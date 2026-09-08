import React from 'react';
import { useZenithStore } from '../../stores/useZenithStore';
import { DEFAULT_TOKENS } from '@zenith/tokens';
import { defaultChainRegistry } from '@zenith/chains';
import { Wallet, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';

export const PortfolioView: React.FC = () => {
  const { walletAddress, isWalletConnected, openWalletModal, setSourceChain, setTokenIn, setActiveTab } = useZenithStore();

  const userTokens = [
    {
      token: DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.isNative)!,
      balance: 4.825,
      chainId: 'ethereum'
    },
    {
      token: DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!,
      balance: 12450.00,
      chainId: 'ethereum'
    },
    {
      token: DEFAULT_TOKENS.find((t) => t.chainId === 'arbitrum' && t.symbol === 'ARB')!,
      balance: 3450.00,
      chainId: 'arbitrum'
    },
    {
      token: DEFAULT_TOKENS.find((t) => t.chainId === 'solana' && t.symbol === 'SOL')!,
      balance: 18.45,
      chainId: 'solana'
    }
  ].filter((item) => item.token !== undefined);

  const totalValueUSD = userTokens.reduce((acc, item) => {
    return acc + item.balance * (item.token.priceUSD || 1);
  }, 0);

  const handleSwapAsset = (item: (typeof userTokens)[0]) => {
    const chain = defaultChainRegistry.getChain(item.chainId);
    if (chain) {
      setSourceChain(chain);
      setTokenIn(item.token);
      setActiveTab('TRADE');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Net Worth</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-white">
            ${isWalletConnected ? totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{isWalletConnected ? '+$1,420.50 (4.8%) past 24h' : 'Connect wallet to view PnL'}</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Chains Active</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-white">{isWalletConnected ? '3 Networks' : '0 Networks'}</p>
          <p className="text-xs text-slate-400 font-mono">
            {isWalletConnected ? 'Ethereum (82%), Arbitrum (9%), Solana (9%)' : 'No active network connections'}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Custody Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          {isWalletConnected ? (
            <>
              <p className="text-lg font-bold font-mono text-cyan-300 truncate">
                {walletAddress}
              </p>
              <p className="text-xs text-emerald-400 font-semibold">100% Non-Custodial On-Chain</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-400">Wallet Disconnected</p>
              <button
                onClick={openWalletModal}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Connect a Wallet →
              </button>
            </>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 bg-[#0B111E] border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-white">Your Multi-Chain Assets</h3>
          <span className="text-xs font-mono text-slate-400">
            {isWalletConnected ? `${userTokens.length} assets held` : 'Wallet not connected'}
          </span>
        </div>

        {isWalletConnected ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B111E]/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800/80">
                <tr>
                  <th className="py-3.5 px-4">Asset</th>
                  <th className="py-3.5 px-4">Network</th>
                  <th className="py-3.5 px-4">Balance</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Value (USD)</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {userTokens.map((item, idx) => {
                  const chain = defaultChainRegistry.getChain(item.chainId);
                  const valueUSD = item.balance * (item.token.priceUSD || 1);

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.token.logoURI}
                            alt={item.token.symbol}
                            className="w-7 h-7 rounded-full"
                          />
                          <div>
                            <p className="font-bold text-sm text-white">{item.token.symbol}</p>
                            <p className="text-xs text-slate-400">{item.token.name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          {chain?.shortName || item.chainId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white text-sm">
                        {item.balance.toLocaleString()} {item.token.symbol}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        ${item.token.priceUSD?.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-cyan-300 text-sm">
                        ${valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleSwapAsset(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 font-bold font-sans text-xs transition-colors"
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <p className="text-sm">Connect your wallet to inspect balances and cross-chain portfolio.</p>
            <button
              onClick={openWalletModal}
              className="px-4 py-2 rounded-xl gradient-brand text-slate-950 font-bold text-xs shadow-glow-cyan"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
