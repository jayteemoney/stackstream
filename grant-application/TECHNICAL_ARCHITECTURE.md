# StackStream — Technical Architecture

---

## System Overview

StackStream is a three-layer protocol: on-chain smart contracts (Clarity v3), a Next.js frontend, and a data service layer.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Dashboard │  │   Earn   │  │ Analytics│  │Landing │  │
│  │ (Sender) │  │(Recipient│  │          │  │        │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┘  │
│       │              │              │                     │
│  ┌────┴──────────────┴──────────────┴──────────────────┐ │
│  │              Hooks & State Layer                     │ │
│  │  useStacksTx | useStreams | useBlockHeight           │ │
│  │  Zustand (wallet) | TanStack Query (data)           │ │
│  └────┬─────────────────────────────────────┬──────────┘ │
└───────┼─────────────────────────────────────┼────────────┘
        │                                     │
        │ @stacks/connect                     │ fetchCallReadOnlyFn
        │ (wallet tx signing)                 │ (Hiro API reads)
        ▼                                     ▼
┌───────────────────────────────────────────────────────────┐
│                   Stacks Blockchain                       │
│  ┌────────────────────┐    ┌────────────────────────────┐ │
│  │  stream-manager    │    │    stream-factory           │ │
│  │  (736 lines)       │    │    (218 lines)              │ │
│  │                    │    │                              │ │
│  │  - create-stream   │◄───│  - track-stream             │ │
│  │  - claim / claim-all│   │  - register-dao             │ │
│  │  - pause / resume  │    │  - dao analytics            │ │
│  │  - cancel          │    └────────────────────────────┘ │
│  │  - top-up          │                                   │
│  │  - emergency-pause │    ┌────────────────────────────┐ │
│  └────────┬───────────┘    │    SIP-010 Tokens           │ │
│           │                │    (msBTC / sBTC / any)     │ │
│           └────────────────┤                              │ │
│              token escrow  └────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

## Smart Contract Architecture

### stream-manager.clar — Core Protocol

The central contract handling all streaming logic. Tokens are escrowed in the contract on stream creation and released to recipients as they claim.

#### Stream Data Model

```clarity
{
  sender: principal,
  recipient: principal,
  token: principal,
  deposit-amount: uint,        ;; Total tokens deposited (including top-ups)
  withdrawn-amount: uint,      ;; Tokens already claimed by recipient
  start-block: uint,           ;; Block when streaming begins
  end-block: uint,             ;; Block when stream is fully vested
  rate-per-block: uint,        ;; Tokens per block (scaled by 1e12 PRECISION)
  status: uint,                ;; 0=Active, 1=Paused, 2=Cancelled, 3=Depleted
  paused-at-block: uint,       ;; Block when last paused (0 if not paused)
  total-paused-duration: uint, ;; Cumulative blocks spent paused
  created-at-block: uint,      ;; Block when stream was created
  memo: (optional (string-utf8 64))
}
```

#### Stream Lifecycle State Machine

```
                    create-stream
                         │
                         ▼
                    ┌──────────┐
           ┌──────►│  ACTIVE   │◄──────┐
           │       │  (0)      │       │
           │       └────┬──┬───┘       │
           │            │  │           │
     resume-stream      │  │      pause-stream
           │            │  │           │
           │            │  ▼           │
           │       ┌────┴──────┐       │
           └───────│  PAUSED   ├───────┘
                   │  (1)      │
                   └───────────┘

        cancel-stream        all tokens claimed
        (from Active          (from Active)
         or Paused)                │
              │                    ▼
              ▼              ┌───────────┐
        ┌───────────┐       │ DEPLETED   │
        │ CANCELLED  │       │ (3)        │
        │ (2)        │       └───────────┘
        └───────────┘
```

#### Precision Math

All rate calculations use 1e12 fixed-point precision to avoid rounding errors:

```
rate_per_block = deposit_amount * 1,000,000,000,000 / duration_in_blocks

streamed_amount = effective_elapsed * rate_per_block / 1,000,000,000,000

effective_elapsed = min(
  current_block - start_block - total_paused_duration,
  end_block - start_block
)
```

This ensures accuracy to 12 decimal places. For a 1,000,000 token stream over 100,000 blocks, the maximum rounding error is < 1 token (0.0001%).

#### Security Model

| Property | Implementation |
|---|---|
| **Authorization** | Every mutating function validates `tx-sender` matches the authorized party (sender for management, recipient for claims) |
| **Token conservation** | On cancel: recipient gets earned amount, sender gets refund. `earned + refund == deposit - withdrawn` |
| **No reentrancy** | Clarity prevents reentrancy by design — no callbacks during execution |
| **Overflow protection** | Clarity's `uint` operations trap on underflow; multiplication overflow checked via precision bounds |
| **Emergency stop** | `emergency-paused` flag blocks new stream creation; existing streams unaffected |
| **Post-conditions** | Frontend enforces post-conditions on all token transfers |

### stream-factory.clar — DAO Registry

Separate contract for DAO identity and analytics. Architectural decision: factory does NOT create streams on behalf of DAOs due to Clarity's `tx-sender` security model (cross-contract calls change `contract-caller` but not `tx-sender`, so token transfers would fail).

Instead, the factory provides:
- DAO registration with unique name system
- Stream-to-DAO tracking (link existing streams to a DAO)
- Aggregate analytics (total streams, total deposited per DAO)

---

## Frontend Architecture

### Stack

| Technology | Purpose |
|---|---|
| Next.js 16.1.6 | App Router, RSC, Turbopack |
| React 19 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| Zustand | Wallet connection state |
| TanStack Query v5 | Server state with 15s polling |
| Framer Motion | Real-time balance animation |
| @stacks/connect | Wallet integration (Leather, Xverse) |
| @stacks/transactions | Read-only contract calls via Hiro API |

### Page Structure

```
/                          Landing page (hero, features, CTA)
/dashboard                 Sender dashboard (stats + recent streams)
/dashboard/create          Stream creation form with live preview
/dashboard/streams         All sender streams with filters & actions
/dashboard/analytics       TVL, burn rate, utilization metrics
/dashboard/register        DAO registration
/earn                      Recipient overview (claimable balance, claim-all)
/earn/streams              All recipient streams with per-stream claims
/earn/history              Claim history table
```

### Key Technical Patterns

**Real-time Balance Animation:**
The `realtime-balance` component uses `requestAnimationFrame` to interpolate between on-chain balance snapshots. It calculates a `rate-per-second` from the on-chain `rate-per-block` and Stacks block time (~120s), providing a smooth counting animation that approximates real-time accrual between polling intervals.

**Transaction Flow:**
```
User Action → useStacksTx hook → openContractCall (@stacks/connect)
    → Wallet popup → User signs → TX broadcast
    → Poll Hiro API for confirmation (2s intervals)
    → On success: invalidate TanStack Query caches → UI updates
```

**Data Fetching:**
All on-chain reads use `fetchCallReadOnlyFunction` through the Hiro API with TanStack Query managing cache, polling (15s), and deduplication. This avoids running a full node while maintaining near-real-time data.

---

## Contract Interaction Map

| Frontend Action | Contract | Function | Key Parameters |
|---|---|---|---|
| Create Stream | stream-manager | `create-stream` | recipient, token, amount, duration, start-block, memo |
| Claim Tokens | stream-manager | `claim` | stream-id, amount, token |
| Claim All | stream-manager | `claim` | stream-id, uint-max, token |
| Pause Stream | stream-manager | `pause-stream` | stream-id |
| Resume Stream | stream-manager | `resume-stream` | stream-id |
| Cancel Stream | stream-manager | `cancel-stream` | stream-id, token |
| Top Up Stream | stream-manager | `top-up-stream` | stream-id, amount, token |
| Register DAO | stream-factory | `register-dao` | name |
| Track Stream | stream-factory | `track-stream` | stream-id |
| Mint Test Tokens | mock-sip010-token | `faucet` | — |

---

## Deployment Architecture

### Testnet (Current)

- **Contracts:** Deployed via Clarinet to Stacks testnet
- **Frontend:** Local development server (Next.js dev mode)
- **Data Service:** OpenClaw REST API on localhost:3001
- **Deployer:** `ST1D7YBYFW44KJE8VAAN2ACX23BCX3FDV5YQRX3RB`

### Mainnet (Planned)

- **Contracts:** Deploy via Clarinet with mainnet plan
- **Frontend:** Vercel (production build, CDN-distributed)
- **Data:** Hiro API + Chainhook event indexer
- **Monitoring:** Contract event tracking, TVL dashboard

---

## Token Compatibility

StackStream works with any SIP-010 compliant token. The contract accepts a token principal as a parameter, enabling:

| Token | Status |
|---|---|
| msBTC (mock) | Testnet — working |
| sBTC | Planned — pending sBTC mainnet launch |
| STX (wrapped) | Compatible — requires wrapped SIP-010 version |
| Any SIP-010 | Compatible — no code changes needed |

---

## Test Infrastructure

```
Clarinet SDK v3.6.0
    │
    ├── vitest-environment-clarinet (simnet provider)
    │
    ├── stream-manager.test.ts (45 tests)
    │   ├── create-stream (7 tests)
    │   ├── claim (7 tests)
    │   ├── pause-stream (4 tests)
    │   ├── resume-stream (3 tests)
    │   ├── cancel-stream (5 tests)
    │   ├── read-only functions (4 tests)
    │   ├── edge cases (3 tests)
    │   ├── top-up-stream (7 tests)
    │   └── admin functions (3 tests)
    │
    └── stream-factory.test.ts (21 tests)
        ├── register-dao (5 tests)
        ├── update-dao-name (2 tests)
        ├── deactivate-dao (2 tests)
        ├── track-stream (7 tests)
        └── read-only functions (4 tests)
```

All tests run on Clarinet's simnet, using `simnet.callPublicFn` for state-changing operations and `simnet.callReadOnlyFn` for reads. Tests validate both success paths and error conditions (authorization failures, invalid states, edge cases).
