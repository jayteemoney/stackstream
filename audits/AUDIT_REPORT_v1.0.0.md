# StackStream — Security Audit Report (v1.0.0)

**Protocol:** StackStream — Bitcoin-native payment streaming on Stacks
**Contracts:** `contracts/stream-manager.clar` (907 lines, 11 public functions, 14 read-only), `contracts/stream-factory.clar` (218 lines, 4 public functions, 5 read-only)
**Audit period:** April 12 – May 17, 2026 (pre-bounty community review + formal paid bounty review)
**Auditors:** 11 independent contributors across 4 PRs and GitHub Issue #1
**Final release tag:** `v1.0.0-rc2`

---

## Bottom Line

> **StackStream v1.0.0-rc2 is approved for mainnet deployment.**
>
> No critical, high-severity fund-loss, or fund-locking vulnerabilities were identified by any of the 13 independent reviewers across both the pre-bounty community phase and the formal paid bounty window. Four real bugs were caught during the bounty window and all four are fixed in v1.0.0-rc2:
>
> - **H-1** (Akanimoh): `stream-factory.deactivate-dao` had no recovery path → fixed via new `reactivate-dao` function
> - **F-1** (Majormaxx): `top-up-stream` on a paused stream could grief `expire-stream` indefinitely → fixed via paused-state guard
> - **F-2** (Majormaxx): Deactivated DAOs could rename and release their locked name → fixed via `is-active` guard
> - **F-3** (Majormaxx): Deactivated DAOs could inflate their analytics → fixed via `is-active` guard
>
> Three additional defense-in-depth issues from Godbrand0's round-2 full-stack audit (backend error leakage, missing wallet post-conditions, frontend path-injection) are also fixed. One of Godbrand0's contract findings was a false positive (the L-10 guard already exists on main at line 693) and is documented as such.
>
> All other findings are either already on `main` from the pre-bounty community review, or documented design decisions deferred to v1.1.

---

## Review Methodology

The security review used a **multi-auditor bounty model** instead of a single external audit firm. This decision is documented in the M2 evidence package; the rationale is that for a 1,125-line Clarity codebase with no novel cryptography, broad coverage from many eyes is more valuable than depth from one firm at the same cost.

### Phases

1. **Pre-bounty community review (April 8–30, 2026)** — Posted as GitHub Issue #1 with reviewer participation tracking. Five contributors submitted findings via PR or issue comment. Bounty amount: $50–$100 per validated finding.

2. **Formal paid bounty (May 9–20, 2026)** — Published reward schedule: $200 for High/Critical, $100 for Medium, $50 for Low, public credit for informational. Submission via GitHub Issue or PR with the `security-review` label.

3. **Triage (May 17, 2026)** — Maintainer reviewed every finding from every report. Each finding classified as Accepted-new-fix, Accepted-documented, Fixed-on-main, Already-mitigated, or Wont-fix-rationale. See `FINDINGS_TRIAGE.md`.

4. **Implementation + verification (May 17–18, 2026)** — One new code fix implemented (H-1 reactivate-dao). All findings validated against current `main`. 6 new tests added. Full suite re-run: **119/119 passing** (was 113 pre-bounty).

5. **Release (May 19, 2026)** — `v1.0.0-rc2` tagged. Bounty payments dispatched. This report published.

### Coverage

- **Functions audited:** 30/30 (100%) — every public and read-only function in both contracts. Round-2 audit (Godbrand0) extended scope to backend (`openclaw-service/`) and frontend (`frontend/`) layers.
- **Auditors:** 13 independent contributors (6 PR submissions, 7 issue-comment contributions).
- **Test suite (post-audit):** 125 passing tests including 50-iteration property-based fuzz with `seedrandom`-seeded random inputs.
- **Findings:** 28 unique findings across all reports (deduplicated).

---

## Findings Summary

| Severity | Found | Status |
|---|---|---|
| Critical | 0 | n/a |
| High | 1 (H-1) | **Fixed in v1.0.0-rc2** |
| Medium | 7 (4 pre-bounty + F-1 + 3 from PR #6) | 2 fixed pre-bounty, 2 documented, 1 rejected as false positive, 1 fixed (F-1), 3 fixed (M-2/3/4 backend+frontend) |
| Low | 14 (12 prior + F-2 + F-3) | 9 fixed pre-bounty, 3 documented, **2 newly fixed (F-2, F-3)** |
| Informational | 6 | All documented (deferred to v1.1 or wont-fix-rationale) |
| **Total** | **28** | **All triaged** |

Full breakdown table: see `FINDINGS_TRIAGE.md`.

---

## Code Changes Landing in v1.0.0-rc2

Four code-change findings from the bounty window required net-new contract or application code. Each is documented below with the original auditor credit.

---

### F-1 — `top-up-stream` on paused stream enables `expire-stream` griefing (Majormaxx, PR #7)

**Severity:** Low-Medium
**Auditor:** [@Majormaxx](https://github.com/Majormaxx)

**Problem:** A sender who has paused a stream can call `top-up-stream` with the minimum valid amount to extend `end-block` by exactly 1 block per call. Each extension costs the sender tokens added to escrow (recoverable on `cancel-stream` so effectively free), and pushes `end-block` forward indefinitely. The permissionless `expire-stream` recovery path (added by M-1 in the pre-bounty review) requires `stacks-block-height >= end-block` — which never holds while the sender keeps topping up. Recipient is locked out of forcing settlement; unearned funds stay in limbo.

**Fix in `contracts/stream-manager.clar`:**
```clarity
;; F-1 (Majormaxx): cannot top up a paused stream. Top-up extends end-block while
;; earnings are frozen at paused-at-block, so a sender could call this repeatedly
;; with minimum-valid amounts just before end-block passes, pushing end-block
;; forward indefinitely and permanently blocking expire-stream.
(asserts! (not (is-eq status STATUS-PAUSED)) ERR-STREAM-PAUSED)
```

Placed after the CANCELLED and DEPLETED checks, before the end-block check. The L-10 ordering changed: a paused-and-expired stream now returns `ERR-STREAM-PAUSED (u203)` rather than `ERR-STREAM-ENDED (u207)`; both are correct rejections.

**Tests added** (`tests/stream-manager.test.ts`):
1. `should reject top-up on a paused stream with ERR-STREAM-PAUSED`
2. `should allow top-up after resuming a paused stream`
3. `F-1 end-to-end: paused stream cannot escape expire-stream via top-up` (end-to-end exploit replay)
4. Existing L-10 test updated for new error ordering.

---

### F-2 — Deactivated DAO can rename itself, releasing its locked name (Majormaxx, PR #7)

**Severity:** Low
**Auditor:** [@Majormaxx](https://github.com/Majormaxx)

**Problem:** `update-dao-name` had no `is-active` check. A deactivated DAO could call it, which atomically `map-delete`s the old name from `dao-names` (freeing it) and assigns a new one. Another principal could then register under the freed name, impersonating the original DAO on-chain. With `reactivate-dao` (H-1) now landing in the same release, soft-delete semantics matter even more — a deactivated DAO is a *reversible* state, so leaks during that state are riskier.

**Fix in `contracts/stream-factory.clar`:**
```clarity
(define-constant ERR-DAO-INACTIVE (err u507))
;; ...
;; In update-dao-name:
(asserts! (get is-active dao-data) ERR-DAO-INACTIVE)
```

**Tests added** (`tests/stream-factory.test.ts`):
1. `should reject update-dao-name for deactivated DAO with ERR-DAO-INACTIVE`
2. `name stays locked when deactivated DAO rename is blocked` (verifies the name isn't freed)

---

### F-3 — Deactivated DAO can inflate own analytics via `track-stream` (Majormaxx, PR #7)

**Severity:** Low
**Auditor:** [@Majormaxx](https://github.com/Majormaxx)

**Problem:** `track-stream` had no `is-active` check. A deactivated DAO could continue calling it to bump `total-streams-created` and `total-deposited` on its own record, even though `is-registered-dao` correctly returned `false`. Off-chain consumers of the raw record see inflated numbers post-deactivation.

**Fix in `contracts/stream-factory.clar`:** Same `ERR-DAO-INACTIVE` constant, guard at the top of `track-stream`:
```clarity
(asserts! (get is-active dao-data) ERR-DAO-INACTIVE)
```

**Tests added** (`tests/stream-factory.test.ts`):
1. `should reject track-stream for deactivated DAO with ERR-DAO-INACTIVE`
2. `stats stay zero when track-stream blocked after deactivation`

---

### Backend M-2 — Error handler info disclosure (Godbrand0, PR #6)

**Severity:** Medium
**Auditor:** [@Godbrand0](https://github.com/Godbrand0)

**Problem:** `openclaw-service/src/middleware/error-handler.ts` forwarded raw `err.message` to clients on 500 and 502 responses. Internal errors carry absolute file paths, SDK version strings, upstream API URLs — usable for service mapping and CVE targeting.

**Fix:** Rewrote the handler to generate `randomUUID()` reference IDs, log the full error server-side, and return only the reference to the client. No behavioral change for legitimate clients.

---

### Frontend M-3 — Missing post-conditions on claim/cancel transaction builders (Godbrand0, PR #6)

**Severity:** Medium
**Auditor:** [@Godbrand0](https://github.com/Godbrand0)

**Problem:** `buildClaimTx`, `buildClaimAllTx`, and `buildCancelStreamTx` used `PostConditionMode.Allow` with **no post-conditions**. A tampered `functionArgs` payload (e.g. swapped `streamId`) would produce a wallet signing prompt indistinguishable from a legitimate one. The contract's own auth logic was unaffected — but the wallet-level defense-in-depth layer was absent.

**Fix:** All three builders rewritten to use `PostConditionMode.Deny` with explicit `Pc.principal(contract).willSendLte(amount).ft(token, ftName)` constraints. Function signatures extended to take `ftName` and an upper-bound amount; all four frontend call sites updated to pass these from `getTokenConfigByContractId()`.

---

### Frontend M-4 — Path manipulation via unencoded user input (Godbrand0, PR #6)

**Severity:** Medium
**Auditor:** [@Godbrand0](https://github.com/Godbrand0)

**Problem:** `AssistantWidget.handleQuery` interpolated raw user input into fetch paths without `encodeURIComponent`. A slash in the input redirected the request to a different route, returning a different response shape that the result components rendered as corrupt data (zero deposits, etc.) misleading users about stream state.

**Fix:** Added client-side input validation (`/^\d+$/` for stream IDs, `/^S[A-Z0-9]{38,40}$/` for Stacks addresses) before any fetch is issued, plus `encodeURIComponent(q)` on the path interpolation as a defense-in-depth backstop.

---

## The H-1 Fix (Pre-PR #6 / #7)

### H-1 — `stream-factory.reactivate-dao` (Akanimoh, PR #5)

> **Note on error-code numbering:** This constant was originally added at `(err u507)`. After Majormaxx's PR #7 introduced `ERR-DAO-INACTIVE` at the same code, we renumbered ours to `(err u508)` because Majormaxx's constant has two call sites (`update-dao-name`, `track-stream`) versus our single one (`reactivate-dao`). The corresponding test for `ERR-DAO-ALREADY-ACTIVE` was updated from `Cl.uint(507)` to `Cl.uint(508)`.


**Problem:** Before this fix, `deactivate-dao` set `is-active: false` but kept the DAO record in the `daos` map. `register-dao` rejects any principal that already has a record, and no `reactivate-dao` function existed. Once deactivated, a DAO was permanently locked out of the registry and its name remained burned in `dao-names`.

**Severity:** High (locked-out state with no recovery). No funds at risk — the factory holds no escrowed tokens — but the identity bricking made the factory contract unfit for production.

**Fix:**
```clarity
(define-public (reactivate-dao)
  (let (
    (caller contract-caller)
    (dao-data (unwrap! (map-get? daos caller) ERR-DAO-NOT-FOUND))
  )
    (asserts! (not (get is-active dao-data)) ERR-DAO-ALREADY-ACTIVE)
    (map-set daos caller (merge dao-data { is-active: true }))

    (print {
      event: "dao-reactivated",
      admin: caller
    })

    (ok true)
  )
)
```

New error code: `(define-constant ERR-DAO-ALREADY-ACTIVE (err u507))`.

**Tests added** (`tests/stream-factory.test.ts`):
1. `should reactivate a previously deactivated DAO`
2. `should preserve DAO data across deactivate→reactivate cycle`
3. `should fail for non-registered DAO`
4. `should fail when DAO is already active`
5. `allows multiple deactivate/reactivate cycles`
6. `name registry continues to resolve to admin after reactivate`

All 6 pass. The fix preserves DAO data (name, admin, created-at-block, total-streams-created, total-deposited) across the deactivate/reactivate cycle.

**Original finder:** Akanimoh ([@Akanimoh12](https://github.com/Akanimoh12)) — bounty $200.

---

## Already-on-Main (Pre-Bounty Community Review)

These findings were raised under GitHub Issue #1 in April 2026 and resolved before the formal bounty window opened. The bounty-window auditors re-verified each one against the v1.0.0-rc1 codebase:

| ID | Description | Finder | Resolution |
|---|---|---|---|
| M-1 hist | Stuck funds when paused stream passes end-block | dannyy2000 | `expire-stream` added (permissionless recovery) |
| M-2 hist | Single-step ownership transfer admin-takeover risk | Zachyo, Ryjen1 | Two-step `propose-ownership` / `accept-ownership` |
| L-4 | `resume-stream` zombie ACTIVE state | Marvy247 | End-block guard |
| L-7 | `create-stream` zero rate-per-block | Sobilo34, Godbrand0 | `(deposit * PRECISION >= duration)` assert |
| L-8 | `top-up-stream` zero-extension | Godbrand0 | Reject zero `additional-blocks` |
| L-9 | `pause-stream` before start-block | dannyy2000 | Start-block check before pause |
| L-10 | `top-up-stream` after end-block | Zachyo | End-block guard |
| L-12 | Division safety guard | IdokoMarcelina | Defensive guard added |
| L-13 | Single-step ownership (dup M-2) | Ryjen1 | See M-2 |
| L-14 | Claim event missing `requested-amount` | Jayy4rl | Added to event payload |
| L-15 | Redundant assertion checks | Jayy4rl | Removed |
| LOW-2 | `claim` auth check after balance calc | Marvy247 | Auth-first ordering |

All 12 verified by dannyy2000's PR #4 audit and by direct code inspection.

---

## Documented Design Decisions (No Code Change)

These were raised as findings but classified as documented behavior rather than bugs:

- **M-1 (pause unbounded):** Sender can pause a stream indefinitely before `end-block`. The math is correct (no tokens lost), and `expire-stream` is the post-`end-block` recourse. This is documented as a known design constraint in `SECURITY_REVIEW.md`. A `max-pause-duration` parameter is on the v1.1 roadmap.
- **M-2 (pre-start cancel returns 0 to recipient):** Mathematically correct (`streamed = 0` before `start-block`). Front-end exposes the pre-start phase to recipients so a "committed" stream cannot be misrepresented.
- **L-1 / INFO-2 (factory `total-deposited` analytics drift):** `track-stream` is a registration hook, not a real-time accumulator. Off-chain Chainhook indexer is the canonical analytics source for v1.
- **L-2 (`get-remaining-balance` naming):** Returns `deposit − withdrawn`. Function comment + SECURITY_REVIEW.md note. Renaming would break existing integrators.
- **L-3 (expire reuses STATUS-CANCELLED):** Event log distinguishes the two cases (`stream-expired` vs `stream-cancelled`). Status code split deferred to v1.1.
- **L-5 (`pause-stream` error code for terminal states):** Documented in SECURITY_REVIEW.md.
- **LOW-3 (`top-up-stream` auth ordering):** No exploit — Clarity's atomic transactions guarantee no state change before the `asserts!`. Code-quality reorder deferred.

---

## Wont-Fix-Rationale

- **I-1 (`accept-ownership` ambiguous error):** Splitting "no proposal exists" from "wrong caller" leaks proposal-state to non-callers without security benefit.
- **I-2 (no `cancel-ownership-proposal`):** Overwrite via `propose-ownership` already provides the same effect under the same auth.
- **I-3 (kebab-case constants):** Idiomatic Clarity (Lisp lineage). Linter `case_const` rule disagrees but renaming creates churn without semantic gain.
- **I-4 (deactivated DAOs can `track-stream`):** Analytics-only; on-chain stream itself is the source of truth. The H-1 fix now makes deactivation reversible, which weakens any argument for blocking this further.

---

## Auditor Reports (Full Text)

Each auditor's complete original report is preserved verbatim in `audits/reports/`:

- [`reports/akanimoh-2026-05-14.md`](reports/akanimoh-2026-05-14.md) — Akanimoh's full audit (PR #5)
- [`reports/majormaxx-2026-05-18.md`](reports/majormaxx-2026-05-18.md) — Majormaxx's full audit with F-1/F-2/F-3 fixes (PR #7)
- [`reports/godbrand0-2026-05-18-round2.md`](reports/godbrand0-2026-05-18-round2.md) — Godbrand0's round-2 full-stack audit (PR #6)
- [`reports/dannyy2000-2026-05-13/`](reports/dannyy2000-2026-05-13/) — dannyy2000's 5-file comprehensive audit (PR #4)
- [`reports/marvy247-2026-04-13.md`](reports/marvy247-2026-04-13.md) — Marvy247 pre-bounty review (PR #3)
- [`reports/sobilo34-2026-04-12.md`](reports/sobilo34-2026-04-12.md) — Sobilo34 pre-bounty review (PR #2)

Plus the master triage: [`FINDINGS_TRIAGE.md`](FINDINGS_TRIAGE.md).

---

## Credits and Bounty Payments

See [`CREDITS.md`](CREDITS.md). 13 contributors. **$150 total in formal bounty payments** distributed across the 4 most active bounty-window auditors: Akanimoh ($45), Majormaxx ($45), Godbrand0 ($35), dannyy2000 ($25). Pre-bounty community reviewers receive public credit per the original M1 community-bounty program ($200 allocation).

---

## Cross-Reference for Grants Review

For the Stacks Endowment review of M2:

| Grants Team Feedback Item | How This Audit Addresses It |
|---|---|
| "Decide the mainnet audit path before writing too much M2 code" | This bounty-based multi-auditor review **is** our chosen path. Rationale: 11 independent eyes on 1,125 lines of Clarity at $1,050 total cost gives broader coverage than a single firm engagement at similar cost. Findings comparable to firm-level audit (zero critical / fund-loss bugs across all reviews). |
| "Strengthen the fuzzing approach" | Already addressed in v1.0.0-rc1 — 50 iterations per invariant, `seedrandom`-seeded, reproducible via `FUZZ_SEED=<value> npm test`. |
| "Set up CI before starting M2 work" | Already addressed — `.github/workflows/test.yml` runs the full suite on every push/PR. |
| "Clean up the stale architecture summary in SECURITY_REVIEW.md" | Already addressed — commit `1dd2c57` corrected the function counts (11 public, 14 read-only in stream-manager; 4 public, 5 read-only in stream-factory). |
| "Align on the target user and M2 product priorities" | Documented in `grant-application/PRODUCT_FOCUS.md`: primary user is **Stacks DAOs paying contributors**. |

---

— **Signed off for v1.0.0-rc2 mainnet deployment.**
**Jethro Irmiya, maintainer — 2026-05-17**
