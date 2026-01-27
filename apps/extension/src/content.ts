/**
 * Content script - runs in ISOLATED world
 * 1. Injects script into main world to access Freighter
 * 2. Detects stellar-snaps URLs -> renders interactive cards
 * 3. Intercepts web+stellar: links -> calls wallet API via injected script
 */

const SNAP_URL_REGEX = /stellar-snaps\.vercel\.app\/s\/([a-zA-Z0-9_-]+)/;
const SNAP_URL_REGEX_LOCALHOST = /localhost:3000\/s\/([a-zA-Z0-9_-]+)/;

const NETWORK_PASSPHRASES = {
  testnet: 'Test SDF Network ; September 2015',
  public: 'Public Global Stellar Network ; September 2015',
};

const HORIZON_URLS = {
  testnet: 'https://horizon-testnet.stellar.org',
  public: 'https://horizon.stellar.org',
};

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

// Pending Freighter requests
const pendingRequests = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();
let injectedReady = false;

// Track processed elements to avoid duplicates
const processedElements = new WeakSet<Element>();

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

function init() {
  console.log('[Stellar Snaps] Content script initializing');
  injectScript();
  document.addEventListener('click', handleLinkClick, true);
  
  // Initial scan with delay
  setTimeout(() => scanForSnapUrls(), 1000);

  // Re-scan on DOM changes (for SPAs like X)
  const observer = new MutationObserver((mutations) => {
    // Debounce: only scan if there are actual node additions
    const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
    if (hasNewNodes) {
      scanForSnapUrls();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function handleLinkClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const anchor = target.closest('a');

  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href) return;

  if (href.startsWith('web+stellar:')) {
    e.preventDefault();
    e.stopPropagation();
    handleStellarUri(href);
  }
}

async function handleStellarUri(uri: string) {
  try {
    const { isConnected } = await callFreighter('isConnected');
    if (!isConnected) {
      showNotification('Please connect Freighter wallet first', 'error');
      return;
    }
    showNotification('Processing payment request...', 'info');
  } catch (err: any) {
    showNotification(err?.message || 'Freighter error', 'error');
  }
}

/**
 * Extract snap ID from text content or URL
 */
function extractSnapId(text: string): { id: string; isLocalhost: boolean } | null {
  let match = text.match(SNAP_URL_REGEX);
  if (match) {
    return { id: match[1], isLocalhost: false };
  }
  
  match = text.match(SNAP_URL_REGEX_LOCALHOST);
  if (match) {
    return { id: match[1], isLocalhost: true };
  }
  
  return null;
}

function scanForSnapUrls() {
  const isX = window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com');
  
  // Method 1: Direct href matching (works on most sites)
  const directLinks = document.querySelectorAll(
    'a[href*="stellar-snaps.vercel.app/s/"], a[href*="localhost:3000/s/"]'
  );
  
  directLinks.forEach((link) => {
    if (processedElements.has(link)) return;
    processedElements.add(link);
    
    const href = link.getAttribute('href') || '';
    const snapInfo = extractSnapId(href);
    if (snapInfo) {
      console.log('[Stellar Snaps] Found direct link:', snapInfo.id);
      const fullUrl = snapInfo.isLocalhost 
        ? `http://localhost:3000/s/${snapInfo.id}`
        : `https://stellar-snaps.vercel.app/s/${snapInfo.id}`;
      fetchAndRenderCard(link as HTMLElement, snapInfo.id, fullUrl);
    }
  });

  // Method 2: Check link text for our URL
  const allLinks = document.querySelectorAll('a');
  allLinks.forEach((link) => {
    if (processedElements.has(link)) return;
    
    const text = link.textContent || '';
    const href = link.getAttribute('href') || '';
    const snapInfo = extractSnapId(text) || extractSnapId(href);
    
    if (snapInfo) {
      processedElements.add(link);
      console.log('[Stellar Snaps] Found link:', snapInfo.id);
      const fullUrl = snapInfo.isLocalhost 
        ? `http://localhost:3000/s/${snapInfo.id}`
        : `https://stellar-snaps.vercel.app/s/${snapInfo.id}`;
      fetchAndRenderCard(link as HTMLElement, snapInfo.id, fullUrl);
    }
  });

  // Method 3: X/Twitter specific - find cards showing our domain and resolve t.co links
  if (isX) {
    // Find elements that mention our domain (even truncated)
    const cardWrappers = document.querySelectorAll('[data-testid="card.wrapper"]');
    
    cardWrappers.forEach((card) => {
      if (processedElements.has(card)) return;
      
      const cardText = card.textContent || '';
      
      // Check if this card is for our domain (X truncates to just domain)
      if (cardText.includes('stellar-snaps.vercel.app') || cardText.includes('stellar-snaps')) {
        console.log('[Stellar Snaps] Found X card for our domain');
        processedElements.add(card);
        
        // Find the t.co link in this card
        const tcoLink = card.querySelector('a[href*="t.co"]') as HTMLAnchorElement;
        if (tcoLink) {
          const tcoUrl = tcoLink.getAttribute('href');
          if (tcoUrl) {
            console.log('[Stellar Snaps] Resolving t.co link:', tcoUrl);
            resolveTcoAndRender(tcoUrl, card as HTMLElement);
          }
        }
      }
    });

    // Also check for links with our domain shown in text (even without full path)
    allLinks.forEach((link) => {
      if (processedElements.has(link)) return;
      
      const text = link.textContent || '';
      const href = link.getAttribute('href') || '';
      
      // If text shows our domain but we don't have the snap ID, resolve the t.co
      if ((text.includes('stellar-snaps.vercel.app') || text.includes('stellar-snaps')) 
          && !extractSnapId(text) 
          && href.includes('t.co')) {
        console.log('[Stellar Snaps] Found truncated URL, resolving:', href);
        processedElements.add(link);
        resolveTcoAndRender(href, link as HTMLElement);
      }
    });
  }
}

// Resolve t.co shortened URL via our server (CORS blocks direct fetch)
async function resolveTcoAndRender(tcoUrl: string, element: HTMLElement) {
  try {
    // Use our API to resolve the t.co URL (avoids CORS issues)
    const response = await fetch(
      `https://stellar-snaps.vercel.app/api/resolve?url=${encodeURIComponent(tcoUrl)}`
    );
    
    if (!response.ok) {
      console.error('[Stellar Snaps] Resolve API error:', response.status);
      return;
    }
    
    const data = await response.json();
    const finalUrl = data.url;
    
    console.log('[Stellar Snaps] Resolved to:', finalUrl);
    
    const snapInfo = extractSnapId(finalUrl);
    if (snapInfo) {
      console.log('[Stellar Snaps] Found snap ID:', snapInfo.id);
      fetchAndRenderCard(element, snapInfo.id, finalUrl);
    } else {
      console.log('[Stellar Snaps] No snap ID in resolved URL');
    }
  } catch (err) {
    console.error('[Stellar Snaps] Failed to resolve t.co:', err);
  }
}

async function fetchAndRenderCard(linkElement: HTMLElement, snapId: string, originalHref: string) {
  try {
    const isLocalhost = originalHref.includes('localhost');
    const baseUrl = isLocalhost ? 'http://localhost:3000' : 'https://stellar-snaps.vercel.app';

    console.log('[Stellar Snaps] Fetching metadata for:', snapId);
    const response = await fetch(`${baseUrl}/api/metadata/${snapId}`);
    if (!response.ok) {
      console.log('[Stellar Snaps] Metadata fetch failed:', response.status);
      return;
    }

    const metadata: SnapMetadata = await response.json();
    console.log('[Stellar Snaps] Got metadata:', metadata.title);
    renderCard(linkElement, metadata, originalHref);
  } catch (err) {
    console.error('[Stellar Snaps] Failed to fetch metadata:', err);
  }
}

function renderCard(linkElement: HTMLElement, metadata: SnapMetadata, originalHref: string) {
  // Check if card already exists nearby
  const existingCard = linkElement.parentElement?.querySelector('.stellar-snap-card');
  if (existingCard) {
    console.log('[Stellar Snaps] Card already exists, skipping');
    return;
  }

  const card = document.createElement('div');
  card.className = 'stellar-snap-card';

  const hasFixedAmount = !!metadata.amount;
  const network = metadata.network || 'testnet';

  card.innerHTML = `
    <div class="snap-card-header">
      <span class="snap-card-logo">✦</span>
      <span class="snap-card-title">${escapeHtml(metadata.title)}</span>
    </div>
    ${metadata.description ? `<p class="snap-card-desc">${escapeHtml(metadata.description)}</p>` : ''}
    <div class="snap-card-amount">
      ${
        hasFixedAmount
          ? `<span class="snap-fixed-amount">${metadata.amount}</span>`
          : '<input type="number" placeholder="Amount" class="snap-amount-input" step="any" min="0" />'
      }
      <span class="snap-asset">${metadata.assetCode || 'XLM'}</span>
    </div>
    <div class="snap-card-destination">
      <span class="snap-dest-label">To:</span>
      <span class="snap-dest-value">${metadata.destination.slice(0, 8)}...${metadata.destination.slice(-4)}</span>
    </div>
    <button class="snap-pay-btn">Pay with Stellar</button>
    <div class="snap-card-footer">
      <span class="snap-network-badge">${network}</span>
      <a href="${originalHref}" target="_blank" class="snap-view-link">Open</a>
    </div>
    <div class="snap-status" style="display: none;"></div>
  `;

  // Insert after the link element
  linkElement.parentNode?.insertBefore(card, linkElement.nextSibling);
  console.log('[Stellar Snaps] Card rendered');

  const payBtn = card.querySelector('.snap-pay-btn') as HTMLButtonElement;
  const statusEl = card.querySelector('.snap-status') as HTMLDivElement;

  payBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const amountInput = card.querySelector('.snap-amount-input') as HTMLInputElement;
    const amount = amountInput?.value || metadata.amount;

    if (!amount || parseFloat(amount) <= 0) {
      updateCardStatus(statusEl, 'Please enter a valid amount', 'error');
      return;
    }

    payBtn.disabled = true;
    payBtn.textContent = 'Connecting...';
    updateCardStatus(statusEl, '', '');

    try {
      const { isConnected } = await callFreighter('isConnected');
      if (!isConnected) {
        throw new Error('Freighter not connected. Click the Freighter icon to connect.');
      }

      const { isAllowed } = await callFreighter('isAllowed');
      if (!isAllowed) {
        await callFreighter('setAllowed');
      }

      const { address } = await callFreighter('getAddress');
      if (!address) {
        throw new Error('Please connect your wallet in Freighter');
      }

      const networkPassphrase = NETWORK_PASSPHRASES[network as keyof typeof NETWORK_PASSPHRASES];
      const { networkPassphrase: currentNetwork } = await callFreighter('getNetwork');

      if (currentNetwork !== networkPassphrase) {
        throw new Error(`Please switch Freighter to ${network}`);
      }

      payBtn.textContent = 'Building tx...';

      const horizonUrl = HORIZON_URLS[network as keyof typeof HORIZON_URLS];
      const accountResponse = await fetch(`${horizonUrl}/accounts/${address}`);

      if (!accountResponse.ok) {
        if (accountResponse.status === 404) {
          throw new Error('Account not funded. Get testnet XLM from friendbot.');
        }
        throw new Error('Failed to load account');
      }

      const account = await accountResponse.json();

      const isLocalhost = originalHref.includes('localhost');
      const baseUrl = isLocalhost ? 'http://localhost:3000' : 'https://stellar-snaps.vercel.app';

      const buildResponse = await fetch(`${baseUrl}/api/build-tx`, {
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

      if (!buildResponse.ok) {
        const err = await buildResponse.json();
        throw new Error(err?.error || 'Failed to build transaction');
      }

      const { xdr } = await buildResponse.json();

      payBtn.textContent = 'Sign in wallet...';

      const { signedTxXdr } = await callFreighter('signTransaction', {
        xdr,
        networkPassphrase,
      });

      payBtn.textContent = 'Submitting...';

      const submitResponse = await fetch(`${horizonUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `tx=${encodeURIComponent(signedTxXdr)}`,
      });

      const result = await submitResponse.json();

      if (submitResponse.ok) {
        payBtn.textContent = 'Paid!';
        payBtn.className = 'snap-pay-btn snap-pay-success';
        updateCardStatus(statusEl, `Success! TX: ${result.hash.slice(0, 8)}...`, 'success');
      } else {
        const errorMessage = result?.extras?.result_codes?.transaction || 'Transaction failed';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('[Stellar Snaps] Payment error:', err);
      payBtn.disabled = false;
      payBtn.textContent = 'Try Again';

      if (err?.message?.includes('User declined') || err?.message?.includes('cancelled')) {
        updateCardStatus(statusEl, 'Cancelled', 'info');
      } else {
        updateCardStatus(statusEl, err?.message || 'Payment failed', 'error');
      }
    }
  });
}

function updateCardStatus(statusEl: HTMLDivElement, message: string, type: string) {
  if (!message) {
    statusEl.style.display = 'none';
    return;
  }
  statusEl.style.display = 'block';
  statusEl.textContent = message;
  statusEl.className = `snap-status snap-status-${type}`;
}

function showNotification(message: string, type: 'info' | 'success' | 'error') {
  document.querySelector('.stellar-snap-notification')?.remove();

  const notification = document.createElement('div');
  notification.className = `stellar-snap-notification snap-notif-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 4000);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
