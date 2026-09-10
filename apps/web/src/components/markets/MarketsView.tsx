import React, { useState, useEffect } from 'react';
import { useZenithStore } from '../../stores/useZenithStore';
import { DEFAULT_TOKENS, defaultTokenService } from '@zenith/tokens';
import { defaultChainRegistry } from '@zenith/chains';
import { Token } from '@zenith/types';
import {
  TrendingUp,
  TrendingDown,
  Search,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const MarketsView: React.FC = () => {
  const {
    setTokenIn,
    setTokenOut,
    setSourceChain,
    setDestChain,
    setActiveTab,
    marketData,
    isMarketsLoading,
    marketsError,
    lastMarketUpdate,
    marketDataStatus,
    fetchMarketData
  } = useZenithStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [chainFilter, setChainFilter] = useState('ALL');

  // Poll for live market data every 20 seconds
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(() => {
      fetchMarketData();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

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
      if (token.isNative) {
        setTokenIn(token);
        const destTokens = defaultTokenService.getTokensForChain(chain.id);
        const stable =
          destTokens.find(
            (t) =>
              (t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'DAI') &&
              t.address.toLowerCase() !== token.address.toLowerCase()
          ) ||
          destTokens.find((t) => t.address.toLowerCase() !== token.address.toLowerCase()) ||
          destTokens[0];
        if (stable) setTokenOut(stable);
      } else {
        const native = defaultTokenService.getNativeToken(chain.id);
        if (native) setTokenIn(native);
        setTokenOut(token);
      }
      setActiveTab('TRADE');
    }
  };

  const formatPrice = (val: number): string => {
    if (val >= 1000) return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (val >= 0.0001) return val.toFixed(6);
    return val.toFixed(8);
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`;
    return `$${vol.toLocaleString()}`;
  };

  const formatMarketCap = (cap?: number | null): string => {
    if (!cap || cap <= 0) return '—';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
    return `$${cap.toLocaleString()}`;
  };

  // Compute live total 24h market volume across unique market assets (deduplicating multi-chain assets)
  const seenAssets = new Set<string>();
  let uniqueTotalVolumeUSD = 0;

  Object.entries(marketData).forEach(([key, m]) => {
    if (m && typeof m.volume24hUSD === 'number' && m.volume24hUSD > 0) {
      const assetId = m.symbol ? m.symbol.toUpperCase() : key;
      if (!seenAssets.has(assetId)) {
        seenAssets.add(assetId);
        uniqueTotalVolumeUSD += m.volume24hUSD;
      }
    }
  });

  const totalVolumeFormatted =
    uniqueTotalVolumeUSD > 0
      ? uniqueTotalVolumeUSD >= 1e9
        ? `$${(uniqueTotalVolumeUSD / 1e9).toFixed(1)} Billion`
        : `$${(uniqueTotalVolumeUSD / 1e6).toFixed(1)} Million`
      : '—';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display font-extrabold text-2xl text-white">Multi-Chain Markets</h2>
            {marketDataStatus === 'LIVE' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                🟢 LIVE FEED
              </span>
            ) : marketDataStatus === 'FALLBACK' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                🟡 BINANCE FALLBACK
              </span>
            ) : marketDataStatus === 'STALE' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                🟠 STALE CACHE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                🔴 OFFLINE / UNAVAILABLE
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time live WebSocket price feeds, circulating supply market caps, and 24h metrics across {defaultChainRegistry.getAllChains().length} supported networks
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Tracked 24h Volume</span>
            <span className="font-bold text-white text-sm">{totalVolumeFormatted}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Active Chains</span>
            <span className="font-bold text-cyan-400 text-sm">{defaultChainRegistry.getAllChains().length} Networks</span>
          </div>
          <button
            onClick={() => fetchMarketData()}
            disabled={isMarketsLoading}
            className="flex items-center gap-1.5 p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors disabled:opacity-50"
            title="Click to refresh live prices"
          >
            <RefreshCw className={`w-4 h-4 ${isMarketsLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span className="text-[11px] font-bold font-sans">
              {isMarketsLoading ? 'Updating...' : lastMarketUpdate ? 'Updated' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      {/* Warning Notice if any error */}
      {marketsError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Pricing feed notice: {marketsError}. Serving last cached market snapshot.</span>
        </div>
      )}

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
                <th className="py-3.5 px-4">Live Price (USD)</th>
                <th className="py-3.5 px-4">24h Change</th>
                <th className="py-3.5 px-4">24h Volume</th>
                <th className="py-3.5 px-4">Market Cap</th>
                <th className="py-3.5 px-4">Risk Rating</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {filteredTokens.map((t) => {
                const chain = defaultChainRegistry.getChain(t.chainId);
                const tokenKey = `${t.chainId.toLowerCase()}:${t.address.toLowerCase()}`;
                const live = marketData[tokenKey] || marketData[t.symbol.toLowerCase()];

                // No static price fallback! If live is null or not provided, it is unavailable
                const currentPrice = (live?.priceUSD !== undefined && live.priceUSD !== null && live.priceUSD > 0) ? live.priceUSD : null;
                const change24h = (live?.change24hUSD !== undefined && live.change24hUSD !== null) ? live.change24hUSD : null;
                const volume24h = (live?.volume24hUSD !== undefined && live.volume24hUSD !== null && live.volume24hUSD > 0) ? live.volume24hUSD : null;
                const marketCapUSD = live?.marketCapUSD ?? null;
                const isAvailable = currentPrice !== null;
                const isPositive = change24h !== null && change24h >= 0;
                const riskScore = t.securityProfile?.riskScore ?? 0;

                return (
                  <tr key={`${t.chainId}-${t.address}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-3">
                        {t.logoURI ? (
                          <img
                            src={t.logoURI}
                            alt={t.symbol}
                            className="w-7 h-7 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
                            }}
                          />
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
                      {currentPrice !== null ? `$${formatPrice(currentPrice)}` : <span className="text-slate-500 font-normal">Unavailable</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      {change24h !== null ? (
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {isPositive ? '+' : ''}
                          {change24h.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {volume24h !== null ? formatVolume(volume24h) : <span className="text-slate-500">—</span>}
                    </td>

                    <td className="py-3.5 px-4 text-slate-200 font-semibold">
                      {formatMarketCap(marketCapUSD)}
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
                        disabled={!isAvailable}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold font-sans text-xs transition-colors inline-flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-cyan-500/20"
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

