# ZENITH Cross-Chain Engine & Intent Architecture

## 1. Overview

The **ZENITH Cross-Chain Engine** orchestrates cross-chain token transfers, multi-chain swaps, and intent-based settlement across EVM and Solana networks without custodial counterparty risk.

### Supported Bridge Protocols
- **Across V3 Protocol**: Low-latency optimistic intent-based bridging.
- **Stargate V2 (LayerZero)**: Unified omnichain liquidity pools.
- **deBridge DLN (Decompiled Liquidity Network)**: 0-slippage cross-chain limit orders.

---

## 2. Intent Engine State Machine

```
   [CREATED] ──> [SIGNED] ──> [SUBMITTED] ──> [ACCEPTED] ──> [FULFILLING] ──> [DESTINATION_FILLED] ──> [SETTLED]
        │                                                                             │
        │ (Timeout / Failure)                                                         │ (Relayer Drop)
        ▼                                                                             ▼
   [REFUND_PENDING] ───────────────────────────────────────────────────────────> [REFUNDED]
```

### Invariants & Guarantees
1. **Recipient Integrity**: The destination recipient address is validated on-chain to match the sender's configured recipient.
2. **Deterministic Refund Recovery**: If an intent exceeds the relayer timeout limit (default: 300s), the intent engine automatically transitions the order state to `REFUND_PENDING` and guarantees refund claimability on the source chain.
3. **Price Sanity Guard**: Cross-chain quotes are strictly checked against oracle pricing bands to prevent malicious solver quote injections.
