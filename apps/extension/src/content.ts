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

// ============ CROSS-CHAIN TYPES ============

type ChainType = 'stellar' | 'evm' | 'solana';
type ChainId = 'stellar' | 'eth' | 'base' | 'arb' | 'pol' | 'bsc' | 'avax' | 'sol';

interface DetectedWallet {
  type: ChainType;
  chainId: ChainId;
  name: string;
  icon: string;
  available: boolean;
}

interface AvailableWallets {
  stellar: DetectedWallet | null;
  evm: DetectedWallet | null;
  solana: DetectedWallet | null;
}

interface QuoteResponse {
  depositAddress: string;
  depositMemo?: string;
  amountIn: string;
  amountInFormatted: string;
  amountOut: string;
  amountOutFormatted: string;
  feeFormatted?: string;
  expiresAt: string;
  estimatedTime: number;
  sourceAssetId: string;
}

interface IntentStatusResponse {
  status: 'PENDING_DEPOSIT' | 'PROCESSING' | 'SUCCESS' | 'INCOMPLETE_DEPOSIT' | 'REFUNDED' | 'FAILED';
  depositTxHash?: string;
  settlementTxHash?: string;
  error?: string;
}

const CHAIN_INFO: Record<ChainId, { name: string; icon: string; assets: string[] }> = {
  stellar: { name: 'Stellar', icon: '✦', assets: ['XLM', 'USDC'] },
  eth: { name: 'Ethereum', icon: '⟠', assets: ['ETH', 'USDC', 'USDT'] },
  base: { name: 'Base', icon: '🔵', assets: ['ETH', 'USDC'] },
  arb: { name: 'Arbitrum', icon: '🔷', assets: ['ETH', 'USDC'] },
  pol: { name: 'Polygon', icon: '💜', assets: ['POL', 'USDC'] },
  bsc: { name: 'BNB Chain', icon: '🟡', assets: ['BNB', 'USDC'] },
  avax: { name: 'Avalanche', icon: '🔺', assets: ['AVAX', 'USDC'] },
  sol: { name: 'Solana', icon: '◎', assets: ['SOL', 'USDC'] },
};

const EVM_CHAIN_IDS: Record<string, number> = {
  eth: 1,
  base: 8453,
  arb: 42161,
  pol: 137,
  bsc: 56,
  avax: 43114,
};

// API base URL for intents
const INTENTS_API_BASE = 'https://stellar-snaps.vercel.app';

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
  const isMainnet = network === 'public';
  const trustBadge = registryEntry.status === 'trusted' 
    ? '<span class="snap-trust-badge snap-trusted">Verified</span>'
    : '<span class="snap-trust-badge snap-unverified">Unverified</span>';
  const crossChainBadge = isMainnet 
    ? '<span class="snap-crosschain-badge">🔗 Multi-chain</span>' 
    : '';

  card.innerHTML = `
    <div class="snap-card-header">
      <span class="snap-card-logo">✦</span>
      <span class="snap-card-title">${escapeHtml(metadata.title)}</span>
      ${trustBadge}
      ${crossChainBadge}
    </div>
    ${metadata.description ? `<p class="snap-card-desc">${escapeHtml(metadata.description)}</p>` : ''}
    <div class="snap-card-amount">
      ${hasFixedAmount
        ? `<span class="snap-fixed-amount">${metadata.amount}</span>`
        : '<input type="number" placeholder="Enter amount" class="snap-amount-input" step="any" min="0" />'}
      <span class="snap-asset">${metadata.assetCode || 'XLM'}</span>
    </div>
    <div class="snap-card-destination">
      <span class="snap-dest-label">To:</span>
      <span class="snap-dest-value">${metadata.destination.slice(0, 6)}...${metadata.destination.slice(-4)}</span>
    </div>
    <button class="snap-pay-btn">Pay with Stellar</button>
    <div class="snap-card-footer">
      <span class="snap-network-badge">${network}</span>
      <a href="${originalHref}" target="_blank" class="snap-view-link">View</a>
    </div>
    <div class="snap-status"></div>
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
  const isMainnet = network === 'public';
  
  // Update button text for mainnet to indicate more options
  if (isMainnet) {
    payBtn.innerHTML = 'Pay <span style="font-size: 12px; opacity: 0.8; margin-left: 4px;">▼</span>';
  }

  payBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const amountInput = card.querySelector('.snap-amount-input') as HTMLInputElement;
    const amount = amountInput?.value || metadata.amount;

    if (!amount || parseFloat(amount) <= 0) {
      showStatus(statusEl, 'Enter a valid amount', 'error');
      return;
    }

    // For mainnet, show wallet selector first
    if (isMainnet) {
      const result = await payWithIntent(metadata, amount, originalHref);
      
      // If null, user chose Stellar - continue with existing flow
      // If 'intent', cross-chain flow was used, we're done
      if (result === 'intent') {
        return;
      }
      
      // If null (Stellar selected) or undefined (cancelled), check if Stellar was selected
      if (result === null) {
        // Continue to Stellar flow below
      } else {
        // User cancelled
        return;
      }
    }
    
    // Stellar native payment flow
    await handleStellarPayment(payBtn, statusEl, metadata, amount, originalHref, network);
  });
}

async function handleStellarPayment(
  payBtn: HTMLButtonElement,
  statusEl: HTMLDivElement,
  metadata: SnapMetadata,
  amount: string,
  originalHref: string,
  network: string
) {
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

// ============ CROSS-CHAIN MODALS ============

async function detectWallets(): Promise<AvailableWallets> {
  return new Promise((resolve) => {
    const messageId = `detect_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.source !== 'stellar-snaps-injected') return;
      if (event.data?.id !== messageId) return;
      
      window.removeEventListener('message', handler);
      resolve(event.data.wallets as AvailableWallets);
    };
    
    window.addEventListener('message', handler);
    
    window.postMessage({
      source: 'stellar-snaps-content',
      id: messageId,
      method: 'detectWallets',
    }, '*');
    
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve({ stellar: null, evm: null, solana: null });
    }, 2000);
  });
}

function closeModal() {
  document.querySelector('.snap-modal-overlay')?.remove();
}

function showWalletSelector(
  wallets: AvailableWallets,
  network: string
): Promise<{ wallet: DetectedWallet; chain: ChainId; asset: string } | null> {
  return new Promise((resolve) => {
    closeModal();
    
    const overlay = document.createElement('div');
    overlay.className = 'snap-modal-overlay';
    
    const isMainnet = network === 'public';
    
    // Build wallet options HTML
    let walletOptionsHtml = '';
    
    // Stellar is always first and available
    if (wallets.stellar?.available) {
      walletOptionsHtml += `
        <div class="snap-wallet-option" data-wallet="stellar" data-chain="stellar" data-asset="XLM">
          <span class="snap-wallet-icon">🚀</span>
          <div class="snap-wallet-info">
            <div class="snap-wallet-name">${wallets.stellar.name}</div>
            <div class="snap-wallet-chain">Pay with XLM on Stellar</div>
          </div>
          <span class="snap-wallet-badge snap-stellar">Direct</span>
        </div>
      `;
    }
    
    // Cross-chain options only on mainnet
    if (isMainnet) {
      if (wallets.evm?.available) {
        walletOptionsHtml += `
          <div class="snap-wallet-option" data-wallet="evm" data-chain="base" data-asset="USDC">
            <span class="snap-wallet-icon">🦊</span>
            <div class="snap-wallet-info">
              <div class="snap-wallet-name">${wallets.evm.name}</div>
              <div class="snap-wallet-chain">Pay from any EVM chain</div>
            </div>
            <span class="snap-wallet-badge">Cross-chain</span>
          </div>
        `;
      } else {
        walletOptionsHtml += `
          <div class="snap-wallet-option snap-wallet-disabled">
            <span class="snap-wallet-icon">🦊</span>
            <div class="snap-wallet-info">
              <div class="snap-wallet-name">EVM Wallet</div>
              <div class="snap-wallet-chain">MetaMask, Rabby not detected</div>
            </div>
          </div>
        `;
      }
      
      if (wallets.solana?.available) {
        walletOptionsHtml += `
          <div class="snap-wallet-option" data-wallet="solana" data-chain="sol" data-asset="SOL">
            <span class="snap-wallet-icon">👻</span>
            <div class="snap-wallet-info">
              <div class="snap-wallet-name">${wallets.solana.name}</div>
              <div class="snap-wallet-chain">Pay from Solana</div>
            </div>
            <span class="snap-wallet-badge">Cross-chain</span>
          </div>
        `;
      } else {
        walletOptionsHtml += `
          <div class="snap-wallet-option snap-wallet-disabled">
            <span class="snap-wallet-icon">👻</span>
            <div class="snap-wallet-info">
              <div class="snap-wallet-name">Solana Wallet</div>
              <div class="snap-wallet-chain">Phantom, Solflare not detected</div>
            </div>
          </div>
        `;
      }
    } else {
      walletOptionsHtml += `
        <div class="snap-wallet-option snap-wallet-disabled">
          <span class="snap-wallet-icon">🔗</span>
          <div class="snap-wallet-info">
            <div class="snap-wallet-name">Cross-chain Payments</div>
            <div class="snap-wallet-chain">Only available on mainnet</div>
          </div>
        </div>
      `;
    }
    
    overlay.innerHTML = `
      <div class="snap-modal">
        <div class="snap-modal-header">
          <span class="snap-modal-title">Choose Payment Method</span>
          <button class="snap-modal-close">&times;</button>
        </div>
        <div class="snap-wallet-list">
          ${walletOptionsHtml}
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event handlers
    overlay.querySelector('.snap-modal-close')?.addEventListener('click', () => {
      closeModal();
      resolve(null);
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
        resolve(null);
      }
    });
    
    overlay.querySelectorAll('.snap-wallet-option:not(.snap-wallet-disabled)').forEach(el => {
      el.addEventListener('click', () => {
        const walletType = el.getAttribute('data-wallet') as 'stellar' | 'evm' | 'solana';
        const chain = el.getAttribute('data-chain') as ChainId;
        const asset = el.getAttribute('data-asset') || 'XLM';
        
        const wallet = walletType === 'stellar' ? wallets.stellar :
                       walletType === 'evm' ? wallets.evm :
                       wallets.solana;
        
        if (wallet) {
          closeModal();
          resolve({ wallet, chain, asset });
        }
      });
    });
  });
}

function showChainAssetSelector(
  walletType: 'evm' | 'solana',
  currentChain: ChainId,
  currentAsset: string
): Promise<{ chain: ChainId; asset: string } | null> {
  return new Promise((resolve) => {
    closeModal();
    
    const overlay = document.createElement('div');
    overlay.className = 'snap-modal-overlay';
    
    const chains = walletType === 'evm' 
      ? ['eth', 'base', 'arb', 'pol', 'bsc', 'avax'] 
      : ['sol'];
    
    const chainButtonsHtml = chains.map(chainId => {
      const info = CHAIN_INFO[chainId as ChainId];
      const isActive = chainId === currentChain;
      return `
        <button class="snap-chain-btn ${isActive ? 'snap-chain-active' : ''}" data-chain="${chainId}">
          <span class="chain-icon">${info.icon}</span>
          <span>${info.name}</span>
        </button>
      `;
    }).join('');
    
    const currentChainInfo = CHAIN_INFO[currentChain];
    const assetOptionsHtml = currentChainInfo.assets.map(asset => 
      `<option value="${asset}" ${asset === currentAsset ? 'selected' : ''}>${asset}</option>`
    ).join('');
    
    overlay.innerHTML = `
      <div class="snap-modal">
        <div class="snap-modal-header">
          <span class="snap-modal-title">Select Chain & Asset</span>
          <button class="snap-modal-close">&times;</button>
        </div>
        <div class="snap-chain-selector">
          <div class="snap-selector-label">Select Chain</div>
          <div class="snap-chain-grid">
            ${chainButtonsHtml}
          </div>
        </div>
        <div class="snap-chain-selector">
          <div class="snap-selector-label">Pay With</div>
          <select class="snap-asset-select">
            ${assetOptionsHtml}
          </select>
        </div>
        <div class="snap-modal-btn-group">
          <button class="snap-modal-btn snap-modal-btn-secondary snap-cancel-btn">Cancel</button>
          <button class="snap-modal-btn snap-modal-btn-primary snap-confirm-btn">Continue</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    let selectedChain = currentChain;
    let selectedAsset = currentAsset;
    
    // Update asset options when chain changes
    const updateAssets = (chainId: ChainId) => {
      const info = CHAIN_INFO[chainId];
      const select = overlay.querySelector('.snap-asset-select') as HTMLSelectElement;
      select.innerHTML = info.assets.map(asset => 
        `<option value="${asset}">${asset}</option>`
      ).join('');
      selectedAsset = info.assets[0];
    };
    
    // Chain button clicks
    overlay.querySelectorAll('.snap-chain-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.snap-chain-btn').forEach(b => b.classList.remove('snap-chain-active'));
        btn.classList.add('snap-chain-active');
        selectedChain = btn.getAttribute('data-chain') as ChainId;
        updateAssets(selectedChain);
      });
    });
    
    // Asset select change
    overlay.querySelector('.snap-asset-select')?.addEventListener('change', (e) => {
      selectedAsset = (e.target as HTMLSelectElement).value;
    });
    
    // Close handlers
    overlay.querySelector('.snap-modal-close')?.addEventListener('click', () => {
      closeModal();
      resolve(null);
    });
    
    overlay.querySelector('.snap-cancel-btn')?.addEventListener('click', () => {
      closeModal();
      resolve(null);
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
        resolve(null);
      }
    });
    
    overlay.querySelector('.snap-confirm-btn')?.addEventListener('click', () => {
      closeModal();
      resolve({ chain: selectedChain, asset: selectedAsset });
    });
  });
}

function showQuoteModal(
  quote: QuoteResponse,
  sourceChain: ChainId,
  sourceAsset: string,
  destAsset: string
): Promise<boolean> {
  return new Promise((resolve) => {
    closeModal();
    
    const overlay = document.createElement('div');
    overlay.className = 'snap-modal-overlay';
    
    const sourceInfo = CHAIN_INFO[sourceChain];
    const expiresIn = Math.max(0, Math.floor((new Date(quote.expiresAt).getTime() - Date.now()) / 1000));
    const expiresMinutes = Math.floor(expiresIn / 60);
    
    overlay.innerHTML = `
      <div class="snap-modal">
        <div class="snap-modal-header">
          <span class="snap-modal-title">Confirm Quote</span>
          <button class="snap-modal-close">&times;</button>
        </div>
        <div class="snap-quote-box">
          <div class="snap-quote-row">
            <span class="snap-quote-label">You Send</span>
            <span class="snap-quote-value snap-quote-highlight">${quote.amountInFormatted} ${sourceAsset}</span>
          </div>
          <div class="snap-quote-row">
            <span class="snap-quote-label">From</span>
            <span class="snap-quote-value">${sourceInfo.icon} ${sourceInfo.name}</span>
          </div>
          <div class="snap-quote-row">
            <span class="snap-quote-label">Merchant Receives</span>
            <span class="snap-quote-value">${quote.amountOutFormatted} ${destAsset}</span>
          </div>
          ${quote.feeFormatted ? `
          <div class="snap-quote-row">
            <span class="snap-quote-label">Fee</span>
            <span class="snap-quote-value">${quote.feeFormatted}</span>
          </div>
          ` : ''}
        </div>
        <div class="snap-quote-rate">
          Est. arrival: ~${Math.ceil(quote.estimatedTime / 60)} min
        </div>
        <div class="snap-quote-warning">
          <span>⚠️</span>
          <span>Cross-chain payments are final. Ensure details are correct.</span>
        </div>
        <div class="snap-quote-expires">
          Quote expires in ${expiresMinutes} minutes
        </div>
        <div class="snap-modal-btn-group">
          <button class="snap-modal-btn snap-modal-btn-secondary snap-cancel-btn">Cancel</button>
          <button class="snap-modal-btn snap-modal-btn-primary snap-confirm-btn">Confirm & Pay</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelector('.snap-modal-close')?.addEventListener('click', () => {
      closeModal();
      resolve(false);
    });
    
    overlay.querySelector('.snap-cancel-btn')?.addEventListener('click', () => {
      closeModal();
      resolve(false);
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
        resolve(false);
      }
    });
    
    overlay.querySelector('.snap-confirm-btn')?.addEventListener('click', () => {
      closeModal();
      resolve(true);
    });
  });
}

function showDepositModal(
  quote: QuoteResponse,
  sourceAsset: string,
  onCancel: () => void
): HTMLElement {
  closeModal();
  
  const overlay = document.createElement('div');
  overlay.className = 'snap-modal-overlay';
  
  overlay.innerHTML = `
    <div class="snap-modal">
      <div class="snap-modal-header">
        <span class="snap-modal-title">Send Payment</span>
        <button class="snap-modal-close">&times;</button>
      </div>
      <div class="snap-deposit-box">
        <div class="snap-deposit-amount">${quote.amountInFormatted}</div>
        <div class="snap-deposit-asset">${sourceAsset}</div>
        <div class="snap-deposit-address-box">
          <div class="snap-deposit-address-label">Send to this address</div>
          <div class="snap-deposit-address">${quote.depositAddress}</div>
          ${quote.depositMemo ? `
          <div class="snap-deposit-memo">
            <div class="snap-deposit-address-label">Memo (required)</div>
            <div class="snap-deposit-address">${quote.depositMemo}</div>
          </div>
          ` : ''}
        </div>
        <button class="snap-copy-btn">
          <span>📋</span>
          <span class="copy-text">Copy Address</span>
        </button>
      </div>
      <div class="snap-status-tracker">
        <div class="snap-status-steps">
          <div class="snap-status-step snap-step-active" data-step="deposit">
            <div class="snap-step-indicator"><span class="snap-spinner"></span></div>
            <div class="snap-step-content">
              <div class="snap-step-title">Waiting for deposit</div>
              <div class="snap-step-desc">Send exactly ${quote.amountInFormatted} ${sourceAsset}</div>
            </div>
          </div>
          <div class="snap-status-step snap-step-pending" data-step="processing">
            <div class="snap-step-indicator">2</div>
            <div class="snap-step-content">
              <div class="snap-step-title">Processing</div>
              <div class="snap-step-desc">Cross-chain settlement</div>
            </div>
          </div>
          <div class="snap-status-step snap-step-pending" data-step="complete">
            <div class="snap-step-indicator">3</div>
            <div class="snap-step-content">
              <div class="snap-step-title">Complete</div>
              <div class="snap-step-desc">Payment delivered</div>
            </div>
          </div>
        </div>
      </div>
      <button class="snap-modal-btn snap-modal-btn-secondary" style="margin-top: 12px;">Cancel</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Copy button
  const copyBtn = overlay.querySelector('.snap-copy-btn') as HTMLButtonElement;
  copyBtn?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(quote.depositAddress);
    copyBtn.classList.add('snap-copied');
    copyBtn.querySelector('.copy-text')!.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.classList.remove('snap-copied');
      copyBtn.querySelector('.copy-text')!.textContent = 'Copy Address';
    }, 2000);
  });
  
  // Cancel handler
  const cancelBtn = overlay.querySelector('.snap-modal-btn-secondary') as HTMLButtonElement;
  cancelBtn?.addEventListener('click', () => {
    closeModal();
    onCancel();
  });
  
  overlay.querySelector('.snap-modal-close')?.addEventListener('click', () => {
    closeModal();
    onCancel();
  });
  
  return overlay;
}

function updateDepositModalStatus(
  modal: HTMLElement,
  status: IntentStatusResponse['status'],
  txHash?: string
) {
  const steps = modal.querySelectorAll('.snap-status-step');
  
  if (status === 'PROCESSING') {
    // Deposit received, processing
    steps[0].classList.remove('snap-step-active');
    steps[0].classList.add('snap-step-complete');
    steps[0].querySelector('.snap-step-indicator')!.innerHTML = '✓';
    
    steps[1].classList.remove('snap-step-pending');
    steps[1].classList.add('snap-step-active');
    steps[1].querySelector('.snap-step-indicator')!.innerHTML = '<span class="snap-spinner"></span>';
    
    if (txHash) {
      const txLink = document.createElement('a');
      txLink.className = 'snap-step-tx';
      txLink.href = '#';
      txLink.textContent = `TX: ${txHash.slice(0, 8)}...`;
      steps[0].querySelector('.snap-step-content')?.appendChild(txLink);
    }
  } else if (status === 'SUCCESS') {
    // Complete
    steps.forEach((step, i) => {
      step.classList.remove('snap-step-active', 'snap-step-pending');
      step.classList.add('snap-step-complete');
      step.querySelector('.snap-step-indicator')!.innerHTML = '✓';
    });
    
    steps[2].querySelector('.snap-step-title')!.textContent = 'Payment Complete!';
  } else if (status === 'FAILED' || status === 'REFUNDED') {
    const activeStep = modal.querySelector('.snap-step-active');
    if (activeStep) {
      activeStep.classList.remove('snap-step-active');
      activeStep.classList.add('snap-step-error');
      activeStep.querySelector('.snap-step-indicator')!.innerHTML = '✗';
      activeStep.querySelector('.snap-step-title')!.textContent = 
        status === 'REFUNDED' ? 'Refunded' : 'Failed';
    }
  }
}

function showResultModal(success: boolean, message: string, txHash?: string) {
  closeModal();
  
  const overlay = document.createElement('div');
  overlay.className = 'snap-modal-overlay';
  
  overlay.innerHTML = `
    <div class="snap-modal">
      <div class="snap-result-box">
        <div class="snap-result-icon">${success ? '✅' : '❌'}</div>
        <div class="snap-result-title">${success ? 'Payment Successful!' : 'Payment Failed'}</div>
        <div class="snap-result-desc">${escapeHtml(message)}</div>
        ${txHash ? `
        <a href="#" class="snap-step-tx" style="display: inline-flex;">
          View Transaction: ${txHash.slice(0, 8)}...
        </a>
        ` : ''}
      </div>
      <button class="snap-modal-btn snap-modal-btn-primary snap-close-btn">Close</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  overlay.querySelector('.snap-close-btn')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

// ============ CROSS-CHAIN PAYMENT FLOW ============

async function fetchQuote(
  snapId: string,
  sourceChain: ChainId,
  sourceAsset: string,
  refundAddress: string,
  dry: boolean = false
): Promise<QuoteResponse | null> {
  try {
    const response = await fetch(`${INTENTS_API_BASE}/api/intent/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapId,
        sourceChain,
        sourceAsset,
        refundAddress,
        dry,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get quote');
    }
    
    return await response.json();
  } catch (err: any) {
    console.error('[Stellar Snaps] Quote error:', err);
    showNotification(err.message || 'Failed to get quote', 'error');
    return null;
  }
}

async function pollIntentStatus(
  depositAddress: string,
  modal: HTMLElement,
  onComplete: (success: boolean, txHash?: string) => void
) {
  const pollInterval = 5000; // 5 seconds
  const maxPolls = 120; // 10 minutes max
  let polls = 0;
  let cancelled = false;
  
  const poll = async () => {
    if (cancelled || polls >= maxPolls) {
      if (polls >= maxPolls) {
        onComplete(false);
        showNotification('Timeout waiting for payment', 'error');
      }
      return;
    }
    
    polls++;
    
    try {
      const response = await fetch(
        `${INTENTS_API_BASE}/api/intent/status?depositAddress=${encodeURIComponent(depositAddress)}`
      );
      
      if (!response.ok) {
        setTimeout(poll, pollInterval);
        return;
      }
      
      const status: IntentStatusResponse = await response.json();
      updateDepositModalStatus(modal, status.status, status.depositTxHash);
      
      if (status.status === 'SUCCESS') {
        cancelled = true;
        setTimeout(() => {
          onComplete(true, status.settlementTxHash);
        }, 1500);
      } else if (status.status === 'FAILED' || status.status === 'REFUNDED') {
        cancelled = true;
        setTimeout(() => {
          onComplete(false);
        }, 1500);
      } else {
        setTimeout(poll, pollInterval);
      }
    } catch (err) {
      console.error('[Stellar Snaps] Status poll error:', err);
      setTimeout(poll, pollInterval);
    }
  };
  
  poll();
  
  return () => { cancelled = true; };
}

async function connectWallet(walletType: 'evm' | 'solana'): Promise<string | null> {
  try {
    if (walletType === 'evm') {
      const result = await callFreighter('connectEVM');
      return result.address;
    } else {
      const result = await callFreighter('connectSolana');
      return result.address;
    }
  } catch (err: any) {
    console.error('[Stellar Snaps] Connect wallet error:', err);
    showNotification(err.message || 'Failed to connect wallet', 'error');
    return null;
  }
}

async function payWithIntent(
  metadata: SnapMetadata,
  amount: string,
  originalHref: string
) {
  // 1. Detect available wallets
  const wallets = await detectWallets();
  const network = metadata.network || 'testnet';
  
  // 2. Show wallet selector
  const selection = await showWalletSelector(wallets, network);
  if (!selection) return;
  
  // 3. If Stellar selected, use existing flow
  if (selection.wallet.type === 'stellar') {
    // Fall back to regular Stellar payment
    return null; // Signal to use existing flow
  }
  
  // 4. For cross-chain, show chain/asset selector
  let finalSelection: { chain: ChainId; asset: string } | null = null;
  
  if (selection.wallet.type === 'evm') {
    finalSelection = await showChainAssetSelector('evm', selection.chain, selection.asset);
  } else {
    finalSelection = { chain: 'sol', asset: selection.asset };
  }
  
  if (!finalSelection) return;
  
  // 5. Connect wallet to get refund address
  const refundAddress = await connectWallet(selection.wallet.type as 'evm' | 'solana');
  if (!refundAddress) return;
  
  // 6. If EVM, check/switch to correct chain
  if (selection.wallet.type === 'evm') {
    const targetChainId = EVM_CHAIN_IDS[finalSelection.chain];
    if (targetChainId) {
      try {
        const currentChainId = await callFreighter('getEVMChainId');
        if (currentChainId !== targetChainId) {
          await callFreighter('switchEVMChain', { chainId: targetChainId });
        }
      } catch (err: any) {
        showNotification(err.message || 'Failed to switch chain', 'error');
        return;
      }
    }
  }
  
  // 7. Fetch quote
  const destAsset = metadata.assetCode || 'XLM';
  const quote = await fetchQuote(
    metadata.id,
    finalSelection.chain,
    finalSelection.asset,
    refundAddress
  );
  
  if (!quote) return;
  
  // 8. Show quote for confirmation
  const confirmed = await showQuoteModal(quote, finalSelection.chain, finalSelection.asset, destAsset);
  if (!confirmed) return;
  
  // 9. Show deposit modal with status tracking
  let cancelPolling: (() => void) | null = null;
  
  const modal = showDepositModal(quote, finalSelection.asset, () => {
    if (cancelPolling) cancelPolling();
  });
  
  // 10. Start polling for status
  cancelPolling = await pollIntentStatus(quote.depositAddress, modal, (success, txHash) => {
    closeModal();
    if (success) {
      showResultModal(true, 'Your payment has been delivered to the merchant.', txHash);
    } else {
      showResultModal(false, 'Payment failed or was refunded. Please try again.');
    }
  });
  
  return 'intent'; // Signal that intent flow was used
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
