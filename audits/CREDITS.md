# StackStream — Security Review Credits

Public acknowledgement of every independent contributor who reviewed StackStream's Clarity contracts during the v1.0.0-rc1 → v1.0.0-rc2 bounty review window (May 11–18, 2026) and the prior community review under GitHub Issue #1 (April 2026).

---

## Formal Paid Bounty Window: May 11–18, 2026 (closed midnight UTC May 18)

**Scope:** `contracts/stream-manager.clar`, `contracts/stream-factory.clar`, plus full-stack review of `openclaw-service/` and `frontend/` where independently scoped.

**Total bounty pool:** **$150 USD (paid in STX)** — split across active contributors weighted by the value of their findings to mainnet readiness.

**Active bounty contributors:**

| Auditor | GitHub | Submission | Key findings | Bounty share |
|---|---|---|---|---|
| **Akanimoh** | [@Akanimoh12](https://github.com/Akanimoh12) | PR #5 (May 14) | **H-1 `reactivate-dao`** (launch blocker, fixed in v1.0.0-rc2), M-1 (documented), M-2 (documented), L-1 through L-5, I-1, I-2 | **$45** |
| **Majormaxx** (Emerson Daniel) | [@Majormaxx](https://github.com/Majormaxx) | PR #7 (May 18) | **F-1 `top-up-stream` paused griefing** (real bug, fixed), **F-2 deactivated DAO can rename** (real bug, fixed), **F-3 deactivated DAO can track-stream** (real bug, fixed) — all with code fixes and 6 new tests | **$45** |
| **Godbrand0** (Thompson) | [@Godbrand0](https://github.com/Godbrand0) | PR #6 (May 18) | Round 2 full-stack audit. **M-2 backend error leak** (fixed), **M-3 frontend missing post-conditions** (fixed), **M-4 frontend path injection** (fixed). M-1 contract finding rejected (false positive — guard already on main at line 693). | **$35** |
| **Akinsanya Daniel Oluwatomiwa** | [@dannyy2000](https://github.com/dannyy2000) | PR #4 (May 13) | Comprehensive 4,261-line verification audit of all 11 prior community fixes; 2 new informational items (I-3, I-4) — both wont-fix-rationale | **$25** |

**Bounty distribution rationale:**
- Akanimoh and Majormaxx are tied for the highest share because each surfaced multiple real, fixable findings (one each at near-launch-blocker severity) that improved the contract before mainnet.
- Godbrand0 gets the next-largest share for surfacing real defense-in-depth issues across the backend and frontend layers that the contract-only audits could not have caught, even though the contract M-1 finding was rejected.
- dannyy2000 gets the smallest formal-bounty share because the contribution was primarily verification work (independently confirming prior fixes) rather than net-new findings; this is high-value work but smaller in scope.

**Total formal-bounty payout:** **$150 USD** (in STX, paid post-mainnet deployment).

---

## Pre-Bounty Community Review (GitHub Issue #1, April 2026)

These contributors submitted findings under the community-review phase before the formal paid bounty. They receive **public credit** (recorded here and in `SECURITY_REVIEW.md`) but are not part of the May 11–18 bounty pool.

| Auditor | GitHub | Findings credited | Recognition |
|---|---|---|---|
| Marvy247 (David Marvy) | [@Marvy247](https://github.com/Marvy247) | LOW-2, LOW-3, LOW-4, INFO-2 | Public credit, listed in SECURITY_REVIEW.md |
| Sobilo34 (Bilal Oyeleke) | [@Sobilo34](https://github.com/Sobilo34) | L-7 zero-rate-per-block | Public credit, listed in SECURITY_REVIEW.md |
| Zachyo | Issue #1 comments | M-2 ownership transfer, L-10 expired top-up | Public credit |
| Godbrand0 | Issue #1 comments | L-7 (duplicate), L-8 zero-extension top-up | Public credit (also active in bounty window, see above) |
| IdokoMarcelina | Issue #1 comments | L-12 division safety | Public credit |
| Ryjen1 | Issue #1 comments | L-13 two-step ownership | Public credit |
| Jayy4rl | Issue #1 comments | L-14 claim event field, L-15 redundant asserts | Public credit |
| Akanmoh Johnson | Issue #1 comments | L-1, L-2 (lifetime stream cap), I-1 | Public credit |
| Ali6nXI | Issue #1 comments | Reviewer participation | Public credit |

All pre-bounty findings have been documented in `SECURITY_REVIEW.md` and reflected in the current `main` codebase. No additional payment is owed to pre-bounty contributors; the original M1 community-bounty budget line ($200) covered the recognition program in full.

---

## How to Claim Your Bounty

If you are listed in the **Formal Paid Bounty** section above, payment instructions:

1. DM your **mainnet STX address** to [@Stackstream0X](https://x.com/Stackstream0X) on X, OR open a GitHub issue with the label `bounty-payment` containing your STX address and the PR that contains your finding.
2. Payment will be sent within 14 days of `v1.0.0-rc2` mainnet deployment.

Payments are made on Stacks mainnet — sent directly from the StackStream project wallet. The transaction hash will be linked here once payments are dispatched.

| Auditor | STX address | Bounty (USD eq.) | Mainnet payment tx |
|---|---|---|---|
| Akanimoh ([@Akanimoh12](https://github.com/Akanimoh12)) | `SP11K7AFAH22JS5FZFWADYJZBG6AS5T9DNADKKEHQ` | $45 | [`0xd6536d3095f331c34671d930fa1fa47d3a228bfbd226b62554ef7255697cd583`](https://explorer.hiro.so/txid/0xd6536d3095f331c34671d930fa1fa47d3a228bfbd226b62554ef7255697cd583?chain=mainnet) |
| Majormaxx ([@Majormaxx](https://github.com/Majormaxx)) | `SP2N8HEVWFRZCQMMDBDCBPS3X0FHYCPA3N2Q0DQP1` | $45 | [`0x2a80c51922cb2c3db99f8d1b101267b2f2541756b66899830cb10549079fbd2f`](https://explorer.hiro.so/txid/0x2a80c51922cb2c3db99f8d1b101267b2f2541756b66899830cb10549079fbd2f?chain=mainnet) |
| Godbrand0 ([@Godbrand0](https://github.com/Godbrand0)) | `SP19XTHQ3SVST2NCYPTHP2W31MFDQDBFG3W7E5AGD` | $35 | [`0x2cb51e759ec6e60a4dbbc07cb4116875b38a33bee4493dd06e4553857cd57e50`](https://explorer.hiro.so/txid/0x2cb51e759ec6e60a4dbbc07cb4116875b38a33bee4493dd06e4553857cd57e50?chain=mainnet) |
| dannyy2000 ([@dannyy2000](https://github.com/dannyy2000)) | `SP14V779KZH7Q62TXJ1G6HZBP23PJT6CE25C7WRBN` | $25 | [`0x8912fdf4093011085861242e92e5745127efdc6e48d9b28dfc237d9d05d2cf3c`](https://explorer.hiro.so/txid/0x8912fdf4093011085861242e92e5745127efdc6e48d9b28dfc237d9d05d2cf3c?chain=mainnet) |

> **Bounty payments verified on Stacks mainnet on 2026-05-19** — exact STX amounts vary slightly from listed USD values due to gas fees and STX market price at payout time; aggregate value paid approximates the $150 bounty pool.

---

## Thank You

13 independent developers volunteered hours of careful review to read Clarity, TypeScript, and Express code that wasn't theirs. The contracts ship to mainnet measurably stronger because of their work — zero critical or fund-loss findings across all reviews, three real bugs caught in the final days that would otherwise have shipped, four reusable audit reports preserved permanently in this repository.

That is the Stacks ecosystem at its best.

— Jethro Irmiya
