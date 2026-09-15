# ZENITH Router & Execution Aggregator Specification

## 1. Overview

The **ZENITH Router** ([`contracts/evm/src/router/ZenithRouter.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/router/ZenithRouter.sol) & [`packages/routing/src/router.ts`](file:///e:/APEX/ZENITH/packages/routing/src/router.ts)) acts as the unified liquidity aggregator across the multi-chain ecosystem.

### Routing Hierarchy
1. **Primary Priority**: Native Sovereign ZENITH Pools (`ZENITH_V3`, `ZENITH_V2`, `ZENITH_V1`).
2. **Secondary Priority**: External verified DEX liquidity on connected chains (Uniswap V3, QuickSwap, Aerodrome, Velodrome, Camelot, PancakeSwap, Trader Joe).
3. **Cross-Chain Bridging**: Multi-provider bridge aggregation (Across, Stargate, deBridge DLN).

---

## 2. Pathfinding & Execution Engine

```
[Quote Request] 
      │
      ├───> [1. Check Direct Zenith V3 / V2 / V1 Pools]
      │           │
      │           ├── Found Optimal Quote ─────────> Return Zenith AMM Route
      │           │
      ├───> [2. Multi-Hop Pathfinding via Connector Assets (WETH / USDC / USDT)]
      │           │
      │           ├── Found Split / Multi-Hop ──────> Return Multi-Hop Route
      │           │
      └───> [3. Cross-Chain Bridge Aggregator (if sourceChain != destChain)]
                  │
                  └── Route through Across / Stargate / deBridge Intent
```

---

## 3. Effective Execution Score (EES)

Every candidate route is evaluated dynamically:

$$\text{EES} = 100 - (\text{PriceImpactPercent} \times 8) - \text{GasCostRatio} - \text{SlippagePenalty}$$

The route with the highest EES is selected as `bestRoute`. All alternative candidate routes are returned in `routes: SwapRoute[]`.
