/**
 * Background service worker
 * Handles URL resolution for t.co links
 * Service workers can follow cross-origin redirects that content scripts can't
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RESOLVE_URL') {
    resolveUrl(message.url)
      .then(resolvedUrl => {
        sendResponse({ success: true, url: resolvedUrl });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send response asynchronously
    return true;
  }
});

async function resolveUrl(shortUrl: string): Promise<string> {
  console.log('[Stellar Snaps BG] Resolving:', shortUrl);
  
  try {
    // Service workers can follow redirects properly
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
    });
    
    console.log('[Stellar Snaps BG] Final URL:', response.url);
    return response.url;
  } catch (err) {
    console.error('[Stellar Snaps BG] Fetch failed:', err);
    throw err;
  }
}

console.log('[Stellar Snaps] Background service worker loaded');
