import { UnsupportedProtocolError } from '../errors';

/**
 * PancakeSwap Deployments
 * Official Documentation: https://docs.pancakeswap.finance/developers/smart-contracts/pancakeswap-exchange/v3-contracts
 */
export const PANCAKESWAP_V3_ROUTERS: Record<number, string> = {
  56: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',   // BNB Chain
  1: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',    // Ethereum
  8453: '0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86', // Base
  42161: '0x1b81D678ffb9C0263b24A97847620C99d213eB14' // Arbitrum
};

export function getPancakeSwapRouter(chainId: number): string {
  const router = PANCAKESWAP_V3_ROUTERS[chainId];
  if (!router) {
    throw new UnsupportedProtocolError('PANCAKESWAP', chainId);
  }
  return router;
}
