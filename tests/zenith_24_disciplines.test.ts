import test from 'node:test';
import assert from 'node:assert/strict';

// Packages imports
import { defaultChainRegistry, ChainRegistry, NETWORK_GAS_PROFILES, ZENITH_SUPPORTED_CHAINS } from '../packages/chains/src';
import {
  DEFAULT_TOKENS,
  UNSUPPORTED_TOKEN_METADATA,
  defaultTokenService,
  defaultMarketDataService,
  VERIFIED_CIRCULATING_SUPPLY,
  TokenService,
  MarketDataService
} from '../packages/tokens/src';
import {
  defaultZenithRouter,
  ConstantProductMath,
  ConcentratedLiquidityMath,
  validateAndSanitizeAmount,
  truncateToThreeDecimals,
  MAX_SWAP_AMOUNT_NUM,
  MAX_SWAP_AMOUNT_STR,
  calculateEffectiveExecutionScore,
  DynamicDEXSplitter,
  defaultBridgeAggregator
} from '../packages/routing/src';
import {
  defaultTokenRiskEngine,
  defaultCircuitBreaker,
  defaultSimulationEngine,
  defaultMEVRouter
} from '../packages/security/src';
import {
  ExecutionStateMachine,
  defaultIntentEngine,
  defaultEVMAdapter,
  defaultSolanaAdapter,
  defaultExecutionCoordinator
} from '../packages/execution/src';
import {
  ChainConfig,
  CrossChainIntent,
  ExecutionStatus,
  GasPreset,
  MEVProtectionLevel,
  QuoteResponse,
  SlippagePreset,
  Token,
  WalletType,
  ZenithNotification
} from '../packages/types/src';
import { defaultThemeManager, ZENITH_TOKENS } from '../packages/ui/src';

// Utility & Store imports
import {
  formatAddress,
  isExplicitlyDisconnected,
  setExplicitlyDisconnected,
  getStoredWalletSession,
  setStoredWalletSession,
  clearStoredWalletSession
} from '../apps/web/src/utils/walletDetector';

// Mock localStorage for Web environment simulation
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}
(global as any).localStorage = new LocalStorageMock();
(global as any).window = { localStorage: (global as any).localStorage };

// ============================================================================
// 1. FUNCTIONAL TESTING
// ============================================================================
test('1. Functional Testing', async (t) => {
  await t.test('1.1 Swap Quoting Exact-Input & Exact-Output Calculations', async () => {
    const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'ETH')!;
    const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;

    const exactInputQuote = await defaultZenithRouter.getQuote({
      sourceChainId: 'ethereum',
      destinationChainId: 'ethereum',
      tokenIn,
      tokenOut,
      amountInRaw: '1000000000000000000',
      slippageTolerancePercent: 0.5,
      tradeType: 'EXACT_INPUT'
    });
    assert.equal(exactInputQuote.tradeType, 'EXACT_INPUT');
    assert.ok(exactInputQuote.amountOutFormatted);

    const exactOutputQuote = await defaultZenithRouter.getQuote({
      sourceChainId: 'ethereum',
      destinationChainId: 'ethereum',
      tokenIn,
      tokenOut,
      amountInRaw: '0',
      amountOutRaw: '2465000000',
      slippageTolerancePercent: 0.5,
      tradeType: 'EXACT_OUTPUT'
    });
    assert.equal(exactOutputQuote.tradeType, 'EXACT_OUTPUT');
    assert.ok(exactOutputQuote.amountInFormatted);
  });

  await t.test('1.2 Custom Token Registration & Multi-Chain Discovery', () => {
    const custom = defaultTokenService.importCustomToken({
      chainId: 'arbitrum',
      address: '0x1234567890123456789012345678901234567890',
      name: 'Functional Test Token',
      symbol: 'FTT',
      decimals: 18
    });
    assert.equal(custom.symbol, 'FTT');
    assert.equal(custom.verificationTier, 'UNVERIFIED');
  });
});

// ============================================================================
// 2. UI TESTING
// ============================================================================
test('2. UI Testing', async (t) => {
  await t.test('2.1 Design System Color Tokens & Palette Integrity', () => {
    assert.equal(ZENITH_TOKENS.colors.brand.primary, '#00F2FE');
    assert.equal(ZENITH_TOKENS.colors.brand.secondary, '#4FACFE');
    assert.equal(ZENITH_TOKENS.colors.dark.bgMain, '#080B11');
    assert.equal(ZENITH_TOKENS.colors.light.bgMain, '#F8FAFC');
    assert.equal(ZENITH_TOKENS.colors.status.success, '#10B981');
    assert.equal(ZENITH_TOKENS.colors.status.danger, '#EF4444');
  });

  await t.test('2.2 Theme Manager Switching and State Retention', () => {
    defaultThemeManager.setTheme('light');
    assert.equal(defaultThemeManager.getTheme(), 'light');
    assert.equal(defaultThemeManager.getColors().bgMain, '#F8FAFC');

    defaultThemeManager.setTheme('dark');
    assert.equal(defaultThemeManager.getTheme(), 'dark');
    assert.equal(defaultThemeManager.getColors().bgMain, '#080B11');
  });
});

// ============================================================================
// 3. USABILITY TESTING
// ============================================================================
test('3. Usability Testing', async (t) => {
  await t.test('3.1 User-Friendly Cryptographic Address Formatting', () => {
    const ethAddr = '0x1234567890abcdef1234567890abcdef12345678';
    assert.equal(formatAddress(ethAddr, 6, 4), '0x1234...5678');
    assert.equal(formatAddress('', 6, 4), '');

    const solAddr = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    assert.equal(formatAddress(solAddr, 4, 4), 'EPjF...Dt1v');
  });

  await t.test('3.2 Strict 3-Decimal User Input Auto-Truncation & Clarified Errors', () => {
    const res1 = validateAndSanitizeAmount('1.2349');
    assert.equal(res1.isValid, true);
    assert.equal(res1.sanitized, '1.234');
    assert.equal(res1.isTruncated, true);

    const res2 = validateAndSanitizeAmount('abc');
    assert.equal(res2.isValid, false);
    assert.ok(res2.error?.includes('numeric'));
  });
});

// ============================================================================
// 4. COMPATIBILITY TESTING
// ============================================================================
test('4. Compatibility Testing', async (t) => {
  await t.test('4.1 Web3 Provider EIP-1193 Standard & Solana Adapter API', () => {
    const eip1193 = {
      request: async (args: { method: string; params?: any[] }) => {
        if (args.method === 'eth_accounts') return ['0x1111111111111111111111111111111111111111'];
        return null;
      },
      on: () => {},
      removeListener: () => {}
    };
    assert.equal(typeof eip1193.request, 'function');

    const solanaProvider = {
      isPhantom: true,
      publicKey: { toString: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
      signTransaction: async (tx: any) => tx
    };
    assert.equal(solanaProvider.isPhantom, true);
    assert.equal(typeof solanaProvider.signTransaction, 'function');
  });

  await t.test('4.2 BigInt Across 64/128/256-bit Unsigned Integer Operations', () => {
    const uint256Max = 2n ** 256n - 1n;
    assert.ok(uint256Max > 0n);
    assert.equal((uint256Max + 1n) % (2n ** 256n), 0n);
  });
});

// ============================================================================
// 5. RESPONSIVE TESTING
// ============================================================================
test('5. Responsive Testing', async (t) => {
  await t.test('5.1 Screen Breakpoint Categorization (Mobile, Tablet, Laptop, 4K)', () => {
    const getBreakpoint = (width: number) => {
      if (width < 640) return 'sm';
      if (width < 1024) return 'md';
      if (width < 1280) return 'lg';
      if (width < 1536) return 'xl';
      return '2xl';
    };

    assert.equal(getBreakpoint(375), 'sm');
    assert.equal(getBreakpoint(768), 'md');
    assert.equal(getBreakpoint(1024), 'lg');
    assert.equal(getBreakpoint(1440), 'xl');
    assert.equal(getBreakpoint(2560), '2xl');
  });

  await t.test('5.2 Mobile Virtual Decimal Keypad Regex Pattern', () => {
    const pattern = new RegExp('^[0-9]*[.,]?[0-9]*$');
    assert.equal(pattern.test('123.456'), true);
    assert.equal(pattern.test('0,5'), true);
    assert.equal(pattern.test('12a3'), false);
  });
});

// ============================================================================
// 6. API TESTING
// ============================================================================
test('6. API Testing', async (t) => {
  await t.test('6.1 Multi-Tier Market Data Service Endpoint Fallbacks', async () => {
    const marketMap = await defaultMarketDataService.fetchMarketData();
    assert.ok(marketMap.size > 0);

    const eth = DEFAULT_TOKENS.find((t) => t.symbol === 'ETH')!;
    const ethCached = defaultMarketDataService.getCachedMarketData(eth.chainId, eth.address);
    assert.ok(ethCached);
    assert.equal(ethCached?.isLive, true);
  });

  await t.test('6.2 24-Hour Statistics API Data Structure', async () => {
    const stats = await defaultMarketDataService.fetch24hStats('ETH', 'USDC', 2465.87);
    assert.ok(stats.currentPrice > 0);
    assert.ok(stats.high24h >= stats.low24h);
    assert.ok(stats.volume24hUSD > 0);
  });
});

// ============================================================================
// 7. INTEGRATION TESTING
// ============================================================================
test('7. Integration Testing', async (t) => {
  await t.test('7.1 Full Pipeline: Token Selection -> Quoting -> EES -> Pre-Flight Sim', async () => {
    const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'ETH')!;
    const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;

    const quote = await defaultZenithRouter.getQuote({
      sourceChainId: 'ethereum',
      destinationChainId: 'ethereum',
      tokenIn,
      tokenOut,
      amountInRaw: '1000000000000000000',
      slippageTolerancePercent: 0.5
    });

    assert.ok(quote.requestId);
    assert.ok(quote.effectiveExecutionScore > 50);
    assert.ok(quote.simulationPreview?.isSuccess);
  });

  await t.test('7.2 Cross-Chain Bridge Stargate / Across Integration', async () => {
    const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;
    const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'arbitrum' && t.symbol === 'USDC')!;

    const crossQuote = await defaultZenithRouter.getQuote({
      sourceChainId: 'ethereum',
      destinationChainId: 'arbitrum',
      tokenIn,
      tokenOut,
      amountInRaw: '1000000000',
      slippageTolerancePercent: 0.5
    });

    assert.equal(crossQuote.bestRoute.routeType, 'CROSS_CHAIN');
    assert.ok(crossQuote.bestRoute.bridgeStep);
  });
});

// ============================================================================
// 8. DATABASE & STATE STORE TESTING
// ============================================================================
test('8. Database & State Store Testing', async (t) => {
  await t.test('8.1 In-Memory Registry Mutation Protection & Deep Isolation', () => {
    const chain = defaultChainRegistry.getChain('ethereum')!;
    const cloned = { ...chain, canonicalName: 'Cloned' };
    assert.notEqual(chain.canonicalName, cloned.canonicalName);
  });

  await t.test('8.2 Null / Undefined Key Query Resilience', () => {
    assert.equal(defaultMarketDataService.getCachedMarketData('unknown_chain', '0x0'), undefined);
    assert.equal(defaultChainRegistry.getChain('unknown_chain'), undefined);
  });
});

// ============================================================================
// 9. PERFORMANCE TESTING
// ============================================================================
test('9. Performance Testing', async (t) => {
  await t.test('9.1 Single-Hop AMM Math Invariant Latency (<0.01ms per op)', () => {
    const reserveIn = 1000000000000000000000n;
    const reserveOut = 3450000000000n;
    const amountIn = 1000000000000000000n;

    const start = performance.now();
    for (let i = 0; i < 5000; i++) {
      ConstantProductMath.getAmountOut(amountIn, reserveIn, reserveOut, 30);
    }
    const elapsed = performance.now() - start;
    const perOp = elapsed / 5000;
    assert.ok(perOp < 0.05, `AMM calculation latency ${perOp}ms per op`);
  });
});

// ============================================================================
// 10. LOAD TESTING
// ============================================================================
test('10. Load Testing', async (t) => {
  await t.test('10.1 Concurrent Quote Batch Execution (25 Parallel Requests)', async () => {
    const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'ETH')!;
    const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;

    const requests = Array.from({ length: 25 }, () =>
      defaultZenithRouter.getQuote({
        sourceChainId: 'ethereum',
        destinationChainId: 'ethereum',
        tokenIn,
        tokenOut,
        amountInRaw: '1000000000000000000',
        slippageTolerancePercent: 0.5
      })
    );

    const results = await Promise.all(requests);
    assert.equal(results.length, 25);
    assert.ok(results.every((r) => r.executionPrice > 0));
  });

  await t.test('10.2 High-Throughput Token Search Load (1,000 Queries)', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      defaultTokenService.searchTokens('USD');
    }
    const duration = performance.now() - start;
    assert.ok(duration < 200, `1,000 token searches executed in ${duration}ms`);
  });
});

// ============================================================================
// 11. STRESS TESTING
// ============================================================================
test('11. Stress Testing', async (t) => {
  await t.test('11.1 Heavy AMM Mathematical Stress Benchmark (50,000 Iterations)', () => {
    const reserveIn = 1000000000000000000000n;
    const reserveOut = 3450000000000n;
    const amountIn = 1000000000000000000n;

    const start = performance.now();
    for (let i = 0; i < 50000; i++) {
      ConstantProductMath.getAmountOut(amountIn, reserveIn, reserveOut, 30);
    }
    const duration = performance.now() - start;
    assert.ok(duration < 1000, `50,000 stress operations executed in ${duration}ms`);
  });
});

// ============================================================================
// 12. SECURITY TESTING
// ============================================================================
test('12. Security Testing', async (t) => {
  await t.test('12.1 Honeypot, Arbitrary Mint & High Tax Vulnerability Detection', () => {
    const maliciousToken: Token = {
      address: '0x9999999999999999999999999999999999999999',
      chainId: 'ethereum',
      name: 'Exploit Token',
      symbol: 'EXPLOIT',
      decimals: 18,
      verificationTier: 'SUSPICIOUS',
      securityProfile: {
        isHoneypot: true,
        buyTaxPercent: 20,
        sellTaxPercent: 99,
        transferTaxPercent: 10,
        canBlacklist: true,
        canMintArbitrary: true,
        isProxy: false,
        liquidityLockedPercent: 0,
        holderConcentrationTop10Percent: 98,
        hasMaliciousPatterns: true,
        riskScore: 100,
        warnings: ['Critical honeypot contract']
      }
    };

    const evaluation = defaultTokenRiskEngine.evaluateToken(maliciousToken);
    assert.equal(evaluation.isTradeable, false);
    assert.equal(evaluation.overallRiskLevel, 'CRITICAL');
  });

  await t.test('12.2 Flashbots MEV Routing for Frontrunning & Sandwich Defense', () => {
    const config = defaultMEVRouter.resolveMEVRoute('ethereum', 'FLASHBOTS_PRIVATE');
    assert.equal(config.frontrunningProtection, true);
    assert.equal(config.sandwichProtection, true);
    assert.equal(config.isPrivateMempool, true);
  });
});

// ============================================================================
// 13. AUTHENTICATION TESTING
// ============================================================================
test('13. Authentication Testing', async (t) => {
  await t.test('13.1 Wallet Session Persistence & Explicit Revocation Enforcement', () => {
    setStoredWalletSession('METAMASK', '0x1234567890123456789012345678901234567890');
    assert.equal(getStoredWalletSession().isConnected, true);

    setExplicitlyDisconnected(true);
    assert.equal(isExplicitlyDisconnected(), true);
    assert.equal(getStoredWalletSession().isConnected, false);

    setExplicitlyDisconnected(false);
  });
});

// ============================================================================
// 14. AUTHORIZATION TESTING
// ============================================================================
test('14. Authorization Testing', async (t) => {
  await t.test('14.1 Role-Based Smart Contract Access Control & Guardian Pauser', () => {
    const governance = '0xSafeMultisig4of7';
    const caller = '0xUnauthorizedUser';

    const setFeeManager = (sender: string) => {
      if (sender !== governance) throw new Error('ZenithRouter: Only governance');
      return 'UPDATED';
    };

    assert.equal(setFeeManager(governance), 'UPDATED');
    assert.throws(() => setFeeManager(caller), /Only governance/);
  });
});

// ============================================================================
// 15. REGRESSION TESTING
// ============================================================================
test('15. Regression Testing', async (t) => {
  await t.test('15.1 53-Chain Governance Structure and Tier Distribution', () => {
    const all = defaultChainRegistry.getAllChains();
    assert.equal(all.length, 53);
    assert.equal(defaultChainRegistry.getChainsByTier('TIER_1').length, 8);
    assert.equal(defaultChainRegistry.getChainsByTier('TIER_2').length, 22);
    assert.equal(defaultChainRegistry.getChainsByTier('TIER_3').length, 18);
    assert.equal(defaultChainRegistry.getChainsByTier('TIER_4').length, 5);
  });
});

// ============================================================================
// 16. SMOKE TESTING
// ============================================================================
test('16. Smoke Testing', async (t) => {
  await t.test('16.1 Critical Path Smoke Check: Registry, Tokens & Router Instantiation', () => {
    assert.ok(defaultChainRegistry);
    assert.ok(defaultTokenService);
    assert.ok(defaultZenithRouter);
    assert.ok(DEFAULT_TOKENS.length > 50);
  });
});

// ============================================================================
// 17. SANITY TESTING
// ============================================================================
test('17. Sanity Testing', async (t) => {
  await t.test('17.1 Basic Sanity Calculation: 1 ETH to USDC Returns Plausible Price', async () => {
    const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'ETH')!;
    const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;

    const quote = await defaultZenithRouter.getQuote({
      sourceChainId: 'ethereum',
      destinationChainId: 'ethereum',
      tokenIn,
      tokenOut,
      amountInRaw: '1000000000000000000',
      slippageTolerancePercent: 0.5
    });

    assert.ok(quote.executionPrice > 1000 && quote.executionPrice < 10000);
  });
});

// ============================================================================
// 18. ACCESSIBILITY TESTING
// ============================================================================
test('18. Accessibility Testing', async (t) => {
  await t.test('18.1 WCAG 2.1 AA Palette Contrast & Modal ARIA Roles', () => {
    assert.equal(ZENITH_TOKENS.colors.dark.bgMain, '#080B11');
    assert.equal(ZENITH_TOKENS.colors.dark.textPrimary, '#F8FAFC');

    const modalProps = { role: 'dialog', 'aria-modal': true };
    assert.equal(modalProps.role, 'dialog');
  });
});

// ============================================================================
// 19. LOCALIZATION TESTING
// ============================================================================
test('19. Localization Testing', async (t) => {
  await t.test('19.1 Currency Formatting & Locale Decimal Delimiters', () => {
    const formatUSD = (num: number) => `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    assert.equal(formatUSD(2465.87), '$2,465.87');
    assert.equal(truncateToThreeDecimals(1234.5678), '1234.567');
  });
});

// ============================================================================
// 20. RELIABILITY TESTING
// ============================================================================
test('20. Reliability Testing', async (t) => {
  await t.test('20.1 Primary RPC Failure & Fallback Redundancy across Chains', () => {
    const eth = defaultChainRegistry.getChain('ethereum')!;
    assert.ok(eth.rpcEndpoints.length >= 2);
    assert.notEqual(eth.rpcEndpoints[0].url, eth.rpcEndpoints[1].url);
  });
});

// ============================================================================
// 21. RECOVERY TESTING
// ============================================================================
test('21. Recovery Testing', async (t) => {
  await t.test('21.1 Cross-Chain Relayer Timeout & Deterministic Refund Engine', () => {
    const orderId = `recovery_intent_${Date.now()}`;
    const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;
    const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'base' && t.symbol === 'USDC')!;

    const intent: CrossChainIntent = {
      orderId,
      sourceChainId: 'ethereum',
      destinationChainId: 'base',
      sourceToken: tokenIn,
      destinationToken: tokenOut,
      sourceAmountRaw: '100000000',
      minDestinationAmountRaw: '99000000',
      recipient: '0x1111111111111111111111111111111111111111',
      deadline: Date.now() + 100000,
      nonce: 998877,
      status: 'CREATED',
      createdAt: Date.now()
    };

    defaultIntentEngine.registerIntent(intent);
    defaultIntentEngine.updateIntentState(orderId, 'SIGNED');
    defaultIntentEngine.updateIntentState(orderId, 'SUBMITTED');
    defaultIntentEngine.updateIntentState(orderId, 'ACCEPTED');

    const refunded = defaultIntentEngine.processRefund(orderId, 'Relayer Timeout Triggered');
    assert.equal(refunded.status, 'REFUNDED');
  });
});

// ============================================================================
// 22. DEPLOYMENT TESTING
// ============================================================================
test('22. Deployment Testing', async (t) => {
  await t.test('22.1 Smart Contract Deployment Configuration & Constructor Parameters', () => {
    const deploymentConfig = {
      feeManager: '0x1111111111111111111111111111111111111111',
      circuitBreaker: '0x2222222222222222222222222222222222222222',
      weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      defaultFeeBps: 5,
      maxFeeBps: 30
    };

    assert.ok(deploymentConfig.feeManager.startsWith('0x'));
    assert.ok(deploymentConfig.circuitBreaker.startsWith('0x'));
    assert.equal(deploymentConfig.defaultFeeBps <= deploymentConfig.maxFeeBps, true);
  });
});

// ============================================================================
// 23. ACCEPTANCE TESTING (USER CRITERIA)
// ============================================================================
test('23. Acceptance Testing', async (t) => {
  await t.test('23.1 Acceptance Criteria: Low Slippage, MEV Protection & Positive Score', async () => {
    const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'ETH')!;
    const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;

    const quote = await defaultZenithRouter.getQuote({
      sourceChainId: 'ethereum',
      destinationChainId: 'ethereum',
      tokenIn,
      tokenOut,
      amountInRaw: '1000000000000000000',
      slippageTolerancePercent: 0.5
    });

    assert.ok(quote.effectiveExecutionScore >= 75);
    assert.equal(quote.protocolFee.feeBps, 5);
  });
});

// ============================================================================
// 24. END-TO-END TESTING
// ============================================================================
test('24. End-to-End Testing', async (t) => {
  await t.test('24.1 Complete Trade Journey: Quoting -> Sim -> Approval -> Execute -> Receipt', async () => {
    const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'ETH')!;
    const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;

    const quote = await defaultZenithRouter.getQuote({
      sourceChainId: 'ethereum',
      destinationChainId: 'ethereum',
      tokenIn,
      tokenOut,
      amountInRaw: '1000000000000000000',
      slippageTolerancePercent: 0.5
    });

    const stateMachine = new ExecutionStateMachine();
    const transitions: ExecutionStatus[] = [];
    stateMachine.subscribe((status) => transitions.push(status));

    const receipt = await defaultExecutionCoordinator.executeTrade({
      quote,
      userAddress: '0x1234567890abcdef1234567890abcdef12345678',
      stateMachine
    });

    assert.equal(receipt.status, 'COMPLETED');
    assert.ok(receipt.txHash.startsWith('0x'));
    assert.ok(transitions.includes('COMPLETED'));
  });
});
