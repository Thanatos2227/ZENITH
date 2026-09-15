# ZENITH Security & Formal Invariant Architecture

## 1. Core Security Invariants

1. **Non-Custodial Guarantee**: At no point does ZENITH take custody of user assets. Funds move atomically between the user and AMM pools / bridge contracts in a single transaction.
2. **Reentrancy Protection**: All state-modifying contract functions (`mint`, `burn`, `swap`, `collect`, `depositFee`, `withdraw`) employ non-reentrant mutex locks.
3. **Integer Arithmetic Precision**: All pricing, fee calculations, and pool shares are calculated in integer BigInt / fixed-point $Q96$ math, strictly preventing IEEE-754 floating-point rounding errors.
4. **Anti-Mock & Anti-Simulation Rule**: The codebase contains zero dummy simulation bypasses, zero placeholder routers, and zero fake timeouts in execution paths. Every transaction targets live on-chain smart contracts.
5. **Circuit Breakers & Emergency Pauses**: The protocol treasury and AMM pools support emergency pause controls managed through a 2-step governance contract (`Ownable2Step`).

---

## 2. Token Security & Risk Engine

Before executing any quote or swap, the ZENITH Security Engine checks:
- **Honeypot Detection**: Simulates transfer in / transfer out to identify honeypots.
- **Tax Token Detection**: Identifies buy/sell transfer taxes and calculates fee adjustments.
- **Blacklist / Mint Arbitrary Guard**: Analyzes bytecode for malicious mint or blacklist hooks.
- **MEV Protection**: Routes high-value transactions through private Flashbots bundles and MEV-blocker RPC endpoints.
