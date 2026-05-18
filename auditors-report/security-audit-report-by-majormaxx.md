# StackStream Security Audit Report
**Version reviewed:** v1.0.0-rc1  
**Date:** May 18, 2026  
**Contracts reviewed:** `stream-manager.clar`, `stream-factory.clar`  
**Reviewer:** Majormaxx  
**Method:** Independent review of both contracts, all prior audit PRs and findings, full test suite run, manual trace of arithmetic and state-transition paths

---

## Scope

This review covers `stream-manager.clar` and `stream-factory.clar` at commit state after all 11 prior community fixes (M-1 through L-15). It does not duplicate findings already addressed in SECURITY_REVIEW.md. Focus was on interaction effects between fixes, factory state-consistency gaps, and the `expire-stream` recovery path introduced by M-1.

Prior audit PRs reviewed before beginning: Sobilo34 (#2), Marvy247 (#3), dannyy2000 (#4), Akanimoh12 (#5), Godbrand0 (#6).

---

## Findings Summary

| ID | Severity | Contract | Function | Description | Status |
|---|---|---|---|---|---|
| F-1 | Low-Medium | stream-manager | `top-up-stream` | Sender can block `expire-stream` indefinitely by topping up a paused stream | **Fixed** |
| F-2 | Low | stream-factory | `update-dao-name` | Deactivated DAO can rename itself, freeing its locked name to other registrants | **Fixed** |
| F-3 | Low | stream-factory | `track-stream` | Deactivated DAO can track streams and inflate its own analytics | **Fixed** |

No critical or high vulnerabilities found.

---

## F-1 — `top-up-stream` on paused stream enables permanent `expire-stream` griefing

**Severity:** Low-Medium  
**Function:** `top-up-stream` in `stream-manager.clar`  
**Prior fix interaction:** Exploits the M-1 fix (`expire-stream`) and the L-10 fix (`top-up` blocked on expired streams).

### Description

`top-up-stream` allows top-ups when `status == STATUS-PAUSED`, provided `stacks-block-height < end-block` (the L-10 guard). Each successful top-up extends `end-block` by `additional-blocks = amount * PRECISION / rate`. The minimum valid top-up amount is bounded by the zero-extension guard (L-8): `amount * PRECISION >= rate`, so the minimum extension is 1 block per call.

`expire-stream` — the permissionless recovery path added by M-1 — requires:

```clarity
(asserts! (>= stacks-block-height end-block) ERR-STREAM-NOT-EXPIRED)
```

A sender who has paused a stream can loop: top up by the minimum amount just before `end-block`, pushing `end-block` forward by 1 block each time. This costs the sender tokens on each call, but those tokens are added to their own stream's escrow and are recoverable via `cancel-stream`. The effective cost to block `expire-stream` is zero (funds are self-custodied in escrow).

The recipient's earnings are not affected — they can still call `claim` at any time for tokens frozen at `paused-at-block`. However, they cannot force a terminal state, cannot compel a settlement, and cannot recover the sender's unearned refund until `end-block` passes. With repeated top-ups, that never happens.

### Reproduction

```
Block 100: Stream created (start=100, end=200, 1_000_000_000 over 100 blocks)
Block 150: Sender pauses (earnings frozen at block 150)
Block 199: Sender calls top-up-stream with minimum valid amount → end-block becomes 200
Block 200: Sender calls top-up-stream again → end-block becomes 201
... repeat indefinitely
expire-stream always returns ERR-STREAM-NOT-EXPIRED
```

### Impact

Recipient is locked out of permissionless settlement. The recipient's earned tokens remain claimable via `claim`, but the unearned sender refund is inaccessible. The stream never reaches a terminal state on-chain. For long-duration streams (e.g. 1-year salary stream), this could strand tokens in an active-paused limbo indefinitely.

### Fix Applied

Added a guard in `top-up-stream` after the CANCELLED and DEPLETED checks, before the end-block check:

```clarity
;; Cannot top up a paused stream: extends end-block while earnings are frozen,
;; enabling the sender to delay expire-stream indefinitely with small repeated top-ups.
;; Resume the stream first, then top up.
(asserts! (not (is-eq status STATUS-PAUSED)) ERR-STREAM-PAUSED)
```

**Ordering note:** This guard now fires before the end-block check, so a paused-and-expired stream returns `ERR-STREAM-PAUSED (u203)` rather than `ERR-STREAM-ENDED (u207)`. The semantics are correct: the stream is rejected for being paused. The L-10 pre-existing test was updated to reflect the new error code.

**Design impact:** Senders who want to extend a paused stream must call `resume-stream` first, then `top-up-stream`. This is a reasonable constraint — a paused stream has a frozen state and extending its duration without resuming it is semantically inconsistent.

---

## F-2 — Deactivated DAO can rename itself and release its locked name

**Severity:** Low  
**Function:** `update-dao-name` in `stream-factory.clar`

### Description

`update-dao-name` reads the DAO record with `(unwrap! (map-get? daos caller) ERR-DAO-NOT-FOUND)` but does not check the `is-active` field. `deactivate-dao` sets `is-active: false` but leaves the record in both `daos` (keyed by principal) and `dao-names` (keyed by name string). The intention is that deactivation locks the DAO's state.

However, a deactivated DAO can still call `update-dao-name`, which atomically:

1. `map-delete dao-names old-name` — removes the old name from the reverse lookup, **freeing it**
2. `map-set dao-names new-name caller` — claims a new name

This means a deactivated DAO can release its original name back into the pool. Another principal can then register with the freed name, impersonating or squatting on the original DAO's identity.

### Reproduction

```
wallet1 registers as "Acme DAO"
wallet1 calls deactivate-dao
wallet1 calls update-dao-name("Acme DAO Fake") → succeeds
wallet3 calls register-dao("Acme DAO") → succeeds (name was freed)
wallet3 now controls the "Acme DAO" identity on-chain
```

### Impact

Name squatting and identity spoofing. Off-chain tooling using `get-dao-by-name("Acme DAO")` will now return `wallet3`, not the original `wallet1`. Deactivated DAOs were presumably deactivated for a reason; allowing post-deactivation name operations violates the intent of the soft-delete.

### Fix Applied

Added `ERR-DAO-INACTIVE (err u507)` constant to `stream-factory.clar` and inserted an `is-active` guard at the top of `update-dao-name`:

```clarity
(define-constant ERR-DAO-INACTIVE (err u507))
```

```clarity
(asserts! (get is-active dao-data) ERR-DAO-INACTIVE)
```

---

## F-3 — Deactivated DAO can track streams and inflate on-chain analytics

**Severity:** Low  
**Function:** `track-stream` in `stream-factory.clar`

### Description

`track-stream` reads the DAO record the same way as `update-dao-name` — `(unwrap! (map-get? daos caller) ERR-DAO-NOT-FOUND)` — and does not check `is-active`. A deactivated DAO can call `track-stream` to increment `total-streams-created` and `total-deposited` on its own record.

`is-registered-dao` correctly returns `false` for deactivated DAOs, so external callers can detect the deactivation. But the underlying analytics fields are writable post-deactivation, creating a discrepancy: the DAO appears inactive to observers yet continues to write to its stats silently.

### Impact

A DAO can artificially inflate its `total-streams-created` and `total-deposited` figures after deactivating, then reactivation (if supported in a future contract upgrade) or any off-chain presentation of the raw record would show inflated numbers. For grant applications, governance proposals, or reputation systems that read factory analytics, this is a data integrity concern.

### Fix Applied

Same `ERR-DAO-INACTIVE` constant (added in F-2). Added guard at the top of `track-stream`:

```clarity
(asserts! (get is-active dao-data) ERR-DAO-INACTIVE)
```

---

## Test Coverage

Six tests added (stream-manager.test.ts +3, stream-factory.test.ts +4 minus the one updated):

**stream-manager.test.ts** (top-up-stream describe):
- `should reject top-up on a paused stream with ERR-STREAM-PAUSED` — updated from prior passing test
- `should allow top-up after resuming a paused stream` — confirms the valid resume-then-top-up flow works
- `should not allow top-up to bypass expire-stream on a paused stream near end-block` — end-to-end: pause, reject top-up, mine past end-block, verify expire-stream succeeds

**stream-factory.test.ts** (update-dao-name and track-stream describe blocks):
- `should reject update-dao-name for deactivated DAO with ERR-DAO-INACTIVE`
- `should not free a name when deactivated DAO rename is blocked`
- `should reject track-stream for deactivated DAO with ERR-DAO-INACTIVE`
- `should not update DAO stats when track-stream is blocked after deactivation`

**Result:** 119 tests pass (up from 113). All prior tests pass unmodified except the one L-10 top-up test whose expected error code changed from `u207` to `u203`.

---

## Confirmations

The following prior findings were independently verified as correctly fixed in v1.0.0-rc1:

- **M-1 (dannyy2000):** `expire-stream` correctly settles paused streams post-end-block. Token conservation holds.
- **L-4 (Marvy247):** `resume-stream` rejects resumes past `end-block` with `ERR-STREAM-ENDED`.
- **L-9 (dannyy2000):** `pause-stream` rejects pauses before `start-block`.
- **L-10 (Zachyo):** `top-up-stream` rejects top-ups when `stacks-block-height >= end-block` (now also rejected earlier by F-1 fix when paused).
- **L-7 (Sobilo34):** Zero rate-per-block guard correctly rejects `deposit * PRECISION < duration`.
- **L-13 / M-2 (Ryjen1 / Zachyo):** Two-step ownership transfer via `propose-ownership` + `accept-ownership` is correctly implemented.

---

## Verdict

Three findings, all Low or Low-Medium severity, all fixed. No critical or high vulnerabilities found. The core streaming math, token conservation, and authorization model are sound. The two factory findings (F-2, F-3) are state-consistency gaps in the deactivation flow. F-1 is an interaction vulnerability between the M-1 and L-10 fixes that creates a new griefing path in the `expire-stream` recovery mechanism.

The contracts are ready for mainnet with these fixes applied.
