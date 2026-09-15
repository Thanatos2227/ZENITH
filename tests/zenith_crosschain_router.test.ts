import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACROSS_SPOKE_POOLS,
  STARGATE_V2_ROUTERS,
  DEBRIDGE_DLN_SOURCE,
  getUniswapV3Router,
  getPermit2Address
} from '../packages/contracts/src';
import { ExecutionStateMachine, ExecutionCoordinator } from '../packages/execution/src';
import { defaultZenithRouter } from '../packages/routing/src';
import { DEFAULT_TOKENS } from '../packages/tokens/src';
import { SignerRequiredError } from '../packages/contracts/src/errors';

test('Zenith Cross-Chain Router: Canonical Protocol Registrations Validation', () => {
  // Validate canonical Across V3 SpokePool registrations across key EVM chains
  assert.ok(ACROSS_SPOKE_POOLS[1]);
  assert.ok(ACROSS_SPOKE_POOLS[137]);
  assert.ok(ACROSS_SPOKE_POOLS[8453]);
  assert.ok(ACROSS_SPOKE_POOLS[42161]);
  assert.ok(ACROSS_SPOKE_POOLS[10]);

  // Validate Stargate V2 Routers
  assert.ok(STARGATE_V2_ROUTERS[1]);
  assert.ok(STARGATE_V2_ROUTERS[42161]);

  // Validate deBridge DLN Source
  assert.ok(DEBRIDGE_DLN_SOURCE[1]);

  // Validate Permit2
  assert.equal(getPermit2Address(1), '0x000000000022D473030F116dDEE9F6B43aC78BA3');
  assert.equal(getPermit2Address(8453), '0x000000000022D473030F116dDEE9F6B43aC78BA3');

  // Validate Uniswap V3 Router
  assert.equal(getUniswapV3Router(1), '0xE592427A0AEce92De3Edee1F18E0157C05861564');
  assert.equal(getUniswapV3Router(42161), '0xE592427A0AEce92De3Edee1F18E0157C05861564');
});

test('Zenith Cross-Chain Router: End-to-End Cross-Chain Quote & Routing', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'polygon' && t.symbol === 'USDT')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDT')!;
  const user = '0xd2206B1A832104F5E6cEBebBf1C2920fDba4Af88';

  assert.ok(tokenIn);
  assert.ok(tokenOut);

  const quote = await defaultZenithRouter.getQuote({
    sourceChainId: 'polygon',
    destinationChainId: 'ethereum',
    tokenIn,
    tokenOut,
    amountInRaw: '100000000', // 100 USDT
    recipient: user,
    slippageTolerancePercent: 0.5
  });

  assert.ok(quote);
  assert.equal(quote.bestRoute.routeType, 'CROSS_CHAIN');
  assert.ok(quote.intent);
  assert.equal(quote.intent.recipient, user);
  assert.ok(quote.bestRoute.crossChainQuote);
});

test('Zenith Cross-Chain Router: Signer Requirement Enforcement', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'polygon' && t.symbol === 'USDC')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'arbitrum' && t.symbol === 'USDC')!;
  const user = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

  assert.ok(tokenIn);
  assert.ok(tokenOut);

  const quote = await defaultZenithRouter.getQuote({
    sourceChainId: 'polygon',
    destinationChainId: 'arbitrum',
    tokenIn,
    tokenOut,
    amountInRaw: '100000000', // 100 USDC
    recipient: user,
    slippageTolerancePercent: 0.5
  });

  assert.ok(quote);
  assert.equal(quote.bestRoute.routeType, 'CROSS_CHAIN');

  const stateMachine = new ExecutionStateMachine();
  const coordinator = new ExecutionCoordinator();

  // Execution without signer must fail closed
  await assert.rejects(
    async () => {
      await coordinator.executeTrade({
        quote,
        userAddress: user,
        stateMachine
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof SignerRequiredError);
      return true;
    }
  );
});

test('Zenith Cross-Chain Router: Mock Signer Execution Flow', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'polygon' && t.symbol === 'USDC')!;
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'arbitrum' && t.symbol === 'USDC')!;
  const user = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

  const quote = await defaultZenithRouter.getQuote({
    sourceChainId: 'polygon',
    destinationChainId: 'arbitrum',
    tokenIn,
    tokenOut,
    amountInRaw: '100000000', // 100 USDC
    recipient: user,
    slippageTolerancePercent: 0.5
  });

  const stateMachine = new ExecutionStateMachine();
  const stepStatuses: string[] = [];
  stateMachine.subscribe((status) => {
    stepStatuses.push(status);
  });

  // Create a realistic mock signer for unit testing
  const mockSigner = {
    getAddress: async () => user,
    estimateGas: async () => 150000n,
    sendTransaction: async (_tx: any) => ({
      hash: '0xabc1230000000000000000000000000000000000000000000000000000000001',
      wait: async () => ({
        status: 1,
        hash: '0xabc1230000000000000000000000000000000000000000000000000000000001',
        blockNumber: 12345678,
        gasUsed: BigInt(150000),
        gasPrice: BigInt(30000000000)
      })
    }),
    provider: {
      call: async () => '0x0000000000000000000000000000000000000000000000000000000005f5e100',
      estimateGas: async () => BigInt(150000),
      getFeeData: async () => ({ gasPrice: BigInt(30000000000) }),
      getTransactionReceipt: async (hash: string) => ({
        status: 1,
        hash,
        blockNumber: 12345678,
        gasUsed: BigInt(150000),
        gasPrice: BigInt(30000000000)
      })
    }
  } as any;

  const coordinator = new ExecutionCoordinator();
  const receipt = await coordinator.executeTrade({
    quote,
    userAddress: user,
    signer: mockSigner,
    stateMachine,
    skipDestinationWait: true
  });

  assert.ok(receipt);
  assert.equal(receipt.status, 'COMPLETED');
  assert.equal(receipt.sourceChain.id, 'polygon');
  assert.equal(receipt.destChain?.id, 'arbitrum');
  assert.ok(receipt.txHash.startsWith('0x'));
  assert.ok(receipt.bridgeDetails);
  assert.ok(stepStatuses.includes('COMPLETED'));
});

test('Zenith Cross-Chain Router: Direct Unsupported Pair Fails Closed', async () => {
  const tokenIn = DEFAULT_TOKENS.find((t) => t.chainId === 'polygon' && t.isNative)!; // POL
  const tokenOut = DEFAULT_TOKENS.find((t) => t.chainId === 'arbitrum' && t.symbol === 'USDT')!;
  const user = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

  // Direct bridge for POL -> USDT is not supported by bridges directly
  // Router must fail closed with CROSS_CHAIN_QUOTE_UNAVAILABLE
  await assert.rejects(
    async () => {
      await defaultZenithRouter.getQuote({
        sourceChainId: 'polygon',
        destinationChainId: 'arbitrum',
        tokenIn,
        tokenOut,
        amountInRaw: '1000000000000000000', // 1 POL
        recipient: user,
        slippageTolerancePercent: 0.5
      });
    },
    /CROSS_CHAIN_QUOTE_UNAVAILABLE|No valid cross-chain bridge quote available/
  );
});

