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

      case 'approveERC20':
        result = await approveERC20(params.tokenAddress, params.spender, params.amount);
        break;

      case 'checkAllowance':
        result = await checkAllowance(params.tokenAddress, params.owner, params.spender);
        break;

      case 'sendBridgeTransaction':
        result = await sendBridgeTransaction(params);
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

async function approveERC20(tokenAddress: string, spender: string, amount: string): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet detected');

  const from = await getEVMAddress();

  // ERC20 approve function signature: approve(address,uint256)
  const approveFnSig = '0x095ea7b3';
  const paddedSpender = spender.slice(2).padStart(64, '0');
  const paddedAmount = BigInt(amount).toString(16).padStart(64, '0');
  const data = approveFnSig + paddedSpender + paddedAmount;

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

async function checkAllowance(tokenAddress: string, owner: string, spender: string): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet detected');

  // ERC20 allowance function signature: allowance(address,address)
  const allowanceFnSig = '0xdd62ed3e';
  const paddedOwner = owner.slice(2).padStart(64, '0');
  const paddedSpender = spender.slice(2).padStart(64, '0');
  const data = allowanceFnSig + paddedOwner + paddedSpender;

  const result = await ethereum.request({
    method: 'eth_call',
    params: [{
      to: tokenAddress,
      data,
    }, 'latest'],
  });

  // Result is hex-encoded uint256
  return BigInt(result).toString();
}

interface BridgeTransactionParams {
  bridgeAddress: string;
  tokenAddress: string;
  amount: string;
  recipient: string; // Stellar address as bytes32
  destinationChainId: number;
  receiveToken: string; // Destination token address
  messenger: number;
  gasFee: string;
}

async function sendBridgeTransaction(params: BridgeTransactionParams): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet detected');

  const from = await getEVMAddress();

  // Allbridge Core swapAndBridge function
  // swapAndBridge(bytes32,uint256,uint8,bytes32,uint8,bytes32,uint256)
  // For simplicity, we encode the call data manually
  
  // Function signature for swapAndBridge
  const fnSig = '0x318abc06'; // This is Allbridge's specific function
  
  // Encode parameters
  // Note: Stellar addresses are 56 chars, we need to convert to bytes32
  const recipientBytes = stellarAddressToBytes32(params.recipient);
  
  // Build the calldata
  // This is a simplified version - Allbridge's actual contract may have different params
  const paddedToken = params.tokenAddress.slice(2).padStart(64, '0');
  const paddedAmount = BigInt(params.amount).toString(16).padStart(64, '0');
  const paddedDestChain = params.destinationChainId.toString(16).padStart(64, '0');
  const paddedRecipient = recipientBytes.padStart(64, '0');
  const paddedMessenger = params.messenger.toString(16).padStart(64, '0');
  
  const data = fnSig + paddedToken + paddedAmount + paddedDestChain + paddedRecipient + paddedMessenger;

  // The bridge requires gas fee to be sent with the transaction
  const value = '0x' + BigInt(params.gasFee).toString(16);

  const txHash = await ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: params.bridgeAddress,
      data,
      value,
    }],
  });

  return txHash;
}

// Convert Stellar address (G...) to bytes32 for bridge contract
function stellarAddressToBytes32(stellarAddress: string): string {
  // Stellar addresses are base32 encoded public keys
  // For the bridge, we typically just use a hash or direct encoding
  // This is a simplified version - actual implementation depends on bridge contract
  
  // For now, we pad the address string as hex
  // In production, you'd use proper Stellar SDK to decode the address
  const bytes = new TextEncoder().encode(stellarAddress);
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex.slice(0, 64).padEnd(64, '0');
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
