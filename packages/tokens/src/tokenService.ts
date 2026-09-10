import { Token, TokenSecurityProfile } from '@zenith/types';
import { DEFAULT_TOKENS } from './defaultTokens';

export class TokenService {
  private tokens: Map<string, Token> = new Map();
  private chainTokenIndex: Map<string, Token[]> = new Map();

  constructor(customTokens?: Token[]) {
    const list = [...DEFAULT_TOKENS, ...(customTokens || [])];
    list.forEach((t) => this.addToken(t));
  }

  private getTokenKey(chainId: string, address: string): string {
    return `${chainId.toLowerCase()}:${address.toLowerCase()}`;
  }

  public addToken(token: Token): void {
    if (!token.chainId || !token.address || !token.symbol || !token.name) {
      throw new Error('[TokenService] Token must include chainId, address, name, and symbol');
    }

    const normalizedToken: Token = {
      ...token,
      chainId: token.chainId.toLowerCase(),
      symbol: token.symbol.toUpperCase(),
      enabled: token.enabled !== false
    };
    const key = this.getTokenKey(normalizedToken.chainId, normalizedToken.address);
    this.tokens.set(key, normalizedToken);

    const chainList = this.chainTokenIndex.get(normalizedToken.chainId) || [];
    const existingIdx = chainList.findIndex(
      (t) => t.address.toLowerCase() === normalizedToken.address.toLowerCase()
    );
    if (existingIdx >= 0) {
      chainList[existingIdx] = normalizedToken;
    } else {
      chainList.push(normalizedToken);
    }
    this.chainTokenIndex.set(normalizedToken.chainId, chainList);
  }

  public getToken(chainId: string, address: string): Token | undefined {
    return this.tokens.get(this.getTokenKey(chainId, address));
  }

  public getNativeToken(chainId: string): Token | undefined {
    const tokens = this.getTokensForChain(chainId);
    return tokens.find((t) => t.isNative);
  }

  public getTokensForChain(chainId: string): Token[] {
    return (this.chainTokenIndex.get(chainId.toLowerCase()) || []).filter((token) => token.enabled !== false);
  }

  public searchTokens(query: string, chainId?: string): Token[] {
    const q = query.trim().toLowerCase();
    if (!q) {
      return chainId ? this.getTokensForChain(chainId) : Array.from(this.tokens.values());
    }

    const searchPool = chainId
      ? this.getTokensForChain(chainId)
      : Array.from(this.tokens.values()).filter((token) => token.enabled !== false);
    return searchPool.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  }

  public importCustomToken(params: {
    chainId: string;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    securityProfile?: TokenSecurityProfile;
  }): Token {
    const chain = params.chainId.toLowerCase();
    if (!this.chainTokenIndex.has(chain)) {
      throw new Error(`[TokenService] Unsupported network: ${params.chainId}`);
    }

    const isEVM = params.address.startsWith('0x');
    if (isEVM && params.address.length !== 42) {
      throw new Error(`[TokenService] Invalid EVM token address format: ${params.address}`);
    }

    const importedToken: Token = {
      address: params.address,
      chainId: chain,
      name: params.name,
      symbol: params.symbol.toUpperCase(),
      decimals: params.decimals,
      enabled: true,
      verificationTier: 'UNVERIFIED',
      securityProfile: params.securityProfile || {
        isHoneypot: false,
        buyTaxPercent: 0,
        sellTaxPercent: 0,
        transferTaxPercent: 0,
        canBlacklist: false,
        canMintArbitrary: false,
        isProxy: false,
        liquidityLockedPercent: 0,
        holderConcentrationTop10Percent: 50,
        hasMaliciousPatterns: false,
        riskScore: 35,
        warnings: ['Custom imported token. Always verify contract address on official explorer.']
      }
    };

    this.addToken(importedToken);
    return importedToken;
  }
}

export const defaultTokenService = new TokenService();
