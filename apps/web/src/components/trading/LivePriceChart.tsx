import React, { useState, useEffect, useMemo } from 'react';
import { Token } from '@zenith/types';
import {
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface LivePriceChartProps {
  tokenIn: Token;
  tokenOut: Token;
}

interface Candle {
  timestamp: number;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const LivePriceChart: React.FC<LivePriceChartProps> = ({ tokenIn, tokenOut }) => {
  const [chartMode, setChartMode] = useState<'AREA' | 'CANDLE'>('AREA');
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isTickUp, setIsTickUp] = useState<boolean | null>(null);
  const [tickCounter, setTickCounter] = useState<number>(0);

  // Compute baseline price for the pair
  const baseRate = useMemo(() => {
    const pIn = tokenIn.priceUSD || (tokenIn.symbol === 'ETH' ? 3450 : tokenIn.symbol === 'SOL' ? 145 : tokenIn.symbol === 'WBTC' ? 65000 : 1);
    const pOut = tokenOut.priceUSD || (tokenOut.symbol === 'USDC' || tokenOut.symbol === 'USDT' ? 1 : tokenOut.symbol === 'ETH' ? 3450 : 1);
    return pIn / pOut;
  }, [tokenIn, tokenOut]);

  // Initial historical data generator
  const [candles, setCandles] = useState<Candle[]>(() => {
    const initial: Candle[] = [];
    const count = 36;
    let lastClose = baseRate * 0.975;
    const now = Date.now();

    for (let i = count; i >= 0; i--) {
      const stepMs = 5 * 1000;
      const ts = now - i * stepMs;
      const d = new Date(ts);
      const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

      const volatility = lastClose * 0.0025;
      const open = lastClose;
      const delta = (Math.random() - 0.48) * volatility;
      const close = Math.max(open + delta, 0.000001);
      const high = Math.max(open, close) + Math.random() * volatility * 0.4;
      const low = Math.min(open, close) - Math.random() * volatility * 0.4;
      const volume = Math.floor(Math.random() * 850 + 150);

      initial.push({
        timestamp: ts,
        timeLabel,
        open,
        high,
        low,
        close,
        volume
      });
      lastClose = close;
    }
    return initial;
  });

  // Re-seed chart on token change
  useEffect(() => {
    const initial: Candle[] = [];
    const count = 36;
    let lastClose = baseRate * 0.975;
    const now = Date.now();

    for (let i = count; i >= 0; i--) {
      const stepMs = 5 * 1000;
      const ts = now - i * stepMs;
      const d = new Date(ts);
      const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

      const volatility = lastClose * 0.0025;
      const open = lastClose;
      const delta = (Math.random() - 0.48) * volatility;
      const close = Math.max(open + delta, 0.000001);
      const high = Math.max(open, close) + Math.random() * volatility * 0.4;
      const low = Math.min(open, close) - Math.random() * volatility * 0.4;
      const volume = Math.floor(Math.random() * 850 + 150);

      initial.push({
        timestamp: ts,
        timeLabel,
        open,
        high,
        low,
        close,
        volume
      });
      lastClose = close;
    }
    setCandles(initial);
  }, [baseRate, tokenIn.symbol, tokenOut.symbol]);

  // Continuous Real-Time Tick Engine (streams live ticks every 1000ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;

        const last = prevCandles[prevCandles.length - 1];
        const volatility = last.close * 0.0016;
        const tickDelta = (Math.random() - 0.49) * volatility;
        const newPrice = Math.max(last.close + tickDelta, 0.000001);

        setIsTickUp(tickDelta >= 0);
        setTickCounter((c) => c + 1);

        const now = Date.now();
        const d = new Date(now);
        const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

        // Append new live streaming tick candle and slide window
        const newCandle: Candle = {
          timestamp: now,
          timeLabel,
          open: last.close,
          high: Math.max(last.close, newPrice),
          low: Math.min(last.close, newPrice),
          close: newPrice,
          volume: Math.floor(Math.random() * 140 + 25)
        };

        return [...prevCandles.slice(1), newCandle];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Derived stats
  const currentPrice = candles[candles.length - 1]?.close || baseRate;
  const firstPrice = candles[0]?.open || baseRate;
  const priceChangeUSD = currentPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChangeUSD / firstPrice) * 100 : 0;
  const isPositive = priceChangePercent >= 0;

  const minPrice = Math.min(...candles.map((c) => c.low));
  const maxPrice = Math.max(...candles.map((c) => c.high));
  const priceRange = maxPrice - minPrice || 1;
  const maxVolume = Math.max(...candles.map((c) => c.volume), 1);

  // SVG Chart Dimensions
  const chartWidth = 700;
  const chartHeight = 240;
  const paddingX = 15;
  const paddingY = 25;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  // Calculate points for Area line
  const points = useMemo(() => {
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

  // Mouse hover event handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
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

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0B111E] border border-slate-800 space-y-4 shadow-xl">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Token Pair & Live Price */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-lg sm:text-xl text-white tracking-wide">
              {tokenIn.symbol}/{tokenOut.symbol}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                LIVE STREAM
              </span>
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
              ${currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: currentPrice < 1 ? 4 : 2,
                maximumFractionDigits: currentPrice < 1 ? 6 : 2
              })}
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

        {/* Controls: Chart Mode (Line / Candles) & Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setChartMode('AREA')}
              className={`px-2.5 py-0.5 rounded font-semibold transition-colors ${
                chartMode === 'AREA'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Line / Area
            </button>
            <button
              onClick={() => setChartMode('CANDLE')}
              className={`px-2.5 py-0.5 rounded font-semibold transition-colors ${
                chartMode === 'CANDLE'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candles
            </button>
          </div>

          {/* Indicators Toggle */}
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
              showEMA
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle EMA (9-Period Exponential Moving Average)"
          >
            EMA (9)
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
        </div>
      </div>

      {/* Real-time OHLCV Inspector Strip */}
      {displayedCandle && (
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800/80">
          <div className="text-slate-400">
            <span>Time: </span>
            <span className="text-white font-semibold">{displayedCandle.timeLabel}</span>
          </div>
          <div>
            <span className="text-slate-400">O: </span>
            <span className="text-slate-200">${displayedCandle.open.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400">H: </span>
            <span className="text-emerald-400">${displayedCandle.high.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400">L: </span>
            <span className="text-red-400">${displayedCandle.low.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400">C: </span>
            <span className="text-cyan-300 font-bold">${displayedCandle.close.toFixed(2)}</span>
          </div>
          {showVolume && (
            <div>
              <span className="text-slate-400">Vol: </span>
              <span className="text-indigo-300">{displayedCandle.volume.toLocaleString()}</span>
            </div>
          )}
          <div className="ml-auto text-[11px] text-slate-500 hidden sm:block">
            Ticks: {tickCounter} | Latency: ~14ms
          </div>
        </div>
      )}

      {/* SVG Interactive Real-Time Chart Canvas */}
      <div className="relative w-full h-72 sm:h-80 bg-[#080B11]/90 rounded-xl border border-slate-800/80 overflow-hidden select-none">
        {/* Horizontal Price Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-30">
          <div className="w-full border-b border-dashed border-slate-700 flex justify-between text-[10px] font-mono text-slate-400">
            <span>${maxPrice.toFixed(2)}</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-700 flex justify-between text-[10px] font-mono text-slate-400">
            <span>${((maxPrice + minPrice) / 2).toFixed(2)}</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-700 flex justify-between text-[10px] font-mono text-slate-400">
            <span>${minPrice.toFixed(2)}</span>
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

          {/* EMA Overlay Line */}
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
          ${currentPrice.toFixed(currentPrice < 1 ? 4 : 2)}
        </div>
      </div>

      {/* Chart Footer: 24h High, 24h Low, 24h Volume, Indicator Legends */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono pt-1">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-500 text-[10px] block">24h High</span>
            <span className="text-slate-200 font-semibold">${maxPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">24h Low</span>
            <span className="text-slate-200 font-semibold">${minPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">24h Vol (Est)</span>
            <span className="text-slate-200 font-semibold">${((maxVolume * candles.length * currentPrice) / 1000).toFixed(1)}k</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {showEMA && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-400" />
              <span className="text-indigo-300">EMA (9)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-0.5 ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-slate-300">Price Path</span>
          </div>
        </div>
      </div>
    </div>
  );
};
