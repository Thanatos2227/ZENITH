# ZENITH V3 AMM Specification — Concentrated Liquidity Protocol

## 1. Overview

**ZENITH V3** is a concentrated liquidity market maker allowing liquidity providers (LPs) to allocate capital within customized price intervals $[p_a, p_b]$.

### Key Innovations
- **Concentrated Capital Efficiency**: Up to 4000x higher capital efficiency compared to uniform $x \cdot y = k$ curves.
- **Fixed-Point Arithmetic**: Integer arithmetic in $Q64.96$ and $Q128.128$ representations without floating point approximations.
- **Tick Bitmap Indexing**: $O(1)$ tick search using word bitmaps (`TickBitmap.sol`) for optimal gas efficiency.
- **ERC721 NFT Positions**: Each concentrated position is minted as a unique ERC721 NFT token via `ZenithV3PositionManager.sol`.

---

## 2. Mathematical Architecture

### Price & Tick Invariant
Price is defined as:
$$P = 1.0001^i$$
where $i$ is the integer tick index.

The square root of price in $Q96$ fixed-point format is:
$$\sqrt{P} = \sqrt{1.0001^i} \times 2^{96}$$

### Liquidity Delta Formulas
When price moves from $\sqrt{P}_c$ to $\sqrt{P}_t$ within tick range $[\sqrt{P}_a, \sqrt{P}_b]$:

- For Token 0 ($\Delta x$):
  $$\Delta x = \Delta L \cdot \frac{\sqrt{P}_b - \sqrt{P}_a}{\sqrt{P}_a \cdot \sqrt{P}_b}$$
- For Token 1 ($\Delta y$):
  $$\Delta y = \Delta L \cdot (\sqrt{P}_b - \sqrt{P}_a)$$

---

## 3. Core Contracts & Libraries

### Math Libraries ([`contracts/evm/src/v3/libraries/`](file:///e:/APEX/ZENITH/contracts/evm/src/v3/libraries/))
- **`LiquidityMath.sol`**: Safe addition/subtraction of signed liquidity deltas with overflow checks.
- **`SwapMath.sol`**: Computes single-step swap amounts $\Delta x$, $\Delta y$, next $\sqrt{P}$, and fee growth.
- **`TickBitmap.sol`**: 256-bit word bitmap indexing initialized ticks.

### [`ZenithV3Factory.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/v3/ZenithV3Factory.sol)
- `createPool(address tokenA, address tokenB, uint24 fee)`: Deploys concentrated pool with configured tick spacing:
  - `100 (0.01%)`: Tick Spacing = 1
  - `500 (0.05%)`: Tick Spacing = 10
  - `3000 (0.30%)`: Tick Spacing = 60
  - `10000 (1.00%)`: Tick Spacing = 200

### [`ZenithV3Pool.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/v3/ZenithV3Pool.sol)
- `slot0`: Current `(sqrtPriceX96, tick, unlocked)`.
- `mint(recipient, tickLower, tickUpper, amount, data)`: Provides liquidity within range.
- `swap(recipient, zeroForOne, amountSpecified, sqrtPriceLimitX96, data)`: Concentrated single-pool swap.
- `collect(recipient, tickLower, tickUpper, amount0, amount1)`: Harvests accrued swap fees.

### [`ZenithV3PositionManager.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/v3/ZenithV3PositionManager.sol)
- ERC721 NFT contract representing ownership of concentrated liquidity positions.
- `mint(...)`: Creates position NFT and deposits tokens.
- `increaseLiquidity(...)` / `decreaseLiquidity(...)`: Adjusts position depth.
- `collect(...)`: Collects accrued trading fees for token owner.

### [`ZenithV3Router.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/v3/ZenithV3Router.sol)
- `exactInputSingle(...)`: Executes single-pool swap with slippage bounds and deadline.
- `multicall(...)`: Batches swap, unwrapping, and refunding operations into a single atomic transaction.
