# StackStream — Product Focus Decision (Pre-M2)

**Date locked:** 2026-05-17
**Status:** Decision made — no further drift permitted before M2 submission (2026-05-22).
**Reason:** Per Stacks Endowment feedback on M1 approval: *"Align on the target user and M2 product priorities before M2 work starts in full."*

---

## Decision

**Primary user: Stacks DAOs paying contributors with on-chain streams.**

Concretely, this means:
- An organization (DAO, working group, project team, grant recipient) that pays one or more contributors a recurring amount in STX, sBTC, USDA, ALEX, xBTC, or any SIP-010 token.
- The DAO admin (or multisig signer acting on behalf of the DAO) creates streams from a DAO-controlled wallet to each contributor's wallet.
- Stream duration: weeks to months (contributor payroll cycle), not seconds or years.
- Stream amounts: small-to-medium (10s to low-1000s of STX-equivalent per stream).
- Recipient is a single contributor wallet — not a smart contract, not a multi-party split.

## Why This User, Not the Others

StackStream's contracts could theoretically serve several user profiles. We are deliberately scoping to one for M2:

| User profile | In scope? | Why / why not |
|---|---|---|
| **DAOs paying contributors** | ✅ **Primary** | Aligns with M3 acceptance criteria (3 DAOs registered). Real pain point: DAOs currently pay manually each cycle with batch transactions or off-chain coordination. Streaming gives recipients real-time access and DAOs cancellation optionality. |
| Protocols managing token vesting / incentives | ❌ Out of scope for v1 | Different product shape — typically multi-year, cliff schedules, token-grant-specific. Solvable with a v2 schedule layer; not in M2/M3 scope. |
| Builders needing one-off payment rails | ❌ Out of scope for v1 | Too generic — Stacks already has direct transfers and SIP-010 transfer functions. No streaming primitive needed. |
| Subscription / SaaS billing | ❌ Out of scope for v1 | Recipient is the merchant, not the contributor. Different UX, different access patterns. Possibly a v2 product (`stream-billing.clar`) but not on the current roadmap. |
| Consumer P2P streaming (allowance, gifts) | ❌ Out of scope for v1 | Marketing channels are completely different (consumer vs. DAO operator). UX needs custodial onboarding, which StackStream does not provide. |

## What This Means for M2 Build Decisions

Because the target user is **DAO operators**, every product decision between now and M3 should be evaluated against this question:

> *"Does this make it easier or harder for a DAO admin to pay 5 contributors a recurring amount?"*

Decisions this lock-in shapes:

1. **Frontend information architecture.** The landing page leads with "Pay your contributors on-chain in real time." Not "stream any token to anyone." DAOs are the explicit audience.
2. **`stream-factory` priority.** The factory's `register-dao`, `update-dao-name`, `deactivate-dao`, `reactivate-dao` (new in v1.0.0-rc2), and `track-stream` functions are first-class on the frontend, not a hidden "advanced" tab. The DAO is the primary on-chain identity in v1.
3. **Onboarding flow.** Step 1 = register DAO. Step 2 = add contributor wallet. Step 3 = create stream. Not "connect wallet → create stream" with the DAO concept hidden.
4. **Documentation tone.** Examples use DAO names ("StacksDAO pays @marvy 500 STX over 30 days"), not abstract Alice→Bob examples.
5. **DAO outreach is the marketing engine for M3.** Per `MILESTONE_PLAN.md` Section 3.1, "What counts as a real team or DAO" is the M3 acceptance criterion. We onboard real DAO admins, not retail users.

## What This Lock-In Explicitly Defers (v1.1+ Roadmap)

The following are real product opportunities but are explicitly deferred to keep M2 scope tight:

- **Token vesting schedules** (cliff + linear) — separate `stream-vesting.clar` contract, post-M3.
- **Multi-recipient splits** — one stream → N recipients. Useful for revenue-share use cases, but not for contributor payroll (each contributor gets their own stream).
- **Recurring stream templates** — "every month, create a new 30-day stream for this contributor." Currently the DAO admin recreates manually after each stream ends. Acceptable for v1.
- **Stream-on-stream** — claiming from one stream automatically funds another. Composable but unnecessary for contributor payroll.
- **Mobile-first UX** — the current Tailwind frontend is responsive, but a dedicated mobile experience is post-M3.

## Marketing Implication


Per the revised content schedule (`content schedule.md`), every educational post on LinkedIn / Skool / X / Telegram between now and M3 uses a DAO-payroll framing. Not "what is streaming finance" — but "how does your DAO pay contributors." This is consistent with the user lock-in above.

## Cross-Reference

- `grant-application/MILESTONE_PLAN.md` Section 3.1 — M3 acceptance criteria (3 DAOs registered).
- `grant-application/IMPLEMENTATION_PLAN.md` — original technical plan.
- `content schedule.md` — 33-day content plan, DAO-payroll framing throughout.

---

**Lock-in signed:** Jethro Irmiya, 2026-05-17. Will not revisit until M3 evidence is submitted.
