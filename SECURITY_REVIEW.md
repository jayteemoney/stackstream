


# StackStream Security Review
**Version:** v1.0.0-rc1  
**Date:** April 12, 2026  
**Updated:** April 14, 2026 (IdokoMarcelina review incorporated — L-12 defensive hardening)  
**Contracts reviewed:** `stream-manager.clar`, `stream-factory.clar`  
**Author review:** Jethro Mbata  
**Community reviewers:** Marvy247, Sobilo34, Akanmoh Johnson, Ali6nXI, Godbrand0, dannyy2000, Zachyo, IdokoMarcelina  

---

## Overview

This document is a function-by-function security analysis of StackStream's smart contracts, prepared as part of Milestone 1 of the Stacks Endowment grant. The review covers authorization, state management, arithmetic safety, and token handling for all public functions.

Both contracts are written in Clarity v3 on Stacks (Epoch 3.0). Clarity's design properties — decidability, no reentrancy, no dynamic dispatch — eliminate entire categories of vulnerability present in EVM contracts. This review focuses on the application-level logic above those guarantees.

---

## Contract Architecture

```
stream-manager.clar  (736 lines)
  8 public functions — core streaming logic, escrow, access control
  12 read-only functions — balance queries, stream data
  1 admin function — emergency circuit breaker

stream-factory.clar  (218 lines)
  4 public functions — DAO registry, stream tracking
  4 read-only functions — registry queries
```

Tokens are escrowed directly in `stream-manager`. The factory is a pure registry — it holds no funds and has no privileged access to stream-manager.

---

## Security Properties (Global)

### 1. Reentrancy
**Not possible.** Clarity's execution model forbids reentrancy at the language level. A contract cannot be re-entered mid-execution. No mitigations required.

### 2. Authorization model — `tx-sender` vs `contract-caller`
All authorization checks use `contract-caller`, not `tx-sender`. This is the correct choice: if a malicious intermediary contract wraps a call to StackStream, `contract-caller` will be that intermediary, not the original signer. This prevents principal spoofing through contract forwarding. Confirmed correct by all three community reviewers.

### 3. Integer overflow
Clarity `uint` operations abort on overflow rather than wrapping silently. The most sensitive calculation is the rate: `(/ (* deposit-amount PRECISION) duration-blocks)` where `PRECISION = 1e12`. For a token with 8 decimal places and a supply of 21 million (Bitcoin-scale), the maximum product is approximately `2.1 × 10²⁷` — well within Clarity's `uint` ceiling of `2¹²⁸ − 1 ≈ 3.4 × 10³⁸`. Overflow is not a practical concern. Confirmed by Akanmoh Johnson.

### 4. Token substitution
Every function that accepts a `<sip-010-trait>` parameter verifies `(is-eq token-principal (contract-of token))` against the stream's stored token principal. A caller cannot substitute a different token contract after stream creation. Confirmed correct by Akanmoh Johnson.

### 5. Stream ID safety
The stream nonce is monotonically increasing and never reused. Each new stream ID is `nonce + 1`, and the nonce is only updated after the stream is fully written to the map.

### 6. Precision and rounding
Streaming rates are stored with 12-digit precision: `rate = deposit * 1e12 / duration`. Claimable amounts are calculated as `elapsed * rate / 1e12`. An additional guard clamps streamed amounts to never exceed `deposit-amount`. See Finding L-1 for known rounding dust behaviour.

### 7. `stacks-block-height` usage
The contracts correctly use `stacks-block-height` throughout — the Clarity 3 replacement for the deprecated `block-height` keyword. Using `block-height` post-Nakamoto would return tenure-height semantics and break all time-based calculations. Confirmed correct by Akanmoh Johnson.

---

## Public Function Analysis — `stream-manager.clar`

### 1. `create-stream`

**Purpose:** Escrow tokens and initialize a new payment stream.

**Authorization:** Any principal can create a stream. No whitelist required.

**Checks (in order):**
| Check | Protection |
|---|---|
| `emergency-paused` flag | Global circuit breaker stops new streams during incidents |
| `deposit-amount > 0` | Prevents zero-value stream creation |
| `duration-blocks > 0` | Prevents division-by-zero in rate calculation |
| `start-block >= stacks-block-height` | Prevents streams starting in the past |
| `recipient != contract-caller` | Sender cannot stream to themselves |
| `recipient != (as-contract tx-sender)` | Contract cannot be set as its own recipient |
| `sender-stream-count < 100` | DoS limit: max 100 streams per sender |
| `recipient-stream-count < 100` | DoS limit: max 100 streams per recipient |
| `deposit * PRECISION >= duration-blocks` | **Added post-review:** prevents zero rate-per-block (Sobilo34) |

**Token handling:** `contract-call? token transfer` moves tokens from the caller to `(as-contract tx-sender)` immediately. If this transfer fails, the entire transaction reverts — no partial state is written. Confirmed correct by Akanmoh Johnson.

**Known limitation (L-1):** When `deposit-amount` is not perfectly divisible by `duration-blocks`, integer division truncates the rate, leaving a sub-satoshi dust amount permanently locked unless the sender calls `cancel-stream` after the stream elapses. See Finding L-1.

**Token trust model documented (IdokoMarcelina — I-3):** Any SIP-010 compliant token is accepted — there is no allowlist. This is a deliberate design choice for a permissionless protocol. Clarity's trait system guarantees the SIP-010 interface at the language level (all required functions must exist and return the correct types). Clarity's no-reentrancy model eliminates the primary dangerous-token attack vector present in EVM contracts. Residual risks that are documented and accepted: (1) a token whose `transfer` always returns `(ok true)` but moves no funds — the stream would exist but never pay the recipient; (2) fee-on-transfer tokens — the contract would receive less than `deposit-amount`, making the escrow underfunded. Parties streaming unusual tokens should verify token behavior off-chain. A token allowlist is a v2 governance consideration for any DAO-controlled deployment.

---

### 2. `claim`

**Purpose:** Transfer earned tokens to the recipient.

**Authorization:** Only `recipient` (verified against stored stream data via `contract-caller`).

**Checks:**
| Check | Protection |
|---|---|
| `caller == recipient` | Only recipient can claim |
| `status != CANCELLED` | Cannot claim from a cancelled stream |
| `claim-amount > 0` | Prevents zero-amount transfers |
| `token-principal == contract-of token` | Token substitution prevention |

**Authorization ordering (Marvy247):** The community review noted that the authorization assertion executes after the `let` block computes elapsed time and claimable values. In Clarity, `let` bindings are eagerly evaluated, so the auth check runs after calculations. This is a gas efficiency concern only — no funds are at risk since no state is written and no transfers occur before the auth check in the function body. Clarifying comments added.

**Pause interaction:** A paused stream can be claimed. `calculate-effective-elapsed` freezes elapsed time at `paused-at-block`, so the recipient claims only what accrued before the pause. Confirmed correct and fair by Akanmoh Johnson.

**Depletion:** When `new-withdrawn == deposit`, the stream status is set to `STATUS-DEPLETED` atomically.

---

### 3. `claim-all`

**Purpose:** Convenience wrapper — claims all currently available tokens.

**Implementation:** Calls `claim` with `u340282366920938463463374607431768211455` (max `uint`). Since `claim` uses `min(amount, claimable)`, this safely claims exactly the available balance.

**Finding:** None. Correct implementation.

---

### 4. `pause-stream`

**Purpose:** Freeze stream accrual (sender only).

**Authorization:** Only `sender`.

**Checks:**
| Check | Protection |
|---|---|
| `caller == sender` | Authorization |
| `status == ACTIVE` | Can only pause active streams |
| `status != CANCELLED` | Redundant — confirmed by Akanmoh Johnson (see L-3) |
| `status != DEPLETED` | Redundant — confirmed by Akanmoh Johnson (see L-3) |
| `current-block >= start-block` | **Added post-review:** prevents pausing before stream starts (dannyy2000) |
| `current-block < end-block` | Cannot pause an already-ended stream |

**Finding L-3 (confirmed):** The CANCELLED and DEPLETED checks are unreachable given the `status == ACTIVE` assertion. No security impact. Deferred to v1.1 cleanup.

**Fix applied (dannyy2000 — L-9):** Without the start-block guard, a sender could pause a stream before `start-block` is reached. When they later resume, the full wall-clock pause duration — including pre-start time when nothing was accruing — is added to `total-paused-duration`. This overcounts the pause, shortening the recipient's effective streaming window. Example: stream starts at block 200, sender pauses at block 190, resumes at block 260 — 10 pre-start blocks are counted as pause time, permanently reducing recipient's claimable window by 10 blocks. Fix: `(asserts! (>= current-block start-block) ERR-INVALID-START-TIME)` before the pause is recorded.

---

### 5. `resume-stream`

**Purpose:** Resume accrual from a paused stream (sender only).

**Authorization:** Only `sender`.

**Checks:**
| Check | Protection |
|---|---|
| `caller == sender` | Authorization |
| `status == PAUSED` | Can only resume paused streams |
| `current-block < end-block` | **Added post-review:** prevents resuming after stream has ended (Marvy247) |

**Fix applied (Marvy247):** Without the end-block guard, a sender could resume a paused stream after its natural end time, leaving it in STATUS-ACTIVE indefinitely with no further accrual — a zombie state. The fix correctly rejects the resume with `ERR-STREAM-ENDED`. The recipient can still claim all earned tokens via `claim`, which is unaffected.

**Pause duration accounting:** `pause-duration = current-block - paused-at-block`. This is added to `total-paused-duration`, which is subtracted from elapsed time in all balance calculations. Verified correct across N cycles by Akanmoh Johnson's arithmetic analysis.

---

### 6. `cancel-stream`

**Purpose:** Terminate a stream, paying the recipient what was earned and refunding the remainder to the sender.

**Authorization:** Only `sender`.

**Checks:**
| Check | Protection |
|---|---|
| `caller == sender` | Authorization |
| `status != CANCELLED` | Idempotency guard |
| `status != DEPLETED` | Cannot cancel a fully-paid stream |
| `token-principal == contract-of token` | Token substitution prevention |

**Fund accounting — verified by Akanmoh Johnson:**
```
recipient-amount = streamed - withdrawn   (earned but unclaimed)
sender-refund    = deposit  - streamed    (unstreamed)
total outgoing   = deposit  - withdrawn   (equals escrow balance) ✓
```

Conservation holds on every exit path. Zero-amount transfers are conditionally skipped.

**Trust assumption documented (Zachyo — L-11):** `cancel-stream` is callable by the sender at any time, including while the stream is STATUS-PAUSED. This is correct by design — the sender can always reclaim unstreamed tokens. However, it means streams are a revocable commitment: a sender can pause immediately after creation and cancel, recovering nearly the full deposit. Recipients must trust the sender not to pause-cancel arbitrarily. There is no minimum lock-in period or non-cancellable flag in v1. This is not a bug — it is a documented trust model. Recipients who require stronger guarantees should agree off-chain on stream parameters before funds are deposited. A non-cancellable flag is a v2 consideration.

---

### 7. `expire-stream` *(new — added post-review)*

**Purpose:** Permissionless settlement of a paused stream after its end-block has passed.

**Authorization:** None — callable by anyone once conditions are met.

**Checks:**
| Check | Protection |
|---|---|
| `status == PAUSED` | Only resolves stuck paused streams; active/depleted/cancelled have other paths |
| `stacks-block-height >= end-block` | Streaming window must be closed — sender can no longer resume |
| `token-principal == contract-of token` | Token substitution prevention |

**Fund accounting:** Identical to `cancel-stream` — earned tokens to recipient, unearned remainder back to sender. Conservation holds on all exit paths.

**Design rationale (M-1 fix):** See Finding M-1. The L-4 fix correctly blocks `resume-stream` past end-block to prevent zombie ACTIVE state, but this created a new stuck-funds path: a sender who pauses and then goes silent locks the unearned portion permanently — `cancel-stream` is sender-only, `resume-stream` is now blocked, and no admin override exists. `expire-stream` is the minimal recovery function that resolves this without granting any party new powers over a live stream.

---

### 8. `top-up-stream`

**Purpose:** Add more tokens to an existing stream, extending its duration at the same rate.

**Authorization:** Only `sender`.

**Checks:**
| Check | Protection |
|---|---|
| `caller == sender` | Authorization |
| `amount > 0` | Prevents zero top-up |
| `token-principal == contract-of token` | Token substitution prevention |
| `rate-per-block > 0` | **Added post-review:** defensive guard before division (IdokoMarcelina) |
| `status != CANCELLED` | Cannot top up cancelled stream |
| `status != DEPLETED` | Cannot top up depleted stream |
| `stacks-block-height < end-block` | **Added post-review:** prevents topping up an expired stream (Zachyo) |

**Authorization ordering (Marvy247):** Same pattern as `claim` — auth check runs after `let` bindings due to Clarity semantics. Gas concern only, no security impact. Clarifying comments added.

**Rate preservation — verified by Akanmoh Johnson:** `additional_blocks = top_up * PRECISION / rate`. Since `rate = deposit * PRECISION / duration`, this correctly extends the end block while keeping rate constant. The rounding dust limitation from Finding L-1 also applies to the extended portion.

**Division safety:** `rate` cannot be zero — `create-stream` now enforces `deposit * PRECISION >= duration` ensuring `rate >= 1`.

**Defensive hardening (IdokoMarcelina — L-12):** IdokoMarcelina flagged that `top-up-stream` performed `(/ (* amount PRECISION) rate)` without an explicit zero-rate guard, submitting this as a High severity finding. The finding is correct in identifying the absence of a local guard, but the severity is downgraded to Low: `rate` is initialized by `create-stream` and the L-7 fix (`deposit * PRECISION >= duration`) guarantees `rate >= 1` — it cannot be zero for any stream that exists in the map. The root issue is also structural: the division was previously in the `let` binding, meaning any assertion in the function body would run too late to prevent it. Fixed by restructuring `top-up-stream` into two nested `let` blocks — the outer let reads stream data and runs all assertions, then the inner let performs the division once `rate > 0` is confirmed. The guard `(asserts! (> rate u0) ERR-INVALID-DURATION)` is now defensive hardening that makes this function self-contained regardless of any upstream invariant.

**Fix applied (Godbrand0 — L-8):** When `amount × PRECISION < rate-per-block`, integer division truncates `additional-blocks` to zero. The sender's tokens transfer to escrow but `end-block` is unchanged — the topped-up tokens silently exceed the stream's claimable ceiling and become permanently unreachable by the recipient (recoverable only by sender via `cancel-stream`). Fixed by adding a guard before the token transfer:
```clarity
(asserts! (>= (* amount PRECISION) rate) ERR-INVALID-AMOUNT)
```
This mirrors the zero-rate guard added in `create-stream` and rejects any top-up too small to extend the stream by at least 1 block.

**Fix applied (Zachyo — L-10):** `top-up-stream` did not check whether the stream's window had already closed. This allowed a sender to top up a paused-and-expired stream, extending `end-block` into the future and making `resume-stream` callable again — bypassing `expire-stream`'s permissionless settlement path. Fixed by adding:
```clarity
(asserts! (< stacks-block-height end-block) ERR-STREAM-ENDED)
```
Pausing a not-yet-expired stream and then topping it up remains valid (sender is adding funds, recipient benefits). Only the expired case is now blocked.

---

### 8. `set-emergency-pause`

**Purpose:** Circuit breaker — stops new stream creation without affecting existing streams.

**Authorization:** Only `contract-owner` (stored as a `define-data-var`, initialized to deployer at deploy time).

**Scope:** Blocks `create-stream` only. Existing streams continue to accrue, recipients can claim, senders can cancel. Confirmed correct scope by Akanmoh Johnson.

**Design rationale re: claim pausing (Ali6nXI):** A community reviewer asked whether a true emergency should also pause claims. The answer is no — by design. Pausing claims would hold existing user funds hostage during an incident, which is a worse outcome than the original emergency. The philosophy: an emergency pause stops new capital from entering while guaranteeing all existing participants can always exit. For v2, a graduated pause model could be considered, but is out of scope for v1.

**Finding I-2 (superseded by M-2 fix):** Previously `CONTRACT-OWNER` was a `define-constant` — non-transferable and non-rotatable without redeployment. Zachyo (M-2) identified two additional problems: (1) if the contract is redeployed by a different address, `CONTRACT-OWNER` silently changes to that new deployer; (2) there was no on-chain way to identify the current owner without reading the constant. Fixed: `contract-owner` is now a `define-data-var` initialized to `tx-sender` at deploy time, with a `transfer-ownership` function guarded by the current owner and a `get-contract-owner` read-only query. Key rotation is now possible without redeployment. Multisig upgrade still deferred to v2 (the new owner can be set to a multisig principal via `transfer-ownership`).

**`transfer-ownership` function:** Only the current owner can call this. Emits an `ownership-transferred` event with previous and new owner. The previous owner immediately loses all admin access.

---

## Public Function Analysis — `stream-factory.clar`

### `register-dao`
Validates non-empty name, uniqueness of principal and name string, writes to forward and reverse lookup maps. No funds involved. No security concerns.

### `update-dao-name`
Caller must be a registered DAO admin. Validates new name non-empty and not taken. Atomically removes old name mapping and writes new one. Correct.

### `deactivate-dao`
Soft-delete only. Sets `is-active: false`. Name mapping remains, preventing name reuse after deactivation. No funds involved.

### `track-stream`
Verifies stream exists and `contract-caller` is the stream's sender before updating analytics. Prevents a DAO from claiming credit for another team's streams. See Finding I-1 for analytics staleness after top-up.

---

## Findings Summary

### Pre-community-review (self-audit)
| ID | Severity | Function | Description | Status |
|---|---|---|---|---|
| L-3 | Low | `pause-stream` | Redundant status checks — unreachable code | Acknowledged, deferred |
| I-2 | Informational | `set-emergency-pause` | Single non-transferable `CONTRACT-OWNER` key | Accepted for v1 |

### Community review findings
| ID | Severity | Function | Reviewer | Description | Status |
|---|---|---|---|---|---|
| L-4 | Low | `resume-stream` | Marvy247 | Resume allowed after end-block — zombie ACTIVE state | **Fixed** |
| L-5 | Low | `claim` | Marvy247 | Auth check runs after `let` calculations — gas concern only | Documented |
| L-6 | Low | `top-up-stream` | Marvy247 | Same auth ordering pattern as `claim` | Documented |
| L-7 | Low | `create-stream` | Sobilo34 | Zero rate-per-block possible with tiny deposit + huge duration | **Fixed** |
| L-1 | Low | `create-stream` | Akanmoh Johnson | Rounding dust permanently locked when deposit % duration ≠ 0 | Documented — recover via `cancel-stream` |
| L-2 | Low | `create-stream` | Akanmoh Johnson | 100-stream cap is lifetime per principal, not concurrent | Documented — v2 improvement |
| I-1 | Informational | `track-stream` | Akanmoh Johnson | DAO `total-deposited` stale after top-up | Accepted — analytics only |
| L-8 | Low | `top-up-stream` | Godbrand0 | Zero-extension top-up: tokens trapped if amount too small to extend by 1 block | **Fixed** |
| M-1 | Medium | `pause-stream` / general | dannyy2000 | Paused stream past end-block — unearned portion permanently locked, no permissionless recovery | **Fixed** — new `expire-stream` function |
| L-9 | Low | `pause-stream` | dannyy2000 | Pre-start pause overcounts pause duration, shortening recipient's effective window | **Fixed** — start-block guard added |
| M-2 | Medium | `set-emergency-pause` | Zachyo | `CONTRACT-OWNER` was a constant — silent change on redeploy, no key rotation possible | **Fixed** — converted to `define-data-var` + `transfer-ownership` |
| L-10 | Low | `top-up-stream` | Zachyo | Top-up on paused-and-expired stream extends end-block, bypassing `expire-stream` | **Fixed** — end-block guard added |
| L-11 | Low | `cancel-stream` | Zachyo | Streams are a revocable commitment — sender can pause-cancel at any time | Documented — design decision, not a bug |
| L-12 | Low | `top-up-stream` | IdokoMarcelina | No explicit rate > 0 guard before division (submitted as High — downgraded, rate=0 impossible given L-7) | **Fixed** — defensive guard added, function restructured into nested lets |
| I-3 | Informational | `create-stream` | IdokoMarcelina | No token allowlist — any SIP-010 compliant contract accepted (submitted as Medium — downgraded) | Documented — permissionless design; Clarity trait system + no-reentrancy covers the primary risks |
| I-4 | Informational | `pause-stream` | IdokoMarcelina | `ERR-STREAM-PAUSED` returned for unreachable cancelled/depleted branches | Duplicate of L-3 — confirmed unreachable dead code, deferred to v1.1 cleanup |

### Totals
| Severity | Count | Fixed | Documented/Deferred |
|---|---|---|---|
| Critical | 0 | — | — |
| High | 0 | — | — |
| Medium | 2 | 2 (M-1, M-2) | 0 |
| Low | 12 | 6 (L-4, L-7, L-8, L-9, L-10, L-12) | 6 |
| Informational | 5 | — | 5 |

**No critical or high vulnerabilities found.** Both medium findings fixed. All fund-safety issues resolved before mainnet.

---

## Mainnet Deployment Checklist

### Pre-deployment
- [ ] All tests passing on Clarinet simnet: `npm test`
- [ ] Contracts compile without warnings: `clarinet check`
- [ ] `CONTRACT-OWNER` key stored securely (hardware wallet recommended)
- [ ] Emergency pause procedure documented
- [ ] Frontend environment variables updated for mainnet contract addresses
- [ ] Post-condition mode confirmed: `allow` for `create-stream` and `top-up-stream`, `deny` for claim/cancel

### Deployment order
1. Deploy `sip-010-trait.clar`
2. Deploy `stream-manager.clar`
3. Deploy `stream-factory.clar`
4. Verify contracts on Stacks Explorer
5. Update `.env.production` with mainnet contract addresses
6. Smoke-test: create one stream, claim partial, pause, resume, cancel

### Post-deployment verification
- [ ] `get-stream-nonce` returns `u0`
- [ ] `is-emergency-paused` returns `false`
- [ ] `get-dao-count` returns `u0`
- [ ] Create a small test stream and verify all state transitions
- [ ] Verify frontend reads mainnet contract state correctly

---

## Community Review

**GitHub Issue:** https://github.com/jayteemoney/stackstream/issues/1  
**Review period:** April 12 – April 15, 2026 (60-hour window)  
**Contact:** `@dev_jayteee` on X

### Reviewer 1 — Marvy247
**Date:** April 13, 2026  
**Method:** Pull request — `security/community-review-fixes` branch  
**Findings:** L-4 (resume past end-block — **fixed**), L-5 (auth ordering in `claim` — documented), L-6 (auth ordering in `top-up-stream` — documented)  
**Verdict:** No critical or high issues. Two defensive improvements applied.

### Reviewer 2 — Sobilo34
**Date:** April 12, 2026  
**Method:** Pull request — commit `72ce254`  
**Findings:** L-7 (zero rate-per-block — **fixed**). Added a test case confirming the fix.  
**Verdict:** Single edge-case finding, correctly identified and patched.

### Reviewer 3 — Akanmoh Johnson
**Date:** April 13, 2026  
**Method:** Line-by-line review posted on GitHub Issue #1  
**Scope:** Full review of both contracts against Clarity v3 / Epoch 3.0 best practices  
**Findings:** L-1 (rounding dust), L-2 (lifetime stream cap), L-3 confirmed, I-1 (factory analytics), I-2 confirmed  
**Positive confirmations:** `contract-caller` authorization model, `stacks-block-height` usage, token substitution prevention, `try!` on all transfers, state-after-transfer ordering, arithmetic overflow safety, streamed amount clamp, emergency pause scoping, state machine correctness  
**Verdict:** "StackStream's contracts demonstrate strong security engineering for a v1 Clarity protocol. The two new findings are both Low severity and neither blocks mainnet launch."

### Reviewer 4 — Ali6nXI
**Date:** April 13, 2026  
**Method:** Comment on GitHub Issue #1  
**Findings:** Design question on `set-emergency-pause` scope — should claims be pausable during emergencies?  
**Design rationale documented:** Emergency pause intentionally blocks only `create-stream`. Pausing claims during an incident would hold existing user funds hostage — a worse outcome than the emergency itself. The philosophy: stop new capital entering, guarantee existing participants can always exit.  
**Verdict:** No security issue raised. Design rationale documented in review.

### Reviewer 5 — Godbrand0
**Date:** April 13, 2026  
**Method:** Comment on GitHub Issue #1  
**Findings:** L-8 (zero-extension top-up — **fixed**): amounts too small to extend the stream by 1 block are silently accepted, trapping tokens in escrow unreachable by the recipient.  
**Verdict:** Real edge case, correctly identified. One-line guard added before token transfer.

### Reviewer 6 — dannyy2000
**Date:** April 13, 2026  
**Method:** Comment on GitHub Issue #1  
**Scope:** Full review of `pause-stream`, `resume-stream`, `cancel-stream`, and general fund-safety design  
**Findings:** M-1 (paused-stream stuck-funds — **fixed via new `expire-stream` function**), L-9 (pre-start pause overcounting — **fixed**)  
**Design impact:** M-1 is the highest-severity finding of the first wave of reviews. It identified a systemic gap where the L-4 fix (correct in isolation) created a new stuck-funds path with no recovery option. The fix adds a permissionless `expire-stream` function — any party can trigger settlement once `end-block` has passed and the stream is still paused. L-9 closes a window where pre-start pause time is incorrectly counted against the recipient's streaming window.  
**Verdict:** Two genuine improvements, both fixed. "The expire-stream addition is the right architectural response — minimal surface area, no new trust assumptions, and it closes the gap completely."

### Reviewer 7 — Zachyo
**Date:** April 14, 2026  
**Method:** Independent review of both contracts  
**Scope:** Full review of `stream-manager.clar` and `stream-factory.clar`  
**Findings:** M-2 (`CONTRACT-OWNER` as constant — silent redeploy risk, no key rotation — **fixed**), L-10 (top-up on expired paused stream bypasses `expire-stream` — **fixed**), L-11 (`cancel-stream` revocability trust assumption — documented)  
**Design impact:** M-2 closes an operational risk that would have been hard to discover post-mainnet: if a deployment script ever ran under a different key, ownership would silently shift. Converting to `define-data-var` + `transfer-ownership` also unblocks a v2 multisig migration path without redeployment. L-10 closes the last known interaction between `top-up-stream` and `expire-stream`.  
**Verdict:** "Completed an independent review of stream-manager.clar and stream-factory.clar. No critical or high findings. One medium and two low findings."

### Reviewer 8 — IdokoMarcelina
**Date:** April 14, 2026  
**Method:** Comment on GitHub Issue #1  
**Findings:** L-12 (no explicit rate > 0 guard before division in `top-up-stream` — submitted as High, downgraded to Low, **fixed**), I-3 (no token allowlist — submitted as Medium, downgraded to Informational, documented), I-4 (error reuse in `pause-stream` — duplicate of existing L-3)  
**Severity reassessments:** The High on `top-up-stream` is correct in identifying the structural issue (division in a let binding with no local guard) but overstates the severity — `rate = 0` is impossible given the L-7 fix in `create-stream`. The Medium on `create-stream` token acceptance is a documented trust model in permissionless DeFi; Clarity's trait system and reentrancy prevention eliminate the most serious malicious-token scenarios. The structural refactoring of `top-up-stream` into nested lets (prompted by this review) is a genuine improvement regardless of severity.  
**Verdict:** Three substantive observations. One code improvement applied. Two appropriately reclassified and documented.

---

All findings from the community review have been reviewed, addressed where applicable, and documented. The contracts are considered ready for mainnet deployment.
