# ZENITH V2 AMM Specification — Multi-Tier Dynamic Protocol

## 1. Overview

**ZENITH V2** extends the constant product model to support **multiple fee tiers** (5 BPS, 30 BPS, 100 BPS) for the same token pair and integrates direct fee routing to the **ZENITH Sovereign Treasury**.

### Key Characteristics
- **Dynamic Fee Tiers**:
  - `5 BPS (0.05%)`: Stablecoin pairs (e.g. USDC/USDT, DAI/USDC)
  - `30 BPS (0.30%)`: Standard volatile pairs (e.g. WETH/USDC, POL/USDC)
  - `100 BPS (1.00%)`: Exotic or high-volatility pairs
- **Treasury Split**: Protocol fee portion is automatically split and streamed to `ZenithTreasury`.
- **TWAP Accumulators**: 32-bit timestamped price accumulators for on-chain manipulation resistance.
- **Factory Registry**: Each `(tokenA, tokenB, feeBps)` triple maps to a unique pool address.

---

## 2. Core Contracts

### [`ZenithV2Factory.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/v2/ZenithV2Factory.sol)
- `createPool(address tokenA, address tokenB, uint24 feeBps)`: Deploys a new V2 pool. Validates that `feeController.isV2FeeTierAllowed(feeBps)` is true.
- `getPool(address tokenA, address tokenB, uint24 feeBps)`: Returns address of the pool.
- `feeController`: Linked central fee controller.
- `treasury`: Linked protocol treasury vault.

### [`ZenithV2Pool.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/v2/ZenithV2Pool.sol)
- `feeBps`: Fee tier of this pool (5, 30, or 100).
- `mint(address to)`: Mints `Zenith V2 LP (ZTH-V2)` tokens.
- `burn(address to)`: Burns LP tokens and returns underlying reserves.
- `swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data)`: Executes swap with protocol fee deduction sent directly to treasury.

### [`ZenithV2Router.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/v2/ZenithV2Router.sol)
- `addLiquidity(address tokenA, address tokenB, uint24 feeBps, ...)`: Provides liquidity to a specific fee tier pool.
- `removeLiquidity(address tokenA, address tokenB, uint24 feeBps, ...)`: Withdraws liquidity.
- `swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, uint24[] feeBpsPath, address to, uint256 deadline)`: Multi-hop swap traversing pools with distinct fee tiers.
