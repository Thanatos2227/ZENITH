import React, { useState } from 'react';
import { useZenithStore } from '../../stores/useZenithStore';
import { defaultMarketDataService } from '@zenith/tokens';
import { ZenithPool, LPPosition } from '@zenith/types';
import {
  Layers,
  PlusCircle,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sliders,
  DollarSign,
  ArrowUpDown,
  Coins,
  ExternalLink
} from 'lucide-react';

export const PoolsView: React.FC = () => {
  const { theme, sourceChain, openTokenPicker, tokenIn, tokenOut } = useZenithStore();
  const isDark = theme === 'dark';

  const [activeSubTab, setActiveSubTab] = useState<'EXPLORE' | 'NEW_POSITION' | 'POSITIONS'>('EXPLORE');
  const [selectedFeeTier, setSelectedFeeTier] = useState<number>(5);
  const [priceMinPercent, setPriceMinPercent] = useState<number>(-15);
  const [priceMaxPercent, setPriceMaxPercent] = useState<number>(15);
  const [depositAmount0, setDepositAmount0] = useState<string>('1000');
  const [depositAmount1, setDepositAmount1] = useState<string>('0.405');
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [mintSuccess, setMintSuccess] = useState<boolean>(false);
  const [harvestingTokenId, setHarvestingTokenId] = useState<string | null>(null);

  const pools: ZenithPool[] = defaultMarketDataService.getPools();
  const [positions, setPositions] = useState<LPPosition[]>(defaultMarketDataService.getUserPositions());

  const feeTiers = [
    { tierBps: 1, label: '0.01%', desc: 'Best for very stable pairs (e.g. USDC/USDT)', popularity: 'Stable' },
    { tierBps: 5, label: '0.05%', desc: 'Best for correlated pairs & high-volume majors', popularity: 'Most Popular' },
    { tierBps: 30, label: '0.30%', desc: 'Best for most standard volatile token pairs', popularity: 'Standard' },
    { tierBps: 100, label: '1.00%', desc: 'Best for exotic or highly volatile pairs', popularity: 'Exotic' }
  ];

  const handleCreatePosition = () => {
    setIsMinting(true);
    setTimeout(() => {
      setIsMinting(false);
      setMintSuccess(true);
      const newPos: LPPosition = {
        tokenId: `#${Math.floor(4000 + Math.random() * 999)}`,
        poolId: 'pool-custom',
        token0: tokenIn,
        token1: tokenOut,
        feeBps: selectedFeeTier,
        tickLower: 200000,
        tickUpper: 205000,
        priceLower: Number((tokenIn.priceUSD || 1) * (1 + priceMinPercent / 100)),
        priceUpper: Number((tokenIn.priceUSD || 1) * (1 + priceMaxPercent / 100)),
        currentPrice: tokenIn.priceUSD || 1,
        isInRange: true,
        liquidityRaw: '1000000000000000000',
        depositedAmount0: `${depositAmount0} ${tokenIn.symbol}`,
        depositedAmount1: `${depositAmount1} ${tokenOut.symbol}`,
        depositedUSD: 2000,
        unclaimedFee0: `0.00 ${tokenIn.symbol}`,
        unclaimedFee1: `0.00 ${tokenOut.symbol}`,
        unclaimedFeeUSD: 0,
        earnedAprPercent: 22.8,
        createdAt: Date.now()
      };
      setPositions([newPos, ...positions]);
      setTimeout(() => {
        setMintSuccess(false);
        setActiveSubTab('POSITIONS');
      }, 1200);
    }, 1500);
  };

  const handleClaimFees = (posId: string) => {
    setHarvestingTokenId(posId);
    setTimeout(() => {
      setPositions((prev) =>
        prev.map((p) =>
          p.tokenId === posId
            ? { ...p, unclaimedFee0: '0.00', unclaimedFee1: '0.00', unclaimedFeeUSD: 0 }
            : p
        )
      );
      setHarvestingTokenId(null);
    }, 1200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-display font-black text-white tracking-wide">
              Concentrated Liquidity Pools
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30">
              v4 Singleton AMM
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Provide concentrated range liquidity, customize hook behaviors, and earn automated protocol fees.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('EXPLORE')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'EXPLORE'
                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Explore Pools
          </button>
          <button
            onClick={() => setActiveSubTab('NEW_POSITION')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'NEW_POSITION'
                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Position
          </button>
          <button
            onClick={() => setActiveSubTab('POSITIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'POSITIONS'
                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Positions ({positions.length})
          </button>
        </div>
      </div>

      {}
      {activeSubTab === 'EXPLORE' && (
        <div className="space-y-6">
          {}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Total Value Locked</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">$527.18M</div>
              <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> +4.2% (7d)
              </span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">24h Pool Volume</span>
              <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">$270.55M</div>
              <span className="text-xs text-slate-400 mt-1 block">53.4% of overall DEX volume</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">24h LP Fees Earned</span>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">$278,025</div>
              <span className="text-xs text-indigo-400 font-mono mt-1 block">60% shared with veZENITH</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Gas Efficiency</span>
              <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">-68% Gas</div>
              <span className="text-xs text-slate-400 mt-1 block">via EIP-1153 Flash Accounting</span>
            </div>
          </div>

          {}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Top Liquidity Pools</h2>
              <button
                onClick={() => setActiveSubTab('NEW_POSITION')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                + Create Custom Pool
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-slate-900/40 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Pool Pair</th>
                    <th className="py-3.5 px-4">Fee Tier</th>
                    <th className="py-3.5 px-4">TVL</th>
                    <th className="py-3.5 px-4">24h Volume</th>
                    <th className="py-3.5 px-4">24h Fees</th>
                    <th className="py-3.5 px-4">APR</th>
                    <th className="py-3.5 px-4">v4 Hook</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {pools.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 font-medium text-white flex items-center gap-3">
                        <div className="flex -space-x-2">
                          <img
                            src={p.token0.logoURI || 'https://assets.coingecko.com/coins/images/6319/small/usdc.png'}
                            alt={p.token0.symbol}
                            className="w-7 h-7 rounded-full border-2 border-slate-900"
                          />
                          <img
                            src={p.token1.logoURI || 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'}
                            alt={p.token1.symbol}
                            className="w-7 h-7 rounded-full border-2 border-slate-900"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {p.token0.symbol} / {p.token1.symbol}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 uppercase">{p.chainId}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-mono text-cyan-300 border border-slate-700">
                          {(p.feeBps / 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-medium text-slate-200">
                        ${(p.tvlUSD / 1_000_000).toFixed(2)}M
                      </td>
                      <td className="py-4 px-4 font-mono text-cyan-400 font-medium">
                        ${(p.volume24hUSD / 1_000_000).toFixed(2)}M
                      </td>
                      <td className="py-4 px-4 font-mono text-emerald-400 font-medium">
                        ${p.fees24hUSD.toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-emerald-400 text-base">{p.aprPercent}%</span>
                      </td>
                      <td className="py-4 px-4">
                        {p.hookName ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            ⚡ {p.hookName}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs font-mono">Standard</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setActiveSubTab('NEW_POSITION')}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-xs font-semibold text-cyan-400 border border-slate-700 transition-all"
                        >
                          Deposit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {}
      {activeSubTab === 'NEW_POSITION' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-cyan-400" />
                1. Select Token Pair & Fee Tier
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => openTokenPicker('IN')}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={tokenIn.logoURI || 'https://assets.coingecko.com/coins/images/6319/small/usdc.png'}
                      alt={tokenIn.symbol}
                      className="w-9 h-9 rounded-full"
                    />
                    <div>
                      <div className="text-xs text-slate-400">Token 0</div>
                      <div className="font-bold text-white text-base">{tokenIn.symbol}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div
                  onClick={() => openTokenPicker('OUT')}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={tokenOut.logoURI || 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'}
                      alt={tokenOut.symbol}
                      className="w-9 h-9 rounded-full"
                    />
                    <div>
                      <div className="text-xs text-slate-400">Token 1</div>
                      <div className="font-bold text-white text-base">{tokenOut.symbol}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Select Fee Tier</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {feeTiers.map((t) => (
                    <div
                      key={t.tierBps}
                      onClick={() => setSelectedFeeTier(t.tierBps)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedFeeTier === t.tierBps
                          ? 'bg-cyan-500/10 border-cyan-500 shadow-glow-cyan'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono text-base">{t.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {t.popularity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  2. Set Concentrated Price Range
                </h2>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Current: ${(tokenIn.priceUSD || 2465).toFixed(2)}
                </span>
              </div>

              {}
              <div className="h-28 rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-end justify-between gap-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none" />
                {Array.from({ length: 32 }).map((_, i) => {
                  const inRange = i >= 8 && i <= 24;
                  const height = 20 + Math.sin(i / 5) * 60 + Math.random() * 15;
                  return (
                    <div
                      key={i}
                      style={{ height: `${height}%` }}
                      className={`flex-1 rounded-t transition-all ${
                        inRange ? 'bg-cyan-400/80 shadow-glow-cyan' : 'bg-slate-800'
                      }`}
                    />
                  );
                })}
              </div>

              {}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-mono text-slate-400">Min Price ({tokenOut.symbol} per {tokenIn.symbol})</span>
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      value={priceMinPercent}
                      onChange={(e) => setPriceMinPercent(Number(e.target.value))}
                      className="bg-transparent text-lg font-bold text-white font-mono focus:outline-none w-24"
                    />
                    <span className="text-xs font-mono text-slate-400">{priceMinPercent}%</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-mono text-slate-400">Max Price ({tokenOut.symbol} per {tokenIn.symbol})</span>
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      value={priceMaxPercent}
                      onChange={(e) => setPriceMaxPercent(Number(e.target.value))}
                      className="bg-transparent text-lg font-bold text-white font-mono focus:outline-none w-24"
                    />
                    <span className="text-xs font-mono text-slate-400">+{priceMaxPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                3. Deposit Amounts
              </h2>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between text-xs text-slate-400 font-mono mb-1">
                    <span>{tokenIn.symbol} Amount</span>
                    <span>Balance: 12,500.00</span>
                  </div>
                  <input
                    type="text"
                    value={depositAmount0}
                    onChange={(e) => setDepositAmount0(e.target.value)}
                    className="w-full bg-transparent text-xl font-bold font-mono text-white focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between text-xs text-slate-400 font-mono mb-1">
                    <span>{tokenOut.symbol} Amount</span>
                    <span>Balance: 4.82</span>
                  </div>
                  <input
                    type="text"
                    value={depositAmount1}
                    onChange={(e) => setDepositAmount1(e.target.value)}
                    className="w-full bg-transparent text-xl font-bold font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Estimated APR:</span>
                  <span className="text-emerald-400 font-bold">22.8%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>NFT Token Standard:</span>
                  <span className="text-white">ERC-721 (ZenithPositionNFT)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Flash Accounting Gas:</span>
                  <span className="text-cyan-400">~125,000 gas</span>
                </div>
              </div>

              <button
                onClick={handleCreatePosition}
                disabled={isMinting || mintSuccess}
                className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-sm tracking-wide shadow-glow-cyan transition-all flex items-center justify-center gap-2"
              >
                {isMinting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    Minting Concentrated LP NFT...
                  </>
                ) : mintSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-950" />
                    Position Minted Successfully!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Mint Concentrated LP Position
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {activeSubTab === 'POSITIONS' && (
        <div className="space-y-6">
          {positions.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
              <Layers className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Active Liquidity Positions</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                You haven't deposited liquidity into any concentrated pools yet. Create a position to start earning swap fees.
              </p>
              <button
                onClick={() => setActiveSubTab('NEW_POSITION')}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-glow-cyan"
              >
                + Create New Position
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {positions.map((pos) => (
                <div key={pos.tokenId} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 font-mono text-xs font-bold border border-slate-700">
                        {pos.tokenId}
                      </span>
                      <h3 className="font-bold text-white text-base">
                        {pos.token0.symbol} / {pos.token1.symbol}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                        {(pos.feeBps / 100).toFixed(2)}%
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium flex items-center gap-1 ${
                        pos.isInRange
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${pos.isInRange ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {pos.isInRange ? 'In Range' : 'Out of Range'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Deposited Liquidity:</span>
                      <span className="text-white font-medium">${pos.depositedUSD.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Price Range:</span>
                      <span className="text-cyan-300">
                        ${pos.priceLower.toFixed(2)} - ${pos.priceUpper.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Current APR:</span>
                      <span className="text-emerald-400 font-bold">{pos.earnedAprPercent}%</span>
                    </div>
                  </div>

                  {/* Unclaimed Fees Card */}
                  <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-slate-400">Unclaimed Fees</span>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        +${pos.unclaimedFeeUSD.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {pos.unclaimedFee0} + {pos.unclaimedFee1}
                      </span>
                    </div>

                    <button
                      onClick={() => handleClaimFees(pos.tokenId)}
                      disabled={harvestingTokenId === pos.tokenId || pos.unclaimedFeeUSD === 0}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all"
                    >
                      {harvestingTokenId === pos.tokenId ? 'Harvesting...' : 'Harvest Fees'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
