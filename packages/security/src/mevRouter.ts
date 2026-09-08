import { MEVProtectionLevel } from '@zenith/types';

export interface MEVRouteConfig {
  protectionLevel: MEVProtectionLevel;
  rpcEndpoint: string;
  isPrivateMempool: boolean;
  frontrunningProtection: boolean;
  sandwichProtection: boolean;
  revertProtection: boolean;
}

export class MEVRouter {
  public resolveMEVRoute(chainId: string, preferredLevel: MEVProtectionLevel): MEVRouteConfig {
    if (chainId.toLowerCase() === 'ethereum') {
      if (preferredLevel === 'FLASHBOTS_PRIVATE') {
        return {
          protectionLevel: 'FLASHBOTS_PRIVATE',
          rpcEndpoint: 'https://rpc.flashbots.net/fast',
          isPrivateMempool: true,
          frontrunningProtection: true,
          sandwichProtection: true,
          revertProtection: true
        };
      }
      if (preferredLevel === 'RPC_STEALTH') {
        return {
          protectionLevel: 'RPC_STEALTH',
          rpcEndpoint: 'https://protect.blocknative.com',
          isPrivateMempool: true,
          frontrunningProtection: true,
          sandwichProtection: true,
          revertProtection: false
        };
      }
    }

    return {
      protectionLevel: preferredLevel,
      rpcEndpoint: '',
      isPrivateMempool: false,
      frontrunningProtection: ['arbitrum', 'base', 'optimism', 'solana', 'monad'].includes(chainId.toLowerCase()),
      sandwichProtection: preferredLevel !== 'NONE',
      revertProtection: false
    };
  }
}

export const defaultMEVRouter = new MEVRouter();
