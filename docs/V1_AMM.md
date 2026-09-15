# ZENITH V1 AMM Specification — Constant Product Protocol

## 1. Overview

**ZENITH V1** is a constant product automated market maker ($x \cdot y = k$) providing decentralized spot liquidity for token pairs without reliance on external AMM protocols.

### Key Characteristics
- **Formula**: $x \cdot y = k$ invariant with strict overflow/underflow checks.
- **LP Token**: Standard ERC20 token `Zenith V1 LP (ZTH-V1)`.
- **Trading Fee**: Fixed **30 BPS (0.30%)** per swap.
- **TWAP Oracle**: On-chain cumulative price accumulators (`price0CumulativeLast`, `price1CumulativeLast`) updated once per block.
- **Reentrancy Lock**: Reentrancy guard modifier on all balance-modifying entrypoints (`mint`, `burn`, `swap`, `sync`, `skim`).

---

## 2. Core Contracts

### [`ZenithV1Factory.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/v1/ZenithV1Factory.sol)
- `createPair(address tokenA, address tokenB)`: Deploys a deterministic pair using `CREATE2`.
- `getPair(address tokenA, address tokenB)`: Lookup pair address for any token combination.
- `allPairsLength()`: Returns total number of active pairs.
- `feeTo`: Address where protocol fee shares accrue if enabled.

### [`ZenithV1Pair.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/v1/ZenithV1Pair.sol)
- `mint(address to)`: Mints liquidity tokens proportional to provided reserves:
  $$\text{liquidity} = \min\left(\frac{\Delta x \cdot T}{x}, \frac{\Delta y \cdot T}{y}\right)$$
  *(Initial mint locks $\text{MINIMUM\_LIQUIDITY} = 1000$ to address zero).*
- `burn(address to)`: Burns LP tokens and returns underlying token assets.
- `swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data)`: Executes flash swaps or regular swaps, ensuring:
  $$(x_1 \cdot 1000 - \Delta x \cdot 3) \cdot (y_1 \cdot 1000 - \Delta y \cdot 3) \ge x_0 \cdot y_0 \cdot 1000^2$$
- `sync()`: Forces reserves to match on-chain balances.

### [`ZenithV1Router.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/v1/ZenithV1Router.sol)
- `addLiquidity(...)`: Computes optimal ratios, transfers tokens, and mints LP tokens to user.
- `removeLiquidity(...)`: Burns LP tokens and transfers tokens back with slippage bounds.
- `swapExactTokensForTokens(...)`: Executes multi-hop swaps across V1 pairs with deadline checks.
- `swapExactETHForTokens(...)` / `swapExactTokensForETH(...)`: Handles native wrapping / unwrapping.

---

## 3. Mathematical Reference

### Swap Output Formula
Given input $\Delta x$ with fee rate $\gamma = 1 - \frac{\text{feeBps}}{10000} = \frac{9970}{10000}$:

$$\Delta y = \frac{y \cdot (\Delta x \cdot 9970)}{x \cdot 10000 + (\Delta x \cdot 9970)}$$

### Swap Input Formula (Exact Output)
Given desired output $\Delta y$:

$$\Delta x = \left\lceil \frac{x \cdot \Delta y \cdot 10000}{(y - \Delta y) \cdot 9970} \right\rceil + 1$$
