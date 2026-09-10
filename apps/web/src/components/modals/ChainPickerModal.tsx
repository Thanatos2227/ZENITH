import React, { useState } from 'react';
import { useZenithStore } from '../../stores/useZenithStore';
import { defaultChainRegistry } from '@zenith/chains';
import { ChainConfig, NetworkSupportTier } from '@zenith/types';
import { X, Search, Zap, Check, Shield, Activity, Layers, ArrowRightLeft, Sparkles } from 'lucide-react';

export const ChainPickerModal: React.FC = () => {
  const {
    isChainPickerOpen,
    closeChainPicker,
    chainPickerTarget,
    sourceChain,
    destChain,
    setSourceChain,
    setDestChain
  } = useZenithStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  if (!isChainPickerOpen) return null;

  const currentSelected = chainPickerTarget === 'SOURCE' ? sourceChain : destChain;
  const allChains = defaultChainRegistry.getAllChains();

  const tier1Count = allChains.filter((c) => c.tier === 'TIER_1').length;
  const tier2Count = allChains.filter((c) => c.tier === 'TIER_2').length;
  const tier3Count = allChains.filter((c) => c.tier === 'TIER_3').length;
  const tier4Count = allChains.filter((c) => c.tier === 'TIER_4').length;

  const filteredChains = allChains.filter((c) => {
    const matchesSearch =
      c.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.executionEnvironment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.supportedStandards.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = selectedTier === 'ALL' || c.tier === selectedTier;

    return matchesSearch && matchesTier;
  });

  const handleSelect = (chain: ChainConfig) => {
    if (chainPickerTarget === 'SOURCE') {
      setSourceChain(chain);
    } else {
      setDestChain(chain);
    }
    closeChainPicker();
  };

  const getTierBadge = (tier: NetworkSupportTier) => {
    switch (tier) {
      case 'TIER_1':
        return {
          label: 'Tier 1 • Core Production',
          desc: 'Full DEX routing, simulation & MEV-aware execution',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        };
      case 'TIER_2':
        return {
          label: 'Tier 2 • Expanding Trading',
          desc: 'Production trading, live routing & risk engine',
          badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
        };
      case 'TIER_3':
        return {
          label: 'Tier 3 • Limited / Experimental',
          desc: 'Selective liquidity with capability restrictions',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        };
      case 'TIER_4':
        return {
          label: 'Tier 4 • Research / Adapter',
          desc: 'Architecture prepared; direct swaps coming soon',
          badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
        };
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-emerald-400';
      case 'DEGRADED':
        return 'bg-yellow-400 animate-pulse';
      case 'MAINTENANCE':
        return 'bg-amber-400';
      case 'PARTIALLY_AVAILABLE':
        return 'bg-blue-400';
      case 'PAUSED':
        return 'bg-orange-500';
      case 'DISABLED':
        return 'bg-red-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl glass-panel rounded-2xl border border-slate-700/80 shadow-modal overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-white">
                Select {chainPickerTarget === 'SOURCE' ? 'Source' : 'Destination'} Network
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {allChains.length} Networks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Universal Chain Registry with automated capability detection, tier governance & failover
            </p>
          </div>
          <button
            onClick={closeChainPicker}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tier Filters */}
        <div className="p-4 border-b border-slate-800/80 space-y-3 bg-[#080D1A]/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by network name, token standard (ERC-20, SPL, Move), or environment..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0B111E] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
            {[
              { id: 'ALL', label: `All Networks (${allChains.length})` },
              { id: 'TIER_1', label: `Tier 1 • Core (${tier1Count})`, color: 'emerald' },
              { id: 'TIER_2', label: `Tier 2 • Expanding (${tier2Count})`, color: 'cyan' },
              { id: 'TIER_3', label: `Tier 3 • Limited (${tier3Count})`, color: 'amber' },
              { id: 'TIER_4', label: `Tier 4 • Research (${tier4Count})`, color: 'purple' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTier(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all text-xs ${
                  selectedTier === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chain Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] scrollbar-thin">
          {filteredChains.map((c) => {
            const isSelected = currentSelected.id === c.id;
            const tierBadge = getTierBadge(c.tier);
            const isSwapSupported = c.capabilities.swap;

            return (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`p-3.5 rounded-xl cursor-pointer border transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500/70 shadow-glow-cyan'
                    : 'bg-[#0B111E] border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={c.iconURI}
                        alt={c.canonicalName}
                        className="w-9 h-9 rounded-full bg-slate-900 p-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
                        }}
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#0B111E] ${getStatusDot(
                          c.operationalStatus
                        )}`}
                        title={`Operational Status: ${c.operationalStatus}`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{c.canonicalName}</span>
                        {c.capabilities.hasSubSecondBlocks && (
                          <span title="Sub-second block time">
                            <Zap className="w-3 h-3 text-yellow-400" />
                          </span>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-cyan-400 ml-1" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="font-mono">{c.executionEnvironment}</span>
                        <span>•</span>
                        <span>{c.category.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${tierBadge.badgeClass}`}
                  >
                    {c.tier.replace('_', ' ')}
                  </span>
                </div>

                {/* Capabilities & Standards Footer */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-400 flex-wrap">
                    {isSwapSupported ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-400 font-medium">
                        <ArrowRightLeft className="w-2.5 h-2.5" /> Swaps ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-slate-500 font-medium">
                        Research Stage
                      </span>
                    )}
                    {c.capabilities.simulation && (
                      <span className="inline-flex items-center gap-0.5 text-cyan-400">
                        • Sim ✓
                      </span>
                    )}
                    {c.capabilities.mevProtection && (
                      <span className="inline-flex items-center gap-0.5 text-indigo-400">
                        • MEV ✓
                      </span>
                    )}
                  </div>

                  <span className="text-slate-500 font-mono text-[9px] truncate max-w-[120px]" title={c.supportedStandards.join(', ')}>
                    {c.supportedStandards[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#080D1A] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-5">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Capability-gated execution: unverified or research chains are restricted safely.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">Universal Tier Governance v4.0</span>
        </div>
      </div>
    </div>
  );
};
