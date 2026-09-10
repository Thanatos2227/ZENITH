import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultChainRegistry } from '../packages/chains/src/registry';
import { DEFAULT_TOKENS, defaultTokenService } from '../packages/tokens/src';
import { defaultTokenRiskEngine, defaultCircuitBreaker } from '../packages/security/src';
import {
  defaultZenithRouter,
  ConstantProductMath,
  ConcentratedLiquidityMath,
  validateAndSanitizeAmount,
  truncateToThreeDecimals,
  MAX_SWAP_AMOUNT_NUM,
  MAX_SWAP_AMOUNT_STR
} from '../packages/routing/src';
import { ExecutionStateMachine, defaultIntentEngine, defaultEVMAdapter } from '../packages/execution/src';
import { CrossChainIntent } from '../packages/types/src';


test('1. Universal Network Support Tier System & 53-Chain Governance', () => {
  const allChains = defaultChainRegistry.getAllChains();
  assert.equal(allChains.length, 53);

  const tier1 = defaultChainRegistry.getChainsByTier('TIER_1');
  assert.equal(tier1.length, 8);
  assert.ok(tier1.some((c) => c.id === 'ethereum'));
  assert.ok(tier1.some((c) => c.id === 'base'));
  assert.ok(tier1.some((c) => c.id === 'solana'));
  assert.ok(tier1.every((c) => c.capabilities.swap && c.capabilities.smartRouting && c.capabilities.simulation));

  const tier2 = defaultChainRegistry.getChainsByTier('TIER_2');
  assert.equal(tier2.length, 22);
  assert.ok(tier2.some((c) => c.id === 'soneium'));
  assert.ok(tier2.some((c) => c.id === 'scroll'));
  assert.ok(tier2.some((c) => c.id === 'berachain'));
  assert.ok(tier2.some((c) => c.id === 'sui'));

  const tier3 = defaultChainRegistry.getChainsByTier('TIER_3');
  assert.equal(tier3.length, 18);
  assert.ok(tier3.some((c) => c.id === 'tron'));
  assert.ok(tier3.some((c) => c.id === 'ton'));
  assert.ok(tier3.some((c) => c.id === 'cardano'));
  assert.ok(tier3.some((c) => c.id === 'polkadot'));

  const tier4 = defaultChainRegistry.getChainsByTier('TIER_4');
  assert.equal(tier4.length, 5);
  const btc = defaultChainRegistry.getChain('bitcoin');
  assert.ok(btc);
  assert.equal(btc?.tier, 'TIER_4');
  assert.equal(btc?.capabilities.swap, false);
  assert.equal(btc?.capabilities.tokenDiscovery, true);
});

test('2. Dynamic Capability Matrix & Health Downgrade Engine', () => {

  assert.equal(defaultChainRegistry.supportsCapability('ethereum', 'swap'), true);
  assert.equal(defaultChainRegistry.supportsCapability('ethereum', 'mevProtection'), true);

  assert.equal(defaultChainRegistry.supportsCapability('bitcoin', 'swap'), false);
  assert.equal(defaultChainRegistry.supportsCapability('bitcoin', 'tokenDiscovery'), true);

  defaultChainRegistry.updateChainTier('soneium', 'TIER_1');
  const soneium = defaultChainRegistry.getChain('soneium');
  assert.equal(soneium?.tier, 'TIER_1');

  defaultChainRegistry.setOperationalStatus('base', 'PAUSED');
  assert.equal(defaultChainRegistry.supportsCapability('base', 'swap'), false);

  defaultChainRegistry.setOperationalStatus('base', 'HEALTHY');
  assert.equal(defaultChainRegistry.supportsCapability('base', 'swap'), true);

  defaultChainRegistry.updateChainTier('soneium', 'TIER_2');
});

test('3. Token Service & Multi-Chain Discovery', () => {
  const ethTokens = defaultTokenService.getTokensForChain('ethereum');
  assert.ok(ethTokens.length > 0);

  const nativeBtc = defaultTokenService.getNativeToken('bitcoin');
  assert.ok(nativeBtc);
  assert.equal(nativeBtc?.symbol, 'BTC');

  const tronTokens = defaultTokenService.getTokensForChain('tron');
  assert.ok(tronTokens.length >= 2);

  const custom = defaultTokenService.importCustomToken({
    chainId: 'arbitrum',
    address: '0x1111111111111111111111111111111111111111',
    name: 'Custom Test Asset',
    symbol: 'CTA',
    decimals: 18
  });
  assert.equal(custom.symbol, 'CTA');
  assert.equal(custom.verificationTier, 'UNVERIFIED');
});

test('4. Token Risk Engine & Security Profiling', () => {
  const nativeToken = DEFAULT_TOKENS.find((t) => t.isNative)!;
  const nativeRisk = defaultTokenRiskEngine.evaluateToken(nativeToken);
  assert.equal(nativeRisk.overallRiskLevel, 'LOW');
  assert.equal(nativeRisk.riskScore, 0);

  const riskyToken = {
    address: '0x9999999999999999999999999999999999999999',
    chainId: 'ethereum',
    name: 'Suspicious Coin',
    symbol: 'SUSP',
    decimals: 18,
    verificationTier: 'SUSPICIOUS' as const,
    securityProfile: {
      isHoneypot: true,
      buyTaxPercent: 15,
      sellTaxPercent: 99,
      transferTaxPercent: 0,
      canBlacklist: true,
      canMintArbitrary: true,
      isProxy: false,
      liquidityLockedPercent: 0,
      holderConcentrationTop10Percent: 95,
      hasMaliciousPatterns: true,
      riskScore: 100,
      warnings: []
    }
  };

  const riskyEval = defaultTokenRiskEngine.evaluateToken(riskyToken);
  assert.equal(riskyEval.overallRiskLevel, 'CRITICAL');
  assert.equal(riskyEval.isTradeable, false);
  assert.ok(riskyEval.warnings.length > 0);
});

test('5. Constant-Product AMM Math & Invariant Verification (x * y = k)', () => {
  const reserveIn = 1000000000000000000000n;
  const reserveOut = 3450000000000n;
  const amountIn = 1000000000000000000n;

  const amountOut = ConstantProductMath.getAmountOut(amountIn, reserveIn, reserveOut, 30);
  assert.ok(amountOut > 0n);
  assert.ok(amountOut < 3450000000n);

  const invariantHolds = ConstantProductMath.verifyInvariant(reserveIn, reserveOut, amountIn, amountOut, 30);
  assert.equal(invariantHolds, true);

  const requiredAmountIn = ConstantProductMath.getAmountIn(amountOut, reserveIn, reserveOut, 30);
  assert.ok(requiredAmountIn > 0n);

  const simulatedOut = ConstantProductMath.getAmountOut(requiredAmountIn, reserveIn, reserveOut, 30);
  assert.ok(simulatedOut >= amountOut);
});

test('6. Concentrated Liquidity sqrt(P) & Tick Step Math', () => {
  const tick0 = 0;
  const sqrtRatio0 = ConcentratedLiquidityMath.getSqrtRatioAtTick(tick0);
  assert.ok(sqrtRatio0 > 0n);

  const tickBack = ConcentratedLiquidityMath.getTickAtSqrtRatio(sqrtRatio0);
  assert.equal(tickBack, 0);

  const liquidity = 1000000000000000000n;
  const targetSqrtRatio = sqrtRatio0 * 99n / 100n;
  const step = ConcentratedLiquidityMath.computeSwapStep(
    sqrtRatio0,
    targetSqrtRatio,
    liquidity,
    10000000000000000n,
    30,
    true,
    true
  );

  assert.ok(step.amountIn > 0n);
  assert.ok(step.amountOut > 0n);
  assert.ok(step.feeAmount > 0n);
});

test('7. Best Execution Router: Exact-Input Swap Quoting', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'ETH')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;

  const quote = await defaultZenithRouter.getQuote({
    sourceChainId: 'ethereum',
    destinationChainId: 'ethereum',
    tokenIn,
    tokenOut,
    amountInRaw: '1000000000000000000',
    slippageTolerancePercent: 0.5,
    tradeType: 'EXACT_INPUT'
  });

  assert.ok(quote.requestId);
  assert.equal(quote.tradeType, 'EXACT_INPUT');
  const outFormattedNum = parseFloat(quote.amountOutFormatted.replace(/,/g, ''));
  assert.ok(outFormattedNum > 2000 && outFormattedNum < 3000);
  assert.ok(quote.effectiveExecutionScore >= 80);
  assert.equal(quote.protocolFee.feeBps, 5);
  assert.ok(quote.simulationPreview?.isSuccess);
});

test('8. Best Execution Router: Exact-Output Swap Quoting', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'ETH')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;

  const quote = await defaultZenithRouter.getQuote({
    sourceChainId: 'ethereum',
    destinationChainId: 'ethereum',
    tokenIn,
    tokenOut,
    amountInRaw: '0',
    amountOutRaw: '2000000000',
    slippageTolerancePercent: 0.5,
    tradeType: 'EXACT_OUTPUT'
  });

  assert.equal(quote.tradeType, 'EXACT_OUTPUT');
  assert.ok(quote.amountInRaw);
  assert.ok(quote.maximumInputRaw);
  assert.ok(BigInt(quote.maximumInputRaw!) >= BigInt(quote.amountInRaw));
  assert.ok(parseFloat(quote.amountInFormatted) > 0.7 && parseFloat(quote.amountInFormatted) < 1.1);
});

test('9. Multi-Hop Graph Pathfinding (A -> Connector -> B)', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'UNI') || {
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    chainId: 'ethereum',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
    verificationTier: 'VERIFIED_CANONICAL' as const,
    priceUSD: 6.18
  };
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'LINK') || {
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    chainId: 'ethereum',
    name: 'Chainlink',
    symbol: 'LINK',
    decimals: 18,
    verificationTier: 'VERIFIED_CANONICAL' as const,
    priceUSD: 11.80
  };

  const quote = await defaultZenithRouter.getQuote({
    sourceChainId: 'ethereum',
    destinationChainId: 'ethereum',
    tokenIn,
    tokenOut,
    amountInRaw: '100000000000000000000',
    slippageTolerancePercent: 0.5
  });

  assert.ok(quote.routes.length > 0);
  const multiHopRoute = quote.routes.find((r) => r.routeType === 'MULTI_HOP');
  assert.ok(multiHopRoute);
  assert.equal(multiHopRoute?.hops.length, 2);
  assert.equal(multiHopRoute?.hops[0].tokenOut.symbol, 'WETH');
});

test('10. Dynamic Split-Routing (Multi-Pool Liquidity Division)', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'ETH')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;

  const quote = await defaultZenithRouter.getQuote({
    sourceChainId: 'ethereum',
    destinationChainId: 'ethereum',
    tokenIn,
    tokenOut,
    amountInRaw: '100000000000000000000',
    slippageTolerancePercent: 0.5
  });

  const splitRoute = quote.routes.find((r) => r.routeType === 'SPLIT_ROUTE');
  assert.ok(splitRoute);
  assert.equal(splitRoute?.hops.length, 2);
  assert.equal(splitRoute?.hops[0].proportionPercent + splitRoute?.hops[1].proportionPercent, 100);
});

test('11. Gas-Aware Scoring & Price Impact Categorization', () => {
  const ethGas = defaultChainRegistry.getEstimatedGasCostUSD('ethereum', 'SWAP');
  const baseGas = defaultChainRegistry.getEstimatedGasCostUSD('base', 'SWAP');
  const solanaGas = defaultChainRegistry.getEstimatedGasCostUSD('solana', 'SWAP');

  assert.ok(ethGas > 2.0);
  assert.ok(baseGas < 0.1);
  assert.ok(solanaGas < 0.01);
});

test('12. Cross-Chain Stargate & Liquidity Routing', async () => {
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
  assert.equal(crossQuote.bestRoute.bridgeStep?.bridgeProtocol, 'STARGATE');
  assert.ok(crossQuote.intent);
  assert.equal(crossQuote.intent?.status, 'CREATED');
});

test('13. Cross-Chain Intent Creation, Solver Competition, Nonce & Replay Protection', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'arbitrum' && t.symbol === 'USDC')!;

  const intent: CrossChainIntent = {
    orderId: `intent_test_${Date.now()}`,
    sourceChainId: 'ethereum',
    destinationChainId: 'arbitrum',
    sourceToken: tokenIn,
    destinationToken: tokenOut,
    sourceAmountRaw: '1000000000',
    minDestinationAmountRaw: '995000000',
    recipient: '0x9999999999999999999999999999999999999999',
    deadline: Date.now() + 100000,
    nonce: 99999,
    status: 'CREATED',
    createdAt: Date.now()
  };

  const solverQuotes = await defaultIntentEngine.getCompetitiveQuotes(intent);
  assert.ok(solverQuotes.length >= 2);
  assert.ok(solverQuotes[0].solverReputationScore >= 90);

  defaultIntentEngine.registerIntent(intent);
  assert.equal(defaultIntentEngine.getIntent(intent.orderId)?.status, 'CREATED');

  assert.throws(() => {
    defaultIntentEngine.registerIntent(intent);
  }, /Nonce replay detected/);
});

test('14. Cross-Chain Settlement State Machine & Deterministic Refund Handling', () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'base' && t.symbol === 'USDC')!;

  const orderId = `intent_refund_${Date.now()}`;
  const intent: CrossChainIntent = {
    orderId,
    sourceChainId: 'ethereum',
    destinationChainId: 'base',
    sourceToken: tokenIn,
    destinationToken: tokenOut,
    sourceAmountRaw: '500000000',
    minDestinationAmountRaw: '498000000',
    recipient: '0x1111111111111111111111111111111111111111',
    deadline: Date.now() + 100000,
    nonce: 88888,
    status: 'CREATED',
    createdAt: Date.now()
  };

  defaultIntentEngine.registerIntent(intent);
  defaultIntentEngine.updateIntentState(orderId, 'SIGNED');
  defaultIntentEngine.updateIntentState(orderId, 'SUBMITTED');
  defaultIntentEngine.updateIntentState(orderId, 'ACCEPTED');

  const refundedIntent = defaultIntentEngine.processRefund(orderId, 'Destination RPC timeout');
  assert.equal(refundedIntent.status, 'REFUNDED');
});

test('15. Circuit Breaker & Execution State Machine', () => {
  const normalCheck = defaultCircuitBreaker.validatePriceDeviation({
    oraclePriceUSD: 2465.87,
    quotedPriceUSD: 2460.00
  });
  assert.equal(normalCheck.isValid, true);

  const abnormalCheck = defaultCircuitBreaker.validatePriceDeviation({
    oraclePriceUSD: 2465.87,
    quotedPriceUSD: 1800.00
  });
  assert.equal(abnormalCheck.isValid, false);

  const sm = new ExecutionStateMachine();
  assert.equal(sm.getStatus(), 'IDLE');
  sm.transitionTo('QUOTE_REQUESTED');
  assert.equal(sm.getStatus(), 'QUOTE_REQUESTED');
});

test('16. Real-Time Dynamic Gas Pricing Across All 4 Tiers', () => {
  const scrollGas = defaultChainRegistry.getEstimatedGasCostUSD('scroll', 'SWAP');
  const tronGas = defaultChainRegistry.getEstimatedGasCostUSD('tron', 'SWAP');
  const btcGas = defaultChainRegistry.getEstimatedGasCostUSD('bitcoin', 'SWAP');

  assert.ok(scrollGas > 0.01 && scrollGas < 0.2);
  assert.ok(tronGas > 0.5 && tronGas < 2.0);
  assert.ok(btcGas > 1.0);
});

test('17. Full End-to-End Swap Execution Lifecycle (EVM & Solana)', async () => {
  const { defaultExecutionCoordinator } = await import('../packages/execution/src/executionCoordinator');
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
  const stepStatuses: string[] = [];
  stateMachine.subscribe((status) => {
    stepStatuses.push(status);
  });

  const receipt = await defaultExecutionCoordinator.executeTrade({
    quote,
    userAddress: '0x1234567890abcdef1234567890abcdef12345678',
    stateMachine
  });

  assert.ok(receipt);
  assert.equal(receipt.status, 'COMPLETED');
  assert.ok(receipt.txHash.startsWith('0x'));
  assert.ok(stepStatuses.includes('COMPLETED'));
  assert.equal(stateMachine.getStatus(), 'COMPLETED');
});

test('18. Quote Resilience & Zero-Division Guards Across Micro Fractions', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'base' && t.symbol === 'ETH')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'base' && t.symbol === 'USDC')!;

  const microQuote = await defaultZenithRouter.getQuote({
    sourceChainId: 'base',
    destinationChainId: 'base',
    tokenIn,
    tokenOut,
    amountInRaw: '1000000000000',
    slippageTolerancePercent: 0.5
  });

  assert.ok(microQuote.executionPrice > 0);
  assert.ok(!isNaN(microQuote.executionPrice));
  assert.ok(microQuote.amountOutFormatted);
  assert.ok(microQuote.bestRoute.hops.length > 0);
});

test('19. EVM Token Authorization & Allowance Verification', async () => {

  const nativeAllowance = await defaultEVMAdapter.checkAllowance({
    tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    spenderAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
  });
  assert.ok(nativeAllowance > 0n);

  const erc20Allowance = await defaultEVMAdapter.checkAllowance({
    tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    spenderAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
  });
  assert.equal(erc20Allowance, 0n);
});

test('20. Strict Swap Amount Input Validation, 3-Decimal Truncation, and Upper Boundary Limits', () => {
  // Test case 1: '1'
  const t1 = validateAndSanitizeAmount('1');
  assert.equal(t1.isValid, true);
  assert.equal(t1.sanitized, '1');
  assert.equal(t1.numericValue, 1);
  assert.equal(t1.isTruncated, false);

  // Test case 2: '1.' (preserve typing decimal point)
  const t2 = validateAndSanitizeAmount('1.');
  assert.equal(t2.isValid, true);
  assert.equal(t2.sanitized, '1.');
  assert.equal(t2.numericValue, 1);
  assert.equal(t2.isTruncated, false);

  // Test case 3: '1.1'
  const t3 = validateAndSanitizeAmount('1.1');
  assert.equal(t3.isValid, true);
  assert.equal(t3.sanitized, '1.1');
  assert.equal(t3.numericValue, 1.1);
  assert.equal(t3.isTruncated, false);

  // Test case 4: '1.11'
  const t4 = validateAndSanitizeAmount('1.11');
  assert.equal(t4.isValid, true);
  assert.equal(t4.sanitized, '1.11');
  assert.equal(t4.numericValue, 1.11);
  assert.equal(t4.isTruncated, false);

  // Test case 5: '1.111'
  const t5 = validateAndSanitizeAmount('1.111');
  assert.equal(t5.isValid, true);
  assert.equal(t5.sanitized, '1.111');
  assert.equal(t5.numericValue, 1.111);
  assert.equal(t5.isTruncated, false);

  // Test case 6: '1.1111' -> MUST TRUNCATE TO '1.111'
  const t6 = validateAndSanitizeAmount('1.1111');
  assert.equal(t6.isValid, true);
  assert.equal(t6.sanitized, '1.111');
  assert.equal(t6.numericValue, 1.111);
  assert.equal(t6.isTruncated, true);

  // Test case 7: '1.1119' -> MUST TRUNCATE TO '1.111', NOT ROUND TO 1.112
  const t7 = validateAndSanitizeAmount('1.1119');
  assert.equal(t7.isValid, true);
  assert.equal(t7.sanitized, '1.111');
  assert.notEqual(t7.sanitized, '1.112'); // STRICT TRUNCATION VERIFICATION
  assert.equal(t7.numericValue, 1.111);
  assert.equal(t7.isTruncated, true);

  // Test case 8: '25.123456' -> MUST TRUNCATE TO '25.123'
  const t8 = validateAndSanitizeAmount('25.123456');
  assert.equal(t8.isValid, true);
  assert.equal(t8.sanitized, '25.123');
  assert.equal(t8.numericValue, 25.123);
  assert.equal(t8.isTruncated, true);

  // Test case 9: '9999999.999' -> EXACT MAXIMUM
  const t9 = validateAndSanitizeAmount('9999999.999');
  assert.equal(t9.isValid, true);
  assert.equal(t9.sanitized, '9999999.999');
  assert.equal(t9.numericValue, 9999999.999);
  assert.equal(t9.isTruncated, false);

  // Test case 10: '10000000' -> MUST REJECT (integer portion exceeds 9999999)
  const t10 = validateAndSanitizeAmount('10000000');
  assert.equal(t10.isValid, false);
  assert.ok(t10.error);

  // Test case 11: '99999999' -> MUST REJECT
  const t11 = validateAndSanitizeAmount('99999999');
  assert.equal(t11.isValid, false);
  assert.ok(t11.error);

  // Test case 12: '0.0001' -> MUST TRUNCATE TO '0.000'
  const t12 = validateAndSanitizeAmount('0.0001');
  assert.equal(t12.isValid, true);
  assert.equal(t12.sanitized, '0.000');
  assert.equal(t12.numericValue, 0);
  assert.equal(t12.isTruncated, true);

  // Additional typing & edge case tests
  assert.equal(validateAndSanitizeAmount('').isValid, true);
  assert.equal(validateAndSanitizeAmount('.').sanitized, '0.');
  assert.equal(validateAndSanitizeAmount('9,999,999.999').sanitized, '9999999.999');
  assert.equal(validateAndSanitizeAmount('-5').isValid, false);
  assert.equal(validateAndSanitizeAmount('1e6').isValid, false);

  // Helper truncateToThreeDecimals
  assert.equal(truncateToThreeDecimals(1.1119), '1.111');
  assert.equal(truncateToThreeDecimals(25.123456), '25.123');
  assert.equal(truncateToThreeDecimals(10000000), '9999999.999');
});

test('21. Router and Calculation Protection from Extremely Large Amounts', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'ETH')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC')!;

  // Try to request a quote with an amount exceeding MAX_SWAP_AMOUNT (e.g. 10,000,000 ETH)
  const massiveAmountRaw = (10000000n * 10n ** 18n).toString();

  await assert.rejects(
    async () => {
      await defaultZenithRouter.getQuote({
        sourceChainId: 'ethereum',
        destinationChainId: 'ethereum',
        tokenIn,
        tokenOut,
        amountInRaw: massiveAmountRaw,
        slippageTolerancePercent: 0.5
      });
    },
    /exceeds maximum allowed limit/
  );
});

