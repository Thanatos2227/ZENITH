import React, { useState } from 'react';
import { useZenithStore } from '../../stores/useZenithStore';
import { defaultMarketDataService } from '@zenith/tokens';
import { ProtocolAnalytics, ZenithPool, Token } from '@zenith/types';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Search,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  DollarSign
} from 'lucide-react';

export const ExploreView: React.FC = () => {
  const { theme, setTokenIn, setActiveTab } = useZenithStore();
  const isDark = theme === 'dark';

  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | 'ALL'>('30D');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const analytics: ProtocolAnalytics = defaultMarketDataService.getProtocolAnalytics();
  const pools = analytics.topPools;
  const tokens = analytics.topTokens.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTradeToken = (tok: Token) => {
    setTokenIn(tok);
    setActiveTab('TRADE');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-display font-black text-white tracking-wide">
              Protocol Analytics & Explorer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Metrics
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-chain volume, total value locked, fee yields, and top token pairs.
          </p>
        </div>

        {}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search token or pool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 text-sm rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Total Value Locked</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5 font-mono">
            ${(analytics.totalValueLockedUSD / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" /> +5.8% this week
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>24h Total Volume</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-1.5 font-mono">
            ${(analytics.totalVolume24hUSD / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            7d Vol: ${(analytics.totalVolume7dUSD / 1_000_000).toFixed(2)}M
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>24h Protocol Fees</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1.5 font-mono">
            ${analytics.totalFees24hUSD.toLocaleString()}
          </div>
          <div className="text-xs text-indigo-400 mt-1 font-mono">
            60% distributed to veZENITH
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>24h Transactions</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5 font-mono">
            {analytics.totalTransactions24h.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Across 53 Chains
          </div>
        </div>
      </div>

      {}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Protocol Volume & TVL History
            </h2>
            <span className="text-xs text-slate-400">Aggregated trading volume across all chains</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['24H', '7D', '30D', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === tf ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {}
        <div className="h-44 flex items-end justify-between gap-1.5 pt-4">
          {analytics.historicalVolume.map((pt, i) => {
            const heightPercent = Math.min(100, Math.max(15, (pt.volumeUSD / 250000000) * 100));
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full rounded-t bg-cyan-500/60 group-hover:bg-cyan-400 transition-all shadow-glow-cyan"
                />
                {i % 5 === 0 && (
                  <span className="text-[10px] font-mono text-slate-500 hidden sm:block">
                    {new Date(pt.timestamp).getDate()}d
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase font-mono">Top Verified Tokens</h2>
            <span className="text-xs text-slate-400 font-mono">By Market Cap</span>
          </div>
          <div className="divide-y divide-slate-800/40 text-sm">
            {tokens.slice(0, 6).map((tok) => (
              <div
                key={tok.symbol}
                onClick={() => handleTradeToken(tok)}
                className="p-3.5 hover:bg-slate-800/30 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={tok.logoURI || 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'}
                    alt={tok.symbol}
                    className="w-7 h-7 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-white">{tok.name}</div>
                    <span className="text-xs font-mono text-slate-400">{tok.symbol}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-white">${(tok.priceUSD || 0).toLocaleString()}</div>
                  <span
                    className={`text-xs flex items-center justify-end gap-0.5 ${
                      (tok.change24hUSD || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(tok.change24hUSD || 0) >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(tok.change24hUSD || 1.45)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase font-mono">Top Concentrated Pools</h2>
            <span className="text-xs text-cyan-400 font-mono">v4 Singleton</span>
          </div>
          <div className="divide-y divide-slate-800/40 text-sm">
            {pools.map((p) => (
              <div
                key={p.id}
                onClick={() => setActiveTab('POOLS')}
                className="p-3.5 hover:bg-slate-800/30 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1.5">
                    <img
                      src={p.token0.logoURI || 'https://assets.coingecko.com/coins/images/6319/small/usdc.png'}
                      alt={p.token0.symbol}
                      className="w-6 h-6 rounded-full border border-slate-900"
                    />
                    <img
                      src={p.token1.logoURI || 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'}
                      alt={p.token1.symbol}
                      className="w-6 h-6 rounded-full border border-slate-900"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {p.token0.symbol}/{p.token1.symbol}
                    </div>
                    <span className="text-[11px] font-mono text-cyan-300">{(p.feeBps / 100).toFixed(2)}% fee</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-emerald-400">{p.aprPercent}% APR</div>
                  <span className="text-xs text-slate-400">${(p.tvlUSD / 1_000_000).toFixed(1)}M TVL</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
