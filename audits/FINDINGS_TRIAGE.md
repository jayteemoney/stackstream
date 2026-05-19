# StackStream — Bounty Review Findings Triage

**Review window:** May 9–20, 2026
**Scope:** `contracts/stream-manager.clar` (v1.0.0-rc1, 907 lines) and `contracts/stream-factory.clar` (218 lines)
**Auditors:** 4 independent (see CREDITS.md)
**Method:** Each finding cross-checked against current `main` state; deduplicated across reports; classified by triage outcome.

---

## Triage Classifications

- **Fixed-on-main** — Finding describes a real issue; fix already merged before bounty review (credit retained).
- **Accepted-new-fix** — Real issue not previously fixed. We will fix it before v1.0.0-rc2.
- **Accepted-documented** — Real behavioral nuance; not a bug. We will update docs / read-only helpers.
- **Wont-fix-rationale** — Documented decision not to change. Rationale stated.
- **Already-mitigated** — Issue described is a real concern but contract design already mitigates it.

---

## Master Findings Table (deduplicated across all 4 auditors)

| ID | Severity | Title | Source PR(s) | Original Finder | Triage | Resolution |
|---|---|---|---|---|---|---|
| **H-1** | High | `stream-factory.deactivate-dao` is one-way; no `reactivate-dao` | PR #5 | Akanimoh | **Accepted-new-fix** | Added `reactivate-dao` public function + 6 tests. Uses `ERR-DAO-ALREADY-ACTIVE (err u508)` (renumbered from u507 to avoid collision with Majormaxx's `ERR-DAO-INACTIVE`). |
| **F-1** | Low-Medium | `top-up-stream` allows top-up on paused stream — sender can extend end-block indefinitely with minimum top-ups and grief `expire-stream` permanently | PR #7 | Majormaxx | **Accepted-new-fix** | Added `(asserts! (not (is-eq status STATUS-PAUSED)) ERR-STREAM-PAUSED)` in `top-up-stream` before the end-block check. 3 new tests including end-to-end griefing prevention. Existing L-10 test updated to reflect new error ordering. |
| **F-2** | Low | `stream-factory.update-dao-name` allows deactivated DAO to free its locked name via `map-delete`, enabling name squatting | PR #7 | Majormaxx | **Accepted-new-fix** | Added new constant `ERR-DAO-INACTIVE (err u507)`. `update-dao-name` now asserts `is-active`. 2 new tests including name-still-locked verification. |
| **F-3** | Low | `stream-factory.track-stream` allows deactivated DAO to inflate its own analytics | PR #7 | Majormaxx | **Accepted-new-fix** | Same `ERR-DAO-INACTIVE` constant. `track-stream` asserts `is-active`. 2 new tests including stats-stay-zero verification. |
| **PR6-M-1** | Medium (rejected) | `top-up-stream` lacks end-block guard, allows top-up on elapsed stream | PR #6 | Godbrand0 (round 2) | **Wont-fix-rationale (false positive)** | The L-10 guard exists on main at `stream-manager.clar:693`: `(asserts! (< stacks-block-height end-block) ERR-STREAM-ENDED)`. The auditor's code reading missed this assertion. No code change needed. |
| **PR6-M-2** | Medium | Backend error handler forwards raw `err.message` to clients (info disclosure) | PR #6 | Godbrand0 (round 2) | **Accepted-new-fix** | `openclaw-service/src/middleware/error-handler.ts` rewritten to generate opaque `randomUUID()` reference IDs and log full errors server-side only. |
| **PR6-M-3** | Medium | Frontend `buildClaimTx`, `buildClaimAllTx`, `buildCancelStreamTx` use `PostConditionMode.Allow` with no post-conditions (defense-in-depth gap) | PR #6 | Godbrand0 (round 2) | **Accepted-new-fix** | Three builders rewritten to `PostConditionMode.Deny` with explicit `Pc.principal(...).willSendLte(...).ft(...)` constraints. All 4 call sites updated to pass `ftName` and amount upper bounds. |
| **PR6-M-4** | Medium | `AssistantWidget` interpolates raw user input into fetch paths without `encodeURIComponent` (path manipulation) | PR #6 | Godbrand0 (round 2) | **Accepted-new-fix** | Added client-side validation regexes (`/^\d+$/` for stream IDs, `/^S[A-Z0-9]{38,40}$/` for addresses) and `encodeURIComponent(q)` on all four interpolated paths. |
| **M-1** | Medium | Sender can pause stream indefinitely; recipient has no recourse before `end-block` | PR #5 | Akanimoh | **Accepted-documented** | Document in SECURITY_REVIEW.md as a known design constraint. `expire-stream` is the post-end recourse. Optional `max-pause-duration` deferred to v1.1. |
| **M-2** | Medium | Sender cancel before `start-block` returns 0 to recipient | PR #5 | Akanimoh | **Accepted-documented** | Math is correct (no tokens lost). Document the "pending" phase in SECURITY_REVIEW.md and expose stream phase via existing `get-stream` read-only. |
| **M-1-historical** | Medium | Stuck funds when paused stream passes end-block (no recovery path) | PR #4 confirmation | dannyy2000 (pre-bounty) | **Fixed-on-main** | `expire-stream` (permissionless after end-block) — `stream-manager.clar:571`. |
| **M-2-historical** | Medium | Ownership transfer single-step (admin key takeover risk) | PR #4 confirmation | Zachyo (pre-bounty) | **Fixed-on-main** | Two-step `propose-ownership` + `accept-ownership` — `stream-manager.clar:876,887`. |
| **L-1** | Low | `factory.track-stream` analytics drift after top-ups/cancels | PR #5 | Akanimoh | **Accepted-documented** | Documented limitation. Off-chain indexer is the canonical analytics source for v1. |
| **L-2** | Low | `get-remaining-balance` returns `deposit − withdrawn`, not claimable | PR #5 | Akanimoh | **Accepted-documented** | Function comment + SECURITY_REVIEW.md note. `get-claimable` is the claimable-balance function. |
| **L-3** | Low | `expire-stream` reuses `STATUS-CANCELLED` (cannot distinguish from cancel) | PR #5 | Akanimoh | **Accepted-documented** | Event log distinguishes (`stream-expired` vs `stream-cancelled`). Status code split deferred to v1.1. |
| **L-4** | Low | `resume-stream` had no end-block guard (zombie ACTIVE state) | PR #3 | Marvy247 (pre-bounty), confirmed by PR #4 | **Fixed-on-main** | `stream-manager.clar:451–453`. |
| **L-5** | Low | `pause-stream` error code misleading for terminal-state streams | PR #5 | Akanimoh | **Accepted-documented** | Error code semantics documented in SECURITY_REVIEW.md. Rename deferred. |
| **L-7** | Low | `create-stream` allowed rate-per-block = 0 (silent math failure) | PR #2 | Sobilo34 | **Fixed-on-main** | `stream-manager.clar:233–235` guard. |
| **L-8** | Low | `top-up-stream` allowed zero-extension (no-op state mutation) | PR #4 confirmation | Godbrand0 (pre-bounty) | **Fixed-on-main** | `top-up-stream` rejects zero `additional-blocks`. |
| **L-9** | Low | `pause-stream` allowed pause before `start-block` | PR #4 confirmation | dannyy2000 (pre-bounty) | **Fixed-on-main** | Start-block check before pause. |
| **L-10** | Low | `top-up-stream` allowed after end-block | PR #4 confirmation | Zachyo (pre-bounty) | **Fixed-on-main** | End-block guard. |
| **L-13** | Low | Single-step ownership transfer (duplicate of M-2-historical) | PR #4 confirmation | Ryjen1 (pre-bounty) | **Fixed-on-main** | Two-step pattern (see M-2-historical). |
| **L-14** | Low | Claim event omitted `requested-amount` (couldn't detect clamping off-chain) | PR #4 confirmation | Jayy4rl (pre-bounty) | **Fixed-on-main** | `stream-manager.clar:362`. |
| **L-15** | Low | Redundant assertion checks | PR #4 confirmation | Jayy4rl (pre-bounty) | **Fixed-on-main** | Cleaned up. |
| **LOW-2** | Low | `claim` authorization check ordered after balance calculation | PR #3 | Marvy247 | **Fixed-on-main** | Auth-first ordering — `stream-manager.clar:333`. |
| **LOW-3** | Low | `top-up-stream` authorization check ordered after arithmetic | PR #3 | Marvy247 | **Accepted-documented** | No exploitability (read-only computation, no state change). Code-quality improvement deferred. |
| **I-1** | Info | `accept-ownership` returns same error for "no proposal" and "wrong caller" | PR #5 | Akanimoh | **Wont-fix-rationale** | Both branches signal "you are not the expected caller right now." Splitting errors leaks proposal-state to non-callers without security benefit. |
| **I-2** | Info | No `cancel-ownership-proposal` function | PR #5 | Akanimoh | **Wont-fix-rationale** | `propose-ownership` overwrites pending; setting `none` requires the same auth. Deferred to v1.1 as a convenience helper. |
| **I-3** | Info | Constants use kebab-case (`STATUS-ACTIVE`) not SCREAMING_SNAKE_CASE | PR #4 | dannyy2000 | **Wont-fix-rationale** | Kebab-case is idiomatic Clarity (Lisp lineage). Linter `case_const` rule disagrees but rename creates churn without semantic gain. |
| **I-4** | Info | Deactivated DAOs can still call `track-stream` | PR #4 | dannyy2000 | **Wont-fix-rationale** | Analytics-only; `track-stream` is informational. Recipient cannot be misled because the on-chain stream itself is the source of truth. |
| **INFO-2** | Info | `factory.total-deposited` does not reflect top-ups (duplicate of L-1) | PR #3 | Marvy247 | **Accepted-documented** | See L-1. |

---

## Counts

| Class | Count |
|---|---|
| Accepted-new-fix | 7 (H-1 contract, F-1 contract, F-2 contract, F-3 contract, PR6-M-2 backend, PR6-M-3 frontend, PR6-M-4 frontend) |
| Accepted-documented | 7 |
| Fixed-on-main (pre-bounty) | 9 |
| Wont-fix-rationale | 5 (4 prior + PR6-M-1 false positive) |
| **Total unique findings** | **28** |

Of 28 unique findings across 6 independent bounty/community reviews:
- **Zero critical or fund-loss bugs identified.**
- **7 findings required new code before mainnet** — all fixed and tested in v1.0.0-rc2.
- The remaining 21 are either already fixed (pre-bounty) or are documented design decisions / false positives.

**Test suite delta:** 113 tests pre-bounty → **125 tests post-bounty** (+12 tests covering H-1, F-1, F-2, F-3, plus updated L-10 test for new error ordering).

---

## Why Not Merge the PRs Directly

| PR | Why we won't merge as-is |
|----|--------------------------|
| #2 (Sobilo34) | The L-7 fix is already on `main` (`stream-manager.clar:233`). Branch is from `main`-pre-fix and would conflict. Credit retained in this triage; close PR with thank-you. |
| #3 (Marvy247) | Branch is stale from April 13 and would *revert* multiple later improvements (constant `CONTRACT-OWNER` revert, removes `MAX-CLAIM-AMOUNT`, removes `pending-owner` data-var, removes `requested-amount` claim event field). Cherry-picking would create more conflict than re-implementing. The LOW-4 resume-end-block fix is already on `main` (`stream-manager.clar:451–453`). Close PR with thank-you. |
| #4 (dannyy2000) | Audit report (5 markdown files). Merging 4,261 lines to repo root pollutes structure. Reorganizing into `audits/reports/dannyy2000-2026-05-13/` instead — full content preserved, attribution clear. |
| #5 (Akanimoh12) | Audit report (1 markdown file). H-1 finding requires a code fix that doesn't exist in the PR. Moving the report into `audits/reports/akanimoh-2026-05-14.md` and implementing H-1 as a separate maintainer commit citing this PR. |
| #6 (Godbrand0 — round 2) | Audit report (1 markdown file, 379 lines). M-1 contract finding is a false positive. M-2 backend / M-3 frontend / M-4 frontend require code fixes the PR doesn't include. Moving the report to `audits/reports/godbrand0-2026-05-18-round2.md` and implementing M-2/M-3/M-4 as maintainer commits citing this PR. |
| #7 (Majormaxx) | PR includes 187-line audit report + real code fixes (stream-factory +5, stream-manager +7) + tests. The code fixes are correct but the constant `ERR-DAO-INACTIVE = u507` collides with our pre-existing `ERR-DAO-ALREADY-ACTIVE = u507` from the H-1 fix. Re-implemented in our own commit, renumbering our constant to u508, keeping Majormaxx's u507 (his usage has 2 call sites, ours had 1). Tests adapted. Full attribution in commit message + report file at `audits/reports/majormaxx-2026-05-18.md`. |

---

## Next Steps

1. Implement H-1 fix (`reactivate-dao`) — owner: maintainer, target: 2026-05-18.
2. Update `SECURITY_REVIEW.md` with the documented findings (M-1, M-2, L-1 through L-5, LOW-3).
3. Move audit reports into `audits/reports/` (one file per auditor).
4. Close PRs #2, #3, #4, #5 with attribution comments referencing this triage.
5. Pay bounties (see CREDITS.md).
6. Tag `v1.0.0-rc2`.
