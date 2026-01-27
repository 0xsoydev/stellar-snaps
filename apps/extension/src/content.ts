/**
 * Content script - runs on all pages
 * 1. Detects stellarsnaps URLs -> renders interactive cards
 * 2. Intercepts web+stellar: links -> calls wallet API
 */

const SNAP_URL_PATTERN = /https?:\/\/(localhost:3000|stellarsnaps\.com)\/s\/([a-zA-Z0-9_-]+)/g;
const STELLAR_URI_PATTERN = /web\+stellar:(pay|tx)\?[^\s"'<>]+/g;

function init() {
  // Intercept web+stellar: link clicks
  document.addEventListener('click', handleLinkClick, true);

  // Scan for snap URLs and render cards
  scanForSnapUrls();

  // Re-scan on DOM changes (for SPAs like X)
  const observer = new MutationObserver(() => scanForSnapUrls());
  observer.observe(document.body, { childList: true, subtree: true });
}

function handleLinkClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const anchor = target.closest('a');
  
  if (!anchor) return;
  
  const href = anchor.getAttribute('href');
  if (!href) return;

  // Handle web+stellar: URIs
  if (href.startsWith('web+stellar:')) {
    e.preventDefault();
    e.stopPropagation();
    handleStellarUri(href);
  }
}

async function handleStellarUri(uri: string) {
  // Check if Freighter is available
  const freighter = (window as any).freighter;
  
  if (!freighter) {
    showNotification('Freighter wallet not found. Please install it.');
    return;
  }

  try {
    // Parse the URI
    const parsed = parseUri(uri);
    
    if (parsed.type === 'pay') {
      // For pay URIs, we need to build a transaction
      // This will be handled by calling our API or building client-side
      showNotification('Processing payment request...');
      // TODO: Build transaction and sign with Freighter
    } else if (parsed.type === 'tx' && parsed.xdr) {
      // For tx URIs, sign the XDR directly
      const result = await freighter.signTransaction(parsed.xdr, {
        networkPassphrase: parsed.networkPassphrase || 'Test SDF Network ; September 2015',
      });
      showNotification('Transaction signed!');
      console.log('Signed XDR:', result);
    }
  } catch (err) {
    console.error('Error handling Stellar URI:', err);
    showNotification('Failed to process transaction');
  }
}

function parseUri(uri: string): { type: string; xdr?: string; networkPassphrase?: string; destination?: string; amount?: string } {
  const withoutScheme = uri.replace('web+stellar:', '');
  const [type, queryString] = withoutScheme.split('?');
  const params = new URLSearchParams(queryString);

  return {
    type,
    xdr: params.get('xdr') || undefined,
    networkPassphrase: params.get('network_passphrase') || undefined,
    destination: params.get('destination') || undefined,
    amount: params.get('amount') || undefined,
  };
}

function scanForSnapUrls() {
  // Find all links matching our snap URL pattern
  const links = document.querySelectorAll('a[href*="stellarsnaps.com/s/"], a[href*="localhost:3000/s/"]');
  
  links.forEach((link) => {
    if (link.getAttribute('data-snap-processed')) return;
    link.setAttribute('data-snap-processed', 'true');

    const href = link.getAttribute('href');
    if (!href) return;

    const match = href.match(/\/s\/([a-zA-Z0-9_-]+)/);
    if (!match) return;

    const snapId = match[1];
    fetchAndRenderCard(link as HTMLElement, snapId);
  });
}

async function fetchAndRenderCard(linkElement: HTMLElement, snapId: string) {
  try {
    // Determine base URL
    const isLocalhost = linkElement.getAttribute('href')?.includes('localhost');
    const baseUrl = isLocalhost ? 'http://localhost:3000' : 'https://stellarsnaps.com';
    
    const response = await fetch(`${baseUrl}/api/metadata/${snapId}`);
    if (!response.ok) return;

    const metadata = await response.json();
    renderCard(linkElement, metadata);
  } catch (err) {
    console.error('Failed to fetch snap metadata:', err);
  }
}

function renderCard(linkElement: HTMLElement, metadata: any) {
  // Create card container
  const card = document.createElement('div');
  card.className = 'stellar-snap-card';
  card.innerHTML = `
    <div class="snap-card-header">
      <span class="snap-card-logo">✦</span>
      <span class="snap-card-title">${escapeHtml(metadata.title)}</span>
    </div>
    ${metadata.description ? `<p class="snap-card-desc">${escapeHtml(metadata.description)}</p>` : ''}
    <div class="snap-card-amount">
      ${metadata.amount ? `<span>${metadata.amount} ${metadata.assetCode || 'XLM'}</span>` : '<input type="text" placeholder="Amount" class="snap-amount-input" />'}
      <span class="snap-asset">${metadata.assetCode || 'XLM'}</span>
    </div>
    <button class="snap-pay-btn">Pay with Stellar</button>
  `;

  // Insert after the link
  linkElement.parentNode?.insertBefore(card, linkElement.nextSibling);

  // Handle pay button click
  const payBtn = card.querySelector('.snap-pay-btn');
  payBtn?.addEventListener('click', () => {
    const amountInput = card.querySelector('.snap-amount-input') as HTMLInputElement;
    const amount = amountInput?.value || metadata.amount;
    
    if (!amount) {
      showNotification('Please enter an amount');
      return;
    }

    // Build and handle the URI
    const uri = buildPaymentUri(metadata, amount);
    handleStellarUri(uri);
  });
}

function buildPaymentUri(metadata: any, amount: string): string {
  const params = new URLSearchParams();
  params.set('destination', metadata.destination);
  params.set('amount', amount);
  
  if (metadata.assetCode && metadata.assetCode !== 'XLM') {
    params.set('asset_code', metadata.assetCode);
    if (metadata.assetIssuer) params.set('asset_issuer', metadata.assetIssuer);
  }
  
  if (metadata.memo) {
    params.set('memo', metadata.memo);
    params.set('memo_type', metadata.memoType || 'MEMO_TEXT');
  }
  
  if (metadata.network === 'testnet') {
    params.set('network_passphrase', 'Test SDF Network ; September 2015');
  }

  return `web+stellar:pay?${params.toString()}`;
}

function showNotification(message: string) {
  const notification = document.createElement('div');
  notification.className = 'stellar-snap-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
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
