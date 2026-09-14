import { ConfigurationError } from '../errors';

/**
 * Uniswap Permit2 Canonical Deployment
 * Deployed at the identical deterministic CREATE2 address on all supported EVM chains.
 * Verification Source: https://github.com/Uniswap/permit2
 */
export const PERMIT2_CANONICAL_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

export const PERMIT2_SUPPORTED_CHAINS: ReadonlySet<number> = new Set([
  1,      // Ethereum Mainnet
  10,     // Optimism
  56,     // BNB Chain
  137,    // Polygon
  324,    // ZKsync Era
  8453,   // Base
  42161,  // Arbitrum One
  43114,  // Avalanche C-Chain
  59144,  // Linea
  534352, // Scroll
  81457,  // Blast
  34443,  // Mode
  1101,   // Polygon zkEVM
  42220,  // Celo
  100,    // Gnosis
  252     // Fraxtal
]);

export function getPermit2Address(chainId: number): string {
  if (PERMIT2_SUPPORTED_CHAINS.has(chainId)) {
    return PERMIT2_CANONICAL_ADDRESS;
  }
  throw new ConfigurationError(
    `Permit2 is not supported or verified on chain ID ${chainId}`,
    'PERMIT2_UNAVAILABLE'
  );
}

export function isPermit2Supported(chainId: number): boolean {
  return PERMIT2_SUPPORTED_CHAINS.has(chainId);
}
