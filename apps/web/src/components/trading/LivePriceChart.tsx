import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Token } from '@zenith/types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Maximize2,
  Radio,
  BarChart2,
  Layers,
  RefreshCw
} from 'lucide-react';
import {
  defaultMarketDataService,
  MarketCandle,
  TimeframeInterval,
  MarketStats24h
} from '../../services/marketDataService';
import { TradingViewChart } from './TradingViewChart';

interface LivePriceChartProps {
  tokenIn: Token;
  tokenOut: Token;
}

export const LivePriceChart: React.FC<LivePriceChartProps> = ({ tokenIn, tokenOut }) => {
  const [viewEngine, setViewEngine] = useState<'NATIVE' | 'TRADINGVIEW'>('NATIVE');
  const [chartMode, setChartMode] = useState<'AREA' | 'CANDLE'>('AREA');
  const [interval, setInterval] = useState<TimeframeInterval>('15m');
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [hoveredCandle, setHoveredCandle] = useState<MarketCandle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isTickUp, setIsTickUp] = useState<boolean | null>(null);
  const [tickCounter, setTickCounter] = useState<number>(0);
  const [wsStatus, setWsStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Compute baseline price
  const baseRate = useMemo(() => {
    const pIn = tokenIn.priceUSD || (tokenIn.symbol === 'ETH' ? 3450 : tokenIn.symbol === 'SOL' ? 145 : tokenIn.symbol === 'WBTC' ? 65000 : 1);
    const pOut = tokenOut.priceUSD || (tokenOut.symbol === 'USDC' || tokenOut.symbol === 'USDT' ? 1 : tokenOut.symbol === 'ETH' ? 3450 : 1);
    return pIn / pOut;
  }, [tokenIn, tokenOut]);

  // Real 24h market stats
  const [stats24h, setStats24h] = useState<MarketStats24h>({
    currentPrice: baseRate,
    change24hPercent: 3.42,
    high24h: baseRate * 1.04,
    low24h: baseRate * 0.96,
    volume24hUSD: 185000000
  });

  // Candlestick historical state
  const [candles, setCandles] = useState<MarketCandle[]>([]);

  // Load real historical klines and 24h stats
  const loadMarketData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedCandles, fetchedStats] = await Promise.all([
        defaultMarketDataService.fetchKlines(tokenIn.symbol, tokenOut.symbol, interval, 45, baseRate),
        defaultMarketDataService.fetch24hStats(tokenIn.symbol, tokenOut.symbol, baseRate)
      ]);

      if (fetchedCandles && fetchedCandles.length > 0) {
        setCandles(fetchedCandles);
      }
      if (fetchedStats) {
        setStats24h(fetchedStats);
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tokenIn.symbol, tokenOut.symbol, interval, baseRate]);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // Live WebSocket Tick Subscription
  useEffect(() => {
    const cleanup = defaultMarketDataService.subscribeLiveStream(
      tokenIn.symbol,
      tokenOut.symbol,
      interval,
      (livePrice, tickCandle) => {
        setCandles((prev) => {
          if (prev.length === 0) return prev;
          const lastIndex = prev.length - 1;
          const last = prev[lastIndex];

          setIsTickUp(livePrice >= last.close);
          setTickCounter((c) => c + 1);

          setStats24h((prevStats) => ({
            ...prevStats,
            currentPrice: livePrice,
            high24h: Math.max(prevStats.high24h, livePrice),
            low24h: Math.min(prevStats.low24h, livePrice)
          }));

          if (tickCandle) {
            // Check if candle timestamp matches latest candle interval
            if (tickCandle.timestamp === last.timestamp) {
              const updatedLast: MarketCandle = {
                ...last,
                high: Math.max(last.high, tickCandle.high, livePrice),
                low: Math.min(last.low, tickCandle.low, livePrice),
                close: livePrice,
                volume: last.volume + (tickCandle.volume ? tickCandle.volume * 0.05 : 1)
              };
              return [...prev.slice(0, lastIndex), updatedLast];
            } else if (tickCandle.timestamp > last.timestamp) {
              // New candle period started
              return [...prev.slice(1), tickCandle];
            }
          }

          // In-period tick
          const updatedLast: MarketCandle = {
            ...last,
            high: Math.max(last.high, livePrice),
            low: Math.min(last.low, livePrice),
            close: livePrice
          };
          return [...prev.slice(0, lastIndex), updatedLast];
        });
      },
      (status) => {
        setWsStatus(status);
      }
    );

    return () => {
      cleanup();
    };
  }, [tokenIn.symbol, tokenOut.symbol, interval]);

  // Derived stats
  const currentPrice = candles[candles.length - 1]?.close || stats24h.currentPrice || baseRate;
  const firstPrice = candles[0]?.open || baseRate;
  const priceChangeUSD = currentPrice - firstPrice;
  const priceChangePercent = stats24h.change24hPercent !== undefined ? stats24h.change24hPercent : (firstPrice > 0 ? (priceChangeUSD / firstPrice) * 100 : 0);
  const isPositive = priceChangePercent >= 0;

  const minPrice = useMemo(() => {
    if (candles.length === 0) return baseRate * 0.95;
    return Math.min(...candles.map((c) => c.low));
  }, [candles, baseRate]);

  const maxPrice = useMemo(() => {
    if (candles.length === 0) return baseRate * 1.05;
    return Math.max(...candles.map((c) => c.high));
  }, [candles, baseRate]);

  const priceRange = maxPrice - minPrice || 1;
  const maxVolume = useMemo(() => {
    if (candles.length === 0) return 1000;
    return Math.max(...candles.map((c) => c.volume), 1);
  }, [candles]);

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 250;
  const paddingX = 20;
  const paddingY = 25;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  // Calculate points for Area line
  const points = useMemo(() => {
    if (candles.length === 0) return [];
    return candles.map((c, i) => {
      const x = paddingX + (i / (candles.length - 1 || 1)) * usableWidth;
      const normalizedY = (c.close - minPrice) / priceRange;
      const y = chartHeight - paddingY - normalizedY * usableHeight;
      return { x, y, candle: c };
    });
  }, [candles, minPrice, priceRange, usableHeight, usableWidth, chartHeight]);

  // Construct SVG Path
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((path, pt, i) => `${path} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = chartHeight - paddingY;
    return `${linePath} L ${lastX.toFixed(1)},${bottomY} L ${firstX.toFixed(1)},${bottomY} Z`;
  }, [linePath, points, chartHeight]);

  // 9-period Exponential Moving Average (EMA)
  const emaPoints = useMemo(() => {
    if (candles.length < 9) return [];
    const k = 2 / (9 + 1);
    let ema = candles[0].close;
    return candles.map((c, i) => {
      ema = c.close * k + ema * (1 - k);
      const x = paddingX + (i / (candles.length - 1 || 1)) * usableWidth;
      const normalizedY = (ema - minPrice) / priceRange;
      const y = chartHeight - paddingY - normalizedY * usableHeight;
      return { x, y };
    });
  }, [candles, minPrice, priceRange, usableHeight, usableWidth, chartHeight]);

  const emaPath = useMemo(() => {
    if (emaPoints.length === 0) return '';
    return emaPoints.reduce((path, pt, i) => `${path} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '');
  }, [emaPoints]);

  // 21-period Exponential Moving Average (EMA)
  const ema21Points = useMemo(() => {
    if (candles.length < 21) return [];
    const k = 2 / (21 + 1);
    let ema = candles[0].close;
    return candles.map((c, i) => {
      ema = c.close * k + ema * (1 - k);
      const x = paddingX + (i / (candles.length - 1 || 1)) * usableWidth;
      const normalizedY = (ema - minPrice) / priceRange;
      const y = chartHeight - paddingY - normalizedY * usableHeight;
      return { x, y };
    });
  }, [candles, minPrice, priceRange, usableHeight, usableWidth, chartHeight]);

  const ema21Path = useMemo(() => {
    if (ema21Points.length === 0) return '';
    return ema21Points.reduce((path, pt, i) => `${path} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '');
  }, [ema21Points]);

  // Mouse hover event handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (candles.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    const mouseY = ((e.clientY - rect.top) / rect.height) * chartHeight;

    const closestIndex = Math.min(
      Math.max(Math.round(((mouseX - paddingX) / usableWidth) * (candles.length - 1)), 0),
      candles.length - 1
    );

    setHoveredCandle(candles[closestIndex]);
    setMousePos({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
    setMousePos(null);
  };

  const displayedCandle = hoveredCandle || candles[candles.length - 1];

  const formatPriceDigits = (p: number) => {
    if (p >= 1000) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (p >= 0.001) return p.toFixed(5);
    return p.toFixed(8);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0B111E] border border-slate-800 space-y-4 shadow-xl">
      {/* Chart Top Bar: Pair, Live Price, Engine Switcher, Timeframe Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Token Pair & Live Price */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-lg sm:text-xl text-white tracking-wide">
              {tokenIn.symbol}/{tokenOut.symbol}
            </span>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${
                wsStatus === 'CONNECTED'
                  ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-500/30 text-amber-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span>{wsStatus === 'CONNECTED' ? 'LIVE WS' : 'SYNCING'}</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono font-bold text-lg sm:text-xl tracking-tight transition-colors duration-300 ${
                isTickUp === true
                  ? 'text-emerald-400'
                  : isTickUp === false
                  ? 'text-red-400'
                  : 'text-white'
              }`}
            >
              ${formatPriceDigits(currentPrice)}
            </span>

            <span
              className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}
              {priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Controls: Engine Switcher, Timeframes, Display Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Engine Switcher: Native Stream vs TradingView Pro */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewEngine('NATIVE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-all ${
                viewEngine === 'NATIVE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3 h-3" />
              Zenith Live
            </button>
            <button
              onClick={() => setViewEngine('TRADINGVIEW')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-all ${
                viewEngine === 'TRADINGVIEW'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              TradingView Pro
            </button>
          </div>

          {/* Timeframe Intervals (When in Native Engine) */}
          {viewEngine === 'NATIVE' && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
              {(['1m', '5m', '15m', '1h', '4h', '1d'] as TimeframeInterval[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setInterval(tf)}
                  className={`px-2 py-0.5 rounded font-bold uppercase transition-colors ${
                    interval === tf
                      ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          {/* Chart Type Toggle & Indicators (When in Native Engine) */}
          {viewEngine === 'NATIVE' && (
            <>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setChartMode('AREA')}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    chartMode === 'AREA'
                      ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartMode('CANDLE')}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    chartMode === 'CANDLE'
                      ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Candles
                </button>
              </div>

              <button
                onClick={() => setShowEMA(!showEMA)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                  showEMA
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title="Toggle EMA 9 & EMA 21 overlays"
              >
                EMA
              </button>

              <button
                onClick={() => setShowVolume(!showVolume)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                  showVolume
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title="Toggle Volume Histogram"
              >
                Vol
              </button>
            </>
          )}

          <button
            onClick={loadMarketData}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mode A: TradingView Pro Embed Widget */}
      {viewEngine === 'TRADINGVIEW' && (
        <TradingViewChart tokenIn={tokenIn} tokenOut={tokenOut} />
      )}

      {/* Mode B: Zenith Native Real-Time SVG Engine */}
      {viewEngine === 'NATIVE' && (
        <>
          {/* Real-time OHLCV Inspector Strip */}
          {displayedCandle && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800/80">
              <div className="text-slate-400">
                <span>Time: </span>
                <span className="text-white font-semibold">{displayedCandle.timeLabel}</span>
              </div>
              <div>
                <span className="text-slate-400">O: </span>
                <span className="text-slate-200">${formatPriceDigits(displayedCandle.open)}</span>
              </div>
              <div>
                <span className="text-slate-400">H: </span>
                <span className="text-emerald-400">${formatPriceDigits(displayedCandle.high)}</span>
              </div>
              <div>
                <span className="text-slate-400">L: </span>
                <span className="text-red-400">${formatPriceDigits(displayedCandle.low)}</span>
              </div>
              <div>
                <span className="text-slate-400">C: </span>
                <span className="text-cyan-300 font-bold">${formatPriceDigits(displayedCandle.close)}</span>
              </div>
              {showVolume && (
                <div>
                  <span className="text-slate-400">Vol: </span>
                  <span className="text-indigo-300">{displayedCandle.volume.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                </div>
              )}
              <div className="ml-auto text-[11px] text-slate-500 hidden sm:flex items-center gap-2">
                <span>Ticks: {tickCounter}</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">Live Market Stream</span>
              </div>
            </div>
          )}

          {/* SVG Interactive Real-Time Chart Canvas */}
          <div className="relative w-full h-72 sm:h-80 bg-[#080B11]/90 rounded-xl border border-slate-800/80 overflow-hidden select-none">
            {/* Horizontal Price Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-30">
              <div className="w-full border-b border-dashed border-slate-700 flex justify-between text-[10px] font-mono text-slate-400">
                <span>${formatPriceDigits(maxPrice)}</span>
              </div>
              <div className="w-full border-b border-dashed border-slate-700 flex justify-between text-[10px] font-mono text-slate-400">
                <span>${formatPriceDigits((maxPrice + minPrice) / 2)}</span>
              </div>
              <div className="w-full border-b border-dashed border-slate-700 flex justify-between text-[10px] font-mono text-slate-400">
                <span>${formatPriceDigits(minPrice)}</span>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full cursor-crosshair"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                {/* Area Gradient */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#00E599' : '#F43F5E'} stopOpacity="0.35" />
                  <stop offset="50%" stopColor={isPositive ? '#06B6D4' : '#E11D48'} stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#080B11" stopOpacity="0.0" />
                </linearGradient>

                {/* Glowing Line Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Volume Bars (Optional) */}
              {showVolume &&
                candles.map((c, i) => {
                  const x = paddingX + (i / (candles.length - 1 || 1)) * usableWidth;
                  const barHeight = (c.volume / maxVolume) * 45;
                  const y = chartHeight - paddingY - barHeight;
                  const barWidth = Math.max(usableWidth / candles.length - 3, 2);
                  const isUp = c.close >= c.open;

                  return (
                    <rect
                      key={`vol-${i}`}
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={isUp ? '#00E599' : '#F43F5E'}
                      opacity="0.25"
                      rx="1"
                    />
                  );
                })}

              {/* Area Mode Rendering */}
              {chartMode === 'AREA' && (
                <>
                  {/* Shaded Area */}
                  <path d={areaPath} fill="url(#areaGradient)" />

                  {/* Main Price Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke={isPositive ? '#00E599' : '#F43F5E'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                  />
                </>
              )}

              {/* Candlestick Mode Rendering */}
              {chartMode === 'CANDLE' &&
                candles.map((c, i) => {
                  const x = paddingX + (i / (candles.length - 1 || 1)) * usableWidth;
                  const normalizedHighY = chartHeight - paddingY - ((c.high - minPrice) / priceRange) * usableHeight;
                  const normalizedLowY = chartHeight - paddingY - ((c.low - minPrice) / priceRange) * usableHeight;
                  const normalizedOpenY = chartHeight - paddingY - ((c.open - minPrice) / priceRange) * usableHeight;
                  const normalizedCloseY = chartHeight - paddingY - ((c.close - minPrice) / priceRange) * usableHeight;

                  const isUp = c.close >= c.open;
                  const candleTop = Math.min(normalizedOpenY, normalizedCloseY);
                  const candleHeight = Math.max(Math.abs(normalizedOpenY - normalizedCloseY), 2);
                  const candleWidth = Math.max(usableWidth / candles.length - 4, 3);

                  return (
                    <g key={`candle-${i}`}>
                      {/* Wick */}
                      <line
                        x1={x}
                        y1={normalizedHighY}
                        x2={x}
                        y2={normalizedLowY}
                        stroke={isUp ? '#00E599' : '#F43F5E'}
                        strokeWidth="1.2"
                      />
                      {/* Body */}
                      <rect
                        x={x - candleWidth / 2}
                        y={candleTop}
                        width={candleWidth}
                        height={candleHeight}
                        fill={isUp ? '#00E599' : '#F43F5E'}
                        stroke={isUp ? '#00E599' : '#F43F5E'}
                        strokeWidth="0.8"
                        rx="1"
                      />
                    </g>
                  );
                })}

              {/* EMA 9 Overlay Line */}
              {showEMA && emaPath && (
                <path
                  d={emaPath}
                  fill="none"
                  stroke="#818CF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  opacity="0.8"
                />
              )}

              {/* EMA 21 Overlay Line */}
              {showEMA && ema21Path && (
                <path
                  d={ema21Path}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.2"
                  opacity="0.7"
                />
              )}

              {/* Current Live Pulse Indicator on Latest Point */}
              {points.length > 0 && (
                <g>
                  {/* Horizontal Latest Price Guideline */}
                  <line
                    x1={paddingX}
                    y1={points[points.length - 1].y}
                    x2={chartWidth - paddingX}
                    y2={points[points.length - 1].y}
                    stroke={isPositive ? '#00E599' : '#F43F5E'}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />

                  {/* Pulsing Beacon */}
                  <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="7"
                    fill={isPositive ? '#00E599' : '#F43F5E'}
                    opacity="0.3"
                    className="animate-ping"
                  />
                  <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="4"
                    fill={isPositive ? '#00E599' : '#F43F5E'}
                    stroke="#080B11"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* Interactive Crosshair & Cursor Line */}
              {mousePos && (
                <g>
                  {/* Vertical Crosshair Line */}
                  <line
                    x1={mousePos.x}
                    y1={paddingY}
                    x2={mousePos.x}
                    y2={chartHeight - paddingY}
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.7"
                  />
                  {/* Horizontal Crosshair Line */}
                  <line
                    x1={paddingX}
                    y1={mousePos.y}
                    x2={chartWidth - paddingX}
                    y2={mousePos.y}
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.7"
                  />
                  {/* Center Target Dot */}
                  <circle cx={mousePos.x} cy={mousePos.y} r="3.5" fill="#38BDF8" stroke="#080B11" strokeWidth="1" />
                </g>
              )}
            </svg>

            {/* Live Price Tag on Right Edge */}
            <div
              style={{
                top: `${((points[points.length - 1]?.y || usableHeight / 2) / chartHeight) * 100}%`,
                transform: 'translateY(-50%)'
              }}
              className={`absolute right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-lg pointer-events-none ${
                isPositive ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
              }`}
            >
              ${formatPriceDigits(currentPrice)}
            </div>
          </div>
        </>
      )}

      {/* Chart Footer: 24h High, 24h Low, 24h Volume, Indicator Legends */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono pt-1">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-slate-500 text-[10px] block">24h High</span>
            <span className="text-slate-200 font-semibold">${formatPriceDigits(stats24h.high24h)}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">24h Low</span>
            <span className="text-slate-200 font-semibold">${formatPriceDigits(stats24h.low24h)}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">24h Volume</span>
            <span className="text-slate-200 font-semibold">
              ${(stats24h.volume24hUSD / 1e6).toFixed(1)}M
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {showEMA && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-indigo-400" />
                <span className="text-indigo-300">EMA 9</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400" />
                <span className="text-amber-300">EMA 21</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-0.5 ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-slate-300">Real Price Action</span>
          </div>
        </div>
      </div>
    </div>
  );
};
