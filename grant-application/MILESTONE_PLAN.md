# StackStream — Milestone Plan

## Getting Started Program Track | 10-Week Execution Plan

---

## Overview

This milestone plan covers the path from the current MVP (testnet-deployed, 66 tests passing) to a production-ready mainnet protocol. The plan is structured in 3 milestones over 10 weeks, with clear deliverables and success metrics for each.

**Current State (Pre-Grant):**
- 2 smart contracts deployed to testnet (stream-manager: 736 lines, stream-factory: 218 lines)
- 66 passing tests across 13 test suites
- Full-stack Next.js frontend with wallet integration
- All core functions operational: create, claim, pause, resume, cancel, top-up

---

## Milestone 1: Security Hardening & Audit Readiness

**Timeline:** Weeks 1–3
**Disbursement Trigger:** Midpoint (Tranche 1 — 50% of grant, covering M1 + M2 costs)

### Objective

Ensure the smart contracts meet production security standards through comprehensive testing, independent review, and formal documentation of security properties.

### Deliverables

#### 1.1 Expanded Test Coverage (Week 1)

- [ ] Add property-based / fuzz tests for core streaming math
  - Verify: `streamed_amount + remaining == deposit` invariant holds for ALL inputs
  - Verify: `claimed <= streamed` invariant across all state transitions
  - Verify: pause/resume cycles never lose or create tokens
- [ ] Add integration tests simulating full lifecycle scenarios
  - Multi-stream concurrent scenarios (10+ streams, overlapping timelines)
  - Rapid pause/resume cycling edge cases
  - Top-up during various stream states
  - Boundary conditions: 1-block streams, maximum-duration streams
- [ ] Achieve **>95% branch coverage** on stream-manager.clar
- [ ] Document all tested invariants in a test coverage report

**Success Metric:** 100+ tests passing, coverage report published

#### 1.2 Security Review & Hardening (Week 2)

- [ ] Conduct self-audit using [Stacks Security Checklist](https://docs.stacks.co/clarity/security)
  - Verify all authorization checks (tx-sender validation on every public function)
  - Verify no integer overflow/underflow possible (Clarity's uint prevents underflow; verify overflow bounds)
  - Verify token conservation: total tokens in contract == sum of all stream remaining balances
  - Verify no front-running vulnerabilities on claim operations
- [ ] Engage community peer review (submit to Stacks developer Discord for review)
- [ ] Address all findings and document mitigations
- [ ] Add reentrancy guards documentation (note: Clarity prevents reentrancy by design, but document why)

**Success Metric:** Security review report with all findings addressed

#### 1.3 Contract Documentation & Specification (Week 3)

- [ ] Write formal contract specification document
  - Function signatures, preconditions, postconditions for every public function
  - State machine diagram for stream lifecycle (Active → Paused → Active → Cancelled/Depleted)
  - Math specification with precision analysis and rounding behavior
- [ ] Create deployment checklist for mainnet
  - Contract verification steps
  - Post-deployment validation tests
  - Emergency procedures (emergency-pause activation)
- [ ] Publish technical blog post explaining the streaming math and Clarity implementation patterns

**Success Metric:** Complete specification document, deployment checklist, published blog post

### Milestone 1 Verification

| Deliverable | Evidence |
|---|---|
| Expanded tests | Test run output showing 100+ tests, coverage report |
| Security review | Published security review document with findings & mitigations |
| Specification | Published specification document, state machine diagrams |
| Blog post | Published URL |

---

## Milestone 2: Mainnet Deployment & sBTC Integration

**Timeline:** Weeks 4–7
**Disbursement Trigger:** Completion (Tranche 2 — 50% of grant, covering M2 + M3 costs)

### Objective

Deploy StackStream to Stacks mainnet with sBTC token support and a production-grade frontend.

### Deliverables

#### 2.1 Mainnet Contract Deployment (Week 4)

- [ ] Update contract references for mainnet SIP-010 trait (`SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard`)
- [ ] Deploy `stream-manager` and `stream-factory` to Stacks mainnet
- [ ] Verify all contract functions via direct contract calls
- [ ] Set up contract monitoring (track stream creation events, TVL)
- [ ] Configure emergency-pause capability with secure admin key management

**Success Metric:** Contracts deployed and verified on mainnet explorer

#### 2.2 sBTC Token Integration (Weeks 5–6)

- [ ] Test stream creation with sBTC token contract on testnet
- [ ] Validate claiming, cancellation, and top-up flows with sBTC
- [ ] Update frontend token selector to include sBTC
- [ ] Add sBTC-specific display formatting (8 decimal places, BTC denomination)
- [ ] Create sBTC streaming tutorial / walkthrough

**Success Metric:** End-to-end sBTC stream lifecycle demonstrated on testnet, ready for mainnet sBTC launch

#### 2.3 Production Frontend (Weeks 6–7)

- [ ] Production build optimization (bundle analysis, code splitting)
- [ ] Error handling hardening
  - Graceful wallet disconnection handling
  - Transaction failure recovery flows
  - Network switching (testnet ↔ mainnet) support
- [ ] Mobile responsiveness audit and fixes
- [ ] Deploy to production hosting (Vercel)
- [ ] Set up domain and SSL
- [ ] Add analytics tracking (privacy-respecting, no PII)
- [ ] Implement transaction history persistence (local storage + on-chain)

**Success Metric:** Production frontend live on custom domain, mobile-responsive, handling edge cases gracefully

#### 2.4 Subgraph / Indexer Setup (Week 7)

- [ ] Set up Chainhook or event indexing for stream events
- [ ] Build API layer for historical stream queries
- [ ] Connect frontend to indexed data for faster load times
- [ ] Enable stream search and filtering by token, status, date range

**Success Metric:** Frontend loads stream data from indexed source, <2s page load time

### Milestone 2 Verification

| Deliverable | Evidence |
|---|---|
| Mainnet contracts | Contract addresses on Stacks Explorer |
| sBTC integration | Video demo of sBTC stream lifecycle |
| Production frontend | Live URL, Lighthouse performance score >80 |
| Indexer | API endpoint returning historical data |

---

## Milestone 3: DAO Tooling & Ecosystem Growth

**Timeline:** Weeks 8–10

### Objective

Build features that make StackStream practical for real DAO operations and begin ecosystem adoption.

### Deliverables

#### 3.1 Batch Stream Operations (Week 8)

- [ ] Multi-stream creation: create up to 10 streams in a single transaction flow
- [ ] CSV import for bulk payroll: upload a CSV with `[recipient, amount, duration, memo]` rows
- [ ] Batch claim for recipients with multiple incoming streams
- [ ] Gas estimation and confirmation UI for batch operations

**Success Metric:** Demonstrated batch creation of 10 streams from CSV

#### 3.2 Notification & Monitoring System (Week 9)

- [ ] Email/webhook notifications for key events:
  - Stream created (recipient notification)
  - Stream paused/resumed/cancelled
  - Stream approaching depletion (< 10% remaining)
  - Claim confirmation
- [ ] DAO dashboard with aggregate analytics
  - Monthly burn rate trending
  - Active contributor count over time
  - Token utilization by stream
- [ ] Export functionality (CSV export of stream history for accounting)

**Success Metric:** Working notification system, analytics dashboard with exportable data

#### 3.3 Documentation & Ecosystem Outreach (Week 10)

- [ ] Comprehensive developer documentation
  - Integration guide: how to create streams programmatically
  - API reference for all contract functions
  - Example scripts for common operations
- [ ] DAO onboarding guide with step-by-step setup instructions
- [ ] Submit to Stacks ecosystem directory / app listings
- [ ] Publish case study: "How a DAO Can Use StackStream for Contributor Compensation"
- [ ] Present at Stacks community call or Twitter Space
- [ ] Open-source all code with MIT license

**Success Metric:** Published documentation, ecosystem listing, community presentation completed

### Milestone 3 Verification

| Deliverable | Evidence |
|---|---|
| Batch operations | Video demo of CSV import → multi-stream creation |
| Notifications | Screenshot of notification delivery |
| Documentation | Published docs site or repository docs |
| Ecosystem listing | Listing URL |
| Community presentation | Recording or event link |

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| sBTC launch delayed beyond grant timeline | Medium | Medium | sBTC integration tested on testnet with mock token; mainnet activation happens when sBTC is live |
| Smart contract vulnerability discovered | Low | High | Emergency-pause circuit breaker; security review in M1; Clarity's safety guarantees reduce attack surface |
| Low initial DAO adoption | Medium | Low | Focus on developer documentation and integration guides; target 2-3 pilot DAOs for feedback |
| Stacks network congestion affecting UX | Low | Medium | Implement transaction queuing and retry logic; show clear pending states |

---

## Post-Grant Roadmap (Months 4–12)

After the grant period, StackStream will pursue:

1. **Token vesting contracts** — Cliff + linear vesting for team/investor tokens
2. **Recurring streams** — Auto-renewing payment streams
3. **Multi-token streaming** — Batch streams with different tokens
4. **Governance integration** — DAO proposal-triggered stream creation
5. **Seek follow-up funding** through Stacks Endowment Growth or Ecosystem track for scaling

---

## Summary

| Phase | What's Done | What Grant Enables |
|---|---|---|
| Pre-Grant (MVP) | 2 contracts, 66 tests, full frontend, testnet deployment | — |
| Milestone 1 (Weeks 1-3) | — | 100+ tests, security review, formal specification |
| Milestone 2 (Weeks 4-7) | — | Mainnet launch, sBTC support, production frontend |
| Milestone 3 (Weeks 8-10) | — | Batch ops, notifications, docs, ecosystem adoption |
