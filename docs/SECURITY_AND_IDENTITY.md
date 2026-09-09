# §63 Application Security & Identity Specification

## 1. Overview
Non-custodial smart contracts protect funds on-chain. This specification governs the application layer surrounding those funds: APIs, frontends, admin portals, and infrastructure endpoints.

---

## 2. Public Frontend Security Posture

### A. Content Security Policy (CSP)
```http
Content-Security-Policy: default-src 'self';
  script-src 'self' 'nonce-{RANDOM_NONCE}';
  connect-src 'self' https://*.llamarpc.com https://*.alchemy.com https://*.solana.com https://*.flashbots.net;
  img-src 'self' data: https://assets.coingecko.com https://*.blockscout.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### B. Anti-XSS Token Sanitization
Token metadata (names, symbols, URLs) are attacker-controlled input and MUST be rendered strictly using text escaping or sanitized DOM nodes. No `dangerouslySetInnerHTML` on token strings.

### C. Frame Busting / Clickjacking Protection
All wallet-approval adjacent views enforce `frame-ancestors 'none'` and X-Frame-Options `DENY`.

---

## 3. Privileged Surfaces (Treasury & Admin)

1. **Authentication**: Mandatory WebAuthn / FIDO2 hardware keys (YubiKey) + 2FA.
2. **Role-Based Access Control (RBAC)**:
   - `READ_ONLY_AUDITOR`: View-only telemetry & treasury accounting.
   - `EMERGENCY_GUARDIAN`: Authorized only to trigger circuit breaker pause.
   - `GOVERNANCE_MULTISIG`: Authorized for parameter and contract updates.
3. **Session Re-authentication**: Any config modification requires a fresh hardware key biometric/PIN prompt.
4. **Audit Logging**: Every privileged interaction is immutably logged with actor identity, IP, UTC timestamp, and state diff.
