/**
 * Content script - Dialect-inspired architecture
 * 
 * Flow:
 * 1. Scan page for ALL links
 * 2. Resolve shortened URLs via /api/proxy
 * 3. Check if domain is in registry
 * 4. Fetch /.well-known/stellar-snap.json from domain
 * 5. Match URL path against rules
 * 6. Fetch snap metadata & render with trust badge
 */

const PROXY_URL = 'https://stellar-snaps.vercel.app/api/proxy';
const REGISTRY_URL = 'https://stellar-snaps.vercel.app/api/registry';

const NETWORK_PASSPHRASES = {
  testnet: 'Test SDF Network ; September 2015',
  public: 'Public Global Stellar Network ; September 2015',
};

const HORIZON_URLS = {
  testnet: 'https://horizon-testnet.stellar.org',
  public: 'https://horizon.stellar.org',
};

interface RegistryEntry {
  domain: string;
  status: 'trusted' | 'unverified' | 'blocked';
  name?: string;
}

interface DiscoveryFile {
  name: string;
  description?: string;
  icon?: string;
  rules: Array<{
    pathPattern: string;
    apiPath: string;
  }>;
}

interface SnapMetadata {
  id: string;
  title: string;
  description?: string;
  destination: string;
  amount?: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
  memoType?: string;
  network?: string;
}

// Caches
let registryCache: Map<string, RegistryEntry> = new Map();
let discoveryCache: Map<string, DiscoveryFile> = new Map();
const resolveCache: Map<string, { url: string; domain: string }> = new Map();
const processedLinks: WeakSet<Element> = new WeakSet();
const pendingUrls: Set<string> = new Set();

// Track rendered cards by snap ID -> card element (so we can check if still in DOM)
const renderedCards: Map<string, WeakRef<Element>> = new Map();

function isSnapRendered(snapId: string): boolean {
  const ref = renderedCards.get(snapId);
  if (!ref) return false;
  
  const card = ref.deref();
  // Card was garbage collected or removed from DOM
  if (!card || !document.contains(card)) {
    renderedCards.delete(snapId);
    return false;
  }
  return true;
}

function markSnapRendered(snapId: string, card: Element) {
  renderedCards.set(snapId, new WeakRef(card));
}

// Freighter bridge
const pendingRequests = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();
let injectedReady = false;

// Debounce
let scanTimeout: number | null = null;
const SCAN_DEBOUNCE_MS = 300;

// ============ INITIALIZATION ============

function init() {
  console.log('[Stellar Snaps] Initializing...');
  
  // Inject Freighter bridge
  injectScript();
  
  // Load registry on startup
  loadRegistry();
  
  // Initial scan after short delay
  setTimeout(() => scheduleScan(), 500);
  
  // Watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
    if (hasNewNodes) scheduleScan();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Handle link clicks for web+stellar:
  document.addEventListener('click', handleLinkClick, true);
  
  // SPA navigation detection
  let lastUrl = location.href;
  const checkNavigation = () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Don't clear renderedCards - we check DOM presence instead
      scheduleScan();
    }
  };
  
  // History API intercept
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    setTimeout(checkNavigation, 100);
  };
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    setTimeout(checkNavigation, 100);
  };
  window.addEventListener('popstate', checkNavigation);
  
  // Scroll detection for lazy-loaded content
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        scheduleScan();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });
}

// ============ REGISTRY ============

async function loadRegistry(): Promise<void> {
  try {
    // Check chrome.storage first
    const stored = await chrome.storage.local.get('registry');
    if (stored.registry && Date.now() - stored.registry.timestamp < 5 * 60 * 1000) {
      registryCache = new Map(stored.registry.entries);
      console.log('[Stellar Snaps] Registry loaded from cache:', registryCache.size, 'domains');
      return;
    }
    
    // Fetch fresh registry
    const response = await fetch(REGISTRY_URL);
    if (!response.ok) throw new Error('Failed to fetch registry');
    
    const data = await response.json();
    registryCache = new Map(data.domains.map((e: RegistryEntry) => [e.domain, e]));
    
    // Persist to storage
    await chrome.storage.local.set({
      registry: {
        entries: Array.from(registryCache.entries()),
        timestamp: Date.now(),
      },
    });
    
    console.log('[Stellar Snaps] Registry fetched:', registryCache.size, 'domains');
  } catch (err) {
    console.error('[Stellar Snaps] Failed to load registry:', err);
    // Fallback: trust our own domain
    registryCache.set('stellar-snaps.vercel.app', {
      domain: 'stellar-snaps.vercel.app',
      status: 'trusted',
      name: 'Stellar Snaps',
    });
  }
}

function checkRegistry(domain: string): RegistryEntry | null {
  return registryCache.get(domain) || null;
}

// ============ DISCOVERY FILE ============

async function fetchDiscoveryFile(domain: string): Promise<DiscoveryFile | null> {
  // Check cache
  if (discoveryCache.has(domain)) {
    return discoveryCache.get(domain)!;
  }
  
  try {
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const response = await fetch(`${protocol}://${domain}/.well-known/stellar-snap.json`);
    if (!response.ok) return null;
    
    const discovery: DiscoveryFile = await response.json();
    discoveryCache.set(domain, discovery);
    return discovery;
  } catch (err) {
    console.error('[Stellar Snaps] Failed to fetch discovery file:', domain, err);
    return null;
  }
}

function matchPathToRule(path: string, rules: DiscoveryFile['rules']): string | null {
  for (const rule of rules) {
    // Convert pathPattern to regex (e.g., "/s/*" -> /^\/s\/(.+)$/)
    const pattern = rule.pathPattern
      .replace(/\*/g, '(.+)')
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${pattern}$`);
    const match = path.match(regex);
    
    if (match) {
      // Replace * in apiPath with captured group
      let apiPath = rule.apiPath;
      match.slice(1).forEach((group, i) => {
        apiPath = apiPath.replace('*', group);
      });
      return apiPath;
    }
  }
  return null;
}

// ============ SCANNING ============

function scheduleScan() {
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = window.setTimeout(() => {
    scanTimeout = null;
    scanForLinks();
  }, SCAN_DEBOUNCE_MS);
}

async function scanForLinks() {
  // Find all links on page
  const links = document.querySelectorAll('a[href]');
  
  for (const link of links) {
    if (processedLinks.has(link)) continue;
    if (link.closest('.stellar-snap-card')) continue;
    
    const href = link.getAttribute('href');
    if (!href) continue;
    
    // Skip obviously non-http links
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
      continue;
    }
    
    processedLinks.add(link);
    processLink(link as HTMLAnchorElement, href);
  }
}

async function processLink(linkElement: HTMLAnchorElement, href: string) {
  // Prevent duplicate processing
  if (pendingUrls.has(href)) return;
  pendingUrls.add(href);
  
  try {
    // Step 1: Resolve URL (handles t.co, bit.ly, etc.)
    const resolved = await resolveUrl(href);
    if (!resolved) return;
    
    const { url: finalUrl, domain } = resolved;
    
    // Step 2: Check registry
    const registryEntry = checkRegistry(domain);
    if (!registryEntry) {
      // Domain not in registry - skip silently
      return;
    }
    
    if (registryEntry.status === 'blocked') {
      console.warn('[Stellar Snaps] Blocked domain:', domain);
      return;
    }
    
    // Step 3: Fetch discovery file
    const discovery = await fetchDiscoveryFile(domain);
    if (!discovery) {
      console.log('[Stellar Snaps] No discovery file for:', domain);
      return;
    }
    
    // Step 4: Match URL path against rules
    const parsedUrl = new URL(finalUrl);
    const apiPath = matchPathToRule(parsedUrl.pathname, discovery.rules);
    if (!apiPath) {
      console.log('[Stellar Snaps] No matching rule for:', parsedUrl.pathname);
      return;
    }
    
    // Step 5: Fetch snap metadata
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const metadataUrl = `${protocol}://${domain}${apiPath}`;
    
    // Extract snap ID from path for dedup
    const snapId = parsedUrl.pathname.split('/').pop() || '';
    if (isSnapRendered(snapId)) return;
    
    console.log('[Stellar Snaps] Fetching metadata:', metadataUrl);
    const metadataResponse = await fetch(metadataUrl);
    if (!metadataResponse.ok) return;
    
    const metadata: SnapMetadata = await metadataResponse.json();
    
    // Double-check dedup after async
    if (isSnapRendered(metadata.id)) return;
    
    // Step 6: Render card with trust badge
    const card = renderCard(linkElement, metadata, finalUrl, registryEntry);
    if (card) {
      markSnapRendered(metadata.id, card);
    }
    
  } catch (err) {
    console.error('[Stellar Snaps] Error processing link:', href, err);
  } finally {
    pendingUrls.delete(href);
  }
}

async function resolveUrl(url: string): Promise<{ url: string; domain: string } | null> {
  // Check if URL needs resolution (shortened URLs)
  const shortenedDomains = ['t.co', 'bit.ly', 'goo.gl', 'tinyurl.com', 'ow.ly', 'is.gd', 'buff.ly'];
  
  let urlToCheck: URL;
  try {
    // Handle relative URLs
    urlToCheck = new URL(url, window.location.origin);
  } catch {
    return null;
  }
  
  const needsResolve = shortenedDomains.some(d => urlToCheck.host.includes(d));
  
  if (!needsResolve) {
    // Direct URL - check if domain is in registry
    return { url: urlToCheck.href, domain: urlToCheck.host };
  }
  
  // Check cache
  if (resolveCache.has(url)) {
    return resolveCache.get(url)!;
  }
  
  // Resolve via proxy
  try {
    const response = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const result = { url: data.url, domain: data.domain };
    resolveCache.set(url, result);
    return result;
  } catch (err) {
    console.error('[Stellar Snaps] Proxy resolution failed:', url, err);
    return null;
  }
}

// ============ RENDERING ============

function renderCard(
  linkElement: HTMLElement,
  metadata: SnapMetadata,
  originalHref: string,
  registryEntry: RegistryEntry
): HTMLElement | null {
  // Final safety check
  if (document.querySelector(`.stellar-snap-card[data-snap-id="${metadata.id}"]`)) return null;

  const card = document.createElement('div');
  card.className = 'stellar-snap-card';
  card.setAttribute('data-snap-id', metadata.id);

  const hasFixedAmount = !!metadata.amount;
  const network = metadata.network || 'testnet';
  const trustBadge = registryEntry.status === 'trusted' 
    ? '<span class="snap-trust-badge snap-trusted">Verified</span>'
    : '<span class="snap-trust-badge snap-unverified">Unverified</span>';

  card.innerHTML = `
    <div class="snap-card-header">
      <div class="snap-card-brand">
        <span class="snap-card-logo">✦</span>
        <span class="snap-card-title">${escapeHtml(metadata.title)}</span>
      </div>
      ${trustBadge}
    </div>
    ${metadata.description ? `<p class="snap-card-desc">${escapeHtml(metadata.description)}</p>` : ''}
    <div class="snap-card-amount">
      ${hasFixedAmount
        ? `<span class="snap-fixed-amount">${metadata.amount}</span>`
        : '<input type="number" placeholder="0.00" class="snap-amount-input" step="any" min="0" />'}
      <span class="snap-asset">${metadata.assetCode || 'XLM'}</span>
    </div>
    <div class="snap-card-destination">
      <span class="snap-dest-value">${metadata.destination.slice(0, 4)}...${metadata.destination.slice(-4)}</span>
    </div>
    <button class="snap-pay-btn">Pay</button>
    <div class="snap-status"></div>
    <div class="snap-card-footer">
      <span class="snap-network-badge">${network}</span>
      <a href="${originalHref}" target="_blank" class="snap-view-link">Details</a>
    </div>
  `;

  // Find the best insertion point and hide Twitter's native card
  let insertionTarget = linkElement;
  
  // On X/Twitter, find and hide the native card wrapper
  const tweet = linkElement.closest('article[data-testid="tweet"]');
  if (tweet) {
    const twitterCard = tweet.querySelector('[data-testid="card.wrapper"]');
    if (twitterCard) {
      // Hide Twitter's card and insert our card in its place
      (twitterCard as HTMLElement).style.display = 'none';
      twitterCard.parentNode?.insertBefore(card, twitterCard);
      setupPayButton(card, metadata, originalHref, network);
      return card;
    }
    
    // Fallback: insert after tweet text
    const tweetText = tweet.querySelector('[data-testid="tweetText"]');
    if (tweetText) {
      insertionTarget = tweetText as HTMLElement;
    }
  }

  insertionTarget.parentNode?.insertBefore(card, insertionTarget.nextSibling);
  setupPayButton(card, metadata, originalHref, network);
  
  return card;
}

// ============ PAYMENT HANDLING ============

function setupPayButton(card: HTMLElement, metadata: SnapMetadata, originalHref: string, network: string) {
  const payBtn = card.querySelector('.snap-pay-btn') as HTMLButtonElement;
  const statusEl = card.querySelector('.snap-status') as HTMLDivElement;

  payBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const amountInput = card.querySelector('.snap-amount-input') as HTMLInputElement;
    const amount = amountInput?.value || metadata.amount;

    if (!amount || parseFloat(amount) <= 0) {
      showStatus(statusEl, 'Enter a valid amount', 'error');
      return;
    }

    payBtn.disabled = true;
    payBtn.textContent = 'Connecting...';
    showStatus(statusEl, '', '');

    try {
      const { isConnected } = await callFreighter('isConnected');
      if (!isConnected) throw new Error('Connect Freighter first');

      const { isAllowed } = await callFreighter('isAllowed');
      if (!isAllowed) await callFreighter('setAllowed');

      const { address } = await callFreighter('getAddress');
      if (!address) throw new Error('Connect wallet in Freighter');

      const networkPassphrase = NETWORK_PASSPHRASES[network as keyof typeof NETWORK_PASSPHRASES];
      const { networkPassphrase: currentNetwork } = await callFreighter('getNetwork');
      if (currentNetwork !== networkPassphrase) throw new Error(`Switch Freighter to ${network}`);

      payBtn.textContent = 'Building...';

      const horizonUrl = HORIZON_URLS[network as keyof typeof HORIZON_URLS];
      const accountRes = await fetch(`${horizonUrl}/accounts/${address}`);
      if (!accountRes.ok) throw new Error(accountRes.status === 404 ? 'Account not funded' : 'Failed to load account');

      const account = await accountRes.json();
      
      // Determine base URL from original href
      let baseUrl = 'https://stellar-snaps.vercel.app';
      try {
        const parsed = new URL(originalHref);
        baseUrl = `${parsed.protocol}//${parsed.host}`;
      } catch {}

      const buildRes = await fetch(`${baseUrl}/api/build-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: address,
          sequence: account.sequence,
          destination: metadata.destination,
          amount,
          assetCode: metadata.assetCode,
          assetIssuer: metadata.assetIssuer,
          memo: metadata.memo,
          memoType: metadata.memoType,
          network,
        }),
      });

      if (!buildRes.ok) throw new Error('Failed to build tx');
      const { xdr } = await buildRes.json();

      payBtn.textContent = 'Sign...';
      const { signedTxXdr } = await callFreighter('signTransaction', { xdr, networkPassphrase });

      payBtn.textContent = 'Submitting...';
      const submitRes = await fetch(`${horizonUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `tx=${encodeURIComponent(signedTxXdr)}`,
      });

      const result = await submitRes.json();
      if (submitRes.ok) {
        payBtn.textContent = 'Paid!';
        payBtn.className = 'snap-pay-btn snap-pay-success';
        showStatus(statusEl, `TX: ${result.hash.slice(0, 8)}...`, 'success');
      } else {
        throw new Error(result?.extras?.result_codes?.transaction || 'Failed');
      }
    } catch (err: any) {
      payBtn.disabled = false;
      payBtn.textContent = 'Try Again';
      showStatus(statusEl, err?.message || 'Payment failed', 'error');
    }
  });
}

// ============ FREIGHTER BRIDGE ============

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function callFreighter(method: string, params?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!injectedReady) {
      reject(new Error('Freighter bridge not ready. Please refresh the page.'));
      return;
    }

    const id = generateId();
    pendingRequests.set(id, { resolve, reject });

    window.postMessage({
      source: 'stellar-snaps-content',
      id,
      method,
      params,
    }, '*');

    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Freighter request timed out'));
      }
    }, 60000);
  });
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== 'stellar-snaps-injected') return;

  if (event.data.ready) {
    injectedReady = true;
    console.log('[Stellar Snaps] Freighter bridge ready');
    return;
  }

  const { id, result, error } = event.data;
  const pending = pendingRequests.get(id);

  if (pending) {
    pendingRequests.delete(id);
    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  }
});

function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function () {
    (this as HTMLScriptElement).remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// ============ UTILITIES ============

function handleLinkClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const anchor = target.closest('a');

  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href) return;

  if (href.startsWith('web+stellar:')) {
    e.preventDefault();
    e.stopPropagation();
    showNotification('Processing payment...', 'info');
  }
}

function showStatus(el: HTMLElement, msg: string, type: string) {
  el.textContent = msg;
  el.className = `snap-status ${type ? `snap-status-${type}` : ''}`;
  el.style.display = msg ? 'block' : 'none';
}

function showNotification(message: string, type: 'info' | 'success' | 'error') {
  document.querySelector('.stellar-snap-notification')?.remove();
  const el = document.createElement('div');
  el.className = `stellar-snap-notification snap-notif-${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============ START ============

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
