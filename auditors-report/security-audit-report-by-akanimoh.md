# StackStream Security Audit — Findings
**Auditor:** Akanimoh (independent)
**Scope:** `stream-manager.clar`, `stream-factory.clar`
**Version:** v1.0.0-rc1
**Date:** 2026-05-14

Hi — I finished reviewing the two contracts. Good news first: I found **no critical or fund-loss bugs**. The escrow accounting is solid — I checked token conservation on every exit path (claim, cancel, expire, top-up) and `deposit == recipient + refund + escrow` always holds. The state machine has no reachable illegal state, and reentrancy / token-substitution / rate-rounding are all handled.

Below is what I think needs fixing before mainnet, most important first.

---

## H-1 (High) — A deactivated DAO is locked out forever
**File:** `stream-factory.clar` → `deactivate-dao`, `register-dao`

`deactivate-dao` just sets `is-active: false` but leaves the record in the `daos` map. `register-dao` rejects any principal that already has a record, and there's no `reactivate-dao`. So once a DAO deactivates, it can never come back — and its name stays burned in `dao-names` forever too.

No funds at risk (the factory holds none), but it permanently bricks a DAO's identity with zero recovery. I'd treat this as a launch blocker for the factory.

**Fix:** add a `reactivate-dao` function that flips `is-active` back to `true`.

---

## M-1 (Medium) — Sender can pause a stream indefinitely, recipient can't undo it
**File:** `stream-manager.clar` → `pause-stream` / `resume-stream`

Only the sender can pause or resume. There's no time limit on a pause. The recipient's only escape is `expire-stream`, and that only works *after* `end-block`. The math is all correct — nobody loses tokens — but a DAO selling a stream as a "guaranteed" payment should know the payer keeps a unilateral pause lever.

**Fix:** not a code bug — please document this clearly. Optionally add a `max-pause-duration` in a future version.

---

## M-2 (Medium) — Cancelling before start gives the recipient nothing
**File:** `stream-manager.clar` → `cancel-stream`

If a sender cancels before `start-block`, `streamed = 0`, so the recipient gets `0` and the sender gets a full refund. The math is correct, but a pending stream looks identical to a live one on-chain — someone could show a recipient a "committed" stream, then cancel it for free before it starts.

**Fix:** consider blocking cancel before `start-block`, or add a read-only that exposes the stream "phase" (pending / streaming / ended) so front-ends can warn recipients.

---

## Low / Informational

- **L-1** — `track-stream` snapshots `deposit-amount` at tracking time. Top-ups and cancels don't update factory stats, so `total-deposited` drifts from reality. Either document it as "not TVL" or compute analytics off events.
- **L-2** — `get-remaining-balance` returns `deposit − withdrawn`, which is *not* claimable balance. Rename or add a doc comment so integrators don't misuse it.
- **L-3** — `expire-stream` reuses `STATUS-CANCELLED`. You can't tell an expired stream from a cancelled one without reading event logs. Consider a separate `STATUS-EXPIRED`.
- **L-4** — `pause-stream` returns `ERR-STREAM-PAUSED` even when the stream is cancelled or depleted. Misleading error — rename to something like `ERR-STREAM-NOT-ACTIVE`.
- **I-1** — `accept-ownership` returns the same `ERR-NOT-AUTHORIZED` for "no proposal exists" and "wrong caller". Split them for easier debugging.
- **I-2** — There's no way to cancel a pending ownership proposal (you can only overwrite it). A small `cancel-ownership-proposal` would be cleaner.

---

## Summary

| ID | Severity | Issue |
|---|---|---|
| H-1 | High | Deactivated DAO locked out — no `reactivate-dao` |
| M-1 | Medium | Unbounded sender pause, no recipient recourse |
| M-2 | Medium | Pre-start cancel gives recipient zero |
| L-1 | Low | Factory analytics drift after top-up/cancel |
| L-2 | Low | `get-remaining-balance` misleading name |
| L-3 | Low | `expire-stream` indistinguishable from cancel |
| L-4 | Low | Wrong error code for terminal-state pause |
| I-1 | Info | Ambiguous `accept-ownership` error |
| I-2 | Info | No cancel-ownership-proposal function |

**My recommendation:** `stream-manager.clar` is good to ship once M-1 and M-2 are documented. `stream-factory.clar` should not go to mainnet until H-1 is fixed — please add `reactivate-dao`.

— Akanimoh
