


# StackStream Security Review
**Version:** v1.0.0-rc1  
**Date:** April 12, 2026  
**Updated:** April 13, 2026 (community review findings incorporated)  
**Contracts reviewed:** `stream-manager.clar`, `stream-factory.clar`  
**Author review:** Jethro Mbata  
**Community reviewers:** Marvy247, Sobilo34, Akanmoh Johnson  

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
| `current-block < end-block` | Cannot pause an already-ended stream |

**Finding L-3 (confirmed):** The CANCELLED and DEPLETED checks are unreachable given the `status == ACTIVE` assertion. No security impact. Deferred to v1.1 cleanup.

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

---

### 7. `top-up-stream`

**Purpose:** Add more tokens to an existing stream, extending its duration at the same rate.

**Authorization:** Only `sender`.

**Checks:**
| Check | Protection |
|---|---|
| `caller == sender` | Authorization |
| `amount > 0` | Prevents zero top-up |
| `token-principal == contract-of token` | Token substitution prevention |
| `status != CANCELLED` | Cannot top up cancelled stream |
| `status != DEPLETED` | Cannot top up depleted stream |

**Authorization ordering (Marvy247):** Same pattern as `claim` — auth check runs after `let` bindings due to Clarity semantics. Gas concern only, no security impact. Clarifying comments added.

**Rate preservation — verified by Akanmoh Johnson:** `additional_blocks = top_up * PRECISION / rate`. Since `rate = deposit * PRECISION / duration`, this correctly extends the end block while keeping rate constant. The rounding dust limitation from Finding L-1 also applies to the extended portion.

**Division safety:** `rate` cannot be zero — `create-stream` now enforces `deposit * PRECISION >= duration` ensuring `rate >= 1`.

**Fix applied (Godbrand0 — L-8):** When `amount × PRECISION < rate-per-block`, integer division truncates `additional-blocks` to zero. The sender's tokens transfer to escrow but `end-block` is unchanged — the topped-up tokens silently exceed the stream's claimable ceiling and become permanently unreachable by the recipient (recoverable only by sender via `cancel-stream`). Fixed by adding a guard before the token transfer:
```clarity
(asserts! (>= (* amount PRECISION) rate) ERR-INVALID-AMOUNT)
```
This mirrors the zero-rate guard added in `create-stream` and rejects any top-up too small to extend the stream by at least 1 block.

---

### 8. `set-emergency-pause`

**Purpose:** Circuit breaker — stops new stream creation without affecting existing streams.

**Authorization:** Only `CONTRACT-OWNER` (set to `tx-sender` at deploy time).

**Scope:** Blocks `create-stream` only. Existing streams continue to accrue, recipients can claim, senders can cancel. Confirmed correct scope by Akanmoh Johnson.

**Design rationale re: claim pausing (Ali6nXI):** A community reviewer asked whether a true emergency should also pause claims. The answer is no — by design. Pausing claims would hold existing user funds hostage during an incident, which is a worse outcome than the original emergency. The philosophy: an emergency pause stops new capital from entering while guaranteeing all existing participants can always exit. For v2, a graduated pause model could be considered, but is out of scope for v1.

**Finding I-2 (confirmed):** `CONTRACT-OWNER` is a constant — non-transferable and cannot be upgraded to multisig. Accepted for v1. If the deployer key is compromised, the attacker can toggle the pause but cannot access escrowed funds. The use of `contract-caller` (not `tx-sender`) means a phishing contract cannot invoke this function on the owner's behalf. Noted for v2 multisig upgrade.

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

### Totals
| Severity | Count | Fixed | Documented/Deferred |
|---|---|---|---|
| Critical | 0 | — | — |
| High | 0 | — | — |
| Medium | 0 | — | — |
| Low | 7 | 2 (L-4, L-7) | 5 |
| Informational | 3 | — | 3 |

**No critical, high, or medium vulnerabilities found.** Two low-severity findings fixed before mainnet. Remaining findings are documented limitations with no fund-safety impact.

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

---

All findings from the community review have been reviewed, addressed where applicable, and documented. The contracts are considered ready for mainnet deployment.
