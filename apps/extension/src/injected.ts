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
  tokenAddress: string;      // Source token address (EVM, 0x...)
  amount: string;            // Amount in base units
  recipient: string;         // Stellar address (G...)
  destinationChainId: number; // Allbridge chain ID (7 for Stellar)
  receiveToken: string;      // Destination token address on Stellar
  messenger: number;         // 1 = Allbridge, 2 = Wormhole
  gasFee: string;            // Gas fee in wei (native currency)
}

/**
 * Send a bridge transaction via Allbridge Core
 * 
 * Contract function: swapAndBridge(bytes32 token, uint256 amount, bytes32 recipient, 
 *   uint256 destinationChainId, bytes32 receiveToken, uint256 nonce, uint8 messenger, uint256 feeTokenAmount)
 */
async function sendBridgeTransaction(params: BridgeTransactionParams): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet detected');

  const from = await getEVMAddress();

  // Allbridge Core swapAndBridge function selector
  // keccak256("swapAndBridge(bytes32,uint256,bytes32,uint256,bytes32,uint256,uint8,uint256)")
  const fnSig = '0x6372a670';
  
  // Convert addresses to bytes32 format
  const tokenBytes32 = evmAddressToBytes32(params.tokenAddress);
  const recipientBytes32 = stellarAddressToBytes32(params.recipient);
  const receiveTokenBytes32 = stellarTokenToBytes32(params.receiveToken);
  
  // Generate random nonce (32 bytes as uint256)
  const nonce = generateNonce();
  
  // Encode all parameters (each padded to 32 bytes)
  const paddedToken = tokenBytes32;
  const paddedAmount = BigInt(params.amount).toString(16).padStart(64, '0');
  const paddedRecipient = recipientBytes32;
  const paddedDestChain = params.destinationChainId.toString(16).padStart(64, '0');
  const paddedReceiveToken = receiveTokenBytes32;
  const paddedNonce = nonce;
  const paddedMessenger = params.messenger.toString(16).padStart(64, '0');
  const paddedFeeTokenAmount = '0'.padStart(64, '0'); // 0 when paying with native
  
  const data = fnSig + paddedToken + paddedAmount + paddedRecipient + 
               paddedDestChain + paddedReceiveToken + paddedNonce + 
               paddedMessenger + paddedFeeTokenAmount;

  // The bridge requires gas fee to be sent with the transaction
  const value = '0x' + BigInt(params.gasFee).toString(16);

  console.log('[Stellar Snaps] Bridge transaction params:', {
    from,
    to: params.bridgeAddress,
    value,
    tokenBytes32,
    recipientBytes32,
    receiveTokenBytes32,
  });

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

/**
 * Convert EVM address (0x...) to bytes32
 * Pads with leading zeros to make 32 bytes
 */
function evmAddressToBytes32(address: string): string {
  // Remove 0x prefix and pad to 64 hex chars (32 bytes)
  const hex = address.replace(/^0x/i, '').toLowerCase();
  return hex.padStart(64, '0');
}

/**
 * Convert Stellar address (G...) to bytes32 for bridge contract
 * Uses base32 decoding to extract the 32-byte public key
 */
function stellarAddressToBytes32(stellarAddress: string): string {
  // Stellar addresses are base32 encoded with a version byte prefix and checksum
  // Format: [version byte (1)] + [public key (32)] + [checksum (2)]
  // We need to decode and extract the 32-byte public key
  
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  
  // Remove any whitespace
  const address = stellarAddress.trim().toUpperCase();
  
  // Decode base32
  const decoded: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;
  
  for (const char of address) {
    const value = ALPHABET.indexOf(char);
    if (value === -1) continue;
    
    buffer = (buffer << 5) | value;
    bitsLeft += 5;
    
    while (bitsLeft >= 8) {
      bitsLeft -= 8;
      decoded.push((buffer >> bitsLeft) & 0xff);
    }
  }
  
  // Skip version byte (first byte) and checksum (last 2 bytes)
  // Extract the 32-byte public key
  const publicKey = decoded.slice(1, 33);
  
  // Convert to hex
  let hex = '';
  for (const byte of publicKey) {
    hex += byte.toString(16).padStart(2, '0');
  }
  
  return hex.padStart(64, '0');
}

/**
 * Convert Stellar token address to bytes32
 * Stellar tokens use contract addresses (C...) which are also base32 encoded
 */
function stellarTokenToBytes32(tokenAddress: string): string {
  // For Stellar/Soroban tokens, the address format is similar
  // If it's a G... address (for classic assets), use same decoding
  // If it's a C... address (contract), use same base32 decoding
  
  if (tokenAddress.startsWith('G') || tokenAddress.startsWith('C')) {
    return stellarAddressToBytes32(tokenAddress);
  }
  
  // If it's already hex, just pad it
  const hex = tokenAddress.replace(/^0x/i, '');
  return hex.padStart(64, '0');
}

/**
 * Generate a random 32-byte nonce as hex string (64 chars)
 */
function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
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
