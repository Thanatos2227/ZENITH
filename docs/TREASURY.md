# ZENITH SWAP — Protocol Treasury & Fee Controller Specification

## 1. Overview & Sovereign Treasury Invariant

The **ZENITH Treasury** ([`contracts/evm/src/treasury/ZenithTreasury.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/treasury/ZenithTreasury.sol)) and **ZENITH Fee Controller** ([`contracts/evm/src/treasury/ZenithFeeController.sol`](file:///e:/APEX/ZENITH/contracts/evm/src/treasury/ZenithFeeController.sol)) establish an independent, sovereign revenue system for ZENITH SWAP.

### Fundamental Invariants
1. **Non-Custodial Fee Isolation**: The treasury never touches or holds user swap principal. Only the exact protocol fee portion (e.g. 5 BPS = 0.05%) from swaps is routed to the treasury contract.
2. **Hard Ceiling on Protocol Fees**: The protocol fee is immutably capped at a maximum of **30 BPS (0.30%)** directly enforced in Solidity arithmetic (`MAX_PROTOCOL_FEE_BPS = 30`).
3. **Transparent Accrual**: The treasury tracks cumulative fees collected per token (`cumulativeFeesCollected[token]`) and current balances (`getTreasuryBalance(token)`).
4. **2-Step Governance Handover (`Ownable2Step`)**: Governance transfers require a 2-step ceremony: `transferGovernance(newGov)` sets `pendingGovernance`, followed by `acceptGovernance()` called by the new governance address.
5. **Emergency Circuit Breaker**: Governance can activate `setEmergencyPause(true)` during critical anomalies.

---

## 2. Architecture & Topology

```
   [User Swap Transaction]
             │
             ├────── (99.95% principal) ──────> [Zenith V1 / V2 / V3 AMM Pool] ──────> [User Receives Output]
             │
             └────── (0.05% protocol fee) ────> [ZenithTreasury.depositFee]
                                                        │
                                                        ▼
                                            [cumulativeFeesCollected[token]++]
                                            [Token Balance in Treasury Vault]
```

---

## 3. Contract Interfaces

### `ZenithFeeController.sol`
- `protocolFeeBps()`: Returns current global protocol fee (default: 5 BPS).
- `crossChainFeeBps()`: Returns current cross-chain protocol fee (default: 5 BPS).
- `setProtocolFeeBps(uint256 newFeeBps)`: Updates fee with strict check `newFeeBps <= 30`.
- `setTreasury(address newTreasury)`: Updates destination vault.
- `configureV2FeeTier(uint24 feeTierBps, bool allowed)`: Authorizes V2 pool fee tiers (5, 30, 100 bps).
- `configureV3FeeTier(uint24 feeTier, int24 tickSpacing, bool allowed)`: Authorizes V3 pool fee tiers & tick spacings.

### `ZenithTreasury.sol`
- `depositFee(address token, uint256 amount)`: Ingests accrued protocol fee revenues.
- `withdraw(address token, address payable recipient, uint256 amount)`: Governance withdrawal of treasury yields.
- `rescueToken(address token, address payable recipient, uint256 amount)`: Emergency token recovery.
- `getTreasuryBalance(address token)`: Returns current spendable balance in vault.
- `getCollectedFees(address token)`: Returns lifetime historical fee volume.

---

## 4. Multi-Chain Address Registry

| Chain ID | Network | Fee Controller Address | Treasury Address | Default Protocol Fee | Max Protocol Fee |
|---|---|---|---|---|---|
| 1 | Ethereum | `0x8000000000000000000000000000000000000001` | Deployed On-Chain | 5 BPS (0.05%) | 30 BPS (0.30%) |
| 137 | Polygon | `0x8000000000000000000000000000000000000137` | Deployed On-Chain | 5 BPS (0.05%) | 30 BPS (0.30%) |
| 8453 | Base | `0x8000000000000000000000000000000000008453` | Deployed On-Chain | 5 BPS (0.05%) | 30 BPS (0.30%) |
| 42161 | Arbitrum | `0x8000000000000000000000000000000000042161` | Deployed On-Chain | 5 BPS (0.05%) | 30 BPS (0.30%) |
| 10 | Optimism | `0x8000000000000000000000000000000000000010` | Deployed On-Chain | 5 BPS (0.05%) | 30 BPS (0.30%) |
| 56 | BNB Chain | `0x8000000000000000000000000000000000000056` | Deployed On-Chain | 5 BPS (0.05%) | 30 BPS (0.30%) |
| 43114 | Avalanche | `0x8000000000000000000000000000000000043114` | Deployed On-Chain | 5 BPS (0.05%) | 30 BPS (0.30%) |
