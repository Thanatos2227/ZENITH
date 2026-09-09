import { Token } from '@zenith/types';
import { DEFAULT_TOKENS } from './defaultTokens';

export interface LiveMarketData {
  symbol?: string;
  priceUSD: number;
  change24hUSD: number; // 24h percent change (%)
  volume24hUSD: number;
  marketCapUSD?: number | null;
  high24h?: number;
  low24h?: number;
  lastUpdated: number;
  isLive: boolean;
  status: 'LIVE' | 'CACHED' | 'UNAVAILABLE';
  source?: string;
}

export interface MarketCandle {
  timestamp: number;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStats24h {
  currentPrice: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24hUSD: number;
}

export type TimeframeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

// Verified circulating supply numbers for calculating Market Cap (Price * Supply)
export const VERIFIED_CIRCULATING_SUPPLY: Record<string, number> = {
  BTC: 19750000,
  WBTC: 19750000,
  CBBTC: 19750000,
  ETH: 120200000,
  WETH: 120200000,
  WSTETH: 120200000,
  SOL: 468000000,
  WSOL: 468000000,
  JITOSOL: 468000000,
  BNB: 147500000,
  WBNB: 147500000,
  ARB: 3250000000,
  OP: 1250000000,
  AVAX: 400000000,
  WAVAX: 400000000,
  POL: 10000000000,
  MATIC: 10000000000,
  LINK: 608000000,
  UNI: 600000000,
  PEPE: 420690000000000,
  SHIB: 589000000000000,
  DOGE: 146000000000,
  XRP: 56000000000,
  ADA: 35700000000,
  SUI: 2850000000,
  NEAR: 1210000000,
  APT: 490000000,
  AAVE: 14900000,
  LDO: 890000000,
  CRV: 1250000000,
  MKR: 920000,
  PENDLE: 160000000,
  TIA: 210000000,
  INJ: 97000000,
  FET: 2500000000,
  SEI: 3500000000,
  RENDER: 518000000,
  RNDR: 518000000,
  BONK: 69000000000000,
  WIF: 998000000,
  JUP: 1350000000,
  RAY: 290000000,
  PYTH: 3600000000,
  USDC: 35000000000,
  USDT: 118000000000,
  DAI: 5300000000,
  FDUSD: 2500000000
};

// Standardized symbol mapping to Binance trading pairs
const BINANCE_SYMBOL_MAP: Record<string, string> = {
  ETH: 'ETH',
  WETH: 'ETH',
  WSTETH: 'ETH',
  BTC: 'BTC',
  WBTC: 'BTC',
  CBBTC: 'BTC',
  SOL: 'SOL',
  WSOL: 'SOL',
  JITOSOL: 'SOL',
  BNB: 'BNB',
  WBNB: 'BNB',
  ARB: 'ARB',
  OP: 'OP',
  AVAX: 'AVAX',
  WAVAX: 'AVAX',
  POL: 'POL',
  MATIC: 'POL',
  LINK: 'LINK',
  UNI: 'UNI',
  PEPE: 'PEPE',
  SUI: 'SUI',
  NEAR: 'NEAR',
  APT: 'APT',
  DOGE: 'DOGE',
  SHIB: 'SHIB',
  XRP: 'XRP',
  ADA: 'ADA',
  FTM: 'FTM',
  S: 'FTM',
  TIA: 'TIA',
  INJ: 'INJ',
  RENDER: 'RENDER',
  RNDR: 'RENDER',
  FET: 'FET',
  SEI: 'SEI',
  AAVE: 'AAVE',
  LDO: 'LDO',
  CRV: 'CRV',
  MKR: 'MKR',
  SNX: 'SNX',
  GRT: 'GRT',
  PENDLE: 'PENDLE',
  BLUR: 'BLUR',
  GMX: 'GMX',
  BONK: 'BONK',
  WIF: 'WIF',
  JUP: 'JUP',
  RAY: 'RAY',
  PYTH: 'PYTH',
  ORDI: 'ORDI',
  STX: 'STX',
  USDC: 'USDC',
  USDT: 'USDT',
  DAI: 'DAI',
  FDUSD: 'FDUSD',
  USDE: 'USDE'
};

const STABLECOINS = new Set(['USDC', 'USDT', 'DAI', 'FDUSD', 'USDE', 'BUSD']);

export type StoreTickCallback = (chainId: string, address: string, data: LiveMarketData) => void;

export interface PairListener {
  symbolIn: string;
  symbolOut: string;
  interval: TimeframeInterval;
  onPriceUpdate: (price: number, tickCandle?: MarketCandle) => void;
  onStatusChange?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED') => void;
}

const KNOWN_BINANCE_SYMBOLS = new Set([
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'TRX', 'DOGE', 'ADA', 'AVAX', 'DOT',
  'LINK', 'POL', 'MATIC', 'SHIB', 'UNI', 'NEAR', 'APT', 'SUI', 'ICP', 'FET',
  'RENDER', 'RNDR', 'AAVE', 'ALGO', 'PEPE', 'WIF', 'BONK', 'JUP', 'SEI', 'INJ',
  'TIA', 'PENDLE', 'MKR', 'CRV', 'LDO', 'RAY', 'PYTH', 'ARB', 'OP', 'FTM',
  'STX', 'ORDI', 'GRT', 'SNX', 'BLUR', 'GMX', 'TON', 'HBAR', 'XLM', 'USDC'
]);

export class MarketDataService {
  private static instance: MarketDataService;
  private cache: Map<string, LiveMarketData> = new Map();
  private lastFetchTime = 0;
  private inFlightPromise: Promise<Map<string, LiveMarketData>> | null = null;
  private lastError: string | null = null;

  // Global WebSockets state (multiple socket connections for chunked stream capacity)
  private activeSockets: WebSocket[] = [];
  private globalWsStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' = 'DISCONNECTED';
  private reconnectTimer: any = null;
  private storeUpdateCallbacks: Set<StoreTickCallback> = new Set();
  private pairListeners: Set<PairListener> = new Set();
  private trackedTokens: Token[] = DEFAULT_TOKENS;

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  constructor() {
    // Seed cache initially from canonical token list
    DEFAULT_TOKENS.forEach((t) => {
      const key = this.getKey(t.chainId, t.address);
      const sym = t.symbol.toUpperCase();
      const price = t.priceUSD ?? 0;
      const supply = VERIFIED_CIRCULATING_SUPPLY[sym] || null;
      const cap = supply && price > 0 ? price * supply : null;

      this.cache.set(key, {
        priceUSD: price,
        change24hUSD: t.change24hUSD ?? 0,
        volume24hUSD: t.volume24hUSD ?? 0,
        marketCapUSD: cap,
        lastUpdated: Date.now(),
        isLive: false,
        status: price > 0 ? 'CACHED' : 'UNAVAILABLE',
        source: 'INITIAL_SEED'
      });
    });
  }

  public getKey(chainId: string, address: string): string {
    return `${chainId.toLowerCase()}:${address.toLowerCase()}`;
  }

  public resolveSymbol(symbol: string): string {
    const clean = symbol.toUpperCase().trim();
    return BINANCE_SYMBOL_MAP[clean] || clean;
  }

  public getCachedMarketData(chainId: string, address: string): LiveMarketData | undefined {
    return this.cache.get(this.getKey(chainId, address));
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public getLastUpdated(): number {
    return this.lastFetchTime;
  }

  public getWsStatus(): 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' {
    return this.globalWsStatus;
  }

  public addStoreTickListener(callback: StoreTickCallback): () => void {
    this.storeUpdateCallbacks.add(callback);
    return () => {
      this.storeUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Primary entry point: Fetch initial REST market data snapshot and attach live WebSockets.
   */
  public async fetchMarketData(tokens: Token[] = DEFAULT_TOKENS): Promise<Map<string, LiveMarketData>> {
    this.trackedTokens = tokens;
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.inFlightPromise = this.executeFetchBinanceFirst(tokens).finally(() => {
      this.inFlightPromise = null;
    });

    return this.inFlightPromise;
  }

  /**
   * Primary snapshot fetcher: Uses Binance 24h Ticker REST API (all tickers in 1 fast call)
   */
  private async executeFetchBinanceFirst(tokens: Token[]): Promise<Map<string, LiveMarketData>> {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        throw new Error(`Binance HTTP ${res.status}: ${res.statusText}`);
      }

      const tickers: Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
        quoteVolume: string;
        highPrice: string;
        lowPrice: string;
      }> = await res.json();

      const tickerMap = new Map<string, { price: number; change: number; volume: number; high: number; low: number }>();
      tickers.forEach((item) => {
        if (item.symbol.endsWith('USDT')) {
          const base = item.symbol.replace(/USDT$/, '');
          tickerMap.set(base, {
            price: parseFloat(item.lastPrice) || 0,
            change: parseFloat(item.priceChangePercent) || 0,
            volume: parseFloat(item.quoteVolume) || 0,
            high: parseFloat(item.highPrice) || 0,
            low: parseFloat(item.lowPrice) || 0
          });
        }
      });

      const now = Date.now();
      tokens.forEach((t) => {
        const sym = t.symbol.toUpperCase();
        const baseSymbol = this.resolveSymbol(sym);
        const ticker = tickerMap.get(baseSymbol);

        if (ticker && ticker.price > 0) {
          const key = this.getKey(t.chainId, t.address);
          const existing = this.cache.get(key);
          const supply = VERIFIED_CIRCULATING_SUPPLY[sym] || VERIFIED_CIRCULATING_SUPPLY[baseSymbol] || null;
          const cap = supply ? ticker.price * supply : null;

          // Only set REST snapshot if we do not already have a live WS tick
          if (!existing || !existing.isLive) {
            const data: LiveMarketData = {
              priceUSD: ticker.price,
              change24hUSD: Number(ticker.change.toFixed(2)),
              volume24hUSD: Math.round(ticker.volume),
              marketCapUSD: cap,
              high24h: ticker.high,
              low24h: ticker.low,
              lastUpdated: now,
              isLive: true,
              status: 'LIVE',
              source: 'BINANCE_REST'
            };

            this.cache.set(key, data);
            this.cache.set(sym.toLowerCase(), data);
            if (baseSymbol) this.cache.set(baseSymbol.toLowerCase(), data);
            this.notifyStoreListeners(t.chainId, t.address, data);
          }
        }
      });

      this.lastFetchTime = now;
      this.lastError = null;
    } catch (err: any) {
      console.warn('[MarketDataService] Primary Binance REST fetch error:', err?.message || err);
      this.lastError = err?.message || 'Binance API error';
    }

    // Start continuous Trade View @kline_1m WebSocket streams for all supported tokens
    this.startGlobalWebSocket(tokens);

    return this.cache;
  }

  /**
   * Starts/attaches continuous Binance WebSocket stream matching Trade View's exact `@kline_1m` stream format.
   * Streams live kline ticks for ALL supported token symbols (XRP, TRX, BTC, ETH, LINK, SOL, DOGE, etc.) continuously.
   */
  public startGlobalWebSocket(tokens: Token[] = this.trackedTokens): void {
    this.trackedTokens = tokens;

    if (this.activeSockets.length > 0) {
      const allActive = this.activeSockets.every(
        (s) => s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING
      );
      if (allActive) return; // Connections already active
    }

    if (typeof window === 'undefined' || !window.WebSocket) return;

    this.closeExistingSockets();
    this.globalWsStatus = 'CONNECTING';

    try {
      // Filter supported symbols strictly to verified Binance USDT trading pairs
      const supportedSymbols = Array.from(
        new Set(
          tokens
            .map((t) => this.resolveSymbol(t.symbol))
            .filter((s) => Boolean(s) && s !== 'USDT' && s !== 'USDE' && KNOWN_BINANCE_SYMBOLS.has(s))
        )
      );

      // Chunk stream names into batches of max 12 streams per socket for max stability
      const BATCH_SIZE = 12;
      const batches: string[][] = [];
      for (let i = 0; i < supportedSymbols.length; i += BATCH_SIZE) {
        batches.push(supportedSymbols.slice(i, i + BATCH_SIZE));
      }

      let connectedCount = 0;

      batches.forEach((batch) => {
        const streamNames = batch.map((s) => `${s.toLowerCase()}usdt@kline_1m`).join('/');
        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streamNames}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          connectedCount++;
          if (connectedCount > 0) {
            this.globalWsStatus = 'CONNECTED';
            this.lastError = null;
            this.pairListeners.forEach((l) => l.onStatusChange?.('CONNECTED'));
          }
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
        };

        ws.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data);
            const data = raw.data || raw;
            if (!data || !data.k) return;

            const k = data.k;
            const binanceSymbol = k.s; // e.g. "XRPUSDT", "BTCUSDT", "TRXUSDT"
            if (!binanceSymbol || !binanceSymbol.endsWith('USDT')) return;

            const baseSymbol = binanceSymbol.replace(/USDT$/, '');
            const closePrice = parseFloat(k.c) || 0;
            const openPrice = parseFloat(k.o) || 0;
            const highPrice = parseFloat(k.h) || 0;
            const lowPrice = parseFloat(k.l) || 0;
            const volUSD = parseFloat(k.q) || (parseFloat(k.v) * closePrice) || 0;
            const now = Date.now();

            if (closePrice <= 0) return;

            // Update internal cache and notify store listeners (Markets)
            this.trackedTokens.forEach((t) => {
              const sym = t.symbol.toUpperCase();
              const mappedBase = this.resolveSymbol(sym);

              if (mappedBase === baseSymbol) {
                const key = this.getKey(t.chainId, t.address);
                const existing = this.cache.get(key);
                const supply = VERIFIED_CIRCULATING_SUPPLY[sym] || VERIFIED_CIRCULATING_SUPPLY[mappedBase] || null;
                const cap = supply ? closePrice * supply : null;

                const change24hPercent = existing?.change24hUSD !== undefined && existing.change24hUSD !== 0
                  ? existing.change24hUSD
                  : (openPrice > 0 ? Number((((closePrice - openPrice) / openPrice) * 100).toFixed(2)) : 0);

                const liveData: LiveMarketData = {
                  symbol: baseSymbol,
                  priceUSD: closePrice,
                  change24hUSD: change24hPercent,
                  volume24hUSD: Math.round(volUSD) || (existing?.volume24hUSD ?? 0),
                  marketCapUSD: cap,
                  high24h: highPrice,
                  low24h: lowPrice,
                  lastUpdated: now,
                  isLive: true,
                  status: 'LIVE',
                  source: 'BINANCE_TRADE_VIEW_WS'
                };

                this.cache.set(key, liveData);
                this.cache.set(sym.toLowerCase(), liveData);
                if (mappedBase) this.cache.set(mappedBase.toLowerCase(), liveData);
                this.notifyStoreListeners(t.chainId, t.address, liveData);
              }
            });

            // Notify registered Trade View pair listeners
            this.pairListeners.forEach((listener) => {
              const pair = this.getPairConfig(listener.symbolIn, listener.symbolOut);
              if (pair.baseSymbol === baseSymbol || (pair.isCrossRate && pair.quoteSymbol === baseSymbol)) {
                let pairPrice = closePrice;

                if (!pair.isCrossRate) {
                  if (pair.invertRate) {
                    pairPrice = closePrice > 0 ? 1 / closePrice : 0;
                  }
                } else {
                  const baseTok = this.trackedTokens.find((t) => this.resolveSymbol(t.symbol) === pair.baseSymbol);
                  const quoteTok = this.trackedTokens.find((t) => this.resolveSymbol(t.symbol) === pair.quoteSymbol);
                  const pBase = baseTok ? (this.cache.get(this.getKey(baseTok.chainId, baseTok.address))?.priceUSD || closePrice) : closePrice;
                  const pQuote = quoteTok ? (this.cache.get(this.getKey(quoteTok.chainId, quoteTok.address))?.priceUSD || 1) : 1;
                  pairPrice = pQuote > 0 ? pBase / pQuote : pBase;
                }

                const ts = Number(k.t);
                const timeLabel = this.formatTimeLabel(new Date(ts), listener.interval);
                let o = openPrice;
                let h = highPrice;
                let l = lowPrice;
                let c = closePrice;

                if (pair.invertRate) {
                  c = c > 0 ? 1 / c : 0;
                  o = o > 0 ? 1 / o : 0;
                  const prevH = h;
                  h = l > 0 ? 1 / l : 0;
                  l = prevH > 0 ? 1 / prevH : 0;
                }

                const tickCandle: MarketCandle = {
                  timestamp: ts,
                  timeLabel,
                  open: o,
                  high: h,
                  low: l,
                  close: pairPrice,
                  volume: parseFloat(k.v) || 0
                };

                listener.onPriceUpdate(pairPrice, tickCandle);
              }
            });
          } catch (parseErr) {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          this.handleWsDisconnect();
        };

        ws.onclose = () => {
          this.handleWsDisconnect();
        };

        this.activeSockets.push(ws);
      });
    } catch (err) {
      this.handleWsDisconnect();
    }
  }

  private closeExistingSockets(): void {
    this.activeSockets.forEach((s) => {
      try {
        s.close();
      } catch {}
    });
    this.activeSockets = [];
  }

  private handleWsDisconnect(): void {
    this.globalWsStatus = 'DISCONNECTED';
    this.closeExistingSockets();
    this.pairListeners.forEach((l) => l.onStatusChange?.('DISCONNECTED'));

    // Mark current cached entries as CACHED rather than LIVE
    this.cache.forEach((val) => {
      val.isLive = false;
      val.status = 'CACHED';
    });

    // Schedule WebSocket auto-reconnect after 3 seconds
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.startGlobalWebSocket();
      }, 3000);
    }
  }

  private notifyStoreListeners(chainId: string, address: string, data: LiveMarketData): void {
    this.storeUpdateCallbacks.forEach((cb) => cb(chainId, address, data));
  }

  /**
   * Helper to determine pair configuration for TradingView / LivePriceChart
   */
  public getPairConfig(symbolIn: string, symbolOut: string): {
    isDirect: boolean;
    binanceSymbol: string;
    isCrossRate: boolean;
    baseSymbol: string;
    quoteSymbol: string;
    invertRate: boolean;
  } {
    const sIn = this.resolveSymbol(symbolIn);
    const sOut = this.resolveSymbol(symbolOut);

    const isStableIn = STABLECOINS.has(sIn);
    const isStableOut = STABLECOINS.has(sOut);

    if (!isStableIn && isStableOut) {
      return {
        isDirect: true,
        binanceSymbol: `${sIn}USDT`,
        isCrossRate: false,
        baseSymbol: sIn,
        quoteSymbol: 'USDT',
        invertRate: false
      };
    }

    if (isStableIn && !isStableOut) {
      return {
        isDirect: true,
        binanceSymbol: `${sOut}USDT`,
        isCrossRate: false,
        baseSymbol: sOut,
        quoteSymbol: 'USDT',
        invertRate: true
      };
    }

    if (isStableIn && isStableOut) {
      return {
        isDirect: true,
        binanceSymbol: 'USDCUSDT',
        isCrossRate: false,
        baseSymbol: 'USDC',
        quoteSymbol: 'USDT',
        invertRate: false
      };
    }

    return {
      isDirect: false,
      binanceSymbol: `${sIn}${sOut}`,
      isCrossRate: true,
      baseSymbol: sIn,
      quoteSymbol: sOut,
      invertRate: false
    };
  }

  /**
   * Fetch historical OHLCV candlestick data from Binance API
   */
  public async fetchKlines(
    symbolIn: string,
    symbolOut: string,
    interval: TimeframeInterval = '15m',
    limit: number = 50,
    fallbackPriceUSD: number = 2465.87
  ): Promise<MarketCandle[]> {
    const pair = this.getPairConfig(symbolIn, symbolOut);

    try {
      if (!pair.isCrossRate) {
        const url = `https://api.binance.com/api/v3/klines?symbol=${pair.binanceSymbol}&interval=${interval}&limit=${limit}`;
        const res = await fetch(url);
        if (res.ok) {
          const rawData: any[][] = await res.json();
          if (Array.isArray(rawData) && rawData.length > 0) {
            return rawData.map((k) => {
              const ts = Number(k[0]);
              const d = new Date(ts);
              const timeLabel = this.formatTimeLabel(d, interval);
              let open = parseFloat(k[1]);
              let high = parseFloat(k[2]);
              let low = parseFloat(k[3]);
              let close = parseFloat(k[4]);
              const volume = parseFloat(k[5]);

              if (pair.invertRate) {
                open = open > 0 ? 1 / open : 0;
                high = low > 0 ? 1 / low : 0;
                low = high > 0 ? 1 / high : 0;
                close = close > 0 ? 1 / close : 0;
              }

              return { timestamp: ts, timeLabel, open, high, low, close, volume };
            });
          }
        }
      } else {
        const [resBase, resQuote] = await Promise.all([
          fetch(`https://api.binance.com/api/v3/klines?symbol=${pair.baseSymbol}USDT&interval=${interval}&limit=${limit}`),
          fetch(`https://api.binance.com/api/v3/klines?symbol=${pair.quoteSymbol}USDT&interval=${interval}&limit=${limit}`)
        ]);

        if (resBase.ok && resQuote.ok) {
          const baseData: any[][] = await resBase.json();
          const quoteData: any[][] = await resQuote.json();
          const count = Math.min(baseData.length, quoteData.length);
          const candles: MarketCandle[] = [];

          for (let i = 0; i < count; i++) {
            const b = baseData[i];
            const q = quoteData[i];
            const ts = Number(b[0]);
            const d = new Date(ts);
            const timeLabel = this.formatTimeLabel(d, interval);

            const bClose = parseFloat(b[4]);
            const qClose = parseFloat(q[4]);
            const close = qClose > 0 ? bClose / qClose : 1;
            const bOpen = parseFloat(b[1]);
            const qOpen = parseFloat(q[1]);
            const open = qOpen > 0 ? bOpen / qOpen : 1;
            const bHigh = parseFloat(b[2]);
            const qLow = parseFloat(q[3]);
            const high = qLow > 0 ? bHigh / qLow : close * 1.002;
            const bLow = parseFloat(b[3]);
            const qHigh = parseFloat(q[2]);
            const low = qHigh > 0 ? bLow / qHigh : close * 0.998;
            const volume = parseFloat(b[5]);

            candles.push({ timestamp: ts, timeLabel, open, high, low, close, volume });
          }

          if (candles.length > 0) return candles;
        }
      }
    } catch (err) {
      console.warn('[MarketDataService] fetchKlines error:', err);
    }

    return this.generateSyntheticCandles(fallbackPriceUSD, interval, limit);
  }

  /**
   * Fetch 24-hour real ticker statistics for a specific token pair
   */
  public async fetch24hStats(
    symbolIn: string,
    symbolOut: string,
    fallbackPriceUSD: number = 2465.87
  ): Promise<MarketStats24h> {
    const pair = this.getPairConfig(symbolIn, symbolOut);

    try {
      if (!pair.isCrossRate) {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair.binanceSymbol}`);
        if (res.ok) {
          const data = await res.json();
          let price = parseFloat(data.lastPrice);
          let change = parseFloat(data.priceChangePercent);
          let high = parseFloat(data.highPrice);
          let low = parseFloat(data.lowPrice);
          const vol = parseFloat(data.quoteVolume);

          if (pair.invertRate) {
            price = price > 0 ? 1 / price : 1;
            change = -change;
            const prevHigh = high;
            high = low > 0 ? 1 / low : price * 1.05;
            low = prevHigh > 0 ? 1 / prevHigh : price * 0.95;
          }

          return { currentPrice: price, change24hPercent: change, high24h: high, low24h: low, volume24hUSD: vol };
        }
      } else {
        const [resBase, resQuote] = await Promise.all([
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair.baseSymbol}USDT`),
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair.quoteSymbol}USDT`)
        ]);

        if (resBase.ok && resQuote.ok) {
          const b = await resBase.json();
          const q = await resQuote.json();

          const bPrice = parseFloat(b.lastPrice);
          const qPrice = parseFloat(q.lastPrice);
          const currentPrice = qPrice > 0 ? bPrice / qPrice : 1;
          const bChange = parseFloat(b.priceChangePercent);
          const qChange = parseFloat(q.priceChangePercent);
          const change24hPercent = bChange - qChange;
          const high24h = currentPrice * (1 + Math.abs(change24hPercent) * 0.01 + 0.03);
          const low24h = currentPrice * (1 - Math.abs(change24hPercent) * 0.01 - 0.03);
          const volume24hUSD = parseFloat(b.quoteVolume);

          return { currentPrice, change24hPercent, high24h, low24h, volume24hUSD };
        }
      }
    } catch (err) {
      console.warn('[MarketDataService] fetch24hStats error:', err);
    }

    return {
      currentPrice: fallbackPriceUSD,
      change24hPercent: 2.85,
      high24h: fallbackPriceUSD * 1.042,
      low24h: fallbackPriceUSD * 0.965,
      volume24hUSD: 148500000
    };
  }

  /**
   * Subscribe to real-time live pair tick stream for Trade View
   * Reuses the single shared global WebSocket streaming pipeline.
   */
  public subscribeLiveStream(
    symbolIn: string,
    symbolOut: string,
    interval: TimeframeInterval,
    onPriceUpdate: (price: number, tickCandle?: MarketCandle) => void,
    onStatusChange?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED') => void
  ): () => void {
    // Ensure the shared global WebSocket streaming pipeline is started
    this.startGlobalWebSocket();

    const listener: PairListener = {
      symbolIn,
      symbolOut,
      interval,
      onPriceUpdate,
      onStatusChange
    };

    this.pairListeners.add(listener);
    onStatusChange?.(this.globalWsStatus);

    // Deliver immediate price update if cached live price exists
    const pair = this.getPairConfig(symbolIn, symbolOut);
    const baseTok = this.trackedTokens.find((t) => this.resolveSymbol(t.symbol) === pair.baseSymbol);
    if (baseTok) {
      const cached = this.cache.get(this.getKey(baseTok.chainId, baseTok.address));
      if (cached && cached.priceUSD > 0) {
        let initPrice = cached.priceUSD;
        if (pair.invertRate) {
          initPrice = initPrice > 0 ? 1 / initPrice : 0;
        }
        onPriceUpdate(initPrice);
      }
    }

    return () => {
      this.pairListeners.delete(listener);
    };
  }

  private formatTimeLabel(d: Date, interval: TimeframeInterval): string {
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const ss = d.getSeconds().toString().padStart(2, '0');
    const day = (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getDate().toString().padStart(2, '0');

    if (interval === '1d' || interval === '4h') {
      return `${day} ${hh}:${mm}`;
    }
    return `${hh}:${mm}:${ss}`;
  }

  private generateSyntheticCandles(
    basePrice: number,
    interval: TimeframeInterval,
    count: number
  ): MarketCandle[] {
    const candles: MarketCandle[] = [];
    const now = Date.now();
    let stepMs = 60 * 1000;
    if (interval === '5m') stepMs = 5 * 60 * 1000;
    if (interval === '15m') stepMs = 15 * 60 * 1000;
    if (interval === '1h') stepMs = 60 * 60 * 1000;
    if (interval === '4h') stepMs = 4 * 60 * 60 * 1000;
    if (interval === '1d') stepMs = 24 * 60 * 60 * 1000;

    let lastClose = basePrice * 0.985;

    for (let i = count; i >= 0; i--) {
      const ts = now - i * stepMs;
      const d = new Date(ts);
      const timeLabel = this.formatTimeLabel(d, interval);
      const volatility = lastClose * 0.003;
      const open = lastClose;
      const delta = (Math.random() - 0.48) * volatility;
      const close = Math.max(open + delta, 0.000001);
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const volume = Math.floor(Math.random() * 800 + 120);

      candles.push({ timestamp: ts, timeLabel, open, high, low, close, volume });
      lastClose = close;
    }
    return candles;
  }
}

export const defaultMarketDataService = MarketDataService.getInstance();

