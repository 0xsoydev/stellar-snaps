// Popup script - settings and status
document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  
  // Check Freighter connection
  const freighter = (window as any).freighter;
  
  if (freighter) {
    try {
      const { isConnected } = await freighter.isConnected();
      if (statusEl) {
        statusEl.textContent = isConnected ? 'Connected to Freighter' : 'Freighter not connected';
        statusEl.className = isConnected ? 'status-ok' : 'status-warn';
      }
    } catch {
      if (statusEl) {
        statusEl.textContent = 'Freighter available';
        statusEl.className = 'status-ok';
      }
    }
  } else {
    if (statusEl) {
      statusEl.textContent = 'Freighter not installed';
      statusEl.className = 'status-error';
    }
  }
});
