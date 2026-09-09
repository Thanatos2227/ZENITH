# §71 Compliance, §73 Accessibility & §74 Performance Budgets

---

## 1. §71 Compliance & Data Governance

### A. Regulatory Scope Gating (e.g. Robinhood Chain / RWA)
- Chains hosting tokenized securities or jurisdiction-restricted assets (such as Robinhood Chain) have dynamic capability flags (`regulatoryScope.jurisdictionGated: true`).
- Geographic filtering restricts access for prohibited jurisdictions according to FATF and local sanctions regimes.
- Clear disclosures and accreditation notices surfaced prior to swap confirmation.

### B. Privacy & Data Minimization
- **Zero IP Retention on Swaps**: Client IP addresses are not linked to wallet addresses.
- **Zero Private Data Collection**: No email or personal identifiers required for core DEX trading.
- **Telemetry Deletion Policy**: Performance metrics aggregated and expunged after 30 days.

---

## 2. §73 Accessibility Specification (WCAG 2.1 AA)

| Requirement | Implementation in ZENITH | Compliance Status |
| :--- | :--- | :--- |
| **Contrast Ratios** | Primary text `#F8FAFC` on `#080B11` yields **15.8:1** (exceeds AAA target 7.0:1) | ✅ Passed |
| **Keyboard Navigation** | Complete tab index and focus rings across Confirm Sheet, Token Picker, Chain Switcher | ✅ Passed |
| **Screen Reader Semantics** | Numeric prices, price impact levels, and gas numbers include descriptive labels | ✅ Passed |
| **No Color-Only State** | Critical, High, Medium, and Low risk states use both distinct iconography & explicit text | ✅ Passed |
| **Reduced Motion** | CSS respects `prefers-reduced-motion: reduce` across state transitions | ✅ Passed |

---

## 3. §74 Performance Budgets

- **Quote-to-Render Latency**: $<150\text{ms}$ for local calculation and UI reconciliation.
- **LCP (Largest Contentful Paint)**: $<1.2\text{s}$ on standard 4G connections.
- **CLS (Cumulative Layout Shift)**: $<0.02$ across Simple and Pro Mode layout transitions.
- **Single Source of Truth**: 100% data parity between Simple and Pro Mode via Zustand core engine store.
