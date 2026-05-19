# StackStream — Full Implementation Plan
## Milestone 1 → Milestone 2 → Milestone 3

---

## CURRENT CODEBASE STATE

| Component | Status | Location |
|---|---|---|
| stream-manager.clar | Deployed on testnet | `contracts/stream-manager.clar` |
| stream-factory.clar | Deployed on testnet | `contracts/stream-factory.clar` |
| mock-sip010-token.clar | Deployed on testnet | `contracts/mocks/mock-sip010-token.clar` |
| sip-010-trait.clar | Deployed on testnet | `contracts/traits/sip-010-trait.clar` |
| Frontend (Next.js 16) | Live on Vercel (testnet) | `frontend/` |
| OpenClaw Service (Express) | Live on Railway | `openclaw-service/` |
| Test suite | 66 tests passing | `tests/` |

**Deployer address (testnet):** `ST1D7YBYFW44KJE8VAAN2ACX23BCX3FDV5YQRX3RB`
**Frontend:** https://stackstream.vercel.app/
**GitHub:** https://github.com/jayteemoney/stackstream

---

## MILESTONE 1 — PRODUCTION HARDENING
**Budget:** $1,600 | **Submit:** April 24, 2026 | **Approval:** ~May 1, 2026

### Acceptance Criteria (what the grant team will check)
- [ ] Test suite has 100+ passing tests including property-based/fuzz tests
- [ ] `SECURITY_REVIEW.md` published in the repo, covering all public functions
- [ ] Evidence of community review (GitHub issue + Discord/Forum posts with responses)
- [ ] GitHub release tag `v1.0.0-rc1` created
- [ ] Mainnet deployment checklist documented

---

### DELIVERABLE 1.1 — Expanded Test Suite (66 → 100+ tests)

**File:** `tests/stream-manager.test.ts` and `tests/stream-factory.test.ts`
**Target:** Minimum 104 tests total

#### New Tests to Write

**Block A — Property-based / fuzz tests for stream-manager (20 new tests)**

These tests use randomized inputs to verify invariants hold for all cases, not just hand-picked values.

```
Invariant 1: Token Conservation
  - For 50 random (deposit, duration) pairs: streamed + remaining == deposit at every block
  - Test at block 0, 25%, 50%, 75%, 100% of stream duration
  - Must hold after partial claims too

Invariant 2: Claim Bounds
  - For 20 random streams: claimed_amount <= streamed_at_time_of_claim
  - Claim-all never produces more than claimable balance

Invariant 3: Pause Gap Accounting — single cycle
  - Pause at random block P, resume at random block R
  - Effective elapsed = actual elapsed - (R - P)
  - Verify balance at resume == balance at pause (nothing accrued during pause)

Invariant 4: Pause Gap Accounting — multi-cycle (5 random pause/resume cycles)
  - Cumulative paused duration tracks correctly across N cycles
  - No drift: total_paused_blocks = sum of each (resume - pause)
  - Streamed amount at any point = rate * (elapsed - total_paused)

Invariant 5: Top-up Rate Preservation
  - For 20 random (original_deposit, top_up_amount) pairs:
    rate_per_block unchanged after top-up
    new_end_block = old_end_block + (top_up * PRECISION / rate)
    new_deposit = old_deposit + top_up
```

**Block B — Edge case tests for stream-manager (10 new tests)**

```
- 1-block stream: create, advance 1 block, claim-all — verify full deposit claimable
- Stream where deposit doesn't divide evenly by duration — verify no token loss
- Claim exactly at end-block — should return full remaining, not overflow
- Top-up on a stream where all tokens are already claimable (near-depleted)
- Cancel at block 0 (before start-block) — sender gets full refund, recipient gets 0
- Cancel at exactly end-block — recipient gets full deposit
- Pause then immediately resume (0-block pause) — total-paused-duration += 0
- Create stream, claim partial, top-up, claim again — correct accounting
- Emergency pause blocks create-stream but not claim or cancel
- Resume on non-existent stream — correct error code
```

**Block C — Additional stream-factory tests (8 new tests)**

```
- Register DAO with max-length name (64 chars) — should succeed
- Register DAO with 65-char name — should fail
- track-stream updates total-deposited correctly for multiple streams
- track-stream with already-tracked stream ID — should fail
- deactivate-dao prevents nothing (data preserved, no blocking logic)
- update-dao-name to an existing name — should it fail? (verify behavior)
- get-dao-by-name for unregistered name returns none
- is-stream-tracked returns false for stream registered by different DAO
```

#### Implementation Steps

**Step 1 — Set up property test helpers**

Add a `generateRandomStream` helper function at the top of `stream-manager.test.ts`:

```typescript
function generateRandomStream(min = 100n, max = 1_000_000_000n) {
  const deposit = BigInt(Math.floor(Math.random() * Number(max - min))) + min;
  const duration = BigInt(Math.floor(Math.random() * 10000) + 1);
  return { deposit, duration };
}
```

Use `simnet.mineEmptyBlocks(n)` to advance blocks in fuzz tests.

**Step 2 — Write Block A invariant tests**

Each invariant test runs in a loop of 50 iterations minimum.

**Step 3 — Write Block B edge case tests**

These are deterministic — no randomness needed.

**Step 4 — Write Block C factory tests**

Extend `stream-factory.test.ts`.

**Step 5 — Run full suite and confirm 100+ passing**

```bash
cd /home/jt/stackstream
npm test
```

---

### DELIVERABLE 1.2 — Security Review

**File:** `SECURITY_REVIEW.md` (in repo root)

#### Self-Audit Checklist — All 8 Public Functions

Go through each function in `stream-manager.clar` against these properties:

| Property | Question to Answer |
|---|---|
| Authorization | Can anyone other than the authorized party call this? |
| Token conservation | Are all tokens accounted for on every exit path? |
| State validity | Can this function be called in an invalid state? |
| Integer safety | Is any multiplication or subtraction at risk of overflow/underflow? |
| Front-running | Does call order matter in a way that can be exploited? |
| Reentrancy | Is there any callback or re-entry point? |
| Post-condition alignment | Does what actually happens match what the user signed? |

**Functions to review:**
1. `create-stream` — authorization, token transfer, start-block validation
2. `claim` — authorization, claim amount bounds, token mismatch
3. `claim-all` — same as claim, verify max uint handling
4. `pause-stream` — authorization, state check (active only), end-block check
5. `resume-stream` — authorization, state check (paused only), duration math
6. `cancel-stream` — authorization, conservation math, state check (not already cancelled)
7. `top-up-stream` — authorization, rate preservation math, state check
8. `set-emergency-pause` — admin-only, scope (new streams blocked, existing unaffected)

**Contract-level checks:**
- `CONTRACT-OWNER` defined at deploy time via `tx-sender` — document key management requirement
- `MAX-STREAMS-PER-USER u100` — DoS prevention adequate
- `PRECISION u1000000000000` — verify no multiplication overflows given max token amounts

**SECURITY_REVIEW.md structure:**

```markdown
# StackStream Security Review
## Version: v1.0.0-rc1
## Date: [date]
## Reviewer: Irmiya Jethro Mbata (self-audit) + community

### Executive Summary
### Scope
### Methodology
### Findings

#### Finding 1: [Title]
- Severity: [Informational / Low / Medium / High / Critical]
- Function: [which function]
- Description:
- Status: [Resolved / Acknowledged / Accepted Risk]

### Function-by-Function Review
[One section per function]

### Math Verification
[Invariant proofs]

### Community Review
[Summary of external feedback received]

### Conclusion
```

#### Community Review Submission

**Step 1 — Create GitHub Issue (Day 9 of M1, April 17)**

Title: `[Security Review] StackStream v1.0.0-rc1 — Pre-Mainnet Community Review`

Body: (paste the template from ECOSYSTEM_OUTREACH.md)

**Step 2 — Post in Stacks Discord `#clarity-smart-contracts` (same day)**

**Step 3 — Post on Stacks Forum under Developers (same day)**

**Step 4 — Post on X (same day)**

**Step 5 — Keep review open 10 days minimum (April 17 → April 27)**

Responses incorporated into SECURITY_REVIEW.md before submission.

---

### DELIVERABLE 1.3 — Release Candidate

**Actions:**

1. Commit all new tests and SECURITY_REVIEW.md
2. Ensure all 100+ tests pass on clean run
3. Tag the release on GitHub:

```bash
git add -A
git commit -m "M1: 100+ tests, SECURITY_REVIEW.md, RC preparation"
git tag -a v1.0.0-rc1 -m "Release candidate for mainnet deployment"
git push origin main --tags
```

4. Create a GitHub Release on the tag with release notes describing:
   - What changed from testnet version
   - Test count and coverage summary
   - Security review findings summary
   - Link to SECURITY_REVIEW.md

**Mainnet Deployment Checklist (document in SECURITY_REVIEW.md or separate file):**

```
Pre-deployment:
[ ] All 100+ tests passing on latest commit
[ ] Security review complete and published
[ ] Mainnet SIP-010 trait address confirmed
[ ] Deployer wallet funded with STX for gas
[ ] CONTRACT-OWNER key stored securely (this wallet controls emergency-pause)
[ ] Clarinet.toml deployment plan updated for mainnet
[ ] Post-deployment validation script written

Deployment:
[ ] Deploy sip-010-trait (if needed — mainnet standard trait may be used instead)
[ ] Deploy stream-manager.clar
[ ] Deploy stream-factory.clar
[ ] Verify both contracts on Stacks Explorer
[ ] Record mainnet contract addresses

Post-deployment validation:
[ ] Call get-stream-nonce() → expect u0
[ ] Call is-emergency-paused() → expect false
[ ] Create one test stream → verify Stream ID 1 created
[ ] Call get-stream(u1) → verify all fields correct
[ ] Claim from test stream → verify token transfer
[ ] Cancel test stream → verify refund

Frontend:
[ ] Update NEXT_PUBLIC_CONTRACT_DEPLOYER in Vercel env vars
[ ] Update NEXT_PUBLIC_NETWORK=mainnet in Vercel env vars
[ ] Update NEXT_PUBLIC_OPENCLAW_API_URL to production Railway URL
[ ] Deploy frontend — verify all pages load
[ ] Test wallet connection on mainnet
[ ] Verify all 5 contract interaction buttons work
```

---

### M1 SUBMISSION EVIDENCE PACKAGE

Prepare a document with:
- GitHub link to `v1.0.0-rc1` tag
- GitHub link to `SECURITY_REVIEW.md`
- GitHub link to community review issue with response count
- Screenshot of `npm test` showing 100+ passing tests
- Link to testnet app still working: https://stackstream.vercel.app/
- `railway.json` committed and openclaw service deployed

---

## MILESTONE 2 — MAINNET LAUNCH
**Budget:** $2,400 | **Start:** May 1, 2026 | **Submit:** May 14, 2026 | **Approval:** ~May 21, 2026

### Acceptance Criteria
- [ ] Both contracts deployed and verified on Stacks mainnet
- [ ] Production frontend live with mainnet configuration
- [ ] 5 end-to-end streams created and claimed on mainnet (tx hashes as evidence)

---

### DELIVERABLE 2.1 — Mainnet Contract Deployment

**Step 1 — Update Clarinet.toml for mainnet**

The `sip-010-trait` on mainnet is at:
`SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard`

Update `stream-manager.clar` and `stream-factory.clar` to use the mainnet trait when deploying. This is a deployment configuration change, not a contract logic change.

**Step 2 — Deploy contracts**

```bash
# From repo root
clarinet deployments apply --mainnet
```

Record the resulting mainnet contract addresses immediately.

**Step 3 — Verify on Stacks Explorer**

- Go to `https://explorer.hiro.so/txid/[deploy-tx-hash]`
- Confirm both contracts appear under the deployer address
- Confirm contract source code is visible and matches the repo

**Step 4 — Run post-deployment validation**

```bash
# Quick smoke test: call get-stream-nonce on mainnet
stx call-read-only-fn \
  [MAINNET_CONTRACT_ADDRESS].stream-manager \
  get-stream-nonce \
  [] \
  [DEPLOYER_ADDRESS] \
  --network mainnet
```

Expect result: `(ok u0)`

---

### DELIVERABLE 2.2 — Production Frontend

**Step 1 — Update Vercel environment variables**

In the Vercel dashboard for the StackStream project, update:

```
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_CONTRACT_DEPLOYER=[mainnet deployer address]
NEXT_PUBLIC_OPENCLAW_API_URL=[production Railway URL]
```

**Step 2 — Update token configuration**

For mainnet the mock token (`mock-sip010-token`) does not exist. Decision: **Option B — multi-token real mainnet SIP-010 tokens.** This replaces the single hardcoded mock with a network-aware token list that exposes real ecosystem tokens to users immediately on mainnet.

**Why not Option A (deploy test token):** A custom `SSTREAM` faucet token on mainnet is still a demo token. It doesn't align with the "Bitcoin-native payroll" narrative, and it limits M3 DAO adoption — real projects will not stream with a valueless test token.

**Why Option B done as a multi-token selector:**
StackStream's protocol is already permissionless (any SIP-010 token works). The gap was the frontend only showing one token. The fix is exposing multiple real tokens so any Stacks user finds a token they already hold. For M2 demos, USDA is the most accessible (Arkadiko has liquidity, small amounts cost a few dollars). For M3, DAOs use their own tokens.

**Mainnet token list (in `constants.ts`):**
| Symbol | Name | Decimals | Use case |
|---|---|---|---|
| sBTC | Stacks BTC | 8 | Bitcoin-native payroll — flagship use case |
| USDA | Arkadiko USD | 6 | Stable payroll streams (price-stable) |
| ALEX | ALEX Token | 8 | DeFi community / protocol contributors |
| xBTC | Wrapped Bitcoin | 8 | Tokenized Bitcoin holders |

**Contract IDs (mainnet, verified Epoch 3.0):**
```
sBTC:  SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-sbtc
USDA:  SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token
ALEX:  SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex
xBTC:  SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin
```
Verify these on Stacks Explorer before mainnet deployment in case any contract was migrated.

**What was implemented:**
- `SUPPORTED_TOKENS` in `constants.ts` is now network-aware: mainnet returns 4 real tokens, testnet returns the mock token
- A `TokenConfig` interface (with `symbol`, `name`, `decimals`, `contractId`, `ftName`, `icon`, `description`) is exported for type-safe token handling across the frontend
- `DEFAULT_TOKEN` is exported as `SUPPORTED_TOKENS[0]` (sBTC on mainnet, msBTC on testnet)
- `create/page.tsx` now has a token selector dropdown that appears on mainnet. Amount calculations use `selectedToken.decimals` — USDA's 6 decimals are handled correctly alongside sBTC's 8 decimals
- `use-token-balance.ts` now accepts `tokenContractId` as a parameter (defaults to `DEFAULT_TOKEN.contractId`)
- Explorer links throughout the create page now use `EXPLORER_BASE` (mainnet vs testnet correct URL)

**For M2 demo streams:** Use USDA for the 5 demonstration streams. Acquire a small amount from Arkadiko (a few dollars of USDA). This demonstrates a real, stable payroll use case rather than test tokens.

**For M3 DAO onboarding:** DAOs use whatever SIP-010 token their contributors expect. sBTC for Bitcoin-maximalst DAOs, USDA for stable payroll, their own governance token if they have one. The frontend's permissive token list accommodates all of these.

**Adding a new token in the future:** Append one entry to `MAINNET_TOKENS` in `constants.ts` and add an icon to `/public/`. No other code changes required.

**Step 3 — Remove testnet-only UI elements**

- Remove or hide the "Mint test tokens" button on mainnet (`IS_MAINNET` flag already exists for this)
- On mainnet, users acquire tokens from the respective protocol (Arkadiko for USDA, bridge for sBTC, etc.)

**Step 4 — Update Explorer links**

`constants.ts` already has:
```typescript
export const EXPLORER_BASE = IS_MAINNET
  ? "https://explorer.hiro.so"
  : "https://explorer.hiro.so/?chain=testnet";
```

This is correct — no changes needed.

**Step 5 — Deploy frontend**

Push to `main` branch — Vercel auto-deploys. Verify:
- Landing page loads
- Wallet connect works (Leather mainnet)
- Dashboard shows correct contract addresses
- Create stream form works
- OpenClaw widget resolves queries against mainnet data

**Step 6 — Update openclaw-service for mainnet**

Update the Railway environment variables:
```
STACKS_NETWORK=mainnet
CONTRACT_DEPLOYER=[mainnet address]
STREAM_MANAGER_CONTRACT=[mainnet].stream-manager
STREAM_FACTORY_CONTRACT=[mainnet].stream-factory
```

Redeploy on Railway. Verify `/health` endpoint responds.

---

### DELIVERABLE 2.3 — 5 End-to-End Mainnet Streams

**Who creates them:** 5 Stacks community members recruited via @Stackstream0X, StackStream Telegram, and Stacks Discord. Each participant is the sender of one stream and the recipient of another (ring topology) — no self-sends, no deployer-as-sender.

**What "end-to-end" means:** Stream is created (tx 1) AND at least one claim is made from it (tx 2). Both tx hashes are evidence.

**Tokens used:** StackStream supports any SIP-010 fungible token on Stacks mainnet. The contract is token-agnostic — it accepts a `<sip-010-trait>` argument at stream creation. For M2 demo evidence we use:

| Token | Why we use it for M2 | Stream count |
|---|---|---|
| **USDA** (Arkadiko USD stablecoin) | Easiest SIP-010 to acquire on mainnet via Bitflow/Velar. Demonstrates the stablecoin-payroll use case directly relevant to the M3 DAO-contributor target audience. Price-stable, so the demo amount is predictable to participants. | 5 of 5 streams |

**Tokens supported but deferred to M3 demos:** sBTC, ALEX, xBTC, and any other SIP-010 fungible token deployed on Stacks mainnet (no contract change needed — they will work with the existing deployment). sBTC streams will be the centerpiece of the post-M2 marketing push and the first DAO onboarding cases.

> **Important:** StackStream does **not** support native STX directly. Native STX uses `stx-transfer?`, while StackStream uses the SIP-010 `transfer` trait. To stream STX, users wrap it via an existing STX→SIP-010 wrapper (or use one of the SIP-010 tokens above).

**Stream plan (durations compressed to fit M2 submission window of May 22):**

Stacks block time averages ~10 minutes (Bitcoin-anchored). All durations below are in **blocks**, not days.

| Stream | Sender | Recipient | Token | Amount | Duration (blocks) | Wall-clock | Purpose |
|---|---|---|---|---|---|---|---|
| 1 | Participant P1 | Participant P2 | USDA | 1 USDA   | 30 | ~5 hrs | Primary demo (partial claim) |
| 2 | Participant P2 | Participant P3 | USDA | 1.5 USDA | 30 | ~5 hrs | Full-claim test |
| 3 | Participant P3 | Participant P4 | USDA | 1 USDA   | 60 | ~10 hrs | Pause+resume cycle |
| 4 | Participant P4 | Participant P5 | USDA | 2 USDA   | 30 | ~5 hrs | Top-up extension test |
| 5 | Participant P5 | Participant P1 | USDA | 1 USDA   | 20 | ~3.5 hrs | Cancel-split test |

**Total wall-clock to complete all 5 end-to-end:** ~12 hours of stream elapsed time + transaction confirmations. All 5 streams can be created in parallel on Day 1, with claims happening as each stream accrues over the next 12 hours. Comfortably fits within a single day before May 22 submission.

**Seed cost per participant:** 0.5 STX (gas, ~$0.80) + 1.1 to 2.2 USDA (stream amount + small buffer). Total seed cost across 5 participants: ~2.5 STX + ~7.5 USDA ≈ **$11 total project cost**.

**Per-participant process:**
1. Receive seed STX + token from project operations wallet (see `M2_DEPLOY_RUNBOOK.md` for the seeding procedure).
2. Connect Leather or Xverse to https://stackstream.vercel.app on mainnet.
3. Create the assigned stream — records create tx hash.
4. Wait at least 3–5 blocks (~30–50 min) for tokens to accrue.
5. Switch to the recipient wallet they were assigned, claim from their incoming stream — records claim tx hash.
6. Maintainer collects all 10 tx hashes.

**Evidence document format:**

```markdown
## M2 Stream Evidence

| # | Token | Create Tx | Claim Tx | Explorer Link |
|---|---|---|---|---|
| 1 | USDA | 0x... | 0x... | link |
| 2 | USDA | 0x... | 0x... | link |
| 3 | USDA | 0x... | 0x... | link |
| 4 | USDA | 0x... | 0x... | link |
| 5 | USDA | 0x... | 0x... | link |
```

**Transparency note for grants submission:** Per `MILESTONE_PLAN.md` line 198–200, M2 demo streams may be self-funded or community-recruited. Participants here were recruited via public channels and seeded with small amounts of STX (gas) and tokens (stream payload) from a project operations wallet. Each participant created and claimed independently from their own wallet — the seeding pattern is fully disclosed in `M2_EVIDENCE_PACKAGE.md` Section 3.

---

### M2 SUBMISSION EVIDENCE PACKAGE

- Mainnet contract addresses (both contracts, with Explorer links)
- Production frontend URL
- Screenshot of live frontend connected to mainnet
- 5-stream evidence document with all tx hashes
- OpenClaw service production URL health check response

---

## MILESTONE 3 — REAL USAGE
**Budget:** $4,000 | **Start:** May 21, 2026 | **Submit:** June 8, 2026 | **Approval:** ~June 15, 2026

### Acceptance Criteria (Option A)
- [ ] 3 real teams or DAOs registered in `stream-factory` on mainnet
- [ ] Each has at least 1 stream created to a real contributor
- [ ] At least 1 claim made per DAO (end-to-end proven)

---

### DELIVERABLE 3.1 — DAO Onboarding

**Who they are:** 3 cohort mates / ecosystem contacts identified during M1 outreach

**On-chain requirements per DAO:**

```
1. register-dao(name) called from their wallet
   → stream-factory tx hash #1

2. create-stream(...) called from their wallet  
   → stream-manager tx hash #2

3. claim() or claim-all() called from recipient wallet
   → stream-manager tx hash #3
```

**The onboarding walkthrough you send each DAO:**

```
Step 1: Go to https://stackstream.vercel.app/dashboard/register
        Connect your wallet
        Enter your project name and click Register DAO
        → Copy the tx hash

Step 2: Go to /dashboard/create
        Enter your contributor's wallet address
        Set token, amount, duration
        Click Create Stream
        → Copy the tx hash

Step 3: Share this link with your contributor:
        https://stackstream.vercel.app/earn
        They connect their wallet and click Claim
        → They copy the tx hash and send it to you

Step 4: Send me all 3 tx hashes (register, create, claim)
```

---

### DELIVERABLE 3.2 — Evidence Compilation
For each DAO, document:

```markdown
## DAO [N]: [Project Name]

**Admin address:** SP...
**Registration tx:** 0x...
**Explorer:** https://explorer.hiro.so/txid/0x...

**Stream created:**
- Stream ID: [N]
- Token: [token]
- Amount: [amount]
- Duration: [duration]
- Create tx: 0x...
- Explorer: link

**Claim made:**
- Claim tx: 0x...
- Amount claimed: [amount]
- Explorer: link
```

---

### M3 SUBMISSION EVIDENCE PACKAGE

- 3 × DAO registration tx hashes with Explorer links
- 3 × stream creation tx hashes (one per DAO)
- 3 × claim tx hashes (one per DAO)
- Screenshot of stream-factory data showing 3 registered DAOs
- Screenshot of OpenClaw assistant showing DAO queries returning real data

---

## TECHNICAL NOTES FOR MAINNET

### Block timing (Q2 from pre-plan discussion)

No contract changes needed for mainnet. The frontend's duration options (minutes / hours / days / months) remain as-is. On mainnet, guide real users toward days/months for production streams. The `startBlock + 3` buffer in `create/page.tsx` is correct for mainnet — keep it.

The testnet streams you created with 1-2 block durations were for testing only. They cannot exist on mainnet unless someone explicitly chooses a sub-1-block duration, which the frontend already blocks (`durationBlocks < 1` validation).

### openclaw-service (Q1 from pre-plan discussion)

The openclaw-service is a genuine, necessary backend. Keep it. It powers the AssistantWidget that lives in `app-shell.tsx` (dashboard + earn pages only — not the landing page). The `railway.json` file is untracked and should be committed as part of M1 cleanup.

### Contract deployer key management

`contract-owner` in `stream-manager.clar` is stored as a `define-data-var` initialized to `tx-sender` at deploy time (Zachyo — M-2 fix). Whoever signs the mainnet deployment transaction becomes the initial admin — the only address that can call `set-emergency-pause`. This key must be:
- The same wallet you use for all StackStream mainnet operations
- Backed up with the seed phrase stored securely offline
- Documented in SECURITY_REVIEW.md as a known property

Key rotation is now possible post-deployment via `transfer-ownership` without redeployment. For v2, transfer ownership to a multisig principal.

### Minimum token cost for mainnet

| Action | STX gas cost (approx) |
|---|---|
| Deploy stream-manager | ~1-2 STX |
| Deploy stream-factory | ~0.5 STX |
| Deploy test token | ~0.5 STX |
| create-stream (per stream) | ~0.05 STX |
| claim (per claim) | ~0.05 STX |
| register-dao (per DAO) | ~0.05 STX |

Total estimated gas for M2 + M3 all transactions: ~5-8 STX

---

## IMMEDIATE NEXT ACTIONS

This is the ordered list of what to do starting today (April 9):

```
TODAY (April 9):
[ ] Commit railway.json to the repo
[ ] Run npm test — verify 66 tests still passing on current codebase
[ ] Begin writing Block A fuzz tests (invariant 1: token conservation)

APRIL 10-12:
[ ] Complete Block A (all 5 invariants, 20 new tests)
[ ] Begin Block B edge case tests

APRIL 13-14:
[ ] Complete Block B (10 new tests)
[ ] Complete Block C factory tests (8 new tests)
[ ] Run full suite — confirm 104+ passing

APRIL 15-16:
[ ] Write self-audit against all 8 public functions
[ ] Draft SECURITY_REVIEW.md

APRIL 17 (Day 9):
[ ] Create GitHub Issue for community review
[ ] Post in Stacks Discord #clarity-smart-contracts
[ ] Post on Stacks Forum
[ ] Post on X

APRIL 17-27:
[ ] Community review open period — respond to every comment
[ ] Incorporate findings into SECURITY_REVIEW.md

APRIL 22:
[ ] Finalize SECURITY_REVIEW.md
[ ] Write mainnet deployment checklist

APRIL 23-24:
[ ] Final test run — confirm 100+ passing
[ ] Commit all files
[ ] Create git tag v1.0.0-rc1
[ ] Create GitHub Release with release notes
[ ] Submit M1 evidence to Stacks Endowment
```
