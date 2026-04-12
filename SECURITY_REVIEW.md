# StackStream Security Review
**Version:** v1.0.0-rc1  
**Date:** April 12, 2026  
**Contracts reviewed:** `stream-manager.clar`, `stream-factory.clar`  
**Reviewer:** Jethro Mbata (author) — community review open (see below)

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
All authorization checks use `contract-caller`, not `tx-sender`. This is the correct choice: if a malicious intermediary contract wraps a call to StackStream, `contract-caller` will be that intermediary, not the original signer. This prevents principal spoofing through contract forwarding.

### 3. Integer overflow
Clarity `uint` operations abort on overflow rather than wrapping silently. The most sensitive calculation is the rate: `(/ (* deposit-amount PRECISION) duration-blocks)` where `PRECISION = 1e12`. For a token with 8 decimal places and a supply of 21 million (Bitcoin-scale), the maximum product is approximately `2.1 × 10²⁷` — well within Clarity's `uint` ceiling of `2¹²⁸ − 1 ≈ 3.4 × 10³⁸`. Overflow is not a practical concern.

### 4. Token substitution
Every function that accepts a `<sip-010-trait>` parameter verifies `(is-eq token-principal (contract-of token))` against the stream's stored token principal. A caller cannot substitute a different token contract after stream creation.

### 5. Stream ID safety
The stream nonce is monotonically increasing and never reused. Each new stream ID is `nonce + 1`, and the nonce is only updated after the stream is fully written to the map.

### 6. Precision and rounding
Streaming rates are stored with 12-digit precision: `rate = deposit * 1e12 / duration`. Claimable amounts are calculated as `elapsed * rate / 1e12`. This eliminates rounding drift in practice. An additional guard clamps streamed amounts to never exceed `deposit-amount`, handling any edge-case rounding upward.

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

**Token handling:** `contract-call? token transfer` moves tokens from the caller to `(as-contract tx-sender)` (the contract's own principal) immediately. If this transfer fails, the entire transaction reverts — no partial state is written.

**State written only after successful transfer:** Stream data, sender/recipient indexes, and nonce are all updated after the `try!` on the token transfer. This is the correct ordering.

**Finding:** None. Logic is correct.

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

**Pause interaction:** A paused stream can be claimed. `calculate-effective-elapsed` freezes elapsed time at `paused-at-block` when the stream is paused. This means the recipient can claim what was earned up to the pause point even while the sender has paused the stream. This is the correct and fair behavior.

**Partial claims:** The `amount` parameter is honored if less than `claimable`. If `amount > claimable`, the actual claimable balance is used. This prevents requesting more than available.

**Depletion:** When `new-withdrawn == deposit`, the stream status is set to `STATUS-DEPLETED` atomically.

**Finding:** None. Logic is correct.

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
| `status != CANCELLED` | Redundant with above — acceptable defense-in-depth |
| `status != DEPLETED` | Redundant with above |
| `current-block < end-block` | Cannot pause an already-ended stream |

**State written:** `status = PAUSED`, `paused-at-block = current-block`.

**Finding:** The CANCELLED and DEPLETED checks are redundant given the `status == ACTIVE` assertion above them. Not a security issue — they add no risk — but they are logically unnecessary. Noted for code clarity; no action required before mainnet.

---

### 5. `resume-stream`

**Purpose:** Resume accrual from a paused stream (sender only).

**Authorization:** Only `sender`.

**Checks:**
| Check | Protection |
|---|---|
| `caller == sender` | Authorization |
| `status == PAUSED` | Can only resume paused streams |

**Pause duration accounting:** `pause-duration = current-block - paused-at-block`. This is added to `total-paused-duration`, which is subtracted from elapsed time in all balance calculations. Across multiple pause/resume cycles, the cumulative paused duration is correctly tracked.

**Note:** There is no check that `current-block >= paused-at-block`. In practice this is guaranteed because block height is monotonically increasing, but Clarity would abort on underflow if this were violated rather than produce a wrong result.

**Finding:** None. Pause accounting is correct across N cycles.

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

**Fund accounting:**
```
recipient-amount = streamed - withdrawn   (what recipient earned but hasn't claimed)
sender-refund    = deposit  - streamed    (unstreamed portion)
```

Invariant check: `recipient-amount + sender-refund = deposit - withdrawn`. This equals the total tokens held in escrow for this stream at cancel time. The accounting is correct.

**Zero-amount transfers:** Both `recipient-amount` and `sender-refund` are conditionally transferred only if `> 0`. This prevents unnecessary zero-value token calls.

**Important UX note:** After cancellation, the recipient cannot call `claim` (ERR-STREAM-CANCELLED). Their earned amount is automatically sent by the cancellation transaction itself. Recipients do not need to take action.

**Finding:** None. Accounting is correct and conservation holds.

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

**Rate preservation:** Additional blocks = `amount * PRECISION / rate`. Since rate was calculated as `deposit * PRECISION / duration`, this correctly computes how many blocks the new amount extends the stream. The streaming rate remains constant.

**Division safety:** `rate` cannot be zero because `create-stream` requires `deposit > 0` and `duration > 0`, making `rate = deposit * PRECISION / duration >= 1`.

**Note:** Top-up is allowed on PAUSED streams. The extension is applied to `end-block`, which will take effect when the stream resumes. This is correct behavior.

**Finding:** None.

---

### 8. `set-emergency-pause`

**Purpose:** Circuit breaker — stops new stream creation without affecting existing streams.

**Authorization:** Only `CONTRACT-OWNER` (set to `tx-sender` at deploy time = deployer address).

**Scope:** Blocks `create-stream` only. Existing streams continue to accrue. Recipients can still claim. Senders can still cancel. This is the correct narrow scope — an emergency pause should stop new exposure, not freeze user funds.

**Centralization note:** `CONTRACT-OWNER` is a single key. This is an accepted tradeoff for v1. If the deployer key is compromised, the attacker can prevent new streams but cannot access escrowed funds (the emergency pause function has no fund-withdrawal capability).

**Finding:** The emergency pause is appropriately scoped. Deployer key security is the operator's responsibility.

---

## Public Function Analysis — `stream-factory.clar`

### `register-dao`
Validates non-empty name, uniqueness of both the principal and the name string, then writes to two maps (forward and reverse lookup). No funds involved. No security concerns.

### `update-dao-name`
Caller must be a registered DAO admin. Validates new name is non-empty and not taken. Atomically removes old name mapping and writes new one. Correct.

### `deactivate-dao`
Soft-delete only. Sets `is-active: false`. Name mapping remains (preventing name reuse by others after deactivation). No funds involved. No security concerns.

### `track-stream`
Calls `stream-manager.get-stream` to verify the stream exists and that `contract-caller` is the stream's `sender`. This prevents a DAO from claiming credit for another team's streams. The `total-deposited` analytics field is updated from on-chain data, not user input. Correct.

---

## Findings Summary

| Severity | Count | Description |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 0 | — |
| Low | 1 | Redundant status checks in `pause-stream` (lines 386–387) — no security impact |
| Informational | 1 | `CONTRACT-OWNER` is a single key — accepted tradeoff for v1 |

**No vulnerabilities found.** The contracts are considered ready for mainnet deployment subject to the checklist below.

---

## Mainnet Deployment Checklist

### Pre-deployment
- [ ] All 103 tests passing on Clarinet simnet: `npm test`
- [ ] Contracts compile without warnings: `clarinet check`
- [ ] `CONTRACT-OWNER` key stored securely (hardware wallet or multisig recommended)
- [ ] Emergency pause procedure documented: who triggers it, under what conditions
- [ ] Frontend environment variables updated for mainnet contract addresses
- [ ] Post-condition mode confirmed as `allow` for `create-stream` and `top-up-stream` (tokens leave wallet), `deny` for claim/cancel (tokens come to wallet)

### Deployment order
1. Deploy `sip-010-trait.clar`
2. Deploy `stream-manager.clar`
3. Deploy `stream-factory.clar`
4. Verify contracts on Stacks Explorer
5. Update `.env.production` with mainnet contract addresses
6. Smoke-test: create one stream, claim partial, pause, resume, cancel

### Post-deployment verification
- [ ] `get-stream-nonce` returns `u0` (clean state)
- [ ] `is-emergency-paused` returns `false`
- [ ] `get-dao-count` returns `u0`
- [ ] Create a small test stream with a non-critical amount and verify all state transitions
- [ ] Verify frontend correctly reads mainnet contract state (not testnet)

---

## Community Review

This review was conducted by the contract author. Independent review is requested before mainnet launch.

**GitHub Issue:** [Link will be added when issue is opened]  
**Review period:** April 12 – April 15, 2026 (60-hour window)  
**Scope:** Authorization logic, arithmetic safety, state transition correctness, token handling  
**Contact:** Open a comment on the GitHub issue or DM `@jayteemoney` on X

Reviewers who identify valid findings will be credited in the v1.0.0 release notes.
