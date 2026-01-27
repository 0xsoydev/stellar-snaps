/**
 * Injected script - runs in page's MAIN world
 * Uses @stellar/freighter-api to communicate with Freighter extension
 */

import * as freighterApi from '@stellar/freighter-api';

console.log('[Stellar Snaps] Injected script loaded');

// Listen for requests from content script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== 'stellar-snaps-content') return;

  const { id, method, params } = event.data;
  console.log('[Stellar Snaps] Received request:', method);
  
  try {
    let result: any;

    switch (method) {
      case 'isConnected':
        result = await freighterApi.isConnected();
        console.log('[Stellar Snaps] isConnected result:', result);
        break;
      
      case 'isAllowed':
        result = await freighterApi.isAllowed();
        break;
      
      case 'setAllowed':
        result = await freighterApi.setAllowed();
        break;
      
      case 'getAddress':
        result = await freighterApi.getAddress();
        break;
      
      case 'getNetwork':
        result = await freighterApi.getNetwork();
        break;
      
      case 'signTransaction':
        result = await freighterApi.signTransaction(params.xdr, {
          networkPassphrase: params.networkPassphrase,
        });
        break;
      
      default:
        postResponse(id, null, `Unknown method: ${method}`);
        return;
    }

    postResponse(id, result, null);
  } catch (err: any) {
    console.error('[Stellar Snaps] Freighter error:', err);
    postResponse(id, null, err?.message || 'Freighter error');
  }
});

function postResponse(id: string, result: any, error: string | null) {
  window.postMessage({
    source: 'stellar-snaps-injected',
    id,
    result,
    error,
  }, '*');
}

// Signal ready after a short delay to let Freighter initialize
setTimeout(() => {
  console.log('[Stellar Snaps] Sending ready signal');
  window.postMessage({ source: 'stellar-snaps-injected', ready: true }, '*');
}, 100);

// Check Freighter availability
setTimeout(async () => {
  try {
    const { isConnected } = await freighterApi.isConnected();
    console.log('[Stellar Snaps] Freighter available, isConnected:', isConnected);
  } catch (err) {
    console.log('[Stellar Snaps] Freighter check failed:', err);
  }
}, 1000);
