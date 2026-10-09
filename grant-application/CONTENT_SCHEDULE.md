# StackStream Content Schedule: Sep 14 to Oct 13, 2026 (weekdays only)

> Same day numbers as `DESIGNER_BRIEF_SEP2026.md`, so asset filenames still match. Who gets a message, and the messages themselves: `ECOSYSTEM_OUTREACH_SEP2026.md` and `M3_DAO_ACQUISITION_PLAN.md`. Voice and settlement rules: `MARKETING_PLAN_V2.md`. How to run a call once a team says yes: `TEAM_ONBOARDING_PLAYBOOK.md`.
>
> **Weekdays only, from Oct 4.** Saturday and Sunday posts are removed from the plan: Days 6, 7, 13, 14, 20, 21, 27 and 28 are not posted and are not moved to another day. Every weekday from Day 1 to Day 19 was posted.

---

## Where we stand

| Fact | Value | Source |
|---|---|---|
| Streams created on mainnet | **11** | `stackstream.xyz/api/stats`, Oct 5, 06:36 UTC |
| Organisations registered | **0** | same |
| Tests | **125 contract tests, all passing**, including property-based fuzz tests. 206 tests across the whole repo | `npx vitest run`, verified Oct 4 |
| Security | Independent paid bounty audit before mainnet. Zero critical findings, every real bug fixed in v1.0.0-rc2 | `audits/AUDIT_REPORT_v1.0.0.md` |
| Live | Stacks mainnet since May 2026 | `deployments/default.mainnet-plan.yaml` |
| Real network cost | 0.003 to 0.018 STX per transaction | Mainnet stream-manager transactions, May to July 2026 |

### Shipped during the campaign, and usable in copy

| Shipped | What it means for a reader | Where it is used |
|---|---|---|
| **Any token, including a team's own** (Oct 2) | A team can pay contributors in its own token, not only a list we chose. The token is checked against the chain before anyone can sign | D22, D23, D24, outreach |
| **One-link setup** (Oct 2) | A team puts `stackstream.xyz/dashboard/create?token=<contract id>` in its docs and the form opens with its token already selected | D23, D24, Zero Authority, Velar |
| **Look-alike warning** (Oct 2) | A token borrowing a famous name, such as a fake "sBTC", is flagged before it can be chosen | D23 LinkedIn, D25 |
| **Correct amounts for every token** (Oct 2) | Balances in 6-decimal tokens such as USDA are shown at their real value everywhere, including the assistant | Answer if asked; not a post on its own |
| **Open read API and integration guide** (Sep 24) | Any app or wallet can show live stream data without asking us, documented in `docs/INTEGRATION_GUIDE.md` | D24, Zero Authority, Xverse |

Not shipped, never in copy as a feature: private streams with Privara (research done, see `PRIVARA_INTEGRATION.md`), cross-chain payout.

---

## What we are proving

**Internally**, the goal is the M3 target: 3 organisations registered and $10,000 streamed. It is never stated in public and never tied to a date.

**Publicly**, every piece of content works toward two outcomes: **real proof of usage for the Stacks Endowment**, and **StackStream serving the ecosystem's payment needs efficiently**.

Four points every post can stand on:

1. **It has a real audience.** DAOs, grant programmes, and contributors across Stacks pay and get paid by hand today.
2. **It is safe.** Independently audited, 125 passing contract tests, and funds sit in the contract, never with us.
3. **It is live.** On Stacks mainnet, works with any token on Stacks including a team's own, no fee from us.
4. **Both sides benefit.** Recipients claim as they earn. Payers keep full control: pause, top up, or cancel, with unearned funds returned instantly.

**The public call:** real teams using StackStream is how it proves it serves the ecosystem, and shows the Stacks Endowment a product that grows natively, over time and space.

---

## Voice and length

**Tone:** professional but light. Persuade with benefits and proof, never hype.

| Format | Length |
|---|---|
| X post | One post, 280 characters or fewer including the link |
| WhatsApp status | One line |
| Grantees Telegram, Stacks Discord | 100 words or fewer |
| LinkedIn, Stacks Forum | 100 to 200 words |
| Outreach DM | 100 to 200 words, follow-ups under 60 |

| Channel | Voice | Asset ratio |
|---|---|---|
| Official X (@Stackstream0X) | We. Clear, warm, confident | 1:1 |
| Personal X (@dev_jayteee) | I. Honest, behind the scenes | 1:1, or none on human-note days |
| LinkedIn | Calm, professional, value-led | 4:5 |
| Stacks Forum | Discussion-first, precise terms allowed | 16:9 |
| Stacks Discord | Receipts and help, never announcements | 16:9, or none |
| Grantees Telegram | Builder to builder, never salesy | None |
| WhatsApp status | Like texting a friend | 9:16 |

---

## The four doors

| Door | Who | What they get | Days |
|---|---|---|---|
| **1. DAOs and teams** | Bitflow, Zest, Stacking DAO, Velar, Taptive | Payroll set once, in any token including their own, contributors claim anytime, full control kept | D5, D9, D23, D26 |
| **2. Grant and bounty programmes** | Zero Authority and DeGrants, Stacks Endowment, PaySats, DeepStack | Funds release as work ships, unreleased funds stay with the funder, the payment is the report | D10, D12, D24 |
| **3. People being paid** | Contributors, freelancers, creators | Pay grows while they work, claimed anytime on the Earn page | D11, D19 |
| **4. Subscriptions** | Listen only this run | Charges only while the service is used | None |

**Distribution layer:** Xverse (Ken Liao), Stacks Labs (Alex Miller, Andre Serrano), and Muneeb Ali, held until a team registers. Their days: D16, D17, D24.

**Private scoreboard, every Friday after the post:** per door, record conversations opened, replies, calls, organisations registered, streams funded by others, value streamed, and unprompted inbound. A registration or funded stream beats a call, and a call beats a reply. Day 30 names the door with the most pull. Value streamed stays on the scoreboard only.

---

## Rules

- **Weekdays only.** Monday to Friday. Nothing is scheduled on Saturday or Sunday, and a weekend is never used to catch up a missed weekday.
- **Numbers:** [N] streams and [D] organisations from `stackstream.xyz/api/stats` on the morning of posting. Never estimate. Any stream we open ourselves is labelled as ours.
- **Security claims:** say "independently audited" and "125 passing tests" (these are the contract tests). Re-run the suite before Day 24 in case the count changed.
- **Tokens:** say "any token on Stacks", and when naming examples use sBTC, USDA, ALEX and xBTC. Never list STX: native STX is not a token the contract can stream.
- **Cost:** say "no fee from us" and "a fraction of one STX in network fees". Never "a few STX", which overstates the real cost about a thousand times.
- **No deadlines anywhere. No target figures or amounts in public.**
- **Settlement:** never put the update rhythm and Bitcoin settlement in the same clause. Social: "your balance updates every few seconds, secured by Bitcoin". Technical: "streams update in seconds; settlement inherits Bitcoin finality".
- **No jargon** in social copy or on assets: escrow, protocol, primitive, SIP-010, vault. Forum posts and Days 10 and 24 may be precise.
- **Link:** every post ends with https://stackstream.xyz. Developer days may use the GitHub repo. Explorer links go in the first reply. Telegram only in DMs and replies, never as a post's link.
- **Follow line:** every post carries a follow ask for the official page, placed just before the final link: "Follow @Stackstream0X for the weekly numbers." on X and LinkedIn, "Weekly numbers on X: @Stackstream0X." on Forum, Discord and Grantees Telegram, and "X: @Stackstream0X" appended to the WhatsApp line. The link still stays last.
- **Handles:** @Stackstream0X, @dev_jayteee (three e's), t.me/dev_jaytee (two e's).
- **DMs** go from @dev_jayteee only. @Stackstream0X engages each target two to three days first.
- **No team named** without written permission, and nothing posted before the transaction confirms.
- **Style:** no em dashes. Personal says "I", Official says "we", never the same words.
- **Assets:** if one is late, post the words alone. Never stock imagery.

---

## Weekly rhythm

**Mon** the number (A) · **Tue** one idea (B) · **Wed** proof (H or C) · **Thu** one objection (D) · **Fri** one door (E). No weekend posts.

**A missed day is skipped, not reposted.** The calendar does not shift and no day carries two posts. LinkedIn about twice a week, Forum on Day 30, Discord on Days 3, 10, 17 and 24, Grantees Telegram five touches, WhatsApp every weekday.

---

## Outreach calendar

Weekdays only. Follow-ups at three and ten days, then stop. Message texts are in `ECOSYSTEM_OUTREACH_SEP2026.md`, Part 6.

| Send | Person | Door | Where it stands, Oct 5 | Message |
|---|---|---|---|---|
| **Mon Oct 5** | **Zero Authority DAO** (zero), runs DeGrants | 2 | Replied Sep 24. X Space Sep 25, call Sep 26 ended positively, with an offer to work together. No message from us since Sep 26 | Z1, the pilot proposal |
| Mon Oct 5 | **Grant Nissly**, Taptive and Stacks Labs | 1 | LinkedIn Sep 16 and Sep 21, silent | G2, one email, then stop |
| **Tue Oct 6** | **Privara** (Samuel Dahunsi), fellow grantee | 1 | Onboarding call held and went well | P1, registration plus the integration questions |
| Tue Oct 6 | **Mithil Thakore**, Velar | 1 | Not yet sent | V1, on the own-token day |
| Tue Oct 6 | **Tycho Onnasch**, Zest and Stacking DAO | 1 | DM Sep 23, no reply | T3, last nudge, then stop |
| **Wed Oct 7** | **PaySats** and **DeepStack**, fellow grantees | 2 | Not yet sent | GR1, one each, builder to builder |
| Wed Oct 7 | **Alex Miller**, Stacks Labs | Distribution | Not yet sent | A1 |
| **Thu Oct 8** | **Andre Serrano**, sBTC go-to-market | Distribution | Not yet sent | S1 |
| Thu Oct 8 | **Ken Liao**, Xverse | Distribution | Not yet sent | K1 |
| Fri Oct 9 | **Rena Shah**, Stacks Endowment | 2 | Replied Sep 18: will try it after the Q3 Treasury Committee meeting | R1, one gentle check-in, only if the meeting has passed |
| Fri Oct 9 | **Bitflow**, via Diego Mey Sanchez | 1 | Bitflow account silent after Sep 25 | B2, once, then stop |
| Hold | **Muneeb Ali**, until a team registers. One message, no follow-up | Distribution | Held | Break-glass |

Follow-ups for the new sends fall on the third and tenth weekday after sending. If a date lands on a weekend, send on the Monday.

---

## Which channels fire each day

Weekend days (6, 7, 13, 14, 20, 21, 27, 28) are removed.

| Day | Date | Narrative | Asset | Off. X | Pers. X | LinkedIn | Forum | Discord | TG | WhatsApp |
|---|---|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | Mon Sep 14 | The call to real teams (posted) | A | ✓ | ✓ |  |  |  | ✓ | ✓ |
| 2 | Tue Sep 15 | The tap, not the bucket (posted) | B | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 3 | Wed Sep 16 | Watch it move (posted) | H | ✓ | ✓ |  |  | ✓ |  | ✓ |
| 4 | Thu Sep 17 | Where the money actually sits (posted) | B, D | ✓ | ✓ |  |  |  |  | ✓ |
| 5 | Fri Sep 18 | Payday that runs itself (posted) | E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 8 | Mon Sep 21 | The number, week 2 (posted) | A | ✓ | ✓ |  |  |  |  | ✓ |
| 9 | Tue Sep 22 | You are never locked in (posted) | B | ✓ | ✓ |  |  |  |  | ✓ |
| 10 | Wed Sep 23 | A real transaction (posted) | C | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |
| 11 | Thu Sep 24 | What if nobody claims it? (posted) | D | ✓ | ✓ |  |  |  |  | ✓ |
| 12 | Fri Sep 25 | Grants that release as work ships (posted) | E, B | ✓ | ✓ | ✓ |  |  | ✓ | ✓ |
| 15 | Mon Sep 28 | The number, week 3 (posted) | A | ✓ | ✓ |  |  |  |  | ✓ |
| 16 | Tue Sep 29 | Any token you actually hold (posted) | B | ✓ | ✓ |  |  |  |  | ✓ |
| 17 | Wed Sep 30 | Two minutes, start to finish (posted) | H, C | ✓ | ✓ |  |  | ✓ |  | ✓ |
| 18 | Thu Oct 1 | What does it cost? (posted) | D | ✓ | ✓ |  |  |  |  | ✓ |
| 19 | Fri Oct 2 | Paid as you work (posted) | E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 22 | Mon Oct 5 | The number, week 4 (posted) | A | ✓ | ✓ |  |  |  |  | ✓ |
| 23 | Tue Oct 6 | Pay your team in your own token (posted) | B, E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 24 | Wed Oct 7 | Open code, open data (posted) | C | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |
| 25 | Thu Oct 8 | Is it safe? (posted) | D | ✓ | ✓ |  |  |  |  | ✓ |
| 26 | Fri Oct 9 | How teams pay people today | E, B | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 29 | Mon Oct 12 | The number, week 5 | A | ✓ | ✓ |  |  |  |  | ✓ |
| 30 | Tue Oct 13 | Thirty days in the open | A, G | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ |

---

## Week 1: What streaming is (Sep 14 to Sep 18)

### Day 1, Mon Sep 14: The call to real teams (posted)

> Posted on all channels Sep 14. Kept as the record, not for reposting.

**Official X** (thread)
> DAOs and teams on Stacks pay real people every month. That money should not have to wait for payday.
> StackStream is live on mainnet. Balances grow every few seconds, secured by Bitcoin. Recipients claim anytime. Senders stay in full control.
> ↳ What comes next is real teams using it. Every stream they open shows how well this serves the ecosystem, and shows the Stacks Endowment a product built to grow natively, over time and space.
> The first seats are open. See it working for yourself.
> https://stackstream.xyz

**Personal X** (thread)
> What StackStream needs next is not more code. It is real teams.
> DAOs and projects paying real contributors through it. That is how we prove it fits this ecosystem, and how the Stacks Endowment sees it grow natively, over time and space.
> ↳ We are early. The product is ready. See what we have built, then let me set up your team's first stream with you.
> https://stackstream.xyz

**Grantees Telegram**
> Starting a new push today, and this room is where I want to begin. StackStream is live and working. The next step is real teams using it, because that is what proves it serves Stacks and shows the Endowment it can grow natively. If your project pays anyone, I would love to set up one stream with you and hear what you honestly think. Gas only, no catch. stackstream.xyz

**WhatsApp**
> StackStream is live and ready. Now it is time for real teams. stackstream.xyz

---

### Day 2, Tue Sep 15: The tap, not the bucket (posted)

> `SS_D02_tap-bucket` (B) · Outreach: Bitflow thread, Rena Shah

**Official X**
> Most pay arrives like a bucket: once a month, and late.
> StackStream works like a tap. Your balance grows every few seconds, and you take what you have earned anytime.
> Payroll, grants, freelance work. Same tap, live on Stacks.
> https://stackstream.xyz

**Personal X**
> How I explain StackStream: the bucket and the tap.
> Bucket: work all month, get paid in one lump.
> Tap: pay flows every few seconds as you work. Fill your glass (your wallet) anytime. The payer controls the tap.
> Audited, live on Stacks.
> https://stackstream.xyz

**LinkedIn**
> Your team works every day. Why does it only get paid once a month?
>
> Most payments are built around a date, not around the work.
> Payroll lands at month end. Invoices wait 30 days. Grants release on sign-off. The value is created continuously, yet the money arrives in one late lump.
> StackStream changes that. An organisation opens a stream once, the recipient's balance grows every few seconds, and they claim whenever they choose. The payer keeps full control and can pause, top up, or cancel, with unearned funds returned instantly.
> It is live on Stacks mainnet, independently audited, and backed by 125 passing tests. It serves groups already active in the ecosystem: DAOs paying contributors, grant programmes releasing funds, and the builders who get paid.
> If your team pays people, I would be glad to show you how it works.
> https://stackstream.xyz

**WhatsApp**
> Money like a tap, not a bucket. Live on Stacks today. stackstream.xyz

---

### Day 3, Wed Sep 16: Watch it move (posted)

> `SS_D03_ticking-balance` (H), pin on @Stackstream0X · Outreach: Grant Nissly · If the loop is late, cut 10 seconds from the July demo

**Official X**
> Watch it move.
> A real balance growing in real time, with nobody pressing anything.
> This is getting paid on StackStream: every few seconds, secured by Bitcoin, yours to claim anytime.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Eight seconds that explain a year of building.
> A number rising on its own while someone gets on with their work. Audited, live on mainnet, and ready for real teams.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord** (#building-on-stacks)
> Hi all, Jethro here, founder of StackStream. A quick look rather than a long read: this loop is a real stream on mainnet. A team opens a stream, the recipient's balance grows every few seconds, and they claim anytime. The team can pause, top up, or cancel, with unearned funds returned instantly. Any token on Stacks, independently audited, 125 passing tests, no fee from us.
> If you pay people from a Stacks project, one honest answer would help: what would stop you trying this?
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz

**WhatsApp**
> Eight seconds of money arriving in real time. stackstream.xyz · X: @Stackstream0X

---

### Day 4, Thu Sep 17: Where the money actually sits (posted)

> `SS_D04_where-money-sits` (B, D)

**Official X**
> While money streams, who holds it?
> Not us. Funds sit in an audited contract. Recipients claim only what they have earned, and senders reclaim only what has not been earned yet.
> Safe by design, not by promise.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The first question I get: where is the money while it streams?
> In a contract neither side controls, and not even I can touch it. The contracts were independently audited before mainnet.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> While money streams, it sits in an audited contract, never with us. stackstream.xyz · X: @Stackstream0X

---

### Day 5, Fri Sep 18: Payday that runs itself (posted)

> `SS_D05_payday-runs-itself` (E) · Follow-ups: Bitflow, Rena · @Stackstream0X starts engaging Zest and Stacking DAO

**Official X**
> A team of five at month end: a spreadsheet, a signer asleep, someone missed.
> Or five streams, opened once and already running. People claim when they want, and you stay in control.
> Payday that runs itself.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Small teams lose hours every month just paying people. Nobody's job, everybody's problem.
> Five streams, set once, and the ritual stops. I will set up your first one with you.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Five people, one spreadsheet, and someone always paid late.
> For founders and operators of small distributed teams, payroll should not be a monthly project. At five people the work is real, but nobody owns it. Amounts get checked twice, signers get chased across time zones, and someone is always paid late.
> With StackStream, each person gets one stream, opened once. Their balance grows as they work, and they claim whenever they choose. Your team keeps full control: pause, top up, or cancel, with unearned funds returned instantly. It works with any token on Stacks, including sBTC, and takes no fee.
> It is live on mainnet and independently audited, so the smallest trial is low risk: one stream, one person, one month. I will set it up with you.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Payday that runs itself. If you run a team, this is for you. stackstream.xyz · X: @Stackstream0X

---

## Week 2: Proof and control (Sep 21 to Sep 25)

### Day 8, Mon Sep 21: The number, week 2 (posted)

> `SS_D08_metric-card` (A), live counts only · Outreach: Tycho Onnasch

**Official X**
> Week 2, straight from the contract: 11 streams. 0 teams registered.
> That 0 is our favourite number. It is a seat saved for the first @Stacks team to stream its pay.
> The product is ready. The seat is warm.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Monday numbers: 11 streams, 0 teams.
> Built with @StacksEndowment backing. Audited, live, ready. But code cannot pick its own first team.
> That part belongs to this ecosystem. I will do the setup myself.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> 11 streams, 0 teams, and one seat saved for the first. stackstream.xyz · X: @Stackstream0X

---

### Day 9, Tue Sep 22: You are never locked in (posted)

> `SS_D09_never-locked-in` (B) · Outreach: DeGrants stewards

**Official X**
> Four controls, and your money stays yours.
> Pause when work stalls. Resume when it restarts. Top up when it runs long. Cancel when it ends, and unearned funds return instantly.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The feature I refused to launch without: the exit.
> Cancel a stream and the earned part goes to the person who earned it, while the rest comes home in the same transaction.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Pause, resume, top up, or cancel. Your money stays yours. stackstream.xyz · X: @Stackstream0X

---

### Day 10, Wed Sep 23: A real transaction (posted)

> `SS_D10_proof-card` (C), precise terms allowed · Outreach: Mithil Thakore · Use a real mainnet stream and label it if it is ours · Explorer link in the first reply

**Official X**
> A real transaction, nothing to take on faith.
> The hash, the block, the amount, confirmed on mainnet. Open it in the explorer and check every field. Receipt in the reply.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Proof over adjectives. One real stream, receipt in the reply.
> Better still: paste the stream ID into the assistant in our dashboard, and it reads the status and claimable balance straight from the chain.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord**
> Hi all, Jethro from StackStream. Today I am posting a receipt, not a promise.
> This is a real stream on mainnet: https://explorer.hiro.so/txid/0xe8367172fde244bb23b776fe6acda8afcb6cf9559ae67b7a2cd6f8dc5ca89148?chain=mainnet
> Stream 11. 1.2 USDA over 2,160 blocks. Created, then claimed. It runs between two of my own wallets, so I am saying that upfront.
> Open it. Check every field. Then paste the stream ID into the lookup on our dashboard and watch it read the balance straight from the chain.
> The infrastructure is ready. What it needs now is real teams. If your project pays anyone, try one stream. I will set it up with you.
> Weekly numbers on X: @Stackstream0X.

**Grantees Telegram**
> Sharing a stream receipt end to end, in case it helps with your own milestone evidence. Everything checks out in the explorer, which saves a lot of "trust me" in grant reports. Standing offer: a test stream between our projects, and I will set it up.
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> Real stream, real receipt. Check it yourself. stackstream.xyz · X: @Stackstream0X

---

### Day 11, Thu Sep 24: What if nobody claims it? (posted)

> `SS_D11_nobody-claims` (D) · Outreach: reply to Zero Authority to book the call. No follow-ups due (Tycho Sep 26, Bitflow Sep 25, Rena not chased)

**Official X**
> What if the person you pay never claims?
> Nothing is lost. The balance keeps accruing and waits in the contract. Claim a little every day, or everything on the last day.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> A common question: what happens if nobody claims?
> Nothing dramatic. The earned balance simply waits until they want it. Claiming is a right, not a chore.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Forget to claim? Nothing is lost. It waits for you. stackstream.xyz · X: @Stackstream0X

---

### Day 12, Fri Sep 25: Grants that release as work ships (posted)

> `SS_D12_grants-in-stages` (E, B) · Follow-ups: DeGrants, Rena · Outreach: PaySats and DeepStack

**Official X**
> Funding builders should not mean choosing who carries the risk.
> Stream the grant instead. Funds release as work ships, pause if a milestone slips, and anything unreleased stays in your control.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Grant programmes already pay in stages. The money just moves by hand.
> A streamed grant does it automatically, and every payment is public, so the payment itself becomes the report.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> For grant, bounty, and ecosystem funding programmes.
> Milestone funding manages risk but creates admin. Someone checks the deliverable, approves the release, sends the transfer, and later writes up where the money went.
> A streamed grant keeps the milestone logic and removes most of the handling. Funds release continuously over the grant period, and the builder draws what has accrued when needed. If work stops, the programme pauses or cancels, and every unreleased dollar returns in the same transaction. Because each payment is on a public ledger, reporting becomes a by-product rather than a task.
> StackStream is live on Stacks mainnet and independently audited. We are looking for one programme to try this on one or two grants, with full control kept throughout.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**Grantees Telegram**
> This one is for us. We are all paid in milestones, and many of us pass funds on to collaborators. If you want to run a sub-grant or bounty as a stream, releasing with the work while the rest stays with you, I will set it up with you. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> Fund builders in stages, as the work happens. stackstream.xyz · X: @Stackstream0X

---

## Week 3: Who it is for (Sep 28 to Oct 2)

### Day 15, Mon Sep 28: The number, week 3 (posted)

> `SS_D15_metric-card` (A) · Outreach: Alex Miller

**Official X**
> Week 3. [N] streams live on mainnet. [D] organisations registered.
> One product, three ways in: payroll that runs itself, grants that release as work ships, and pay that grows while you work.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Week 3: [N] streams, [D] organisations registered.
> The kind of team leaning in most so far: [DAOs and teams / grant programmes / builders]. [One true line on why.]
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Week 3: [N] streams, [D] teams. Built for Stacks. stackstream.xyz · X: @Stackstream0X

---

### Day 16, Tue Sep 29: Any token you actually hold (posted)

> **Correction for any reuse.** Native STX cannot be streamed: the contract takes tokens, and STX is the network's own coin. Say "any token on Stacks, including sBTC, USDA, ALEX and xBTC", and since Oct 2, "including your own".

> `SS_D16_any-token` (B) · Outreach: Andre Serrano

**Official X**
> Not a one-token tool.
> Stream sBTC, USDA, ALEX, xBTC, or any SIP-010 token on Stacks. Pay in what your treasury holds, and get paid in what you actually want.
> Including real Bitcoin, through sBTC.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The most common wrong assumption: "so it only streams one token?"
> No, any SIP-010 token on Stacks. My favourite is sBTC: someone paid in real Bitcoin, continuously, claiming it themselves.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Stream any token you hold, even real Bitcoin. stackstream.xyz · X: @Stackstream0X

---

### Day 17, Wed Sep 30: Two minutes, start to finish (posted)

> `SS_D17_two-minute-flow` (H, C), captioned, under 40 seconds · Outreach: Ken Liao

**Official X**
> Wallet to live stream, start to finish, no cuts.
> Connect. Choose who, which token, how much, and how long. Confirm. Watch it start.
> Captioned, so it works on mute.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> My bar for the product: if you can send a message, you can open a stream.
> Here is the full flow, recorded once with no edits. Try it yourself, and tell me where it could be smoother.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord**
> For anyone who wanted the real flow rather than a loop: a full recording of opening a stream on mainnet, from wallet to live stream, captioned. [clip]
> If you try it and anything breaks, especially in the wallet step, post it here or DM me. Reports from this room are the fastest way I find and fix issues.
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> Wallet to live stream in under two minutes. stackstream.xyz · X: @Stackstream0X

---

### Day 18, Thu Oct 1: What does it cost? (posted)

> **Correction for any reuse.** Real network fees on our contract are 0.003 to 0.018 STX per transaction. Say "a fraction of one STX", never "a few STX".

> `SS_D18_cost` (D), asset copy "No fee from us" · Follow-ups: Alex, Tycho

**Official X**
> What does it cost?
> No fee from us. You pay Stacks network gas, a few STX, and that is it.
> Price should never be the reason not to try.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Budget quietly kills good tools, so I say it first: StackStream takes no fee.
> A one-person, one-month trial costs a few STX in gas and twenty minutes. I will do the setup.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> No fee from us. Just a few STX in network gas. stackstream.xyz · X: @Stackstream0X

---

### Day 19, Fri Oct 2: Paid as you work (posted)

> `SS_D19_paid-as-you-work` (E) · Follow-ups: DeGrants, Andre · Outreach: creators, only if Tycho is silent

**Official X**
> For the person being paid.
> From the moment a stream opens, your balance grows while you work. Watch it on the Earn page and claim all or part anytime.
> No invoice. No chasing. No 30-day wait.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> I freelanced for years. The work was never the hard part; the waiting was.
> On StackStream, your pay grows in front of you and you take it when you want. Send this to whoever pays you.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> If you hire freelancers, contractors, or creators, here is an underrated retention tool: pay them as they work.
> With a streamed engagement, your contractor watches earnings grow while they deliver and claims anytime, without chasing an invoice. You keep control and can pause or stop if the scope changes. Both sides get certainty.
> StackStream makes this simple on Stacks. It is live on mainnet, independently audited, works with any token on Stacks including sBTC, and takes no fee. Setup takes a few minutes, and the person you pay needs nothing more than a Stacks wallet.
> The best people choose clients who pay like this.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> For everyone still waiting on an invoice, there is a better way. stackstream.xyz · X: @Stackstream0X

---

## Week 4: Trust and depth (Oct 5 to Oct 9)

### Day 22, Mon Oct 5: The number, week 4 (posted)

> `SS_D22_metric-card` (A) · Outreach: Zero Authority (Z1), Grant Nissly (G2) · If a team registers this week, run the break-glass posts · Personal X: keep the bracketed line under 60 characters so the post stays within 280

**Official X**
> Week 4. [N] streams on mainnet. [D] organisations registered.
> New: any team can now stream its own token, not only the ones we list. Share one link and your people are paid in it as they work.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Week 4: [N] streams, [D] organisations registered.
> [One honest line on the gap between conversations and registrations.] New: teams can stream their own token from one link. I still set up every first stream myself.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Week 4: [N] streams, [D] teams. Now in any token, even your own. stackstream.xyz · X: @Stackstream0X

---

### Day 23, Tue Oct 6: Pay your team in your own token (posted)

> `SS_D23_own-token` (B, E), the master diagram with a blank token badge on the stream · Outreach: Privara (P1), Mithil Thakore (V1), Tycho (T3) · Replaces "Cancel it and see"; the cancel split now lives on Day 25

**Official X**
> Your DAO has its own token. Now you can pay contributors in it, continuously.
> Share one link, we check the token against the chain, and the stream opens. They claim as they earn. You stay in control.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The question I kept hearing: can we stream our own token?
> Now yes. Put one link in your docs and the form opens with your token picked and verified. No list to get onto, no waiting on me.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Many organisations on Stacks pay contributors in their own token. Most still do it by hand, in lump sums.
> StackStream now streams any token on Stacks, including a team's own. The team shares one link, the token's details are read straight from the chain, and a stream opens in a few minutes. Contributors watch their balance grow and claim whenever they want. The team can pause, top up or cancel at any point, and anything unearned returns in the same transaction.
> Tokens that borrow a well-known name are flagged before anyone can pick them, so a link cannot be used to slip in a fake.
> It is live on Stacks mainnet, independently audited, and takes no fee. If your organisation pays in its own token, I will set up the first stream with you.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Pay your team in your own token, as they work. stackstream.xyz · X: @Stackstream0X

---

### Day 24, Wed Oct 7: Open code, open data (posted)

> `SS_D24_open-code` (C), precise terms allowed · Outreach: PaySats and DeepStack (GR1), Alex Miller (A1) · Re-run `npx vitest run` first and update the count if it changed

**Official X**
> For developers.
> Open-source Clarity contracts, 125 passing tests with fuzzing, and an independent audit before mainnet. Plus an open read API any app can call, and a link that opens a stream in any token.
> Follow @Stackstream0X for the weekly numbers.
> https://github.com/jayteemoney/stackstream

**Personal X**
> I would not move my salary through a contract I could not read, so you can read ours.
> 125 tests, fuzzing on the one property that matters (funds always add up), and an open API for your app.
> Follow @Stackstream0X for the weekly numbers.
> https://github.com/jayteemoney/stackstream

**Stacks Discord**
> For builders. StackStream's Clarity contracts are open source, with 125 passing tests on Clarinet including property-based fuzzing. Audit report and findings triage are in /audits.
> New: a public read-only API (/api/streams, /api/daos, /api/stats) any site can call from the browser, documented in docs/INTEGRATION_GUIDE.md, and a create link that preselects any SIP-010 token: stackstream.xyz/dashboard/create?token=<contract-id>.
> Build on it, or open an issue if something is wrong.
> Weekly numbers on X: @Stackstream0X.
> https://github.com/jayteemoney/stackstream

**Grantees Telegram**
> For anyone wiring payments into their own product: our read API is open and documented, and you can link straight to a stream in your own token. The audit report and findings triage are public too, so copy the format if it helps your milestone evidence. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> Open code, independent audit, open data. stackstream.xyz · X: @Stackstream0X

---

### Day 25, Thu Oct 8: Is it safe? (posted)

> `SS_D25_is-it-safe` (D), or reuse `SS_D23_cancel-split` if it was already produced · Outreach: Andre Serrano (S1), Ken Liao (K1)

**Official X**
> Is it safe?
> Funds sit in the contract, never with us. Audited before mainnet. Cancel anytime: earned goes to the recipient, unearned comes straight back to you, in one transaction.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The question behind every question: can I trust it?
> My answer: do not trust it, check it. Audited contracts, 125 passing tests, all public. Even a cancel splits fairly in one transaction.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Your money sits in an audited contract, never with us. stackstream.xyz · X: @Stackstream0X

---

### Day 26, Fri Oct 9: How teams pay people today

> `SS_D26_how-teams-pay` (E, B), the highest-converting asset · Follow-up: Andre · Pin on @dev_jayteee if a Door 1 conversation is open

**Official X**
> How a small team pays people today: a spreadsheet, a second check, signer chasing, a late payment, and someone missed.
> The same month with streams: set once, paid continuously, full control.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The image maps every step of month-end payroll and every place it breaks.
> None of it is hard. It is just repeated forever. One stream, one person, one month is the easiest way to see the difference.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Mapping manual payroll honestly for a small distributed team.
> A spreadsheet at month end. A second check by whoever has time. A multi-signature proposal and a round of chasing signers across time zones. Payment somewhere in the first week of the next month, and almost always one person missed.
> None of it is difficult. It is hours of repeated work every month, and it leaves contributors unsure when they will be paid.
> StackStream turns it into a one-time setup. Each contributor gets a stream, pay accrues continuously, and they claim when they choose. The team keeps full control throughout. It is live on Stacks mainnet and independently audited.
> If this is your month end, try one stream with one person for one month. I will set it up with you.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Month-end payroll takes hours. It should take zero. stackstream.xyz · X: @Stackstream0X

---

## Week 5: Closing (Oct 12 to Oct 13)

### Day 29, Mon Oct 12: The number, week 5

> `SS_D29_metric-card` (A), with the five-Monday sparkline

**Official X**
> Week 5, the last card of this run. [N] streams live on mainnet. [D] organisations registered.
> All five Mondays in one line, every figure checkable on-chain. The door stays open.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Five Mondays, five cards: [N] streams, [D] organisations registered.
> [One honest line on the shape of the sparkline.]
> Tomorrow: what this month taught us about who needs StackStream most.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Five honest Mondays. [N] streams, [D] teams. stackstream.xyz · X: @Stackstream0X

---

### Day 30, Tue Oct 13: Thirty days in the open

> `SS_D30_thirty-days` (A, G), built to work whether numbers rose or barely moved · Name the door with the most pull from the scoreboard, or say plainly that none led

**Official X**
> Thirty days in the open.
> Sep 14: 11 streams, 0 organisations. Today: [N] streams, [D] organisations.
> The teams leaning in hardest: [door]. That is where the next month goes.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> 30 days of posting real numbers: 11 to [N] streams, 0 to [D] organisations.
> The biggest lesson: [door] needs this most. That is where I am heading next, and my DMs are open.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Thirty days ago we started testing one question in public: which part of the Stacks ecosystem needs payment streaming most?
> StackStream serves teams paying contributors, grant programmes releasing funds, and individuals paid as they work. All three were live throughout, on mainnet, with audited contracts. We published usage every Monday, straight from the chain, and tracked every conversation by where it came from.
> Result: [N] streams and [D] organisations registered, from 11 and 0. The strongest pull came from [door], measured by [registrations, calls, inbound]. The weakest was [door].
> Next: [one sentence].
> The lesson for anyone seeking product-market fit: measure behaviour by segment, not interest overall. The total hides the segment already leaning in.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**Stacks Forum**, thread: "StackStream, 30 days in the open"
> A retrospective for the ecosystem, posted the same day as the public numbers.
> Numbers: 11 to [N] streams and 0 to [D] organisations, all verifiable at stackstream.xyz/api/stats. Any streams we opened ourselves are labelled: [list or "none"].
> Conversations: [count] opened across teams, grant programmes, contributors, and ecosystem partners. The strongest response came from [door], the weakest from [door].
> Shipped this month: streams in any token including a team's own, opened from one link; a warning on look-alike tokens; correct amounts for every token; and an open read API with an integration guide. Changing next: [one or two lines].
> The contracts remain open source, independently audited, live on mainnet, and backed by 125 passing tests. If your Stacks project pays people by hand, I will still set it up with you personally.
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz

**Grantees Telegram**
> 30-day run done: [N] streams, [D] organisations, and the clearest signal is that [door] wants this most. Thank you to everyone here who answered my question about how you pay people; it shaped the whole month. Happy to share the scoreboard format, and the test-stream offer never expires. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> Thirty days of showing our work. Thank you for watching. stackstream.xyz · X: @Stackstream0X

---

## Extra post: an onboarding call with a fellow grantee

> Post only with the team's written OK, the afternoon after the call, as an extra. That day's scheduled post still runs in the morning. Asset: none, or a plain card with both logos if they agree. Says "onboarding call", never "registered", until the transaction confirms. Once it does, the break-glass post below takes over.

**Official X**
> First onboarding call done, with a fellow Stacks Endowment grantee.
> [Team name] builds [one line, in their words]. We walked through how a stream works from their own wallet.
> No claims yet. Just two builders getting a real team ready to use it.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Had my first onboarding call this week, with [team name], another Endowment grantee.
> Builder to builder, wallet open, real questions. This is what "ready for use" looks like from the inside.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Grantees Telegram**
> Did an onboarding call with [team name] this week. Took about twenty minutes, from their own wallet. Same offer stands for anyone here: I will set up your first stream with you. stackstream.xyz

**WhatsApp**
> First onboarding call done. Real team, real wallet. stackstream.xyz · X: @Stackstream0X

---

## Extra post: working with Zero Authority DAO

> Post only with Zero Authority's written OK, as an afternoon extra after the morning post. Says "working together" or "pilot", never "registered", until a registration transaction confirms. Asset: none, or a plain card with both logos if they agree.

**Official X**
> We are working with @zeroauthdao on paying bounties and grants as streams.
> Contributors see their pay grow as work ships, and the funder keeps full control. Receipts once the first pilot is live.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Zero Authority has paid out across hundreds of on-chain bounties. I am exploring streaming those payouts with them, so the payment itself shows progress.
> Grateful they leaned in. More when the first stream is live.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

---

## Break-glass: the day a team registers

> Post only after the registration confirms, and name the team only with written permission; otherwise use the bracketed unnamed version. Post the next afternoon as an extra. That day's schedule still runs.
> Asset: proof card (C) of the registration. Same day: send the held Muneeb Ali message and submit the event to Stacks Snacks. Record the door on the scoreboard.

**Official X**
> [Team name / A Stacks team] just registered on StackStream and opened its first streams on mainnet.
> Its people are now paid continuously, with the team in full control. Receipt in the reply.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> A team just trusted something I built with how it pays its people.
> Thank you to [team name / them] for going first. It makes it easier for every team that follows.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Milestone: the first organisation has registered on StackStream and is streaming payments on Stacks mainnet.
> [Team name / The team] now pays [contributors / grantees / collaborators] continuously. Recipients claim whenever they choose, and the organisation can pause, top up, or cancel at any point, with unearned funds returned instantly.
> This is the proof we set out to build: a real team using audited infrastructure to pay real people more efficiently. [D] organisations are now registered, and every payment is verifiable on-chain.
> If your organisation pays people by hand, you could be next, and I will set it up with you.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord**
> Follow-through rather than an announcement: the first team is registered and streaming on mainnet, [receipt link]. Thank you to this room for the sceptical questions that shaped the onboarding. Same offer for the next team: I will do the setup with you.
> Weekly numbers on X: @Stackstream0X.

**Grantees Telegram**
> First team registered on StackStream this week. Onboarding took one registration transaction and about twenty minutes on a call. If anyone here wants the same, I will set it up with you. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> The first team is streaming pay with us. stackstream.xyz · X: @Stackstream0X

---

## Before every post

- Numbers pulled that morning, and no `[N]` or `[D]` left in the copy or on the card.
- Asset filename matches the day number.
- X posts fit in one post of 280 characters or fewer.
- Settlement sentence read aloud.
- One link, on the last line, to https://stackstream.xyz.
- Follow line for @Stackstream0X present, just above the link.
- Reply to every reply within the hour.
