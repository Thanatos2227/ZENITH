import React, { useState } from 'react';
import { useZenithStore } from '../../stores/useZenithStore';
import {
  Share2,
  Lock,
  TrendingUp,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { SwapCard } from './SwapCard';
import { LivePriceChart } from './LivePriceChart';

type ProTab = 'CHART' | 'ROUTING';

export const UnifiedTradingView: React.FC = () => {
  const {
    sourceChain,
    destChain,
    tokenIn,
    tokenOut,
    quote
  } = useZenithStore();

  const [activeProTab, setActiveProTab] = useState<ProTab>('CHART');

  const isCrossChain = sourceChain.id !== destChain.id;
  const currentPair = `${tokenIn.symbol} / ${tokenOut.symbol}`;
  const mock24hChange = tokenIn.change24hUSD || 3.84;
  const mock24hHigh = (tokenIn.priceUSD || 3450) * 1.05;
  const mock24hLow = (tokenIn.priceUSD || 3450) * 0.96;
  const mock24hVolume = tokenIn.volume24hUSD ? `$${(tokenIn.volume24hUSD / 1e6).toFixed(1)}M` : '$142.8M';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Top Header Bar: Pair Stats, Global Network Context & Automated Protection Status */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {tokenIn.logoURI ? (
                <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-8 h-8 rounded-full border-2 border-[#080B11] z-10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-xs text-slate-950 border-2 border-[#080B11] z-10">
                  {tokenIn.symbol.slice(0, 1)}
                </div>
              )}
              {tokenOut.logoURI ? (
                <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-8 h-8 rounded-full border-2 border-[#080B11]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs text-white border-2 border-[#080B11]">
                  {tokenOut.symbol.slice(0, 1)}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-lg text-white tracking-wide">
                  {currentPair}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {isCrossChain ? 'Cross-Chain' : 'Same-Chain'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono flex-wrap">
                <span>{sourceChain.shortName}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  sourceChain.tier === 'TIER_1' ? 'text-emerald-400 bg-emerald-500/10' :
                  sourceChain.tier === 'TIER_2' ? 'text-cyan-400 bg-cyan-500/10' :
                  sourceChain.tier === 'TIER_3' ? 'text-amber-400 bg-amber-500/10' :
                  'text-purple-400 bg-purple-500/10'
                }`}>
                  {sourceChain.tier.replace('_', ' ')}
                </span>
                {isCrossChain && (
                  <>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                    <span>{destChain.shortName}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      destChain.tier === 'TIER_1' ? 'text-emerald-400 bg-emerald-500/10' :
                      destChain.tier === 'TIER_2' ? 'text-cyan-400 bg-cyan-500/10' :
                      destChain.tier === 'TIER_3' ? 'text-amber-400 bg-amber-500/10' :
                      'text-purple-400 bg-purple-500/10'
                    }`}>
                      {destChain.tier.replace('_', ' ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-5 pl-4 border-l border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Mark Price</span>
              <span className="font-bold text-white text-sm">
                ${tokenIn.priceUSD?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '3,450.00'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">24h Change</span>
              <span className="font-bold text-emerald-400 text-sm flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +{mock24hChange}%
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">24h High / Low</span>
              <span className="text-slate-300">
                ${mock24hHigh.toFixed(0)} / ${mock24hLow.toFixed(0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">24h Volume</span>
              <span className="text-slate-200 font-semibold">{mock24hVolume}</span>
            </div>
          </div>
        </div>

        {/* Protection Status Badge */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-cyan-300">Private Relay Protected</span>
          </div>
        </div>
      </div>

      {/* Main Flagship Grid: Left 7 Cols (Live Chart & Route Topology) + Right 5 Cols (Swap Engine) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Center: Live Real-Time Chart & Route Mapping */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl">
            {/* Analytics Tab Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveProTab('CHART')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeProTab === 'CHART'
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  Live Price Chart
                </button>

                <button
                  onClick={() => setActiveProTab('ROUTING')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeProTab === 'ROUTING'
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Route & Liquidity
                </button>
              </div>

              {quote && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">EES Rating:</span>
                  <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                    {quote.effectiveExecutionScore}/100
                  </span>
                </div>
              )}
            </div>

            {/* Tab 1: Live Real-Time Streaming Chart */}
            {activeProTab === 'CHART' && (
              <div className="animate-in fade-in duration-300">
                <LivePriceChart tokenIn={tokenIn} tokenOut={tokenOut} />
              </div>
            )}

            {/* Tab 2: Route & Liquidity Topology */}
            {activeProTab === 'ROUTING' && quote && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Dynamic Multi-Hop Route Map
                    </h4>
                    <span className="text-[11px] font-mono text-cyan-400">
                      {isCrossChain ? 'Cross-Chain Stargate Relay' : 'Atomic Smart Split DEX Route'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold font-mono text-cyan-300">
                        {tokenIn.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{quote.amountInFormatted} {tokenIn.symbol}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{sourceChain.canonicalName}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center px-4 w-full sm:w-auto">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {quote.bestRoute.hops.map((hop, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 font-semibold"
                          >
                            {hop.dexProtocol} ({hop.proportionPercent}%)
                          </span>
                        ))}
                      </div>
                      <div className="w-full flex items-center gap-1 my-1.5">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500" />
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isCrossChain ? `Bridge Latency: ~${quote.bestRoute.bridgeStep?.estimatedTransferTimeSec || 45}s` : 'Atomic Single Transaction'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold font-mono text-emerald-300">
                        {tokenOut.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{quote.amountOutFormatted} {tokenOut.symbol}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{destChain.canonicalName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liquidity Split Depth */}
                <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Ranked Liquidity Pathways & Quotes
                  </h4>
                  <div className="space-y-2">
                    {quote.routes.map((r, i) => (
                      <div
                        key={r.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                          i === 0
                            ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold font-mono text-slate-400">#{i + 1}</span>
                          <span className="font-semibold">{r.routeType}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({r.hops.map((h) => `${h.dexProtocol} ${h.proportionPercent}%`).join(' + ')})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-emerald-400 font-semibold">
                            Gas: ~${r.gasCostUSD < 0.01 ? r.gasCostUSD.toFixed(4) : r.gasCostUSD.toFixed(2)}
                          </span>
                          {i === 0 && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold text-[10px]">
                              BEST ROUTE
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Area: The Core Swap Execution Card */}
        <div className="lg:col-span-5">
          <SwapCard />
        </div>
      </div>
    </div>
  );
};
