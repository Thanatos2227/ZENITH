import { UnsupportedProtocolError } from '../errors';

/**
 * Camelot DEX Deployments on Arbitrum (42161)
 * Official Documentation: https://docs.camelot.exchange/
 */
export const CAMELOT_V2_ROUTER = '0xc873fEcbd354f5A56E00E710B90EF4201db2448d';
export const CAMELOT_V3_ROUTER = '0x1F721E2E82F6676FCE4eA07A5958cF098D339e18';

export function getCamelotRouter(chainId: number): string {
  if (chainId === 42161) {
    return CAMELOT_V3_ROUTER;
  }
  throw new UnsupportedProtocolError('CAMELOT', chainId);
}
