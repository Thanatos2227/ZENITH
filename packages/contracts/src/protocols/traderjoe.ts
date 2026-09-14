import { UnsupportedProtocolError } from '../errors';

/**
 * Trader Joe (LFJ) Deployments on Avalanche (43114) and Arbitrum (42161)
 * Official Documentation: https://docs.lfj.gg/
 */
export const TRADER_JOE_LB_ROUTERS: Record<number, string> = {
  43114: '0xb4310e7De3e0f14172488457B1A97140eCC94b77', // Avalanche LBRouter v2.1
  42161: '0xb4310e7De3e0f14172488457B1A97140eCC94b77'  // Arbitrum LBRouter v2.1
};

export function getTraderJoeRouter(chainId: number): string {
  const router = TRADER_JOE_LB_ROUTERS[chainId];
  if (!router) {
    throw new UnsupportedProtocolError('TRADER_JOE', chainId);
  }
  return router;
}
