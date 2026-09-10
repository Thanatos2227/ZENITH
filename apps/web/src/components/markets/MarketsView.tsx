import React, { useState } from 'react';
import { useZenithStore } from '../../stores/useZenithStore';
import { DEFAULT_TOKENS } from '@zenith/tokens';
import { defaultChainRegistry } from '@zenith/chains';
import { Token } from '@zenith/types';
import {
  TrendingUp,
  TrendingDown,
  Search,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const MarketsView: React.FC = () => {
  const { setTokenIn, setTokenOut, setSourceChain, setDestChain, setActiveTab } = useZenithStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [chainFilter, setChainFilter] = useState('ALL');

  const filteredTokens = DEFAULT_TOKENS.filter((t) => {
    const chain = defaultChainRegistry.getChain(t.chainId);
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chain && chain.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesChain = chainFilter === 'ALL' || t.chainId.toLowerCase() === chainFilter.toLowerCase();
    const matchesTier = tierFilter === 'ALL' || (chain && chain.tier === tierFilter);

    return matchesSearch && matchesChain && matchesTier;
  });

  const handleTrade = (token: Token) => {
    const chain = defaultChainRegistry.getChain(token.chainId);
    if (chain) {
      setSourceChain(chain);
      setDestChain(chain);
      setTokenOut(token);
      setActiveTab('TRADE');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white">Multi-Chain Markets</h2>
          <p className="text-sm text-slate-400">
            Real-time liquidity, pricing, and automated security scoring across {defaultChainRegistry.getAllChains().length} supported networks
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">24h Volume</span>
            <span className="font-bold text-white text-sm">$48.2 Billion</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Active Chains</span>
            <span className="font-bold text-cyan-400 text-sm">{defaultChainRegistry.getAllChains().length} Networks</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Avg Execution Time</span>
            <span className="font-bold text-emerald-400 text-sm">~1.4s</span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens, symbols, or networks..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0B111E] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          {[
            { id: 'ALL', label: 'All Tiers' },
            { id: 'TIER_1', label: 'Tier 1 (Core)' },
            { id: 'TIER_2', label: 'Tier 2 (Expanding)' },
            { id: 'TIER_3', label: 'Tier 3 (Limited)' },
            { id: 'TIER_4', label: 'Tier 4 (Research)' }
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => setTierFilter(tier.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors ${
                tierFilter === tier.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B111E] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Asset</th>
                <th className="py-3.5 px-4">Network & Tier</th>
                <th className="py-3.5 px-4">Price (USD)</th>
                <th className="py-3.5 px-4">24h Change</th>
                <th className="py-3.5 px-4">24h Volume</th>
                <th className="py-3.5 px-4">Risk Rating</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {filteredTokens.map((t) => {
                const chain = defaultChainRegistry.getChain(t.chainId);
                const isPositive = (t.change24hUSD || 0) >= 0;
                const riskScore = t.securityProfile?.riskScore ?? 0;
                const isSwapSupported = chain?.capabilities.swap ?? false;

                return (
                  <tr key={`${t.chainId}-${t.address}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-3">
                        {t.logoURI ? (
                          <img src={t.logoURI} alt={t.symbol} className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">
                            {t.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-white">{t.symbol}</p>
                          <p className="text-xs text-slate-400 font-sans">{t.name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          {chain?.shortName || t.chainId}
                        </span>
                        {chain && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            chain.tier === 'TIER_1' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' :
                            chain.tier === 'TIER_2' ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' :
                            chain.tier === 'TIER_3' ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' :
                            'text-purple-300 bg-purple-500/10 border-purple-500/30'
                          }`}>
                            {chain.tier.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      ${t.priceUSD?.toLocaleString() || '1.00'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {isPositive ? '+' : ''}
                        {t.change24hUSD || 0}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      ${((t.volume24hUSD || 10000000) / 1e6).toFixed(1)}M
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          riskScore > 30
                            ? 'bg-red-500/20 text-red-300'
                            : riskScore > 10
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {riskScore > 20 ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                        Score: {riskScore}/100
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleTrade(t)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold font-sans text-xs transition-colors inline-flex items-center gap-1"
                      >
                        Trade
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
