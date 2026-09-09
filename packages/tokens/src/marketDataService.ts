import { Token } from '@zenith/types';
import { DEFAULT_TOKENS } from './defaultTokens';

export interface LiveMarketData {
  priceUSD: number;
  change24hUSD: number;
  volume24hUSD: number;
  lastUpdated: number;
}

// Comprehensive mapping from token symbol/address to CoinGecko asset ID
const TOKEN_COINGECKO_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  WBTC: 'wrapped-bitcoin',
  CBBTC: 'coinbase-wrapped-btc',
  ORDI: 'ordinals',
  SATS: 'sats-ordinals',
  DOG: 'dog-go-to-the-moon-runes',
  PUPS: 'pups-world-peace',
  ETH: 'ethereum',
  WETH: 'weth',
  WSTETH: 'wrapped-steth',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  PYUSD: 'paypal-usd',
  USDS: 'usds',
  UNI: 'uniswap',
  LINK: 'chainlink',
  AAVE: 'aave',
  MKR: 'maker',
  LDO: 'lido-dao',
  PEPE: 'pepe',
  SHIB: 'shiba-inu',
  ONDO: 'ondo-finance',
  AERO: 'aerodrome-finance',
  DEGEN: 'degen-base',
  BRETT: 'based-brett',
  TOSHI: 'toshi',
  VIRTUAL: 'virtuals-protocol',
  ARB: 'arbitrum',
  GMX: 'gmx',
  PENDLE: 'pendle',
  SOL: 'solana',
  WSOL: 'solana',
  JITOSOL: 'jito-staked-sol',
  JUP: 'jupiter-exchange-solana',
  RAY: 'raydium',
  PYTH: 'pyth-network',
  BONK: 'bonk',
  WIF: 'dogwifcoin',
  POPCAT: 'popcat',
  POL: 'matic-network',
  QUICK: 'quickswap',
  TRX: 'tron',
  USDD: 'usdd',
  BTT: 'bittorrent',
  SUN: 'sun-token',
  JST: 'just',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  OP: 'optimism',
  SUI: 'sui',
  APT: 'aptos',
  NEAR: 'near',
  ATOM: 'cosmos',
  OSMO: 'osmosis',
  INJ: 'injective-protocol',
  SEI: 'sei-network',
  CRO: 'crypto-com-chain',
  TAIKO: 'taiko',
  METIS: 'metis-token',
  GLMR: 'moonbeam',
  MOVR: 'moonriver',
  TON: 'the-open-network',
  HBAR: 'hedera-hashgraph',
  ALGO: 'algorand',
  XLM: 'stellar',
  XRP: 'ripple',
  ADA: 'cardano',
  DOT: 'polkadot',
  ICP: 'internet-computer'
};

export class MarketDataService {
  private cache: Map<string, LiveMarketData> = new Map();
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 20000; // 20 seconds cache TTL
  private inFlightPromise: Promise<Map<string, LiveMarketData>> | null = null;
  private lastError: string | null = null;

  constructor() {
    // Seed initial cache with canonical tokens data
    DEFAULT_TOKENS.forEach((t) => {
      if (t.priceUSD !== undefined) {
        const key = this.getKey(t.chainId, t.address);
        this.cache.set(key, {
          priceUSD: t.priceUSD,
          change24hUSD: t.change24hUSD ?? 0,
          volume24hUSD: t.volume24hUSD ?? 0,
          lastUpdated: Date.now()
        });
      }
    });
  }

  private getKey(chainId: string, address: string): string {
    return `${chainId.toLowerCase()}:${address.toLowerCase()}`;
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

  /**
   * Fetches real-time market data from CoinGecko with rate-limiting, deduplication, and fallback.
   */
  public async fetchMarketData(tokens: Token[] = DEFAULT_TOKENS): Promise<Map<string, LiveMarketData>> {
    const now = Date.now();
    if (now - this.lastFetchTime < this.CACHE_TTL_MS && this.cache.size > 0) {
      return this.cache;
    }

    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.inFlightPromise = this.executeFetch(tokens)
      .finally(() => {
        this.inFlightPromise = null;
      });

    return this.inFlightPromise;
  }

  private async executeFetch(tokens: Token[]): Promise<Map<string, LiveMarketData>> {
    // Gather distinct CoinGecko IDs needed
    const idToTokensMap = new Map<string, Token[]>();
    const cgIdsSet = new Set<string>();

    tokens.forEach((t) => {
      const sym = t.symbol.toUpperCase();
      const cgId = TOKEN_COINGECKO_MAP[sym] || (t.isNative && t.chainId === 'polygon' ? 'matic-network' : undefined);
      if (cgId) {
        cgIdsSet.add(cgId);
        const list = idToTokensMap.get(cgId) || [];
        list.push(t);
        idToTokensMap.set(cgId, list);
      }
    });

    const cgIdsArray = Array.from(cgIdsSet);
    if (cgIdsArray.length === 0) {
      return this.cache;
    }

    try {
      // 1. Primary: CoinGecko Simple Price API
      const idsParam = cgIdsArray.join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(idsParam)}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`;

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        throw new Error(`CoinGecko HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const now = Date.now();

      Object.entries(data).forEach(([cgId, info]: [string, any]) => {
        if (info && typeof info.usd === 'number') {
          const matchingTokens = idToTokensMap.get(cgId) || [];
          matchingTokens.forEach((t) => {
            const key = this.getKey(t.chainId, t.address);
            this.cache.set(key, {
              priceUSD: info.usd,
              change24hUSD: Number(info.usd_24h_change?.toFixed(2) ?? 0),
              volume24hUSD: Math.round(info.usd_24h_vol ?? 0),
              lastUpdated: now
            });
          });
        }
      });

      this.lastFetchTime = now;
      this.lastError = null;
      return this.cache;
    } catch (primaryErr: any) {
      console.warn('[MarketDataService] CoinGecko fetch failed, trying Binance fallback:', primaryErr?.message || primaryErr);
      this.lastError = primaryErr?.message || 'CoinGecko API unreachable';

      // 2. Secondary: Binance Public 24h Ticker Fallback for major assets
      try {
        await this.fetchBinanceFallback(tokens);
        this.lastFetchTime = Date.now();
        this.lastError = null;
      } catch (fallbackErr) {
        console.warn('[MarketDataService] Fallback also failed, serving cached prices:', fallbackErr);
      }

      return this.cache;
    }
  }

  private async fetchBinanceFallback(tokens: Token[]): Promise<void> {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return;

    const tickers: Array<{ symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }> = await res.json();
    const tickerMap = new Map<string, { price: number; change: number; volume: number }>();

    tickers.forEach((item) => {
      if (item.symbol.endsWith('USDT')) {
        const base = item.symbol.replace(/USDT$/, '');
        tickerMap.set(base, {
          price: parseFloat(item.lastPrice) || 0,
          change: parseFloat(item.priceChangePercent) || 0,
          volume: parseFloat(item.quoteVolume) || 0
        });
      }
    });

    const now = Date.now();
    tokens.forEach((t) => {
      const sym = t.symbol.toUpperCase();
      const ticker = tickerMap.get(sym === 'WETH' ? 'ETH' : sym === 'WBTC' ? 'BTC' : sym === 'WSOL' ? 'SOL' : sym);
      if (ticker && ticker.price > 0) {
        const key = this.getKey(t.chainId, t.address);
        this.cache.set(key, {
          priceUSD: ticker.price,
          change24hUSD: Number(ticker.change.toFixed(2)),
          volume24hUSD: Math.round(ticker.volume),
          lastUpdated: now
        });
      }
    });
  }
}

export const defaultMarketDataService = new MarketDataService();
