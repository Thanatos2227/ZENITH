import { UnsupportedProtocolError } from '../errors';

/**
 * Velodrome Finance Deployments on Optimism (10)
 * Official Documentation: https://docs.velodrome.finance/
 */
export const VELODROME_ROUTER = '0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858';
export const VELODROME_UNIVERSAL_ROUTER = '0xCCD5d625D8D9EcB8a6A0d885D577c2B9612eB581';

export function getVelodromeRouter(chainId: number): string {
  if (chainId === 10) {
    return VELODROME_ROUTER;
  }
  throw new UnsupportedProtocolError('VELODROME', chainId);
}
