// Popup script - settings and status
import * as freighterApi from '@stellar/freighter-api';

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  
  try {
    const { isConnected } = await freighterApi.isConnected();
    if (statusEl) {
      if (isConnected) {
        // Get address to show connected account
        try {
          const { address } = await freighterApi.getAddress();
          statusEl.textContent = `Connected: ${address.slice(0, 4)}...${address.slice(-4)}`;
          statusEl.className = 'status-ok';
        } catch {
          statusEl.textContent = 'Freighter connected';
          statusEl.className = 'status-ok';
        }
      } else {
        statusEl.textContent = 'Click Freighter to connect';
        statusEl.className = 'status-warn';
      }
    }
  } catch (err) {
    console.log('Freighter check error:', err);
    if (statusEl) {
      statusEl.textContent = 'Freighter not detected';
      statusEl.className = 'status-error';
    }
  }
});
