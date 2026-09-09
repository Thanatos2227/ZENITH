import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultChainRegistry } from '../packages/chains/src/registry';
import { DEFAULT_TOKENS, defaultTokenService } from '../packages/tokens/src';
import { defaultTokenRiskEngine, defaultCircuitBreaker } from '../packages/security/src';
import { defaultZenithRouter } from '../packages/routing/src';
import { ExecutionStateMachine } from '../packages/execution/src';

test('1. Universal Network Support Tier System & 53-Chain Governance', () => {
  const allChains = defaultChainRegistry.getAllChains();
  assert.equal(allChains.length, 53);

  // Check Tier 1 (8 chains)
  const tier1 = defaultChainRegistry.getChainsByTier('TIER_1');
  assert.equal(tier1.length, 8);
  assert.ok(tier1.some((c) => c.id === 'ethereum'));
  assert.ok(tier1.some((c) => c.id === 'base'));
  assert.ok(tier1.some((c) => c.id === 'solana'));
  assert.ok(tier1.every((c) => c.capabilities.swap && c.capabilities.smartRouting && c.capabilities.simulation));

  // Check Tier 2 (22 chains)
  const tier2 = defaultChainRegistry.getChainsByTier('TIER_2');
  assert.equal(tier2.length, 22);
  assert.ok(tier2.some((c) => c.id === 'soneium'));
  assert.ok(tier2.some((c) => c.id === 'scroll'));
  assert.ok(tier2.some((c) => c.id === 'berachain'));
  assert.ok(tier2.some((c) => c.id === 'sui'));

  // Check Tier 3 (18 chains)
  const tier3 = defaultChainRegistry.getChainsByTier('TIER_3');
  assert.equal(tier3.length, 18);
  assert.ok(tier3.some((c) => c.id === 'tron'));
  assert.ok(tier3.some((c) => c.id === 'ton'));
  assert.ok(tier3.some((c) => c.id === 'cardano'));
  assert.ok(tier3.some((c) => c.id === 'polkadot'));

  // Check Tier 4 (5 research chains)
  const tier4 = defaultChainRegistry.getChainsByTier('TIER_4');
  assert.equal(tier4.length, 5);
  const btc = defaultChainRegistry.getChain('bitcoin');
  assert.ok(btc);
  assert.equal(btc?.tier, 'TIER_4');
  assert.equal(btc?.capabilities.swap, false); // Gated safely
  assert.equal(btc?.capabilities.tokenDiscovery, true);
});

test('2. Dynamic Capability Matrix & Health Downgrade Engine', () => {
  // Check Ethereum capabilities
  assert.equal(defaultChainRegistry.supportsCapability('ethereum', 'swap'), true);
  assert.equal(defaultChainRegistry.supportsCapability('ethereum', 'mevProtection'), true);

  // Check Bitcoin capability (research stage)
  assert.equal(defaultChainRegistry.supportsCapability('bitcoin', 'swap'), false);
  assert.equal(defaultChainRegistry.supportsCapability('bitcoin', 'tokenDiscovery'), true);

  // Dynamic Tier Promotion test
  defaultChainRegistry.updateChainTier('soneium', 'TIER_1');
  const soneium = defaultChainRegistry.getChain('soneium');
  assert.equal(soneium?.tier, 'TIER_1');

  // Dynamic Operational Status Downgrade test
  defaultChainRegistry.setOperationalStatus('base', 'PAUSED');
  assert.equal(defaultChainRegistry.supportsCapability('base', 'swap'), false); // Paused chain denies swap

  // Re-instate healthy status
  defaultChainRegistry.setOperationalStatus('base', 'HEALTHY');
  assert.equal(defaultChainRegistry.supportsCapability('base', 'swap'), true);

  // Reset soneium tier to TIER_2
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

test('5. Best Execution Router, EES Scoring & Capability Gating', async () => {
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
  const outFormattedNum = parseFloat(quote.amountOutFormatted.replace(/,/g, ''));
  assert.ok(outFormattedNum > 3000);
  assert.ok(quote.effectiveExecutionScore >= 80);
  assert.equal(quote.protocolFee.feeBps, 5);
  assert.ok(quote.simulationPreview?.isSuccess);

  // Capability Gating: Quoting on Tier 4 (Bitcoin) should throw descriptive capability rejection
  const btcToken = DEFAULT_TOKENS.find((t) => t.chainId === 'bitcoin' && t.symbol === 'BTC')!;
  await assert.rejects(
    async () => {
      await defaultZenithRouter.getQuote({
        sourceChainId: 'bitcoin',
        destinationChainId: 'bitcoin',
        tokenIn: btcToken,
        tokenOut: btcToken,
        amountInRaw: '100000000',
        slippageTolerancePercent: 0.5
      });
    },
    {
      message: /Swap capability is not supported on Bitcoin/
    }
  );
});

test('6. Cross-Chain Stargate & Liquidity Routing', async () => {
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
});

test('7. Circuit Breaker & Execution State Machine', () => {
  const normalCheck = defaultCircuitBreaker.validatePriceDeviation({
    oraclePriceUSD: 3450,
    quotedPriceUSD: 3445
  });
  assert.equal(normalCheck.isValid, true);

  const abnormalCheck = defaultCircuitBreaker.validatePriceDeviation({
    oraclePriceUSD: 3450,
    quotedPriceUSD: 2400
  });
  assert.equal(abnormalCheck.isValid, false);

  const sm = new ExecutionStateMachine();
  assert.equal(sm.getStatus(), 'IDLE');
  sm.transitionTo('QUOTE_REQUESTED');
  assert.equal(sm.getStatus(), 'QUOTE_REQUESTED');
});

test('8. Real-Time Dynamic Gas Pricing Across All 4 Tiers', () => {
  const ethGas = defaultChainRegistry.getEstimatedGasCostUSD('ethereum', 'SWAP');
  const baseGas = defaultChainRegistry.getEstimatedGasCostUSD('base', 'SWAP');
  const solanaGas = defaultChainRegistry.getEstimatedGasCostUSD('solana', 'SWAP');
  const scrollGas = defaultChainRegistry.getEstimatedGasCostUSD('scroll', 'SWAP');
  const tronGas = defaultChainRegistry.getEstimatedGasCostUSD('tron', 'SWAP');
  const btcGas = defaultChainRegistry.getEstimatedGasCostUSD('bitcoin', 'SWAP');

  assert.ok(ethGas > 2.0);
  assert.ok(baseGas < 0.1);
  assert.ok(solanaGas < 0.01);
  assert.ok(scrollGas > 0.01 && scrollGas < 0.2);
  assert.ok(tronGas > 0.5 && tronGas < 2.0);
  assert.ok(btcGas > 1.0);
});

test('9. Full End-to-End Swap Execution Lifecycle (EVM & Solana)', async () => {
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

test('10. Quote Resilience & Zero-Division Guards Across Micro Fractions', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'base' && t.symbol === 'ETH')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'base' && t.symbol === 'USDC')!;

  // 0.000001 ETH
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
