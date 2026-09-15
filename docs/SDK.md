# ZENITH SDK Developer Guide (`@zenith/sdk`)

## 1. Installation

```bash
npm install @zenith/sdk ethers
```

---

## 2. Quickstart

```typescript
import { ZenithSDK, zenithSDK } from '@zenith/sdk';

// 1. Initialize SDK
const sdk = new ZenithSDK({
  defaultSlippageBps: 50, // 0.5%
  rpcUrls: {
    137: 'https://polygon-rpc.com',
    8453: 'https://mainnet.base.org'
  }
});

// 2. Fetch Swap Quote
const quote = await sdk.getQuote({
  chainId: 137,
  tokenIn: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC
  tokenOut: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // POL
  amountIn: 100n * 10n ** 6n // 100 USDC (6 decimals)
});

console.log(`Expected output: ${quote.amountOut}`);
console.log(`Minimum received (with slippage): ${quote.minimumReceived}`);
console.log(`Protocol fee: ${quote.protocolFeeAmount} (${quote.protocolFeeBps} BPS)`);

// 3. Build Unsigned Swap Transaction
const unsignedTx = await sdk.buildSwapTransaction(quote, {
  userAddress: '0xYourWalletAddress'
});

// 4. Sign and Broadcast with Ethers / Viem
// await signer.sendTransaction(unsignedTx);
```

---

## 3. Liquidity Provisioning

### Add Liquidity (V1 Constant Product)
```typescript
const tx = await sdk.buildLiquidityTransaction({
  protocol: 'ZENITH_V1',
  chainId: 137,
  tokenA: tokenAAddress,
  tokenB: tokenBAddress,
  amountADesired: 1000n * 10n ** 6n,
  amountBDesired: 10000n * 10n ** 18n,
  amountAMin: 990n * 10n ** 6n,
  amountBMin: 9900n * 10n ** 18n,
  to: userAddress,
  deadline: Math.floor(Date.now() / 1000) + 1200
});
```

### Mint Position (V3 Concentrated Liquidity NFT)
```typescript
const tx = await sdk.buildLiquidityTransaction({
  protocol: 'ZENITH_V3',
  chainId: 137,
  token0: token0Address,
  token1: token1Address,
  feeBps: 3000,
  tickLower: -887220,
  tickUpper: 887220,
  amount0Desired: 1000n * 10n ** 6n,
  amount1Desired: 10000n * 10n ** 18n,
  amount0Min: 950n * 10n ** 6n,
  amount1Min: 9500n * 10n ** 18n,
  recipient: userAddress,
  deadline: Math.floor(Date.now() / 1000) + 1200
});
```

---

## 4. API Reference

| Method | Return Type | Description |
|---|---|---|
| `getQuote(params)` | `Promise<ZenithQuoteResult>` | Calculates optimal swap quote across Zenith AMMs |
| `getRoutes(params)` | `Promise<ZenithRoute[]>` | Returns all ranked candidate execution routes |
| `getPools(chainId, protocol?)` | `Promise<ZenithPoolInfo[]>` | Discovers active pools and reserves |
| `getPool(chainId, address, protocol)` | `Promise<ZenithPoolInfo>` | Fetches detailed pool state and tick data |
| `buildSwapTransaction(quote, options)` | `Promise<UnsignedTransaction>` | Generates unsigned swap transaction calldata |
| `buildLiquidityTransaction(params)` | `Promise<UnsignedTransaction>` | Builds liquidity addition/removal transactions |
| `getPosition(chainId, tokenId)` | `Promise<ZenithV3PositionInfo>` | Inspects concentrated liquidity NFT position |
| `getTreasuryInfo(chainId)` | `Promise<ZenithTreasuryInfo>` | Retrieves treasury balances and fee rates |
