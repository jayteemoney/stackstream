# StackStream — Social Media Posts

**Live App:** https://stackstream.vercel.app/
**GitHub:** https://github.com/jayteemoney/stackstream
**Early Access Form:** https://forms.gle/xmpNJkjtWwV2gYCS7
**X Handle:** @stackstream0

---

## PRE-MILESTONE POSTS (Already Published)

### Skool

**How DAOs Can Pay Contributors in Real Time (Instead of Waiting Weeks)**

Most DAOs still pay contributors the same way:
Manual transfers.
Delays. Lump-sum payments.

It works, but it creates friction, uncertainty, and inefficiency. I've been building StackStream to solve this. Instead of sending payments manually, tokens stream continuously over time.

Contributors earn in real time and can claim whenever they want. It's a simpler and more transparent way to manage contributor payments. The product is already live on testnet: 👉 https://stackstream.vercel.app/

Now moving toward mainnet. If you work with teams or contributors, I'd love to know: Would this improve your workflow?

📋 Early access: https://forms.gle/xmpNJkjtWwV2gYCS7

---

### LinkedIn

DAOs on Stacks still rely on manual processes to pay contributors.

Multi-signature approvals. Delayed payments. Lump-sum transfers.

It works but it doesn't scale.

I've been working on a solution.

I built StackStream, a payment streaming protocol on Stacks that allows DAOs to stream token payments continuously instead of sending them manually.

Contributors earn in real time and can claim whenever they choose.

The product is already live on testnet with working smart contracts, a functional frontend, and over 60 automated tests.

StackStream is supported by a grant from the Stacks ecosystem, and I'm now taking it through a structured path to mainnet and real-world usage.

Over the next few weeks, I'll be building this in public — sharing progress, decisions, and lessons along the way.

If you manage contributors, run a DAO, or are building on Stacks, I'd value your perspective.

App: https://stackstream.vercel.app/

Early access: https://forms.gle/xmpNJkjtWwV2gYCS7

#Stacks #DeFi

---

### X (Twitter) — Thread

**Slide 1**
DAOs on Stacks still don't have a native way to pay contributors automatically.

I built it.

It's called StackStream. ⚡🧵🚀

Right now, DAO payments look like:
→ Multi-sig approvals
→ Delays
→ Lump-sum transfers
It's slow, manual, and doesn't scale.

**Slide 2**
On Ethereum, protocols like Sablier have already streamed billions.

On Stacks?

Nothing.

StackStream changes that:
→ Stream tokens block by block
→ Contributors earn in real time
→ Claim anytime
→ No more manual payroll

**Slide 3**
What's already live:

→ Smart contracts on testnet
→ 60+ automated tests
→ Full working app
→ Wallet support (Leather + Xverse)
Try it: https://stackstream.vercel.app
Supported by the @StacksEndowment @Stacks ecosystem.

---

### X (Twitter) — Milestone 1 Progress Posts (Published)

**Post 1 — D1.1 Test Suite Complete**
*Link: https://x.com/dev_jayteee/status/2043285822410051700*

One of StackStream M1 Deliverable 1 is complete.

103 tests passing on Clarinet simnet up from 66.
38 new tests including property-based fuzz tests that verify the streaming math holds for ANY valid input, not just hand-picked values.

Here's what was tested & why: The original 66 tests covered the happy path.

What was missing: tests that try to *break* the math.

5 fuzz invariants, each running across 20-50 randomly generated stream configurations:

→ Token conservation: streamed + remaining == deposit. Always.
→ Claim bounds: you can never claim more than has accrued
→ Pause math: no drift across N pause/resume cycles
→ Top-up: rate unchanged, end-block extends correctly

The precision math that makes this work:
rate = deposit × 1e12 / duration_blocks
This gives 12 digits of precision for streaming rates — no floating point, no rounding drift across the full stream duration.
Clarity's uint means no overflow wrapping — it aborts instead.

The fuzz tests prove conservation holds for any (deposit, duration) pair

10 edge case tests that randomized inputs rarely hit:
→ 1-block streams
→ Deposits that don't divide evenly by duration
→ Cancel before stream starts (full refund)
→ Cancel at exactly end-block (recipient gets everything)
→ 0-block pause/resume cycles
→ Emergency pause: blocks creation, NOT claims or cancels

103 passing. 12.75s on Clarinet simnet.

Next: security review open for 60 hours (closes April 15), then mainnet deployment April 2026.

GitHub: https://github.com/jayteemoney/stackstream
Testnet: https://stackstream.vercel.app
Review issue: https://github.com/jayteemoney/stackstream/issues/1

---

**Post 2 — Security Review Update**
*Link: https://x.com/dev_jayteee/status/2044075664131702903*

StackStream security review update 🔒

8 devs have reviewed the contracts so far here's where we stand:

→ 0 critical
→ 0 high
→ 2 medium (fixed)
→ 6 low (addressed/documented)
→ 5 informational

113 tests passing on latest commit.

We're getting closer to mainnet safely. Some key improvements from community review:

→ expire-stream: recover funds from paused expired streams
→ ownership transfer: rotate owner key without redeploy
→ pause guard: fixes edge-case overcounting
→ safer top-up validation

Review is still OPEN 👇
http://github.com/jayteemoney/stackstream/issues/1

If you spot anything, drop it — every review makes this stronger.

Built on @Stacks sponsored by @StacksEndowment 🚀🚀🔥

---

### Skool — Milestone 1 Progress Posts (Published)

**Post 1 — D1.1 Test Suite Complete**
*Link: https://www.skool.com/stackers/stackstream103-tests-passing-with-fuzz-invariants-stacks-endowment-grantee*

StackStream: 103 Tests Passing with Fuzz Invariants (Stacks Endowment Grantee)

Hi Stacks community,
StackStream (Stacks Endowment grantee, mainnet April 2026) completed: Test suite expanded from 66 → 103 passing tests.

Fuzz tests (20) — 5 invariants verified across random (deposit, duration) pairs:
• Token conservation: streamed + remaining == deposit, always
• Claim bounds: claimed ≤ accrued at call time
• Pause accounting: no drift across N pause/resume cycles
• Top-up: rate preserved, end-block extends proportionally

Edge cases (10) — 1-block streams, indivisible deposits, cancel before/at end-block, emergency pause scope (blocks creation only, not claims)

Factory tests (8) — name boundary validation, duplicate tracking guard, cross-DAO stream isolation

Security review open now (60h window, closes April 15):
https://github.com/jayteemoney/stackstream/issues/1
Testnet: https://stackstream.vercel.app
GitHub: https://github.com/jayteemoney/stackstream


---

**Post 2 — Security Review 48hr Update**
*Link: https://www.skool.com/stackers/stackstream-security-review-48hr-update*

We opened StackStream's contracts for public review 48hrs ago. So far, 8 developers have reviewed stream-manager.clar and stream-factory.clar.

Status: 0 Critical | 0 High | 2 Medium (fixed) | 6 Low (addressed) | 5 Informational

Key improvements from review:
expire-stream → prevents stuck funds on paused expired streams
transfer-ownership → enables safe key rotation
pause guard → fixes pre-start accounting edge case
safer top-up validation

113 tests passing. Core logic holding strong.

Review is still open, please feel free to take a look and contribute.
github.com/jayteemoney/stackstream/issues/1

---

### LinkedIn — Milestone 1 Progress Posts (Published)

**Post 1 — D1.1 Test Suite Complete**
*Link: https://www.linkedin.com/posts/jethro-irmiya-a2153427b_stacks-defi-share-7447903048275738624-r3t9*

Milestone update: StackStream's test suite now has 103 passing tests — up from 66 — as part of Deliverable 1.1 of our Stacks Endowment grant.

The new tests aren't just more of the same. The key addition is property-based fuzz testing: instead of hand-picking inputs, the tests generate hundreds of random stream configurations and verify that core invariants hold for all of them.

Five invariants now verified for any valid input:

1. Token conservation — streamed + remaining always equals the original deposit. No tokens created, no tokens lost, at any point in the stream lifecycle.

2. Claim bounds — a recipient can never extract more than has accrued at the time of the call.

3. Pause accounting (single cycle) — pausing a stream freezes accrual exactly. Balance at resume equals balance at pause.

4. Pause accounting (multi-cycle) — cumulative pause duration tracks correctly across N pause/resume cycles. Zero drift.

5. Top-up correctness — adding funds to a stream preserves the streaming rate and extends the end block proportionally.

These properties aren't obvious to verify by hand — that's the point of fuzz testing. The math either holds for all inputs or it doesn't.

103 tests. 2 files. 12.75 seconds.

Mainnet deployment: April 17, 2026.

Security review is open for community feedback until April 15:
https://github.com/jayteemoney/stackstream/issues/1

Testnet app: https://stackstream.vercel.app/
GitHub: https://github.com/jayteemoney/stackstream

#Bitcoin #Stacks #DeFi #SmartContracts #BuildInPublic #DAO

---

**Post 2 — Security Review Progress Update**
*Link: https://www.linkedin.com/posts/jethro-irmiya-a2153427b_security-review-stackstream-v100-rc1-share-7449844381865648128-33Pl*

StackStream Security Review — Progress Update 🔒

48 hours ago, I opened a public community review of StackStream's Clarity smart contracts as part of Milestone 1 under the Stacks Endowment grant.

So far, 8 developers have reviewed the codebase.

Current status:
• 0 critical issues
• 0 high severity
• 2 medium — fixed before mainnet
• 6 low — addressed or documented
• 5 informational

What matters most is not just the numbers, but what the process uncovered.

Two meaningful fixes from the review:

Added a permissionless recovery path for paused streams past their end-block (expire-stream)
Reworked contract ownership into a rotatable model (transfer-ownership) for safer long-term operation

This is exactly why open review matters. Every external perspective strengthens the protocol before real funds are involved.

The review is still open.
If you work with Clarity or smart contract security, I'd genuinely value your input.

GitHub issue: github.com/jayteemoney/stackstream/issues/1

Built on Stacks. Moving carefully toward mainnet.

---

## MILESTONE 1 COMPLETE — v1.0.0-rc1 Release (Post April 16, 2026)

---

### X (Twitter) — v1.0.0-rc1 Release

**Post 1 — Main Announcement**

StackStream v1.0.0-rc1 is live.

10 independent security reviewers. 113 passing tests. Zero critical findings.

The Bitcoin-native payroll streaming protocol for DAOs on Stacks is ready for mainnet.

Release notes: https://github.com/jayteemoney/stackstream/releases/tag/v1.0.0-rc1

Try the testnet app: https://stackstream.vercel.app/

@Stacks @StacksEndowment #Stacks #Bitcoin #sBTC #DeFi #BuildOnBitcoin

---

**Post 2 — Security Review Thread**

We just closed a 60-hour open security review of StackStream. 10 community reviewers. Every public function audited. Here's what they found — and what we fixed. 🧵

1/ The review opened April 12. Within hours, the first findings came in.

Reviewers found a paused-stream stuck-funds scenario: if a stream was paused and the end-block passed, there was no path to settle it. Funds would be locked permanently.

Fix: added expire-stream — a permissionless function anyone can call to settle the stuck stream.

2/ The CONTRACT-OWNER pattern was flagged.

If the deployer key was ever lost, admin control (emergency pause) would be gone forever. Fix: two-step propose-ownership + accept-ownership pattern. A single typo can no longer brick the contract.

3/ Multiple reviewers independently confirmed:

- Token conservation holds on every exit path
- Authorization model is correct throughout
- Pause duration math has no drift across multiple cycles
- No arithmetic overflow risks identified

4/ Final tally:
0 Critical | 0 High
2 Medium — both fixed
15 Low — 9 fixed, 6 documented
20 Informational

Thank you Marvy247, Sobilo34, Akanmoh Johnson, Ali6nXI, Godbrand0, dannyy2000, Zachyo, IdokoMarcelina, Ryjen1, and Jayy4rl.

Full report: https://github.com/jayteemoney/stackstream/blob/main/SECURITY_REVIEW.md

@Stacks @StacksEndowment #Stacks #ClarityLang #DeFi

---

**Post 3 — Milestone 1 Complete**

Milestone 1 of the @StacksEndowment-funded StackStream build is done.

What was shipped:
- 66 tests → 113 tests (property-based invariant coverage)
- 10-person open security review — 0 Critical, 0 High
- All medium and most low findings fixed
- v1.0.0-rc1 release candidate tagged

Next: mainnet deployment. Target May 7.

Bitcoin-native DAO payroll is coming to Stacks.

https://github.com/jayteemoney/stackstream

Follow: @stackstream0

@Stacks @StacksEndowment #Stacks #Bitcoin #BuildOnBitcoin

---

### LinkedIn — v1.0.0-rc1 Release

Milestone 1 of StackStream is complete.

StackStream is a payment streaming protocol on Stacks that lets DAOs pay contributors in real time — tokens flow block by block instead of in monthly lump sums.

Here is what was accomplished in M1:

**Test suite: 66 → 113 passing tests**
Added property-based invariant tests that verify mathematical correctness under randomized inputs — token conservation, claim bounds, pause duration math, and top-up rate preservation all tested at scale.

**Open security review — 10 independent reviewers**
A 60-hour community review attracted 10 reviewers who audited every public function in both contracts.

Result: 0 Critical, 0 High findings. 2 Medium — both fixed.

Key improvements from the review: a permissionless expire-stream function to prevent a stuck-funds edge case, a two-step ownership transfer pattern to prevent admin lockout, and several defensive guards.

**v1.0.0-rc1 release candidate published**
Tagged and live on GitHub. Ready for mainnet deployment.

**What is next:**
Mainnet deployment targeting May 7, 2026. Production frontend switch. Five live verifiable streams on Stacks mainnet as evidence.

If you manage contributors, run a DAO, or are building on Stacks, follow along.

GitHub: https://github.com/jayteemoney/stackstream
Release: https://github.com/jayteemoney/stackstream/releases/tag/v1.0.0-rc1
App (testnet): https://stackstream.vercel.app/
Early access: https://forms.gle/xmpNJkjtWwV2gYCS7

#Stacks #Bitcoin #DeFi #SmartContracts #OpenSource #BuildInPublic #DAO #sBTC

---

### Skool — Milestone 1 Update

**StackStream Milestone 1 is done — here is what the security review found**

When I opened the StackStream contracts for community review two weeks ago, I did not know what to expect.

10 people reviewed the code over 60 hours.

The most important finding: a stuck-funds edge case. If a stream was paused and the end-block passed while it was still paused, there was no way to settle it. Funds would be locked forever.

That is now fixed. I added expire-stream — a permissionless function that anyone can call to settle the stream and return funds to both parties.

Other fixes from the review:
- Two-step ownership transfer (prevents admin lockout from a typo)
- Guards preventing pause before a stream starts
- Guards preventing top-up on already-expired streams

Final security score: 0 Critical, 0 High findings.

The product is live on testnet and heading to mainnet in May.

If you work with contributors or run a DAO on Stacks, get early access here:
https://forms.gle/xmpNJkjtWwV2gYCS7

App: https://stackstream.vercel.app/

---

## PRE-MILESTONE 2 POSTS (Already Published)

---

### X (Twitter) — Pre-Milestone 2

*Link: https://x.com/stackstream0X/status/2046758132320219497*

From testnet → mainnet.

StackStream M1 is done:
→ 113 tests
→ 10 independent reviewers
→ 0 critical / 0 high findings
→ Release candidate live

M2 (ending April):
We deploy to mainnet and run the first live streams.

Excited for what comes next on @Stacks with @StacksEndowment

Looking for 2–3 DAOs on Stacks to use StackStream on mainnet.

Early users will shape how this gets adopted.

---

### Skool — Pre-Milestone 2

*Link: https://www.skool.com/stackers/stackstream-update-m1-done-mainnet-next-ending-april*

StackStream Update: M1 Done → Mainnet Next (Ending April)🔥🚀

Quick update for everyone following the build 👇

Milestone 1 is complete, and it was all about making the protocol production-ready:
- Test suite grew from 66 → 113 (including fuzz/property-based tests)
- Open community security review (10 reviewers, 0 critical/high issues)
- All medium findings fixed before release
- v1.0.0-rc1 is now live on GitHub

Now things get real.

Milestone 2 is mainnet:
- Deploy contracts on Stacks
- Switch the app from testnet → mainnet
- Run real streams with on-chain proof

This is the transition from "cool testnet tool" → "actual financial primitive on Bitcoin."

If you're building on Stacks or part of a DAO, this is the phase where you can plug in early and shape how it's used.

Early access is open — happy to walk anyone through it.

---

### LinkedIn — Pre-Milestone 2

*Link: https://www.linkedin.com/posts/jethro-irmiya-a2153427b_milestone-1-complete-milestone-2-is-where-share-7452527603434807296-iqiu*

Milestone 1 complete. Milestone 2 is where StackStream becomes real.

Over the past few weeks, I've been building StackStream in public under the Stacks Endowment — a protocol designed to replace manual, delayed contributor payments with real-time streaming on Bitcoin.

Milestone 1 focused on production readiness:

• Test suite expanded from 66 → 113 (including property-based fuzz testing)
• 10-person open security review — 0 critical, 0 high findings
• All medium issues resolved before release
• v1.0.0-rc1 tagged and published

Now the shift begins.

Milestone 2:
• Deploy to Stacks mainnet
• Move the application from testnet to mainnet
• Execute real, on-chain payment streams

This is the point where StackStream transitions from a testnet prototype to a live financial primitive.

If you run a DAO, manage contributors, or are exploring on-chain coordination, this is the moment to start paying attention.

We're about to see what real-time payroll on Bitcoin actually looks like.
