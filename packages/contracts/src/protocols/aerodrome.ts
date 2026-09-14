import { UnsupportedProtocolError } from '../errors';

/**
 * Aerodrome Finance Deployments on Base (8453)
 * Official Documentation: https://aerodrome.finance/docs
 */
export const AERODROME_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74856154990ED379bC';
export const AERODROME_SLIPSTREAM_ROUTER = '0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5';
export const AERODROME_FACTORY = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';

export function getAerodromeRouter(chainId: number): string {
  if (chainId === 8453) {
    return AERODROME_ROUTER;
  }
  throw new UnsupportedProtocolError('AERODROME', chainId);
}
