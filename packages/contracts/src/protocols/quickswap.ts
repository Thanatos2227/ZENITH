import { UnsupportedProtocolError } from '../errors';

/**
 * QuickSwap Deployments on Polygon (137)
 * Official Documentation: https://quickswap-layer2.gitbook.io/quickswap-documentation
 */
export const QUICKSWAP_V2_ROUTER = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';
export const QUICKSWAP_V3_ROUTER = '0xf5b509bB0909a69B1c207E495f687a596C168E12';

export function getQuickSwapRouter(chainId: number): string {
  if (chainId === 137) {
    return QUICKSWAP_V3_ROUTER;
  }
  throw new UnsupportedProtocolError('QUICKSWAP', chainId);
}
