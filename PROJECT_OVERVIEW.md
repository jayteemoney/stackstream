# StackStream — Project Overview

**Bitcoin-Native Payroll Streaming Protocol for DAOs on Stacks**

---

## What StackStream Is

StackStream is a fully on-chain payment streaming protocol built in Clarity v3 on the Stacks blockchain. It enables any Stacks user or DAO to stream SIP-010 tokens continuously — block by block — from a sender to a recipient, instead of distributing funds in lump-sum payments.

Every Stacks block (~10 minutes), a proportional share of the deposited tokens becomes claimable by the recipient. The sender retains full management control: they can pause, resume, cancel, or top up a stream at any time. The recipient can claim accrued tokens at any time — partially or in full.

StackStream is the first payment streaming protocol on Stacks. It fills the same infrastructure role that Sablier (>$2B cumulative streamed) and Superfluid fill on Ethereum — but natively anchored to Bitcoin via Proof of Transfer.

---

## The Problem It Solves

DAOs and decentralized teams on Stacks currently have no native payroll infrastructure. Contributor compensation happens through:

- Manual batch transfers requiring multi-sig coordination every pay cycle
- Lump-sum payments that create cash flow uncertainty for both senders and recipients
- Off-chain tools that introduce trust assumptions contrary to on-chain governance

StackStream replaces all of this with a single, auditable, programmable streaming primitive that any DAO can use to pay contributors on-chain, continuously, with full transparency.

---

## Current Build Status

StackStream is a working product deployed to Stacks testnet. It is not a whitepaper or a proof of concept — it is a complete protocol stack with smart contracts, a full-stack frontend, a REST data service, and a test suite.

| Layer | Component | Status |
|---|---|---|
| Smart Contracts | `stream-manager.clar` | Deployed to testnet |
| Smart Contracts | `stream-factory.clar` | Deployed to testnet |
| Smart Contracts | `mock-sip010-token.clar` | Deployed to testnet |
| Smart Contracts | `sip-010-trait.clar` | Deployed to testnet |
| Frontend | Next.js 16 application | Live on Vercel |
| Data Service | OpenClaw REST API | Live on Railway |
| Tests | 66 passing tests | All passing |

**Mainnet deployer:** `SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79`
**Production frontend:** https://stackstream.xyz (primary, mainnet)
**Vercel fallback URL:** https://stackstream.vercel.app/
**Testnet deployer (historical):** `ST1D7YBYFW44KJE8VAAN2ACX23BCX3FDV5YQRX3RB`
**GitHub:** https://github.com/jayteemoney/stackstream

---

## Part 1: Smart Contracts

### Contract Architecture Overview

```
contracts/
├── traits/
│   └── sip-010-trait.clar          (30 lines)  — Fungible token standard interface
├── mocks/
│   └── mock-sip010-token.clar      (90 lines)  — Test token with public faucet
├── stream-manager.clar             (736 lines) — Core protocol: all streaming logic
└── stream-factory.clar             (218 lines) — DAO registry and analytics
                                    ----------
                                    1,074 lines total
```

All contracts are written in **Clarity v3**, epoch 3.0. The dependency chain is:

```
sip-010-trait  ←  mock-sip010-token
sip-010-trait  ←  stream-manager  ←  stream-factory
```

---

### Contract 1: `stream-manager.clar` — Core Protocol (736 lines)

This is the heart of StackStream. All streaming logic, token escrow, and state management lives here.

#### Stream Data Model

Each stream is stored as a map entry keyed by a uint stream ID:

```clarity
{
  sender:                principal,   ;; Address that created and funds the stream
  recipient:             principal,   ;; Address receiving the stream
  token:                 principal,   ;; SIP-010 token contract address
  deposit-amount:        uint,        ;; Total tokens deposited (cumulative, includes top-ups)
  withdrawn-amount:      uint,        ;; Tokens already claimed by recipient
  start-block:           uint,        ;; Stacks block where streaming begins
  end-block:             uint,        ;; Stacks block where stream is fully vested
  rate-per-block:        uint,        ;; Tokens per block scaled by 1e12 precision
  status:                uint,        ;; 0=Active 1=Paused 2=Cancelled 3=Depleted
  paused-at-block:       uint,        ;; Block at which last pause occurred (0 if not paused)
  total-paused-duration: uint,        ;; Cumulative blocks spent in paused state
  created-at-block:      uint,        ;; Block when stream was created
  memo:                  (optional (string-utf8 64))
}
```

#### Public Functions (8 total)

| Function | Caller | Description |
|---|---|---|
| `create-stream` | Sender | Deposits tokens and initializes a new stream |
| `claim` | Recipient | Claims a specified amount of accrued tokens |
| `claim-all` | Recipient | Claims the full current accrued balance |
| `pause-stream` | Sender | Halts accrual; records the block at which pause occurred |
| `resume-stream` | Sender | Restarts accrual; adds pause duration to cumulative tracker |
| `cancel-stream` | Sender | Permanently stops the stream; splits remaining balance between earned (recipient) and unearned (sender) |
| `top-up-stream` | Sender | Adds tokens to an active stream; extends duration at the same rate |
| `emergency-pause` | Admin | Activates a global circuit breaker that blocks new stream creation |

#### Read-Only Functions (12 total)

| Function | Returns |
|---|---|
| `get-stream` | Full stream data map entry |
| `get-stream-balance` | Claimable amount at current block |
| `get-streamed-amount` | Total accrued since start (regardless of claims) |
| `get-remaining-balance` | Tokens not yet streamed |
| `get-stream-progress` | Progress as a percentage (0–100) |
| `get-stream-count` | Total number of streams created |
| `is-emergency-paused` | Global pause state flag |
| `get-streams-by-sender` | List of stream IDs for a sender address |
| `get-streams-by-recipient` | List of stream IDs for a recipient address |
| `get-total-deposited` | Sum of all deposits across all streams |
| `get-total-withdrawn` | Sum of all claims across all streams |
| `get-rate-per-block` | Precision-scaled rate for a given stream |

#### Precision Math

All rate calculations use **1e12 fixed-point precision** to avoid rounding errors inherent to integer arithmetic in DeFi:

```
rate_per_block = deposit_amount × 1,000,000,000,000 ÷ duration_in_blocks

streamed_amount = effective_elapsed × rate_per_block ÷ 1,000,000,000,000

effective_elapsed = min(
  current_block − start_block − total_paused_duration,
  end_block − start_block
)
```

For a 1,000,000-token stream over 100,000 blocks the maximum rounding error is less than 1 micro-token (0.0001%). The invariant `streamed_amount + remaining == deposit` holds for all valid inputs.

#### Pause/Resume Temporal Accounting

Pause and resume cycles require careful tracking to prevent elapsed time from being double-counted or lost. The contract records `paused-at-block` at the moment of each pause and adds the duration `(current-block - paused-at-block)` to `total-paused-duration` on resume. This cumulative tracker is subtracted from all elapsed time calculations, ensuring the stream's effective duration is only the time it was actually active.

#### Top-Up Mechanics

When a sender tops up an active stream, the additional tokens extend the stream's duration at the existing rate rather than changing the rate:

```
additional_blocks = top_up_amount × PRECISION ÷ rate_per_block
new_end_block = current_end_block + additional_blocks
```

The recipient's claim history is fully preserved. The rate per block does not change.

#### Security Model

| Property | Implementation |
|---|---|
| Authorization | Every mutating function validates `tx-sender` against the authorized party (sender for management functions, recipient for claim functions) |
| Token conservation | On cancellation: `recipient_earned + sender_refund == deposit - already_withdrawn` — no tokens are created or destroyed |
| No reentrancy | Clarity prevents reentrancy by design — no callbacks or re-entry points exist in the execution model |
| Overflow protection | Clarity `uint` traps on underflow; multiplication overflow is bounded by the precision constants |
| Emergency circuit breaker | `emergency-pause` flag blocks `create-stream`; all existing streams continue operating |
| Post-conditions | Frontend enforces Stacks post-conditions on all token transfer transactions |

#### Error Code System

Errors are organized into numbered ranges for easy diagnosis:

| Range | Category | Example |
|---|---|---|
| u100–u102 | Authorization | `u101` ERR-NOT-SENDER, `u102` ERR-NOT-RECIPIENT |
| u200–u207 | Stream state | `u200` ERR-STREAM-NOT-FOUND, `u203` ERR-STREAM-PAUSED |
| u300–u305 | Validation | `u301` ERR-INVALID-DURATION, `u303` ERR-INVALID-RECIPIENT |
| u400–u401 | Token | `u401` ERR-TOKEN-MISMATCH |

#### Stream Lifecycle State Machine

```
                    create-stream
                         │
                         ▼
                    ┌──────────┐
           ┌──────►│  ACTIVE   │◄──────┐
           │       │   (0)     │       │
           │       └────┬──┬───┘       │
           │            │  │           │
     resume-stream      │  │      pause-stream
           │            │  │           │
           │            │  ▼           │
           │       ┌────┴──────┐       │
           └───────│  PAUSED   ├───────┘
                   │   (1)     │
                   └─────┬─────┘
                         │
               cancel-stream (from Active or Paused)
                         │
                         ▼
                   ┌───────────┐          ┌────────────┐
                   │ CANCELLED │          │  DEPLETED  │
                   │   (2)     │          │    (3)     │
                   └───────────┘          └────────────┘
                                               ▲
                                    all tokens claimed
                                    (from Active state)
```

---

### Contract 2: `stream-factory.clar` — DAO Registry (218 lines)

The factory is a separate contract that provides DAO identity, stream tracking, and aggregate analytics. It does **not** create streams on behalf of DAOs — this is an intentional architectural decision.

**Why the factory does not proxy stream creation:**
Clarity's `tx-sender` security model means that when Contract A calls Contract B, `contract-caller` changes but `tx-sender` remains the original user. If the factory called `create-stream`, token transfers would be authorized against the factory's principal, not the DAO's wallet. The solution is to separate concerns: users create streams directly through `stream-manager`, then optionally register and link them to their DAO through the factory.

#### Public Functions

| Function | Description |
|---|---|
| `register-dao` | Registers a new DAO with a unique name, linked to the caller's principal |
| `update-dao-name` | Allows a DAO admin to rename their registered DAO |
| `deactivate-dao` | Marks a DAO as inactive (non-destructive — data is preserved) |
| `track-stream` | Links an existing stream ID to the caller's registered DAO |

#### Read-Only Functions

| Function | Description |
|---|---|
| `get-dao` | Returns full DAO record for a given admin address |
| `get-dao-by-name` | Looks up a DAO by its registered name |
| `is-registered-dao` | Boolean check for whether an address has a registered DAO |
| `is-stream-tracked` | Boolean check for whether a stream is tracked by the calling DAO |

#### DAO Analytics

Each DAO entry accumulates:
- `total-streams`: count of tracked streams
- `total-deposited`: sum of all deposit amounts across tracked streams

These are updated automatically when `track-stream` is called.

---

### Contract 3: `mock-sip010-token.clar` — Test Token (90 lines)

A full SIP-010 compliant fungible token for testnet development and testing. Includes:
- Standard SIP-010 interface: `transfer`, `get-balance`, `get-total-supply`, `get-name`, `get-symbol`, `get-decimals`, `get-token-uri`
- Public `faucet` function: mints 1,000 tokens to the caller — allows any testnet user to get tokens for testing without needing an airdrop

Token symbol: **msBTC** (mock sBTC). Decimals: 8 (matching real sBTC denomination).

---

### Contract 4: `sip-010-trait.clar` — Fungible Token Interface (30 lines)

A local copy of the SIP-010 fungible token trait used to type-check token contract parameters at compile time in the Clarinet simnet environment. On mainnet, the production trait at `SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard` is used instead.

---

## Part 2: Test Suite

### Overview

```
Test runner:    Vitest v3.2.4
Environment:    vitest-environment-clarinet (Clarinet SDK v3.6.0 simnet)
Total tests:    66 passing, 0 failing
Test files:     2 (stream-manager.test.ts, stream-factory.test.ts)
Run time:       ~8 seconds
```

All tests run on Clarinet's in-process simnet — no testnet network calls, no wallet prompts, deterministic block progression.

### Test Coverage by File

#### `tests/stream-manager.test.ts` — 45 Tests

| Suite | Tests | What Is Verified |
|---|---|---|
| `create-stream` | 7 | Successful creation, invalid amounts, invalid durations, self-stream rejection, token escrow |
| `claim` | 7 | Partial claim, full claim, over-claim rejection, claim from paused stream rejection, zero-claim rejection |
| `pause-stream` | 4 | Successful pause, double-pause rejection, unauthorized pause, pause of non-existent stream |
| `resume-stream` | 3 | Successful resume, resume of non-paused stream rejection, unauthorized resume |
| `cancel-stream` | 5 | Cancellation with partial claims, full refund to sender, recipient gets accrued, unauthorized cancel, cancel already-cancelled |
| `read-only functions` | 4 | `get-stream`, `get-stream-balance`, `get-streamed-amount`, `get-remaining-balance` |
| `edge cases` | 3 | 1-block duration stream, claim at exact end block, zero-balance stream |
| `top-up-stream` | 7 | Successful top-up, rate preservation, end block extension, top-up after partial claim, unauthorized top-up, top-up cancelled stream rejection |
| `admin functions` | 3 | `emergency-pause` activation, block on new streams, existing streams unaffected |

#### `tests/stream-factory.test.ts` — 21 Tests

| Suite | Tests | What Is Verified |
|---|---|---|
| `register-dao` | 5 | Successful registration, duplicate registration rejection, empty name rejection, name too long rejection, name stored correctly |
| `update-dao-name` | 2 | Successful rename, unauthorized rename rejection |
| `deactivate-dao` | 2 | Successful deactivation, unauthorized deactivation rejection |
| `track-stream` | 7 | Successful tracking, analytics increment, track non-existent stream rejection, already-tracked rejection, track stream from unregistered DAO, track multiple streams |
| `read-only functions` | 4 | `is-registered-dao` true/false, `get-dao-by-name` match/no-match |

---

## Part 3: Frontend Application

### Technology Stack

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.1.6 | App Router, React Server Components, Turbopack |
| React | 19.2.3 | UI framework |
| TypeScript | ^5 | Type safety throughout |
| Tailwind CSS | v4 | Utility-first styling |
| Zustand | ^5.0.0 | Wallet connection and app-level state |
| TanStack Query | v5.60.0 | Server state, caching, 15-second polling |
| Framer Motion | ^12.0.0 | Real-time balance animation |
| @stacks/connect | ^7.0.0 | Wallet integration (Leather + Xverse) |
| @stacks/transactions | ^7.2.0 | Read-only contract calls via Hiro API |
| @stacks/network | ^7.0.0 | Network configuration (testnet/mainnet) |
| sonner | ^2.0.0 | Toast notifications |
| date-fns | ^4.1.0 | Block-to-date conversion and display |
| lucide-react | ^0.469.0 | Icon system |
| geist | ^1.7.0 | Font (Vercel's Geist Sans + Mono) |

### Page Structure (10 Pages)

```
/                           Landing page
                            — Hero section, feature highlights, CTA to launch app

/dashboard                  Sender dashboard home
                            — Stats: active streams, total deposited, total claimed, recipients
                            — Recent streams list with quick action buttons

/dashboard/create           Stream creation
                            — Form: recipient address, amount, duration, memo
                            — Live preview: rate per block, start/end block, token

/dashboard/streams          All sender streams
                            — Filter tabs: All | Active | Paused | Cancelled | Depleted
                            — Per-stream cards with pause / resume / cancel / top-up actions

/dashboard/analytics        Analytics dashboard
                            — TVL, burn rate, active stream count, utilization rate
                            — Stream breakdown table with per-stream progress bars

/dashboard/register         DAO registration
                            — Register a DAO name linked to your wallet address

/earn                       Recipient overview
                            — Total claimable balance (real-time animated counter)
                            — Claim All button (sweeps all streams in one transaction)
                            — Stats: total earned, total claimed, active streams

/earn/streams               All recipient streams
                            — Per-stream cards with individual Claim buttons
                            — Real-time claimable amounts updating between polls

/earn/history               Claim history
                            — Table: stream ID, sender, deposited amount, claimed amount,
                              status, block range
```

### State Architecture

**Zustand stores (client-side state):**

| Store | File | Manages |
|---|---|---|
| Wallet store | `stores/wallet-store.ts` | Connected address, wallet type, connection status |
| App store | `stores/app-store.ts` | UI state: active filters, selected streams, modal state |

**TanStack Query (server state):**

All on-chain data is fetched via `fetchCallReadOnlyFunction` from the Hiro API, cached and polled through TanStack Query with a 15-second interval. Cache invalidation is triggered immediately on transaction confirmation.

**Custom hooks:**

| Hook | File | Purpose |
|---|---|---|
| `useStreams` | `hooks/use-streams.ts` | Fetches and normalizes sender/recipient stream lists |
| `useStacksTx` | `hooks/use-stacks-tx.ts` | Wraps `openContractCall`, handles pending/confirmed state, invalidates cache on success |
| `useBlockHeight` | `hooks/use-block-height.ts` | Polls current Stacks block height (used for stream progress calculation) |
| `useTokenBalance` | `hooks/use-token-balance.ts` | Fetches SIP-010 token balance for connected wallet |

### Real-Time Balance Animation

The `earn` page shows a live-updating token counter that animates smoothly between on-chain data snapshots. Implementation:

1. On each 15-second poll, the latest claimable balance is stored as a snapshot
2. The `rate-per-second` is derived from the on-chain `rate-per-block` divided by the Stacks block time (~120 seconds)
3. A `requestAnimationFrame` loop interpolates the displayed balance forward from the last snapshot using the derived rate
4. This creates the appearance of real-time token accrual while the actual on-chain data updates every 15 seconds

### Transaction Flow

```
User clicks action button
        │
        ▼
useStacksTx hook constructs ContractCallOptions
        │
        ▼
openContractCall (@stacks/connect) → Wallet popup
        │
        ▼
User signs and broadcasts
        │
        ▼
Hook polls Hiro API every 2 seconds for tx confirmation
        │
        ▼
On success: TanStack Query cache invalidated → UI re-fetches → displays updated state
        │
        ▼
Toast notification (sonner) confirms success or surfaces error
```

### Post-Condition Enforcement

All token transfer transactions include Stacks post-conditions set at the frontend layer:

- **Create stream:** Post-condition asserts sender sends exactly `deposit_amount` tokens — prevents any overpayment
- **Cancel stream:** Post-conditions assert both refund amounts (recipient earned + sender unearned) — prevents any mismatch

---

## Part 4: OpenClaw Data Service

OpenClaw is a custom-built REST API that acts as the backend data layer for StackStream. It provides structured on-chain query endpoints, transaction parameter builders, and powers the in-app AI assistant widget.

### Technology Stack

| Technology | Role |
|---|---|
| Express.js | HTTP server |
| TypeScript | Type safety |
| @stacks/transactions | Blockchain read-only calls |
| Zod | Request validation and schema enforcement |
| Hiro API | Upstream Stacks blockchain data source |

**Hosting:** Railway (production), `localhost:3001` (development)

### API Endpoint Reference

#### Streams (`/api/streams`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/streams/:id` | Full stream data by ID including status, progress, claimable balance |
| GET | `/api/streams/sender/:address` | All stream IDs where address is sender |
| GET | `/api/streams/recipient/:address` | All stream IDs where address is recipient |

#### DAOs (`/api/daos`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/daos/:admin` | DAO record for a given admin address |
| GET | `/api/daos/count` | Total number of registered DAOs |

#### Blockchain (`/api/blocks`, `/api/tokens`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/blocks/current` | Current Stacks block height |
| GET | `/api/tokens/:contract/balance/:address` | SIP-010 token balance for an address |

#### Transactions (`/api/tx`) — POST endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tx/create-stream` | Builds serialized transaction parameters for stream creation |
| POST | `/api/tx/claim` | Builds claim transaction parameters |
| POST | `/api/tx/pause` | Builds pause transaction parameters |
| POST | `/api/tx/resume` | Builds resume transaction parameters |
| POST | `/api/tx/cancel` | Builds cancel transaction parameters |
| POST | `/api/tx/top-up` | Builds top-up transaction parameters |

Transaction endpoints do **not** broadcast — they build the transaction parameter object that the frontend passes to `openContractCall` for the user to sign in their wallet.

### In-App AI Assistant (OpenClaw Widget)

The frontend includes an embedded chat widget backed by the OpenClaw service. It allows users to query stream data, check balances, and understand the protocol through natural language:

```
"Show me stream #5"
→ Returns: status, progress, claimable amount, sender, recipient, token

"What streams am I receiving at ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM?"
→ Returns: list of stream IDs with status summary

"Create a stream of 1 msBTC to ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG over 30 days"
→ Returns: built transaction parameters (user signs with their wallet)
```

---

## Part 5: Deployment Architecture

### Current (Testnet)

```
┌──────────────────────────────────────────────────────┐
│                    User Browser                       │
└───────────────────────┬──────────────────────────────┘
                        │ HTTPS
                        ▼
┌──────────────────────────────────────────────────────┐
│         Vercel CDN (Next.js 16 frontend)              │
│         https://stackstream.vercel.app/               │
└───────┬───────────────────────────────┬──────────────┘
        │ fetchCallReadOnlyFn           │ OpenClaw API calls
        │ (Hiro API)                    ▼
        │               ┌──────────────────────────────┐
        │               │  Railway (OpenClaw Express)   │
        │               │  express.js REST API          │
        │               └──────────────┬───────────────┘
        │                              │ Hiro API/
        ▼                              ▼
┌──────────────────────────────────────────────────────┐
│                 Stacks Testnet                        │
│  stream-manager   ST1D7YBYFW44KJE8VAAN2ACX23BCX3FDV5YQRX3RB.stream-manager   │
│  stream-factory   ST1D7YBYFW44KJE8VAAN2ACX23BCX3FDV5YQRX3RB.stream-factory   │
└──────────────────────────────────────────────────────┘
```

### Planned (Mainnet — Milestone 2)

The architecture is identical — only the contract addresses and network configuration change. No infrastructure rebuild is required. Mainnet deployment involves:

1. Updating environment variables in Vercel: swap testnet contract addresses for mainnet addresses
2. Updating `StacksTestnet` → `StacksMainnet` in `@stacks/network` config
3. Running `clarinet deployments apply --mainnet` to deploy contracts
4. Optionally adding Chainhook for event-based stream indexing

---

## Part 6: Token Compatibility

StackStream accepts any SIP-010 compliant token as a parameter. The token principal is stored per-stream and validated on every claim and management operation.

| Token | Status | Notes |
|---|---|---|
| msBTC (mock sBTC) | Working on testnet | Test token with public faucet |
| sBTC | Ready (pending mainnet launch) | SIP-010 compatible by design |
| STX (wrapped) | Compatible | Requires a SIP-010 wrapper contract |
| Any SIP-010 token | Compatible | No contract changes needed |

---

## Part 7: Repository Structure

```
stackstream/
├── contracts/
│   ├── traits/
│   │   └── sip-010-trait.clar
│   ├── mocks/
│   │   └── mock-sip010-token.clar
│   ├── stream-manager.clar
│   └── stream-factory.clar
│
├── tests/
│   ├── stream-manager.test.ts      (45 tests)
│   └── stream-factory.test.ts      (21 tests)
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx            (landing)
│       │   ├── layout.tsx
│       │   ├── dashboard/
│       │   │   ├── page.tsx        (sender home)
│       │   │   ├── create/
│       │   │   ├── streams/
│       │   │   ├── analytics/
│       │   │   └── register/
│       │   └── earn/
│       │       ├── page.tsx        (recipient home)
│       │       ├── streams/
│       │       └── history/
│       ├── components/
│       │   ├── landing/
│       │   ├── layout/
│       │   ├── openclaw/           (AI assistant widget)
│       │   ├── stream/             (stream cards, forms, actions)
│       │   ├── ui/                 (design system components)
│       │   └── wallet/             (connect button, address display)
│       ├── hooks/
│       │   ├── use-block-height.ts
│       │   ├── use-stacks-tx.ts
│       │   ├── use-streams.ts
│       │   └── use-token-balance.ts
│       ├── stores/
│       │   ├── wallet-store.ts
│       │   └── app-store.ts
│       ├── lib/                    (contract interaction helpers, type parsing)
│       └── providers/              (TanStack Query provider, theme provider)
│
├── openclaw-service/
│   └── src/
│       ├── routes/
│       │   ├── streams.ts
│       │   ├── daos.ts
│       │   ├── blocks.ts
│       │   ├── tokens.ts
│       │   └── transactions.ts
│       ├── stacks-client.ts        (Hiro API wrapper)
│       ├── middleware/
│       ├── skill/                  (OpenClaw AI skill definition)
│       └── index.ts
│
├── grant-application/
│   ├── APPLICATION_NARRATIVE.md
│   ├── MILESTONE_PLAN.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── BUDGET_PROPOSAL.md
│   ├── ECOSYSTEM_IMPACT.md
│   ├── TEAM_AND_EXECUTION.md
│   └── USER_GUIDE.md
│
├── Clarinet.toml                   (contract definitions and dependencies)
├── vitest.config.js
├── package.json                    (test runner config)
└── PROJECT_OVERVIEW.md             (this document)
```

---

## Part 8: Non-Trivial Technical Problems Solved

These are the hard problems encountered and resolved during the build — evidence of the depth of Stacks expertise required:

### 1. Precision Math Without Floating Point

Clarity has no floating-point types. Streaming requires computing a rate in tokens per block that may not divide evenly. The solution is a 1e12 fixed-point system: multiply all token amounts by 10^12 before division, carry that scaling factor through all calculations, and divide at the final output step. This preserves sub-token precision across millions of blocks while keeping all values within Clarity's `uint` bounds.

### 2. tx-sender vs contract-caller in Cross-Contract Calls

An early design had `stream-factory` creating streams on behalf of DAOs by calling `stream-manager.create-stream`. This silently failed because Clarity's `tx-sender` does not change across contract calls — it always reflects the original wallet that signed the transaction. The factory's principal was being used for token authorization, causing all token transfers to fail with authorization errors. The solution was to redesign the factory as a pure registry: DAOs call `stream-manager` directly, then register the resulting stream in `stream-factory`. This respects Clarity's security model while preserving the desired analytics structure.

### 3. Pause/Resume Gap Accounting

When a stream is paused and resumed multiple times, elapsed time must exclude all paused periods. A naive implementation that only tracks the last pause would accumulate drift over multiple cycles. The solution tracks a `total-paused-duration` counter that increments by `(current-block - paused-at-block)` on every resume. All elapsed time calculations subtract this cumulative value. This correctly accounts for arbitrary pause/resume sequences with no drift.

### 4. Top-Up Without Rate Change

A top-up must extend the stream's duration without changing the per-block rate, because changing the rate mid-stream would violate the recipient's expectations about their earning schedule. The math derives `additional_blocks` from the top-up amount and the existing rate, then extends `end-block` by exactly that many blocks. The `deposit-amount` is updated for accounting, but `rate-per-block` remains unchanged.

### 5. Real-Time UI from 15-Second On-Chain Data

On-chain data updates every Stacks block (~10 minutes in production, polled every 15 seconds in the app). Showing a static claimable balance that jumps every 15 seconds is a poor UX for a product whose core value proposition is continuous payment. The solution is a `requestAnimationFrame` interpolation loop that derives a `rate-per-second` from the on-chain rate and uses it to increment the displayed balance every frame between polling cycles, creating the appearance of real-time accrual.

---

## Part 9: What the Grant Funds

StackStream was built entirely without external funding. The grant from Stacks Endowment ($8,000) funds the path from this working testnet MVP to a production mainnet protocol with real users:

| Milestone | What It Funds | Amount |
|---|---|---|
| M1: Production Hardening | Fuzz testing, community security review, mainnet release candidate | $1,600 |
| M2: Mainnet Launch | Contract deployment, production frontend, 5 live end-to-end streams | $2,400 |
| M3: Real Usage | 3 DAOs onboarded OR 25 streams + $10K streamed on mainnet | $4,000 |

See `grant-application/MILESTONE_PLAN.md` for the full execution plan.

---

*StackStream is open-source (MIT license). All contracts, frontend code, and the OpenClaw service are available at https://github.com/jayteemoney/stackstream*
