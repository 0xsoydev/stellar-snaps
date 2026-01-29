/**
 * Injected script - runs in page's MAIN world
 * Handles Freighter (Stellar), EVM wallets, and Solana wallets
 */

import * as freighterApi from '@stellar/freighter-api';

console.log('[Stellar Snaps] Injected script loaded');

// EVM chain configurations
const EVM_CHAINS: Record<number, { name: string; hexId: string }> = {
  1: { name: 'Ethereum', hexId: '0x1' },
  8453: { name: 'Base', hexId: '0x2105' },
  42161: { name: 'Arbitrum', hexId: '0xa4b1' },
  137: { name: 'Polygon', hexId: '0x89' },
  56: { name: 'BNB Chain', hexId: '0x38' },
  43114: { name: 'Avalanche', hexId: '0xa86a' },
};

// Listen for requests from content script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== 'stellar-snaps-content') return;

  const { id, method, params } = event.data;
  console.log('[Stellar Snaps] Received request:', method);
  
  try {
    let result: any;

    switch (method) {
      // ============ FREIGHTER (STELLAR) ============
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

      // ============ WALLET DETECTION ============
      case 'detectWallets':
        result = detectAllWallets();
        // Send as 'wallets' property for detection
        window.postMessage({
          source: 'stellar-snaps-injected',
          id,
          wallets: result,
        }, '*');
        return;

      // ============ EVM WALLETS ============
      case 'connectEVM':
        result = await connectEVMWallet();
        break;

      case 'getEVMAddress':
        result = await getEVMAddress();
        break;

      case 'getEVMChainId':
        result = await getEVMChainId();
        break;

      case 'switchEVMChain':
        result = await switchEVMChain(params.chainId);
        break;

      case 'sendEVMTransaction':
        result = await sendEVMTransaction(params.to, params.amount);
        break;

      case 'sendERC20':
        result = await sendERC20(params.tokenAddress, params.to, params.amount);
        break;

      // ============ SOLANA WALLETS ============
      case 'connectSolana':
        result = await connectSolanaWallet();
        break;

      case 'getSolanaAddress':
        result = await getSolanaAddress();
        break;

      case 'sendSOL':
        result = await sendSOL(params.to, params.amount);
        break;

      case 'sendSPLToken':
        result = await sendSPLToken(params.tokenMint, params.to, params.amount);
        break;
      
      default:
        postResponse(id, null, `Unknown method: ${method}`);
        return;
    }

    postResponse(id, result, null);
  } catch (err: any) {
    console.error('[Stellar Snaps] Wallet error:', err);
    postResponse(id, null, err?.message || 'Wallet error');
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

// ============ WALLET DETECTION ============

function detectAllWallets() {
  const wallets: any = {
    stellar: null,
    evm: null,
    solana: null,
  };

  // Detect Freighter (Stellar)
  if (typeof (window as any).freighter !== 'undefined' || typeof freighterApi !== 'undefined') {
    wallets.stellar = {
      type: 'stellar',
      chainId: 'stellar',
      name: 'Freighter',
      icon: '🚀',
      available: true,
    };
  }

  // Detect EVM wallet (MetaMask, Rabby, etc.)
  const ethereum = (window as any).ethereum;
  if (ethereum) {
    let name = 'Wallet';
    if (ethereum.isMetaMask) name = 'MetaMask';
    else if (ethereum.isRabby) name = 'Rabby';
    else if (ethereum.isCoinbaseWallet) name = 'Coinbase Wallet';
    else if (ethereum.isBraveWallet) name = 'Brave Wallet';

    wallets.evm = {
      type: 'evm',
      chainId: 'eth', // Will be updated on connect
      name,
      icon: '🦊',
      available: true,
    };
  }

  // Detect Solana wallet (Phantom, Solflare, etc.)
  const solana = (window as any).solana || (window as any).phantom?.solana;
  if (solana) {
    let name = 'Wallet';
    if (solana.isPhantom) name = 'Phantom';
    else if (solana.isSolflare) name = 'Solflare';

    wallets.solana = {
      type: 'solana',
      chainId: 'sol',
      name,
      icon: '👻',
      available: true,
    };
  }

  console.log('[Stellar Snaps] Detected wallets:', wallets);
  return wallets;
}

// ============ EVM WALLET FUNCTIONS ============

async function connectEVMWallet() {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet detected');

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const chainId = await ethereum.request({ method: 'eth_chainId' });

  let name = 'Wallet';
  if (ethereum.isMetaMask) name = 'MetaMask';
  else if (ethereum.isRabby) name = 'Rabby';
  else if (ethereum.isCoinbaseWallet) name = 'Coinbase Wallet';

  return {
    type: 'evm',
    chainId: parseInt(chainId, 16),
    name,
    icon: '🦊',
    address: accounts[0],
    connected: true,
  };
}

async function getEVMAddress(): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet detected');

  const accounts = await ethereum.request({ method: 'eth_accounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No EVM account connected');
  }
  return accounts[0];
}

async function getEVMChainId(): Promise<number> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet detected');

  const chainId = await ethereum.request({ method: 'eth_chainId' });
  return parseInt(chainId, 16);
}

async function switchEVMChain(chainId: number): Promise<void> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet detected');

  const chain = EVM_CHAINS[chainId];
  if (!chain) throw new Error(`Unknown chain ID: ${chainId}`);

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chain.hexId }],
    });
  } catch (err: any) {
    // Chain not added, try to add it
    if (err.code === 4902) {
      throw new Error(`Please add ${chain.name} to your wallet`);
    }
    throw err;
  }
}

async function sendEVMTransaction(to: string, amount: string): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet detected');

  const from = await getEVMAddress();

  const txHash = await ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to,
      value: '0x' + BigInt(amount).toString(16),
    }],
  });

  return txHash;
}

async function sendERC20(tokenAddress: string, to: string, amount: string): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet detected');

  const from = await getEVMAddress();

  // ERC20 transfer function signature: transfer(address,uint256)
  const transferFnSig = '0xa9059cbb';
  const paddedTo = to.slice(2).padStart(64, '0');
  const paddedAmount = BigInt(amount).toString(16).padStart(64, '0');
  const data = transferFnSig + paddedTo + paddedAmount;

  const txHash = await ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: tokenAddress,
      data,
    }],
  });

  return txHash;
}

// ============ SOLANA WALLET FUNCTIONS ============

async function connectSolanaWallet() {
  const solana = (window as any).solana || (window as any).phantom?.solana;
  if (!solana) throw new Error('No Solana wallet detected');

  const response = await solana.connect();

  let name = 'Wallet';
  if (solana.isPhantom) name = 'Phantom';
  else if (solana.isSolflare) name = 'Solflare';

  return {
    type: 'solana',
    chainId: 'sol',
    name,
    icon: '👻',
    address: response.publicKey.toString(),
    connected: true,
  };
}

async function getSolanaAddress(): Promise<string> {
  const solana = (window as any).solana || (window as any).phantom?.solana;
  if (!solana) throw new Error('No Solana wallet detected');

  if (!solana.publicKey) {
    throw new Error('Solana wallet not connected');
  }

  return solana.publicKey.toString();
}

async function sendSOL(to: string, amount: string): Promise<string> {
  // For SOL transfers, we need to use the Solana web3.js library
  // Since we can't bundle it here easily, we'll construct the transaction manually
  // This is a simplified version - in production you'd want to use @solana/web3.js

  const solana = (window as any).solana || (window as any).phantom?.solana;
  if (!solana) throw new Error('No Solana wallet detected');

  // Phantom and other wallets support signAndSendTransaction
  // We need to construct a transaction - this requires @solana/web3.js
  // For now, throw an informative error
  throw new Error('SOL transfers require additional setup. Please use the deposit address flow.');
}

async function sendSPLToken(tokenMint: string, to: string, amount: string): Promise<string> {
  // Similar to sendSOL, this requires @solana/web3.js for transaction construction
  throw new Error('SPL token transfers require additional setup. Please use the deposit address flow.');
}

// ============ INITIALIZATION ============

// Signal ready after a short delay to let wallets initialize
setTimeout(() => {
  console.log('[Stellar Snaps] Sending ready signal');
  window.postMessage({ source: 'stellar-snaps-injected', ready: true }, '*');
}, 100);

// Check wallet availability
setTimeout(async () => {
  try {
    const { isConnected } = await freighterApi.isConnected();
    console.log('[Stellar Snaps] Freighter available, isConnected:', isConnected);
  } catch (err) {
    console.log('[Stellar Snaps] Freighter check failed:', err);
  }

  const wallets = detectAllWallets();
  console.log('[Stellar Snaps] Available wallets on page load:', wallets);
}, 1000);
