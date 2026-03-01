# StackStream — Grant Application Narrative

## Stacks Endowment: Getting Started Program Track

---

## Project Name

**StackStream** — Bitcoin-Native Payroll Streaming Protocol for DAOs

## One-Line Description

StackStream enables DAOs on Stacks to stream token payments block-by-block to contributors, replacing lump-sum payroll with continuous, transparent, and programmable compensation flows.

---

## 1. Problem Statement

### The Gap in the Stacks Ecosystem

DAOs and decentralized teams on Stacks currently lack native payroll infrastructure. Today, DAO treasuries distribute funds through:

- **Manual batch transfers** — requiring multi-sig coordination for each pay period
- **Lump-sum payments** — creating cash flow volatility for both DAOs and contributors
- **Off-chain payroll tools** — introducing trust assumptions that defeat the purpose of on-chain governance

On Ethereum, protocols like Sablier (>$2B in cumulative streamed volume) and Superfluid have proven that payment streaming is critical DAO infrastructure. **No equivalent exists on Stacks.**

This gap matters because:

1. **Stacks DAO treasuries are growing** — with STX stacking yields, sBTC integration, and increasing developer activity, DAOs need sophisticated treasury management
2. **Contributor retention suffers** — without continuous payment visibility, contributors lack confidence in DAO commitment
3. **Capital efficiency is poor** — locking full payment upfront when contributors are paid monthly wastes treasury capital that could be stacking or deployed in DeFi

### Who This Affects

- **DAO operators** managing contributor compensation (e.g., grant-funded teams, protocol DAOs, community working groups)
- **Contributors and freelancers** receiving recurring payments from Stacks-based organizations
- **The broader Stacks DeFi ecosystem** — payment streaming is composable infrastructure that other protocols can build on

---

## 2. Solution: StackStream Protocol

StackStream is a fully on-chain payment streaming protocol built in Clarity v3. It enables any Stacks user to create a token stream that linearly releases SIP-010 tokens block-by-block from sender to recipient.

### How It Works

1. **Create** — A sender deposits tokens and specifies a recipient, duration (in blocks), and optional memo. Tokens are escrowed in the smart contract.
2. **Stream** — Every Stacks block, a proportional amount of tokens becomes claimable by the recipient. A 10,000 STX stream over 1,000 blocks releases 10 STX per block.
3. **Claim** — Recipients claim accrued tokens at any time — partial claims or full balance.
4. **Manage** — Senders can pause, resume, cancel, or top-up streams in real-time.

### What Makes This Stacks-Native

- **Block-by-block precision** — Uses `stacks-block-height` for deterministic streaming math, leveraging Stacks' consistent block times
- **SIP-010 compatible** — Works with any fungible token following the SIP-010 standard, including future sBTC wrappers
- **Clarity's safety guarantees** — No reentrancy risks, decidable execution, and transparent on-chain logic
- **PoX-aligned treasury management** — DAOs can coordinate streaming schedules with stacking cycles

---

## 3. Current Progress (Proof of Concept)

I have a **working MVP** deployed to Stacks testnet with a fully functional frontend. This is not an idea — it is a built product.

### Smart Contracts (Deployed to Testnet)

| Contract | Lines | Status |
|---|---|---|
| `stream-manager.clar` | 736 | Complete — all 8 public functions, 12 read-only functions |
| `stream-factory.clar` | 218 | Complete — DAO registry, name system, analytics |
| `mock-sip010-token.clar` | 90 | Complete — test token with faucet |
| `sip-010-trait.clar` | 30 | Complete — local trait definition |

**Testnet deployer:** `ST1D7YBYFW44KJE8VAAN2ACX23BCX3FDV5YQRX3RB`

### Test Suite

- **66 tests passing** (45 stream-manager + 21 stream-factory)
- Covers: creation, claiming, pause/resume, cancellation, top-up, edge cases, admin functions
- Built with Clarinet SDK v3.6.0 + Vitest

### Frontend Application

- **10 pages** across landing, dashboard (sender), and earn (recipient) sections
- Full wallet integration (Leather & Xverse)
- All 7 contract interactions wired: create, claim, claim-all, pause, resume, cancel, top-up
- Real-time balance animation using `requestAnimationFrame` interpolation
- Analytics dashboard with TVL, burn rate, utilization metrics
- Testnet faucet for easy onboarding

### Supporting Infrastructure

- OpenClaw data service (custom-built Express.js REST API for on-chain queries, transaction building, and the in-app assistant widget)
- Comprehensive user guide (329 lines covering all workflows)

---

## 4. Milestone Plan (10 Weeks)

See [MILESTONE_PLAN.md](./MILESTONE_PLAN.md) for detailed breakdown.

| Milestone | Timeline | Deliverables | Funding |
|---|---|---|---|
| **M1: Security & Audit Readiness** | Weeks 1-3 | Independent code review, fuzz testing, formal verification of core math | 30% |
| **M2: Mainnet Launch & sBTC Integration** | Weeks 4-7 | Mainnet deployment, sBTC token support, production frontend | 40% |
| **M3: DAO Tooling & Ecosystem Integration** | Weeks 8-10 | Multi-stream batch creation, CSV import, notification system, documentation | 30% |

---

## 5. Budget Breakdown

See [BUDGET_PROPOSAL.md](./BUDGET_PROPOSAL.md) for detailed allocation.

**Requested Amount: $7,500 in STX**

| Category | Amount | % |
|---|---|---|
| Security review & testing infrastructure | $2,250 | 30% |
| Mainnet deployment & sBTC integration | $3,000 | 40% |
| DAO tooling, docs & ecosystem outreach | $2,250 | 30% |

---

## 6. Ecosystem Impact

StackStream fills a critical infrastructure gap by providing:

- **Composable primitive** — Other protocols can build on streaming (vesting schedules, subscription services, yield distribution)
- **DAO operational efficiency** — Reduces multi-sig coordination overhead for recurring payments
- **sBTC utility driver** — As sBTC launches, payment streaming becomes a primary use case for Bitcoin-denominated payroll
- **Developer tooling** — Open-source Clarity patterns for time-based token distribution that other builders can reference
- **User onboarding** — The earn/claim interface gives contributors a reason to use Stacks wallets regularly

See [ECOSYSTEM_IMPACT.md](./ECOSYSTEM_IMPACT.md) for detailed analysis.

---

## 7. Team & Execution Capability

### Proof of Execution

The strongest evidence of my execution capability is the MVP itself:

- **1,074 lines of Clarity** smart contracts — not boilerplate, but production-grade streaming math with 1e12 precision handling
- **66 passing tests** covering edge cases, authorization, and state transitions
- **Full-stack frontend** with real-time animation, wallet integration, and analytics
- **Testnet deployment** — contracts are live and interactive today

### Technical Competence Demonstrated

- Deep understanding of Clarity v3 semantics (tx-sender vs contract-caller security model)
- Precision math implementation avoiding floating-point issues common in DeFi
- Production frontend patterns (TanStack Query polling, Zustand state, Framer Motion)

---

## 8. Long-Term Vision

StackStream aims to become the default payment infrastructure for Stacks DAOs, analogous to Sablier's role on Ethereum. Post-grant roadmap includes:

1. **Token vesting module** — Lock-up schedules for team tokens and investor allocations
2. **Recurring streams** — Auto-renewing payment streams for ongoing contributor relationships
3. **Multi-token streaming** — Stream multiple tokens in a single transaction
4. **Governance integration** — DAO proposal-triggered stream creation (e.g., "If proposal passes, start streaming X to contributor Y")
5. **sBTC yield streaming** — Stream stacking yields directly to contributors

---

## 9. Links & Resources

- **Testnet App:** [TODO: Add deployed frontend URL]
- **GitHub Repository:** [TODO: Add repository URL]
- **User Guide:** Included in repository (`USER_GUIDE.md`)
- **Technical Architecture:** See [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)

---


