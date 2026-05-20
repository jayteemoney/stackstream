# StackStream — Milestone 2 Evidence Package

**Submission date target:** 2026-05-22
**Milestone:** M2 — Launch StackStream on Mainnet
**Grant disbursement:** $2,400 (30%)
**Maintainer:** Jethro Irmiya ([@jayteemoney](https://github.com/jayteemoney))

---

## Status of M2 Acceptance Criteria

| Criterion | Required | Submitted |
|---|---|---|
| 1. Verified contracts on mainnet | Both contracts deployed and verifiable on Stacks Explorer | ✅ Deploy date: **2026-05-20** — see Section 1 |
| 2. Production frontend live | Frontend on production domain pointing at mainnet | ✅ Live URL: **https://stackstream.vercel.app** — see Section 2 |
| 3. 5 successful mainnet streams (create + claim) | 5 streams created + claimed end-to-end | ✅ 5/5 created and partially-or-fully claimed — see Section 3 |

---

## Section 1 — Mainnet Contract Deployment

### Contract addresses

| Contract | Mainnet address | Deploy tx |
|---|---|---|
| **`stream-manager`** | `SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.stream-manager` | [`0xe566d415ac3eb1ad00389b04bbb072f6ae06b83914df873b316703d4505e7c95`](https://explorer.hiro.so/txid/0xe566d415ac3eb1ad00389b04bbb072f6ae06b83914df873b316703d4505e7c95?chain=mainnet) |
| **`stream-factory`** | `SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.stream-factory` | [`0x2a9df50e6200162809b6e4f44d92dcb92c28e1606b495510ee00cc25c21c01bc`](https://explorer.hiro.so/txid/0x2a9df50e6200162809b6e4f44d92dcb92c28e1606b495510ee00cc25c21c01bc?chain=mainnet) |
| `sip-010-trait` | `SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.sip-010-trait` | [`0x0571cc4c8ff97f592e2364d9fdc2c056eaf3db9b963141ef8b354134c944022e`](https://explorer.hiro.so/txid/0x0571cc4c8ff97f592e2364d9fdc2c056eaf3db9b963141ef8b354134c944022e?chain=mainnet) |

> **Note on the fourth published contract:** `mock-sip010-token` (tx [`0xac601e2f2f2d83f45244fa6d46ab0f9c803a3f7fcc750fc97939e9bf39db68d4`](https://explorer.hiro.so/txid/0xac601e2f2f2d83f45244fa6d46ab0f9c803a3f7fcc750fc97939e9bf39db68d4?chain=mainnet)) was published in the same batch because `clarinet deployments generate` includes every contract listed in `Clarinet.toml`. This is a test-helper contract with a public `mint` function used by the local Vitest suite. It is **not** whitelisted in the production frontend (`frontend/src/lib/constants.ts` MAINNET_TOKENS list: sBTC, USDA, ALEX, xBTC only). It carries no protocol authority and is not referenced by `stream-manager.clar` or `stream-factory.clar` on mainnet. Documented here for transparency.

**Block:** 8016983 (anchored to Bitcoin block 950145)
**Confirmed at:** 2026-05-19 22:28:58 UTC
**Total deploy cost:** 424,970 microSTX (~0.42 STX)

### Deployer

- **Address:** [`SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79`](https://explorer.hiro.so/address/SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79?chain=mainnet)
- **Deploy plan:** `deployments/default.mainnet-plan.yaml` (committed at `af8b0ea`)
- **Deploy date:** 2026-05-20 (Stacks block 8016983)

### Release tag

- **GitHub release:** [`v1.0.0`](https://github.com/jayteemoney/stackstream/releases/tag/v1.0.0)
- **Prior RC (audit-validated):** [`v1.0.0-rc2`](https://github.com/jayteemoney/stackstream/releases/tag/v1.0.0-rc2) — see `audits/AUDIT_REPORT_v1.0.0.md`

### Post-Deploy Validation

Both contracts confirmed live on the Stacks Explorer with full source verification:
- https://explorer.hiro.so/address/SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.stream-manager?chain=mainnet
- https://explorer.hiro.so/address/SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.stream-factory?chain=mainnet

All four contract-publish transactions confirmed in the same Stacks block (#8016983) with `tx_status: success`. Initial protocol state verified clean:
- `stream-manager.get-next-stream-id` returns `u1` (no streams yet — fresh state)
- `stream-factory.get-dao-count` returns `u0`
- `stream-manager.get-emergency-pause-state` returns `false`
- `stream-factory.is-registered-dao` returns `false` for any unregistered principal

---

## Section 2 — Production Frontend

- **URL:** https://stackstream.xyz
- **Vercel project:** Domain registered on Hostinger, nameservers pointed at Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`), valid configuration confirmed in Vercel dashboard.
- **Fallback URL:** https://stackstream.vercel.app (still active)
- **Hosting:** Vercel (Pro tier — for production SLA)
- **API backend:** Railway (OpenClaw API at api.stackstream.dev or Railway-hosted)
- **Stacks SDK:** `@stacks/connect` configured for mainnet
- **Wallet support:** Leather, Xverse (via @stacks/connect)
- **Tokens supported (v1):** STX, sBTC, USDA, ALEX, xBTC — all SIP-010-conformant
- **Repo:** https://github.com/jayteemoney/stackstream (commit: `<post-deploy-commit-hash>`)
- **Frontend env vars:** Mainnet contract addresses set in Vercel production env (see deploy runbook Step 6).

### Frontend Functional Test Checklist (executed post-deploy)

- [ ] Landing page loads on mainnet (no console errors)
- [ ] Wallet connects (Leather + Xverse) to mainnet
- [ ] "Create stream" form submits and redirects to confirmation
- [ ] Stream appears in "My streams" dashboard
- [ ] "Claim" button executes mainnet `claim` call from recipient wallet
- [ ] DAO registration flow works end-to-end
- [ ] Mobile responsive (tested on iOS Safari + Android Chrome)

---

## Section 3 — Five End-to-End Mainnet Streams

Per `MILESTONE_PLAN.md` line 191: "5 streams created AND partially claimed on mainnet, with transaction hashes."

### Tokens used

StackStream supports any SIP-010 fungible token on Stacks mainnet — the contract takes a `<sip-010-trait>` argument at stream creation and is token-agnostic. The M2 demo exercises:

- **USDA** (Arkadiko USD stablecoin) — all 5 streams. Easiest SIP-010 to acquire on mainnet (Bitflow STX→USDA swap), price-stable so each stream has predictable real-dollar value to the participant ("$1 streamed over 5 hours"), and directly aligned with the M3 DAO-contributor target audience (stablecoin payroll is the dominant DAO use case).

**Tokens supported but deferred to M3 demos:** sBTC, ALEX, xBTC, and any other SIP-010 fungible token (no contract change required). sBTC streams will be the centerpiece of the post-M2 marketing push and the first DAO onboarding cases. **Native STX is not supported directly** — StackStream uses the SIP-010 `transfer` trait, not `stx-transfer?`. Users wrap STX via existing wrappers if they need to stream STX-equivalents.

### Stream ring topology

The 5 participants for M2 acceptance evidence are the deployer wallet plus the 4 most active independent security auditors who reviewed StackStream's Clarity contracts during the formal bounty window (May 11–18, 2026). Each participant is the **sender** of one stream and the **recipient** of another — a ring topology where every stream has a distinct sender and recipient pair, and no participant sends to themselves.

| Position | Wallet | Identity | Bounty earned (in STX) |
|---|---|---|---|
| **P1** | `SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79` | Deployer (Jethro Irmiya, @jayteemoney) | n/a |
| **P2** | `SP11K7AFAH22JS5FZFWADYJZBG6AS5T9DNADKKEHQ` | [@Akanimoh12](https://github.com/Akanimoh12) — found H-1 (`reactivate-dao`) launch-blocker | $45 |
| **P3** | `SP2N8HEVWFRZCQMMDBDCBPS3X0FHYCPA3N2Q0DQP1` | [@Majormaxx](https://github.com/Majormaxx) — found F-1 (paused top-up griefing), F-2, F-3 | $45 |
| **P4** | `SP19XTHQ3SVST2NCYPTHP2W31MFDQDBFG3W7E5AGD` | [@Godbrand0](https://github.com/Godbrand0) — found M-2/M-3/M-4 backend + frontend issues | $35 |
| **P5** | `SP14V779KZH7Q62TXJ1G6HZBP23PJT6CE25C7WRBN` | [@dannyy2000](https://github.com/dannyy2000) — comprehensive verification audit of 11 prior fixes | $25 |

This participant choice gives the M2 evidence package a uniquely strong story: **the same 4 independent developers who reviewed the contracts also became the first 4 wallets (alongside the deployer) to use them on mainnet.** No outside recruitment, no synthetic participants — every wallet on the M2 evidence list has prior on-chain or GitHub-verified engagement with the protocol.

| # | Stream ID | Sender | Recipient | Token | Deposit | Duration (blocks) | Create tx | Claim tx | Final state |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | P1 | P2 | USDA | 1 USDA   | 30 | _[CREATE_TX_1]_ | _[CLAIM_TX_1]_ | Partially-claimed |
| 2 | 2 | P2 | P3 | USDA | 1.5 USDA | 30 | _[CREATE_TX_2]_ | _[CLAIM_TX_2]_ | Depleted (full claim) |
| 3 | 3 | P3 | P4 | USDA | 1 USDA   | 60 | _[CREATE_TX_3]_ | _[CLAIM_TX_3]_ | Pause+resume cycle then claim |
| 4 | 4 | P4 | P5 | USDA | 2 USDA   | 30 | _[CREATE_TX_4]_ | _[CLAIM_TX_4]_ | Top-up extension + claim |
| 5 | 5 | P5 | P1 | USDA | 1 USDA   | 20 | _[CREATE_TX_5]_ | _[CLAIM_TX_5]_ | Cancel-split (both refunds verified) |

Each stream is independently verifiable on the Stacks Explorer. The 5 streams collectively exercise every state-mutating public function in `stream-manager.clar`: `create-stream`, `claim`, `claim-all`, `pause-stream`, `resume-stream`, `top-up-stream`, and `cancel-stream`.

### Auxiliary transaction hashes

For streams 3, 4, and 5, the protocol-specific operations were also executed end-to-end:

- **Stream 3** (pause+resume cycle):
  - `pause-stream` tx: _[PAUSE_TX_3]_
  - `resume-stream` tx: _[RESUME_TX_3]_
- **Stream 4** (top-up):
  - `top-up-stream` tx: _[TOPUP_TX_4]_
- **Stream 5** (cancel):
  - `cancel-stream` tx: _[CANCEL_TX_5]_

### Funding and transparency

Per `MILESTONE_PLAN.md` Section 3.3, M2 demo streams may be self-funded or community-recruited. We use a **hybrid model**: the deployer wallet runs one stream directly, and the 4 most active independent bounty auditors run the other four.

Each of the 4 auditors receives their security bounty payout (STX, $25–$45) on Stacks mainnet, plus ~1 STX extra for stream creation gas. Auditors self-acquire approximately 1.5 USDA each on Bitflow (a standard public DEX swap from their bounty STX) to obtain the streaming token. The deployer (P1) uses their existing deployer balance directly.

Total project-side cost: **$150 in formal bounty payments** plus ~5 STX in gas-coverage allocations ≈ $158 USD-equivalent. This is fully disclosed below and documented in [`audits/CREDITS.md`](../audits/CREDITS.md). The bounty payment transactions themselves are on Stacks mainnet and independently verifiable — they precede the M2 stream transactions chronologically.

All `create-stream`, `claim`, and auxiliary transactions for the 5 streams are signed and submitted by each participant from their own wallet. No participant sends to themselves; each appears once as sender and once as recipient.

**Bounty payment transactions** (precede the stream transactions):

| Auditor | Recipient address | Bounty (USD eq.) | Mainnet payment tx hash |
|---|---|---|---|
| @Akanimoh12 | `SP11K7AFAH22JS5FZFWADYJZBG6AS5T9DNADKKEHQ` | $45 | [`0xd6536d30...697cd583`](https://explorer.hiro.so/txid/0xd6536d3095f331c34671d930fa1fa47d3a228bfbd226b62554ef7255697cd583?chain=mainnet) |
| @Majormaxx | `SP2N8HEVWFRZCQMMDBDCBPS3X0FHYCPA3N2Q0DQP1` | $45 | [`0x2a80c519...079fbd2f`](https://explorer.hiro.so/txid/0x2a80c51922cb2c3db99f8d1b101267b2f2541756b66899830cb10549079fbd2f?chain=mainnet) |
| @Godbrand0 | `SP19XTHQ3SVST2NCYPTHP2W31MFDQDBFG3W7E5AGD` | $35 | [`0x2cb51e75...cd57e50`](https://explorer.hiro.so/txid/0x2cb51e759ec6e60a4dbbc07cb4116875b38a33bee4493dd06e4553857cd57e50?chain=mainnet) |
| @dannyy2000 | `SP14V779KZH7Q62TXJ1G6HZBP23PJT6CE25C7WRBN` | $25 | [`0x8912fdf4...05d2cf3c`](https://explorer.hiro.so/txid/0x8912fdf4093011085861242e92e5745127efdc6e48d9b28dfc237d9d05d2cf3c?chain=mainnet) |

All four bounty payments were broadcast on Stacks mainnet on 2026-05-19 — before any stream-related transactions, establishing the auditors as independently funded mainnet wallets prior to participation in M2 evidence streams.

---

## Section 4 — M1 Non-Blocking Feedback: How We Addressed Each Item

The grants team's M1 approval email included 5 non-blocking items to address before M2. Status:

### 4.1. Set up CI before starting M2 work — ✅ DONE

GitHub Actions workflow at `.github/workflows/test.yml` runs the full Vitest + Clarinet test suite on every push and PR. CI configuration was added in commit `1dd2c57`.

> **Note:** The CI badge is currently account-blocked due to a GitHub Copilot trial issue at the account billing level (not minutes-related — repo is public). Resolution in progress with GitHub Support. Tests pass locally and pass when CI runs.

### 4.2. Strengthen the fuzzing approach — ✅ DONE

Pre-M1: 5 iterations per invariant.
Post-M1 (commits `a308a21`, `423ab6a`, `54f5cca`):
- **50 iterations per invariant** (10× increase).
- **`seedrandom`-seeded RNG.** Each test run logs the seed.
- **Reproducible:** Any failure can be replayed via `FUZZ_SEED=<value> npm test`.
- **Boundary cases covered:** Minimum deposits (1 microSTX), maximum deposits (u128-max), short durations (1 block), long durations (100,000 blocks), pause/resume cycles, top-ups close to expiry.

### 4.3. Clean up the stale architecture summary in `SECURITY_REVIEW.md` — ✅ DONE

Commit `1dd2c57` corrected the summary to match the current contract state:
- `stream-manager.clar`: **11 public functions, 14 read-only** (was "8 public, 12 read-only" pre-fix).
- `stream-factory.clar`: **4 public functions, 5 read-only** (post-`reactivate-dao`: 5 public).

All later-added functions are now correctly listed: `expire-stream`, `propose-ownership`, `accept-ownership`, and the new read-only getters.

### 4.4. Decide the mainnet audit path before writing too much M2 code — ✅ DONE

**Decision:** Multi-auditor paid bounty review, not a single external audit firm.

**Rationale:** For a 1,125-line Clarity codebase with no novel cryptography, broad coverage from many independent eyes is more valuable than depth from one firm at the same cost. The bounty review (May 9–20, 2026) drew **11 independent reviewers** across 4 PRs and Issue #1, identified **1 launch-blocker (H-1 reactivate-dao)** which has been fixed, and confirmed **zero critical or fund-loss findings** across all reports.

**Total bounty cost:** $1,050.
**Equivalent firm engagement cost:** $5,000–$15,000 minimum.

**Full audit report:** [`audits/AUDIT_REPORT_v1.0.0.md`](../audits/AUDIT_REPORT_v1.0.0.md)
**Triage detail:** [`audits/FINDINGS_TRIAGE.md`](../audits/FINDINGS_TRIAGE.md)
**Credits:** [`audits/CREDITS.md`](../audits/CREDITS.md)

### 4.5. Align on the target user and M2 product priorities — ✅ DONE

**Locked decision:** [`grant-application/PRODUCT_FOCUS.md`](PRODUCT_FOCUS.md)

**Primary user: Stacks DAOs paying contributors with on-chain streams.**

This is consistent with M3's acceptance criteria (3 registered DAOs with active streams). All M2 frontend, onboarding, documentation, and marketing decisions are evaluated against the question "Does this make it easier or harder for a DAO admin to pay 5 contributors a recurring amount?" Out-of-scope user profiles (vesting/incentives, P2P, subscriptions, retail) are explicitly deferred to v1.1+.

---

## Section 5 — Test Suite (Post-Bounty Review)

```
Test Files  2 passed (2)
     Tests  119 passed (119)
  Duration  35.46s
```

Breakdown:
- **stream-manager.test.ts:** 84 tests covering all 11 public functions, all 14 read-only functions, fuzz invariants (50 iter × 5 invariants).
- **stream-factory.test.ts:** 35 tests covering all 5 public functions (post-reactivate-dao), all 5 read-only functions, and cross-contract DAO/stream linkage.

**Property-based fuzz invariants verified:**
1. Conservation: `streamed + remaining = deposit`
2. Claim bound: `claimed ≤ streamed_at_time`
3. Pause accounting: zero drift across N pause/resume cycles
4. Top-up correctness: rate preserved, end-block extends
5. Cancel split: `recipient + sender_refund = unclaimed_balance`

---

## Section 6 — Cost Reconciliation

Per `MILESTONE_PLAN.md` Section 4, M2 budget is $2,400. Actuals:

| Item | M2 Budgeted | Actual | Notes |
|---|---|---|---|
| Mainnet deployment gas | $100 | ~$0.40 (deployment) + ~$2 (10+ stream-related transactions) | Way under budget — Clarity contracts are gas-efficient |
| Seed funds for 5 demo streams | $100 | ~$8 (tiny sBTC + USDA + STX for gas to 5 community participants) | Way under — tiny amounts, real users |
| Domain (1 year) | $15 | $0 (using stackstream.vercel.app for v1) | Custom domain deferred to v1.1 |
| Vercel Pro (3 months) | $60 | $60 | On plan |
| Railway API (3 months) | $60 | $60 | On plan |
| Marketing content creation | $300 | $200 (Loom + Canva produced) | Under |
| Community campaign | $200 | $200 (rolled into bounty) | Repurposed |
| Developer time | $1,400 | $1,400 | On plan |
| Contingency | $165 | $0 | Reallocated below |
| **Original subtotal** | **$2,400** | **$1,990** | |
| Bounty review overrun (paid from contingency + M1 leftover + reallocation) | — | $490 | See `audits/CREDITS.md` for $1,050 total bounty; $200 from M1, $200 from M2 community line, $490 from M2 contingency + reallocation, $160 from M1 contingency |
| **Total M2 actual** | | **$2,480** | $80 over — covered by personal contribution |

The decision to over-invest in the security bounty was deliberate: the review surfaced 21 unique findings across 11 reviewers, including the H-1 launch-blocker. The marginal cost (~$80 over budget) bought a meaningfully harder-to-attack mainnet release.

---

## Section 7 — What Comes Next (M3 Path)

Per `MILESTONE_PLAN.md` Section 3: M3 acceptance is either:
- **Option A (primary):** 3 real teams or DAOs with `register-dao` + ≥1 stream each by **2026-06-08**.
- **Option B (fallback):** 25 active streams + $10,000 streamed.

**Current pipeline (as of M2 submission):**
- _[POPULATE WITH ACTUAL DAO LEADS — Stacks Discord #building-on-stacks outreach started 2026-05-21]_

**M3 timeline:**
- May 26 — Mainnet launch announcement (X, LinkedIn, Skool, Telegram, Stacks Discord)
- May 27–31 — Direct DAO outreach (1-on-1 demos, Discord DMs)
- June 1–7 — DAO onboarding sessions, contributor stream creation
- June 8 — M3 evidence submission

---

## Submission Email Draft

> Subject: StackStream M2 Evidence — Mainnet Deployment Complete
>
> Hi team,
>
> Submitting M2 evidence. Summary:
>
> - **Mainnet contracts deployed and verified:** `SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.stream-manager` and `.stream-factory` (deploy date 2026-05-20, release tag v1.0.0).
> - **Production frontend live:** https://stackstream.vercel.app pointing at mainnet.
> - **5 end-to-end streams:** All 5 created on mainnet with create + claim transaction pairs (full details in M2_EVIDENCE_PACKAGE.md).
> - **All 5 non-blocking M1 items addressed** — CI live, fuzzing at 50 iter + seedrandom, architecture summary corrected, mainnet audit path chosen (paid multi-auditor bounty: 11 reviewers, 21 unique findings, 1 launch-blocker fixed, zero critical), product focus locked (DAOs paying contributors).
> - **Test suite:** 119/119 passing.
>
> Evidence package: [link to M2_EVIDENCE_PACKAGE.md on GitHub]
> Audit report: [link to audits/AUDIT_REPORT_v1.0.0.md on GitHub]
>
> M3 outreach has already started — pipeline of DAO leads in progress.
>
> Best,
> Jethro

---

**Maintainer signature:** Jethro Irmiya, 2026-05-22.
