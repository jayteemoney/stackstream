# StackStream Content Schedule, Phase 2: 60 days

**Runs:** Mon Oct 26, 2026 to Thu Dec 24, 2026. Day 1 to Day 60, calendar numbering, weekends not posted.
**Written:** Oct 21, 2026.
**Companions:** `POSITIONING.md` (the spine and the proof points), `ECOSYSTEM_OUTREACH_V2.md` (the messages and the send calendar), `MARKETING_PLAN_V2.md` (voice and CTA rules), `DESIGNER_BRIEF_V2.md` (the assets), `TEAM_ONBOARDING_PLAYBOOK.md` (what happens when someone says yes), `M3_EVIDENCE_PACKAGE.md` (the record).
**Supersedes:** `CONTENT_SCHEDULE.md` (the Sep 14 to Oct 13 run, kept as the record of what we actually shipped).

---

## Where we stand

Read live from `stackstream.xyz/api/stats` on **Oct 21, 2026 at 10:59 UTC**, mainnet block 9,268,739.

| Fact | Value | Source |
|---|---|---|
| Streams created on mainnet | **16** | `stackstream.xyz/api/stats` |
| Organisations registered | **1** | same |
| Organisations with a stream running and claimed from | **0** | same, derived |
| Contract tests | **125 passing**, including property-based fuzzing. 230 across the whole repo | `npx vitest run`, verified Oct 21 |
| Security | Independent paid community bounty audit before mainnet. 13 independent reviewers, zero critical findings, four real bugs caught and fixed before launch | `audits/AUDIT_REPORT_v1.0.0.md`, `audits/CREDITS.md` |
| Live | Stacks mainnet since May 2026 | `deployments/default.mainnet-plan.yaml` |
| Real network cost | 0.003 to 0.018 STX per transaction | Mainnet stream-manager transactions, May to Oct 2026 |

### What the first 30 days actually produced, and what it teaches

This is the part that shapes the next 60 days, so it is worth being blunt about.

| What happened | Number | What it teaches |
|---|---|---|
| Posts shipped across 6 channels | 19 weekday days, 5 weeks | Content alone did not move the stream count. Weeks 1, 2 and 3 all read 11 streams and 0 organisations. |
| Streams created | 11 to 16 | The five new streams all came from one place, on one day, from one organisation's wallet, and we funded them. |
| Organisations registered | 0 to 1 | The registration did not come from a post. It came from a warm DM into a contact inside a DAO that had already shown interest, followed by us doing the setup work on a call. |
| Targeted conversations opened | about 15 | Six of the ten individuals we targeted never replied. The one that converted was the one with a relationship already. |
| Real people paid | 5 creators, streaming since Oct 19 | Five real recipients with growing balances is worth more than 16 streams with no users, because it is the only proof that a person actually used this. We funded this one, and we say so whenever it is mentioned. |

**The lesson, stated once: posting gets attention, a relationship gets a registration, and a registration is what gets the next team.** Everything in the next 60 days is built on that.

### What we shipped that the copy can use

| Shipped | What it means to a reader | Used on |
|---|---|---|
| **Public organisations directory** (Oct 7) | Every organisation that registers appears on a public list, read live from the chain, with a receipt. A stranger can check it in ten seconds | D2, D51, D52, D60 |
| **Linking streams to an organisation** (Oct 8) | An organisation's stream count on its public record grows as it uses it. The record is an asset that gets stronger the more they use it | D2, D51, D57 |
| **Prepared setup links** (Oct 8) | We can fill in a stream for a team and hand them one link. They check it and sign. Their work is one click | D23, D37 |
| **Any token, including a team's own** (Oct 2) | A team pays in what its treasury already holds | D17, D22, D44 |
| **Correct amounts for every token** (Oct 2) | 6 decimal tokens show at their real value everywhere | Answer if asked |
| **Open read API and integration guide** (Sep 24) | Any app or wallet can show live stream data without asking us | D37, D38 |

Not shipped, never in copy: private streams with Privara, cross chain payout.

---

## The narrative arc

Nine weeks, one job each. The rhythm inside each week never changes.

| Week | Days | Job of the week | The question it answers |
|---|---|---|---|
| 1 | D1 to D5 | **The register opens** | What is this and who is already on it |
| 2 | D8 to D12 | **Proof of use** | Did real people actually get paid, and what did they say |
| 3 | D15 to D19 | **The position** | Where does StackStream sit in the Stacks ecosystem |
| 4 | D22 to D26 | **Scheme 1, payroll** | What changes for a team that pays people |
| 5 | D29 to D33 | **Scheme 2, grants and bounties** | What changes for a programme that releases funds |
| 6 | D36 to D40 | **The builder's view** | What can other Stacks apps do with it |
| 7 | D43 to D47 | **Scheme 3, subscriptions, and the person being paid** | What changes for the recipient |
| 8 | D50 to D54 | **The pattern** | Is this one team or a habit |
| 9 | D57 to D60 | **Close** | What 60 days taught us and what we want next |

**Weekly rhythm, unchanged.** **Mon** the number (asset A). **Tue** one idea (B). **Wed** proof (C or H). **Thu** one objection (D). **Fri** one door (E). Weekends are never posted and are never used to catch up a missed weekday. A missed day is skipped, not reposted.

**Two rules that are new, and they are the point of this run:**

1. **Monday belongs to the organisation.** Official X posts the number, and no Personal X post that day. Personal X speaks Tuesday to Friday, in the first person, and never uses the same words as the official account.
2. **The headline number is organisations, not streams.** Every Monday card leads with organisations, and the second figure is organisations with a stream running and claimed from. Total streams is a secondary line. See `MARKETING_PLAN_V2.md` for why.

---

## Voice and length

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
| Personal X (@dev_jayteee) | I. Honest, behind the scenes | 1:1 |
| LinkedIn | Calm, professional, value-led | 4:5 |
| Stacks Forum | Discussion-first, precise terms allowed | 16:9 |
| Stacks Discord | Receipts and help, never announcements | 16:9 |
| Grantees Telegram | Builder to builder, never salesy | None |
| WhatsApp status | Like texting a friend | 9:16 |

---

## The doors

| Door | Who | What they get | Days |
|---|---|---|---|
| **1. Teams paying people** | Protocol DAOs, funded teams, agencies, working groups | Payroll set once, in any token including their own, contributors claim anytime, full control kept | D16, D19, D23, D26 |
| **2. Grant and bounty programmes** | DeGrants, the Endowment, bounty programmes, grantees paying collaborators | Funds release as work ships, unreleased funds stay with the funder, the payment is the report | D5, D30, D31, D33 |
| **3. People being paid** | Contributors, freelancers, creators | Pay grows while they work, claimed anytime on the Earn page | D9, D12, D46, D47 |
| **4. Wallets and infrastructure** | Xverse, Leather, integrators, builders | A read API, a setup link, and a reason for a wallet to be opened daily | D37, D38, D40 |

**Private scoreboard, every Friday after the post.** Per door: conversations opened, replies, calls, organisations registered, streams funded by that organisation, repeat claimants, and unprompted inbound. A registration beats a call, a call beats a reply, and a repeat claimant beats a registration, because it is the only thing that predicts a user who is still here in February. Value streamed stays on the scoreboard only.

---

## Rules

- **Weekdays only.** Monday to Friday. Nothing is scheduled on Saturday or Sunday, and a weekend is never used to catch up a missed weekday.
- **Numbers:** `[N]` streams, `[D]` organisations and `[O]` organisations with a running, claimed stream, read from `stackstream.xyz/api/stats` on the morning of posting. Never estimate. Any stream we open ourselves is labelled as ours.
- **Security claims:** say "independently audited" and "125 passing contract tests". The full repo suite is 230 tests, and the 125 are the contract tests including the fuzzing. Re-run `npx vitest run` before Day 1 and again before Day 43, and update if the number moved.
- **Tokens:** say "any token on Stacks", and when naming examples use sBTC, USDA, ALEX and xBTC. Never list STX: native STX is not a token the contract can stream.
- **Cost:** say "no fee from us" and "a fraction of one STX in network fees". Never "a few STX", which overstates the real cost about a thousand times.
- **No deadlines anywhere. No target figures or amounts in public.**
- **Settlement:** never put the update rhythm and Bitcoin settlement in the same clause. Social: "your balance grows with every block, secured by Bitcoin". Technical: "streams update with every block; settlement inherits Bitcoin finality". Never a seconds figure: mainnet is at about 9 to 10 seconds a block, not the 5 the app assumes.
- **No jargon** in social copy or on assets: escrow, protocol, primitive, SIP-010, vault. Forum posts and Days 37 and 38 may be precise.
- **Link:** every post ends with https://stackstream.xyz. Developer days may use the GitHub repo. Explorer links go in the first reply. Telegram only in DMs and replies.
- **Follow line:** "Follow @Stackstream0X for the weekly numbers." on X and LinkedIn, "Weekly numbers on X: @Stackstream0X." on Forum, Discord and Grantees Telegram, and "X: @Stackstream0X" appended to the WhatsApp line. The link still stays last.
- **Handles:** @Stackstream0X, @dev_jayteee (three e's), t.me/dev_jaytee (two e's).
- **DMs** go from @dev_jayteee only. @Stackstream0X engages each target two to three days first.
- **No team named** without written permission, and nothing posted before the transaction confirms.
- **Style:** no em dashes. Personal says "I", Official says "we", never the same words.
- **Assets:** if one is late, post the words alone. Never stock imagery.

---

## Which channels fire each day

| Day | Date | Narrative | Asset | Off. X | Pers. X | LinkedIn | Forum | Discord | TG | WhatsApp |
|---|---|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | Mon Oct 26 | The number, week 1 | A | ✓ |  |  |  |  |  | ✓ |
| 2 | Tue Oct 27 | The register | B | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 3 | Wed Oct 28 | Five real streams | C | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |
| 4 | Thu Oct 29 | Where the money sits | D | ✓ | ✓ |  |  |  |  | ✓ |
| 5 | Fri Oct 30 | Grant programmes | E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 6, 7 | Sat, Sun | Not posted | | | | | | | | | |
| 8 | Mon Nov 2 | The number, week 2 | A | ✓ |  |  |  |  |  | ✓ |
| 9 | Tue Nov 3 | What the creators said | F | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 10 | Wed Nov 4 | The claim receipts | C | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |
| 11 | Thu Nov 5 | What if nobody claims | D | ✓ | ✓ |  |  |  |  | ✓ |
| 12 | Fri Nov 6 | Creators and freelancers | E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 13, 14 | Sat, Sun | Not posted | | | | | | | | | |
| 15 | Mon Nov 9 | The number, week 3 | A | ✓ |  |  |  |  |  | ✓ |
| 16 | Tue Nov 10 | The layer map | B | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 17 | Wed Nov 11 | Paid in real Bitcoin | C, H | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |
| 18 | Thu Nov 12 | Why this project | D | ✓ | ✓ |  |  |  |  | ✓ |
| 19 | Fri Nov 13 | Protocol teams | E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 20, 21 | Sat, Sun | Not posted | | | | | | | | | |
| 22 | Mon Nov 16 | The number, week 4 | A | ✓ |  |  |  |  |  | ✓ |
| 23 | Tue Nov 17 | Month end, replaced | B, E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 24 | Wed Nov 18 | A payroll stream live | C | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |
| 25 | Thu Nov 19 | Our multisig is fine | D | ✓ | ✓ |  |  |  |  | ✓ |
| 26 | Fri Nov 20 | Teams of three to fifteen | E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 27, 28 | Sat, Sun | Not posted | | | | | | | | | |
| 29 | Mon Nov 23 | The number, week 5 | A | ✓ |  |  |  |  |  | ✓ |
| 30 | Tue Nov 24 | A grant that releases as work ships | B | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 31 | Wed Nov 25 | A grant milestone streamed | C | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |
| 32 | Thu Nov 26 | Thank you (Thanksgiving) | F | ✓ | ✓ |  |  |  |  | ✓ |
| 33 | Fri Nov 27 | DeGrants and the programmes | E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 34, 35 | Sat, Sun | Not posted | | | | | | | | | |
| 36 | Mon Nov 30 | The number, week 6 | A | ✓ |  |  |  |  |  | ✓ |
| 37 | Tue Dec 1 | Read our data, open a link | C | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 38 | Wed Dec 2 | An integrator reads it | C | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |
| 39 | Thu Dec 3 | We would have to build it | D | ✓ | ✓ |  |  |  |  | ✓ |
| 40 | Fri Dec 4 | Wallets and infra | E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 41, 42 | Sat, Sun | Not posted | | | | | | | | | |
| 43 | Mon Dec 7 | The number, week 7 | A | ✓ |  |  |  |  |  | ✓ |
| 44 | Tue Dec 8 | Charge only while it is used | B | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 45 | Wed Dec 9 | A subscription running | C | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |
| 46 | Thu Dec 10 | What a recipient needs | D | ✓ | ✓ |  |  |  |  | ✓ |
| 47 | Fri Dec 11 | The person being paid | E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 48, 49 | Sat, Sun | Not posted | | | | | | | | | |
| 50 | Mon Dec 14 | The number, week 8 | A | ✓ |  |  |  |  |  | ✓ |
| 51 | Tue Dec 15 | More than one | B | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 52 | Wed Dec 16 | A second organisation streams | C | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |
| 53 | Thu Dec 17 | Is this just a grant project | D | ✓ | ✓ |  |  |  |  | ✓ |
| 54 | Fri Dec 18 | The ecosystem | E | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 55, 56 | Sat, Sun | Not posted | | | | | | | | | |
| 57 | Mon Dec 21 | The number, week 9 | A | ✓ |  |  |  |  |  | ✓ |
| 58 | Tue Dec 22 | What 60 days taught us | A | ✓ | ✓ | ✓ |  |  |  | ✓ |
| 59 | Wed Dec 23 | The receipts | C | ✓ | ✓ |  |  | ✓ | ✓ | ✓ |
| 60 | Thu Dec 24 | Sixty days, in the open | A, G | ✓ | ✓ | ✓ | ✓ |  | ✓ | ✓ |

**Totals:** 44 Official X posts, 36 Personal X posts, 44 WhatsApp statuses, 18 LinkedIn posts, 5 Forum threads, 9 Discord posts, 9 Grantees Telegram posts, 4 Stacks Snacks submissions. **173 pieces over 60 days**, against 76 in the last 30. That is the intensification.

---

## Week 1, D1 to D5: The register opens

### Day 1, Mon Oct 26: The number, week 1

> `SS_D01_metric-card` (A, new layout) · Outreach: Zero Authority, naming permission request · No Personal X today

**Official X**
> Week one of the next sixty days.
> [D] organisation registered. [O] with a stream running that has been claimed from.
> [N] streams on mainnet. The organisation list is public, and every entry has a receipt.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> New chapter. [D] organisation on the public register, and the list is real. stackstream.xyz · X: @Stackstream0X

---

### Day 2, Tue Oct 27: The register

> `SS_D02_the-register` (B, new template) · Outreach: every target that has not yet seen the directory

**Official X**
> There is a list of every organisation using StackStream.
> Each name, date and stream count is read live from the chain, and each card links to its own receipt. You can check it in ten seconds.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**Personal X**
> Last month I found out that posting does not get organisations. Talking to people does.
> So I built the list. Every team that registers appears there with a receipt, and it updates every minute.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**LinkedIn**
> Most products in a young ecosystem ask you to take their word for it. We would rather show you the receipt.
> StackStream now publishes a public register of every organisation that has registered on the platform. Each entry is read live from the contract: the name, the date it joined, how many streams it has linked, and a link to the registration transaction on the Stacks explorer. Nothing on that page is typed in by us, and it refreshes every minute.
> The point is not the page. The point is that a stranger can check whether a claim about adoption is true, in the same way they can check any other transaction on Stacks.
> One organisation is on it so far. That is the honest number, and the list is where you will see it move.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz/organisations

**WhatsApp**
> Every team using StackStream is on one public list, with receipts. stackstream.xyz/organisations · X: @Stackstream0X

---

### Day 3, Wed Oct 28: Five real streams

> `SS_D03_five-streams` (C, proof card) · Outreach: none · Stacks Snacks submission

**Official X**
> Five streams are running on mainnet, from one registered organisation's wallet, to five different people.
> Every one has a hash, a block, an amount and a rate. Check every field. We funded the first one.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Five creators, five streams, one organisation's wallet. I funded the first one.
> What I care about is not the count. It is that five real people have a growing balance, and can take it whenever they want.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord**
> Hi all, Jethro here, founder of StackStream. Receipts, not an announcement.
> Five live streams on mainnet, all from one registered organisation's wallet, paying five creators continuously. We funded the first one. Open any in the explorer and check the hash, block, amount and rate. Links in the reply.
> A stream is one payment arriving continuously. The recipient claims whenever they want, the payer can pause or cancel with anything unearned returned instantly, and funds sit in the contract.
> If your project pays anyone, reply and I will set it up for you personally.
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz

**Grantees Telegram**
> Sharing this because it may help with milestone evidence. We now have five live streams on mainnet from a registered organisation's wallet, paying five creators continuously. We funded the first one. Every one has an explorer receipt with hash and block, and a balance you can read straight from the chain. The format is free to copy if it helps your own reporting. If any of you are paying contributors from grant money, I will set up your first stream myself. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> Five real streams running on mainnet. Check any of them yourself. stackstream.xyz · X: @Stackstream0X

---

### Day 4, Thu Oct 29: Where the money sits

> `SS_D04_where-money-sits` (D) · Outreach: none

**Official X**
> While money streams, who holds it?
> Not us. It sits in the contract, and neither side can take the other's share. Cancel and the earned part still goes to the person who earned it, the rest comes back to you.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The question I get asked most is where the money is while it streams.
> In the contract. Not with me, and not with the person being paid either, until they claim it. That is the whole point of the design.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> The money sits in the contract while it streams. Never with us. stackstream.xyz · X: @Stackstream0X

---

### Day 5, Fri Oct 30: Grant programmes

> `SS_D05_grant-programmes` (E) · Outreach: the registered organisation, Privara, fellow grantees

**Official X**
> Grant programmes already pay in stages. The money moves by hand.
> Stream it instead: funds release as the work ships, unreleased stays with you, and every payment is public, so the payment is the report.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> This is the scheme that fits best, and I did not expect it.
> In a grant, you know who you are paying from day one. That makes a streamed payout easy in a way that payroll is not.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Grant and bounty programmes pay in stages. That part is right, and most of them already think about it well.
> What is usually manual is the movement of the money. Someone checks the deliverable, approves the release, sends the transfer, and later writes up where the money went.
> A streamed grant keeps the milestone logic and removes most of the handling. Funds release continuously over the grant period, and the builder draws what has accrued when they need it. If work stops, the programme pauses or cancels, and every unreleased amount returns in the same transaction. Because each payment lands on a public ledger, the reporting becomes a by-product rather than a task.
> StackStream is live on Stacks mainnet, independently audited, and takes no fee from anyone. We are looking for one programme to try this on one or two grants.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Fund builders as the work happens, not after. stackstream.xyz · X: @Stackstream0X

---

## Week 2, D8 to D12: Proof of use

### Day 8, Mon Nov 2: The number, week 2

> `SS_D08_metric-card` (A) · No Personal X today

**Official X**
> Week two. [D] organisation registered. [O] of them with a running stream that has been claimed from.
> [N] streams on mainnet. Last week's number was [N0].
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Week two: [D] organisation, [N] streams, [O] with a real claim. stackstream.xyz · X: @Stackstream0X

---

### Day 9, Tue Nov 3: What the creators said

> `SS_D09_creator-voices` (F, new template) · Requires the creator feedback in hand. If it is not in hand, use Day 47's copy instead

**Official X**
> The people being paid are the ones who decide whether this works.
> [Name], one of five creators being paid continuously on mainnet, said: "[one sentence quote]".
> Read the rest of what they told us.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> I asked the five people in the test what they thought, and put their answers up unedited.
> Two were surprised the money was real. One said the timing mattered more than the amount. That is what I hoped for.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> We ran a small test: five creators, paid continuously from an organisation's wallet, over a couple of weeks. We funded it ourselves. Not a demo between our own wallets. Real recipients, real balances, one real claim so far.
> We asked them what they thought and published the answers without editing them. The most common response was not about the technology. It was about timing. Knowing the money is there, and growing, changed how they planned their week.
> That is the part worth knowing if you are considering this for your own contributors. The interest rate on the money matters less than the certainty of it.
> StackStream is live on Stacks mainnet, independently audited, and takes no fee.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Five creators got paid continuously. Here is what they said, unedited. stackstream.xyz · X: @Stackstream0X

---

### Day 10, Wed Nov 4: The claim receipts

> `SS_D10_claim-receipts` (C) · Outreach: Rena Shah, Alex Miller · Stacks Forum thread

**Official X**
> Streams are one half of the story. Claims are the other half.
> Here is a real claim on mainnet, with the hash and the amount. Open it. Then check what was left behind for the next claim.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> A balance nobody has claimed is a promise. A claim is a fact.
> This is a receipt from someone who actually took the money. That is the number I care about.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord**
> The claim from the last post, shown properly.
> A stream says money will arrive. A claim says it arrived. Both are live on mainnet, linked in the reply with hash, block and amount, so you can check every field.
> The recipient claims whenever they want, all of it or part of it. The payer can pause, top up or cancel, and anything unearned returns in the same transaction.
> If your project pays people by hand, one stream is the smallest possible test. I will do the setup with you.
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz

**Grantees Telegram**
> Following on from the streams, here is a real claim receipt from a recipient. Worth knowing if you are building milestone evidence: a stream proves the commitment, a claim proves the payment. Both are on-chain, both are free to copy, and the format is in the repo. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**Stacks Snacks submission**
> StackStream now publishes a public register of every organisation that has registered on the platform, read live from the contract, with a receipt for each. Five streams are live on mainnet from a registered organisation's wallet, paying five creators continuously. We funded the first one, and one creator has claimed. The contracts are open source and independently audited, and there is a free community bounty for anyone who finds a real bug.

**WhatsApp**
> Not just streams. A real claim, with a receipt. stackstream.xyz · X: @Stackstream0X

---

### Day 11, Thu Nov 5: What if nobody claims it

> `SS_D11_nobody-claims` (D) · Outreach: none

**Official X**
> What if the person you pay never claims?
> Nothing is lost. The balance keeps growing and waits in the contract. Claim a little every day, or everything on the last day.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> A question I get asked every time.
> The answer is that unclaimed is not lost, it is just waiting. People claim on their own schedule, and the money does not go anywhere.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Nobody claimed it? It keeps waiting. Nothing is lost. stackstream.xyz · X: @Stackstream0X

---

### Day 12, Fri Nov 6: Creators and freelancers

> `SS_D12_creators` (E) · Outreach: creators paid by Stacks projects, one introduction each

**Official X**
> For the person being paid.
> From the moment a stream opens, your balance grows while you work. Watch it on the Earn page and claim any of it, whenever you want.
> No invoice. No chasing. No waiting for month end.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> If a Stacks project pays you, send them this. Or send me the name of whoever handles payments there.
> You never have to pitch anything. I would just rather not arrive as a stranger.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Most of the case for streaming payroll is made to the person paying. But the person being paid is the one who feels the difference, and they are usually not in the room when it gets discussed.
> With a streamed engagement, the contractor watches their earnings grow while they deliver, and takes what they have earned whenever they want, without chasing an invoice. The client keeps full control and can pause or stop if the scope changes.
> StackStream makes this simple on Stacks. It is live on mainnet, independently audited, works with any token on Stacks including sBTC, and takes no fee. The person being paid needs nothing more than a Stacks wallet.
> If you pay freelancers, contractors or creators, this is worth a try on one engagement.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> For everyone waiting on an invoice. There is a better way. stackstream.xyz · X: @Stackstream0X

---

## Week 3, D15 to D19: The position

### Day 15, Mon Nov 9: The number, week 3

> `SS_D15_metric-card` (A) · No Personal X today

**Official X**
> Week three. [D] organisation registered. [O] with a running, claimed stream. [N] streams on mainnet.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Week three: [D] organisation, [O] with a real claim. stackstream.xyz · X: @Stackstream0X

---

### Day 16, Tue Nov 10: The layer map

> `SS_D16_layer-map` (B, new template) · Outreach: ecosystem builders, Stacks Labs, wallets

**Official X**
> Stacks is excellent at holding Bitcoin and trading it. What it does not have is a way to move money for work.
> Payroll, grants, subscriptions. All one transfer at a time.
> StackStream is the layer that moves it.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The way I describe what I am building now.
> Stacks has the money layer and the trading layer. The layer in between, where a DAO pays a contributor, was empty. I am filling it.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Bitcoin gives Stacks something no other layer two has: a settlement anchor that is genuinely final, and with sBTC, real Bitcoin to move.
> What it did not have was a way to move that money for work. Trading infrastructure on Stacks is mature. Payment infrastructure for the work itself is not there: teams still close a bounty by hand, release a grant in lumps, and pay contributors on a date, with a signer to chase.
> StackStream sits in that gap. It is the rail that moves money continuously for payroll, grants and subscriptions, and it settles to Bitcoin, so a stream inherits Bitcoin finality. Streaming payment exists on Ethereum and on Solana. It did not exist on Bitcoin.
> The position we are taking is not to compete with the DEXes. It is to be the layer they sit on when money moves for work rather than for trading.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Stacks can hold Bitcoin and trade it. Now it can pay people. stackstream.xyz · X: @Stackstream0X

---

### Day 17, Wed Nov 11: Paid in real Bitcoin

> `SS_D17_sbtc` (C, H) · Outreach: Andre Serrano, sBTC leads · Stacks Snacks submission

**Official X**
> Real Bitcoin, paid continuously.
> Through sBTC, a contributor can be paid in Bitcoin while they work, and claim it into their own wallet whenever they like.
> Not lending. Not swapping. Earning it.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> My favourite line about Stacks: it is the only layer where Bitcoin can be a salary.
> That has always been theoretical for me. With sBTC and a stream, it is a transaction you can look up.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord**
> For anyone who cares about the sBTC story, this is the part I find most interesting.
> sBTC makes Bitcoin usable inside Stacks. StackStream makes it usable for a person. A contributor can be paid in real Bitcoin, continuously, and claim it into their own wallet whenever they choose.
> It works with any token on Stacks, and sBTC is the one I would demo first because the idea needs no explanation.
> The contracts are open source and independently audited. I am up for building a demo with anyone working on sBTC distribution.
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz

**Grantees Telegram**
> Worth flagging for anyone thinking about Bitcoin-denominated payments: sBTC streams work today on mainnet. A contributor paid in real Bitcoin, continuously, claiming into their own wallet. No lending, no swap, no exchange in between. If that is useful for a programme you are running, tell me and I will set it up. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**Stacks Snacks submission**
> StackStream now streams any token on Stacks, including a team's own, opened from a single shareable link, and pays in sBTC so a contributor can be paid in real Bitcoin continuously and claim it into their own wallet. Five USDA streams are live on mainnet from a registered organisation's wallet, and one recipient has claimed.

**WhatsApp**
> Paid in real Bitcoin, as you work. stackstream.xyz · X: @Stackstream0X

---

### Day 18, Thu Nov 12: Why this project

> `SS_D18_why-this-project` (D) · Outreach: none

**Official X**
> Why this project, on this chain?
> Streaming pay was proven on Ethereum and Solana. Both settle somewhere other than Bitcoin. Stacks settles to Bitcoin, so a stream inherits its finality.
> Nobody can copy that.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The honest version: I could have built this anywhere.
> I built it here because Bitcoin is the settlement layer Stacks inherits, and it is the only one nobody else can take.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Streaming pay exists elsewhere. It settles on Bitcoin here. stackstream.xyz · X: @Stackstream0X

---

### Day 19, Fri Nov 13: Protocol teams

> `SS_D19_protocol-teams` (E) · Outreach: Bitflow, Zest, Stacking DAO, Velar, Taptive

**Official X**
> For a protocol team with contributors spread across time zones.
> One stream each, opened once. Balance grows while they work, they claim when they want, and you keep every control: pause, top up, or cancel.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The size where I see this matter most is between three and fifteen people.
> Below that, month end is annoying but survivable. Above it, you have a payroll team. In between, nobody owns the job.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> There is a specific team size where payroll hurts the most, and it is not the one most people talk about.
> Below three people, month end is annoying but survivable. Above fifteen, you have a payroll team and a process. In between, you have a spreadsheet, a multi-signature proposal, a round of chasing signers across time zones, and almost always one person paid late.
> StackStream turns that into a one-time setup. Each contributor gets a stream, pay accrues continuously, and they claim when they choose. You keep full control throughout, including cancelling with anything unearned returned in the same transaction.
> It is live on Stacks mainnet, independently audited, works with any token on Stacks including sBTC, and takes no fee. The smallest useful trial is one stream, one person, one month.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Between three and fifteen people, month end hurts the most. stackstream.xyz · X: @Stackstream0X

---

## Week 4, D22 to D26: Scheme 1, payroll

### Day 22, Mon Nov 16: The number, week 4

> `SS_D22_metric-card` (A) · No Personal X today

**Official X**
> Week four. [D] organisation registered. [O] with a running, claimed stream. [N] streams on mainnet.
> New: teams can stream their own token from one link, and every organisation gets a public record that grows.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Week four: [D] organisation, [N] streams, [O] with a real claim. stackstream.xyz · X: @Stackstream0X

---

### Day 23, Tue Nov 17: Month end, replaced

> `SS_D23_month-end` (B, E) · Outreach: Taptive, fellow grantees

**Official X**
> Month end for a team of five, the old way.
> A spreadsheet. A second check. A signer to chase. Payment in the first week of next month.
> The same month with streams: set once, paid continuously, control kept.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The image I made maps every step of month end and every place it breaks.
> None of it is hard. It is just repeated forever. One stream, one person, one month is the easiest way to see the difference.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Mapping manual payroll honestly, because most descriptions of it are too tidy.
> A spreadsheet at month end. A second check by whoever has time. A multi-signature proposal. A round of chasing signers across time zones. Payment somewhere in the first week of the next month. Almost always one person missed.
> None of it is technically difficult. It is hours of repeated work every month, and it leaves contributors genuinely unsure when they will be paid, which is the part that costs you people.
> StackStream turns it into a one-time setup. Each contributor gets a stream, pay accrues continuously, and they claim when they choose. The team keeps full control throughout. It is live on Stacks mainnet and independently audited.
> If this is your month end, try one stream with one person for one month.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Month end payroll takes hours. It should take zero. stackstream.xyz · X: @Stackstream0X

---

### Day 24, Wed Nov 18: A payroll stream live

> `SS_D24_payroll-stream` (C) · Outreach: none · Stacks Forum thread

**Official X**
> A payroll stream, live, on mainnet.
> One contributor. One amount. One period. Open it and read every field: who sent it, who receives it, the rate per block and the end block.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Here is the shape of it in one transaction, and how I would draw it.
> A team, a contributor, an amount, a period. Everything after that is automatic and everything before it is a decision you only make once.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord**
> A payroll stream, live on mainnet. Receipt in the reply.
> A team opens one per contributor, once. The balance grows with every block, the contributor claims whenever they want, and the payer can pause, top up or cancel with anything unearned returned.
> It works with any token on Stacks including sBTC, so you can pay in what you already hold. There is no fee from us, only a fraction of one STX in network fees.
> If you pay anyone from a Stacks project, reply and I will set it up for you personally.
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz

**Grantees Telegram**
> A payroll stream is live on mainnet, receipt in the thread. If any of you pay contributors from grant money, this is the smallest possible version: one person, one period, setup done by me on a short call. No fee from us, only network gas. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> A payroll stream, live on mainnet. Read every field yourself. stackstream.xyz · X: @Stackstream0X

---

### Day 25, Thu Nov 19: Our multisig is fine

> `SS_D25_multisig` (D) · Outreach: none

**Official X**
> "Our multisig is fine."
> It is. That is not the problem. Month end is the problem.
> One stream, one person, one month, and see how the end of the month feels.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> I am not here to tell you your multisig is wrong. It is probably perfect.
> I am here because the person you are chasing across time zones at 11pm would rather just watch a balance grow.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Your multisig is fine. Month end is the problem. stackstream.xyz · X: @Stackstream0X

---

### Day 26, Fri Nov 20: Teams of three to fifteen

> `SS_D26_team-size` (E) · Outreach: Bitflow, Velar, Taptive, working groups

**Official X**
> If you are a team of three to fifteen, this is for you.
> Five streams, opened once and already running. People claim when they want. You stay in control of every one of them.
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
> Five people, five streams, and month end stops being a project. stackstream.xyz · X: @Stackstream0X

---

## Week 5, D29 to D33: Scheme 2, grants and bounties

### Day 29, Mon Nov 23: The number, week 5

> `SS_D29_metric-card` (A) · No Personal X today

**Official X**
> Week five. [D] organisation registered. [O] with a running, claimed stream. [N] streams on mainnet.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Week five: [D] organisation, [N] streams, [O] with a real claim. stackstream.xyz · X: @Stackstream0X

---

### Day 30, Tue Nov 24: A grant that releases as work ships

> `SS_D30_grant-stages` (B) · Outreach: DeGrants stewards, Rena Shah

**Official X**
> A grant need not be paid all at once, or only at the end.
> Stream it: funds release as the work ships, the builder claims as they earn, unreleased stays with you. If work stops, pause. If it is over, cancel.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Grant programmes already think in milestones and clawback. That is the entire mental model.
> All I do is move the money at the speed the model already assumes.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Funding builders should not mean choosing who carries the risk.
> Milestone funding manages risk, but it creates administration. Someone checks the deliverable, approves the release, sends the transfer, and later writes up where the money went.
> A streamed grant keeps the milestone logic and removes most of the handling. Funds release continuously over the grant period, and the builder draws what has accrued when they need it. If work stops, the programme pauses or cancels, and every unreleased amount returns in the same transaction. Because each payment lands on a public ledger, reporting becomes a by-product rather than a task.
> StackStream is live on Stacks mainnet, independently audited, and takes no fee from anyone. We are looking for one programme to try this on one or two grants.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> A grant that pays out as the work gets done. stackstream.xyz · X: @Stackstream0X

---

### Day 31, Wed Nov 25: A grant milestone streamed

> `SS_D31_grant-milestone` (C) · Outreach: none · Stacks Snacks submission

**Official X**
> A grant milestone, streamed.
> The funder's funds, released as the work shipped, with the builder claiming as they went. One transaction to open, one to cancel, and the payment is the record of delivery.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> This is the shape I want more of.
> A grant paid in instalments as the work lands, where the funder can stop it, and where nobody has to write a report at the end because the payments already are the report.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord**
> A grant milestone, streamed on mainnet, receipt in the reply.
> This is the scheme that fits the ecosystem best, because a grant programme knows who it is paying, thinks in milestones, and carries the reporting burden. A streamed grant releases funds as the work ships, the builder claims as they go, and unreleased funds return to the funder.
> And because every payment is on a public ledger, the report writes itself.
> If you run a grant or bounty programme, one grant is a small enough test. I will set it up with you.
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz

**Grantees Telegram**
> A grant milestone, streamed, live on mainnet with the receipt in the thread. This is the use case I think fits the ecosystem best: the funder already knows the recipient, already thinks in milestones, and the payment itself becomes the report rather than something you write afterwards. If any of you run a sub-grant or bounty, tell me and I will set it up. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**Stacks Snacks submission**
> StackStream now streams any token on Stacks, including a team's own, opened from a single shareable link. A public register of every registered organisation is live and reads directly from the contract, and five streams are running on mainnet from a registered organisation's wallet, paying creators continuously. We funded the first one, and one creator has claimed.

**WhatsApp**
> A grant milestone, streamed. The payment is the report. stackstream.xyz · X: @Stackstream0X

---

### Day 32, Thu Nov 26: Thank you

> `SS_D32_thank-you` (F) · Human note. Light post, no asset needed if it is late

**Official X**
> A quiet one.
> A month ago the number was [D] organisations and [N] streams. It is not a big number and we will not pretend it is. But the people on the register are real, and the payments behind them are real.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Thanksgiving, so a short one.
> The thing I did not expect was how much of this work is showing up and asking people a question, then doing the setup when they say yes.
> Thank you to everyone who answered one.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Short one this week. Thank you to everyone who answered a question. stackstream.xyz · X: @Stackstream0X

---

### Day 33, Fri Nov 27: DeGrants and the programmes

> `SS_D33_degrants` (E) · Outreach: DeGrants stewards, Zero Authority

**Official X**
> Community microgrants, paid in stages, released as the work ships.
> That is not a new idea. It is the same milestone logic that already runs, with the money moving at the speed the work does.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The strongest fit for this has been grant programmes, and I have the receipts.
> You know who you are paying from day one, you think in milestones, and the reporting afterwards is the part everyone hates.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Community grant programmes are the clearest fit for streaming payments, and I do not think that is a coincidence.
> Milestone-based microgrants already work this way: a builder is identified when the award is made, the funds are released as approved deliverables or milestones complete, and the award is capped. What has not changed is that the money still moves in lumps, by hand, and someone still has to account for where it went.
> A streamed grant keeps the shape and removes the handling. The grant flows to the builder as they work, they claim what they have earned, and if the work stops, the funder pauses or cancels and the unreleased part comes back in the same transaction. Every payment is on a public ledger, so the cohort report is a by-product.
> StackStream is live on Stacks mainnet, independently audited, and takes no fee. One programme, one grant is a small enough test.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Microgrants that pay out as the work ships. stackstream.xyz · X: @Stackstream0X

---

## Week 6, D36 to D40: The builder's view

### Day 36, Mon Nov 30: The number, week 6

> `SS_D36_metric-card` (A) · No Personal X today

**Official X**
> Week six. [D] organisation registered. [O] with a running, claimed stream. [N] streams on mainnet.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Week six: [D] organisation, [N] streams, [O] with a real claim. stackstream.xyz · X: @Stackstream0X

---

### Day 37, Tue Dec 1: Read our data, open a link

> `SS_D37_open-data` (C, developer, precise terms allowed) · Outreach: integrators, wallets, Stacks Labs

**Official X**
> For developers.
> Open source Clarity contracts, 125 passing contract tests with fuzzing, an independent audit. An open read API any site can call, and a link that opens a stream in any token.
> Follow @Stackstream0X for the weekly numbers.
> https://github.com/jayteemoney/stackstream

**Personal X**
> I would not move my own salary through a contract I could not read, so you can read the code.
> 125 contract tests, fuzzing on the property that matters most, and an open API your app can call.
> Follow @Stackstream0X for the weekly numbers.
> https://github.com/jayteemoney/stackstream

**LinkedIn**
> If you want to build on top of StackStream rather than use it, three things are already open and documented.
> First, the contracts. Clarity, open source, verified on the explorer, with 125 passing contract tests including property-based fuzzing and an independent audit report in the repository.
> Second, a public read API. Any site can call it to show live stream balances, claimable amounts and organisation records, with no key and no permission from us. That is how a wallet or a dashboard shows a user what they have earned without asking us for anything.
> Third, a shareable setup link. You can put your own token in a link, drop it in your docs, and the stream form opens with the token already selected and checked against the chain. It only fills the form. The payer still reviews and signs in their own wallet.
> The integration guide is in the repository.
> Follow @Stackstream0X on X for the weekly numbers.
> https://github.com/jayteemoney/stackstream

**WhatsApp**
> Open code, open data, and a link that opens a stream in your token. stackstream.xyz · X: @Stackstream0X

---

### Day 38, Wed Dec 2: An integrator reads it

> `SS_D38_integrator` (C) · Outreach: wallets, integrators, Stacks Labs · Stacks Forum thread

**Official X**
> Something is reading our data, and we did not write it.
> A third party pulled live balances off the public API and put them somewhere else. No key, no permission, no ask. That is how it should work.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The open API was supposed to make this easy to build on. Seeing someone else use it, without asking me, was the point.
> If you have a wallet or a dashboard, the endpoints are free.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord**
> A short one for the builders.
> The public read API is open, so any site can show live balances, claimable amounts and organisation records with no key and no permission. Someone outside this project already uses it.
> There is also a setup link: put a token contract id in the URL and the form opens with that token selected and checked against the chain. It only fills the form, and the payer signs in their own wallet.
> Contracts are open source, 125 passing contract tests, independently audited.
> If something is wrong, open an issue.
> Weekly numbers on X: @Stackstream0X.
> https://github.com/jayteemoney/stackstream

**Grantees Telegram**
> A note for anyone wiring payment data into their own product: the read API is open, documented, and free. You can show a user's live balance or an organisation's record without asking us for anything. There is also a one link setup flow for opening a stream in your own token. Integration guide is in the repo, and I am happy to review an integration if it helps. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> Our API is open and someone else is already using it. stackstream.xyz · X: @Stackstream0X

---

### Day 39, Thu Dec 3: We would have to build it

> `SS_D39_would-have-to-build` (D) · Outreach: none

**Official X**
> "We would have to build this ourselves."
> You would have to build the payments part. Not the balances, the claiming, the cancellation, the audit, the fuzzing.
> Those are done and open. Yours is one link.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The honest version of the pitch I give a technical team.
> You are not building a payment system. You are adding a call to one that already exists, audited, tested and running on mainnet.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> You are not building a payment system. You are adding one call. stackstream.xyz · X: @Stackstream0X

---

### Day 40, Fri Dec 4: Wallets and infrastructure

> `SS_D40_wallets` (E) · Outreach: Xverse, Leather, wallet integrators

**Official X**
> Everyone paid through StackStream has a reason to open their wallet.
> A balance that grows with every block, claimed whenever they want. Daily, not monthly.
> Wallet builders: this is what we want to talk about.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> From a wallet's point of view, a streaming recipient is the ideal user. Not a bigger balance. A reason to come back tomorrow.
> I think wallets notice that eventually.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> There is one number that matters more to a wallet than total value locked, and it is how often someone has a reason to open the app.
> Most crypto balances are checked once, after a transfer lands. A streaming payment balance is different. It grows with every block, and the recipient can take what they have earned whenever they choose. That is a daily habit rather than a monthly one.
> For wallet teams, the integration is already open. There is a public read API with no key and no permission needed, so a wallet can show a user their incoming streams and claimable balance without asking us for anything. There is also a shareable link that opens a stream in a given token.
> I am not here to ask anyone to integrate a product with a small number of streams. I am here because the direction is one I think wallets eventually want.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> A growing balance is a reason to open your wallet tomorrow. stackstream.xyz · X: @Stackstream0X

---

## Week 7, D43 to D47: Subscriptions and the person being paid

### Day 43, Mon Dec 7: The number, week 7

> `SS_D43_metric-card` (A) · No Personal X today

**Official X**
> Week seven. [D] organisation registered. [O] with a running, claimed stream. [N] streams on mainnet.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Week seven: [D] organisation, [N] streams, [O] with a real claim. stackstream.xyz · X: @Stackstream0X

---

### Day 44, Tue Dec 8: Charge only while it is used

> `SS_D44_subscriptions` (B) · Outreach: tools, communities, media, SaaS

**Official X**
> A subscription should charge for what was actually used.
> With a stream, the charge runs while the service runs, the user can stop any time, and the payer can pause or cancel with anything unused returned.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> I am still not sure subscriptions are my biggest use case.
> But the model fits them cleanly, and I would rather test it with a real service than argue about it.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Subscription billing is one of the last places in software where the amount paid has almost no relationship to the value received.
> Usually it is a flat monthly charge, renewed on a date, whether the customer used the service or not. And the two ways to fix that, prorating and refunds, are both awkward for the business.
> A stream removes the awkwardness. The charge runs for as long as the service does, in real time, in a token the customer already holds. The user can stop whenever they want, and the payer can pause or cancel with anything unused returned in the same transaction.
> It works with any token on Stacks, including sBTC, and it settles to Bitcoin. StackStream is live on mainnet, independently audited, and takes no fee.
> If you run a service with a recurring charge, one subscription is a small enough test.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Charge for what they actually used. stackstream.xyz · X: @Stackstream0X

---

### Day 45, Wed Dec 9: A subscription running

> `SS_D45_subscription` (C) · Outreach: none · Stacks Snacks submission

**Official X**
> A subscription, running on mainnet.
> A service, a period, and a charge that moves with every block for as long as the service is being used. Cancel and the unused part comes straight back.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Three schemes now have something live behind them: payroll, grants, and a recurring charge.
> The subscription one is the least proven and I am least sure about it. That is why it belongs on the chain.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Stacks Discord**
> A third shape of payment, live on mainnet.
> A subscription as a stream: the charge runs while the service runs, the user can stop whenever they want, and the payer can pause or cancel with anything unused returned in the same transaction.
> I will say plainly that this is the least proven of the three ways we get used. It is live and it works, but I do not yet know whether it is how most people would want to be charged.
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz

**Grantees Telegram**
> A third scheme is live on mainnet now: a subscription as a stream, where the charge runs only while the service is used. I am less certain about this one than about payroll and grants, which is why I am putting it out in the open. If you run a recurring service and want to try one, tell me. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**Stacks Snacks submission**
> StackStream now streams any token on Stacks, including a team's own, from a single link, with a public register of registered organisations read live from the contract. Payroll, grant and subscription shapes are all live on mainnet, with receipts.

**WhatsApp**
> A subscription as a stream. Charge only while it is used. stackstream.xyz · X: @Stackstream0X

---

### Day 46, Thu Dec 10: What a recipient needs

> `SS_D46_recipient-needs` (D) · Outreach: none

**Official X**
> What does the person being paid actually need?
> A Stacks wallet. That is it. They connect it, watch the balance grow, and claim all of it or part of it whenever they want. No account, no signup, no invoice.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> I want to be careful not to oversell this.
> The recipient needs a Stacks wallet and a tiny amount of STX for the network fee when they claim. If that is a barrier for the people you pay, it is real.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> All a recipient needs is a Stacks wallet. Nothing else. stackstream.xyz · X: @Stackstream0X

---

### Day 47, Fri Dec 11: The person being paid

> `SS_D47_person-being-paid` (E) · Outreach: creators, recipient-side introductions

**Official X**
> Five people are being paid continuously on StackStream right now.
> They watch the balance grow on their Earn page and claim it whenever they want. No invoice, no chasing, no waiting for month end.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> I have watched this side of it a lot recently, and it is better than I expected.
> The thing people react to is not the amount. It is that they can see it happening and take it whenever they want.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Most writing about streaming payroll is addressed to the person paying. I think the person being paid deserves more of it.
> When a stream opens, the recipient's balance starts growing immediately. They watch it move on the Earn page, they claim all of it or part of it whenever they choose, and their history records every claim. There is no invoice to send, no payment to chase, and no uncertainty about whether the work is worth anything yet.
> The requirement is deliberately small: a Stacks wallet, and a small amount of STX for the network fee when they claim.
> If you hire freelancers, contractors or creators, this is an underrated retention tool. The best people choose clients who pay like this.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> For everyone being paid. Watch it grow, take it when you want. stackstream.xyz · X: @Stackstream0X

---

## Week 8, D50 to D54: The pattern

### Day 50, Mon Dec 14: The number, week 8

> `SS_D50_metric-card` (A) · No Personal X today

**Official X**
> Week eight. [D] organisation registered. [O] with a running, claimed stream. [N] streams on mainnet.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Week eight: [D] organisation, [N] streams, [O] with a real claim. stackstream.xyz · X: @Stackstream0X

---

### Day 51, Tue Dec 15: More than one

> `SS_D51_more-than-one` (B) · Outreach: teams who looked once

**Official X**
> The list of organisations using StackStream is [D] long.
> Each one registered from its own wallet, and each one has a receipt. It is not a big list yet. It is a real one.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**Personal X**
> One team on the list is a data point.
> A pattern is what changes what people believe is possible in an ecosystem, and that is what I am watching for.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**LinkedIn**
> The question that decides whether a payment rail matters is not how good it is. It is how many people are already using it.
> One organisation on a public register is a data point. It proves the mechanism works. It does not prove the category exists.
> So we publish the register. Every organisation that registers on StackStream appears on it, read live from the contract, with a receipt for each entry and a count of the streams it has linked. Nothing is typed in by us. It is the same public record you would use to check any other transaction on Stacks.
> The list is [D] long today. The number matters less than the direction, and a habit rather than an example is what I am after.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz/organisations

**WhatsApp**
> The list of teams using StackStream, with receipts. stackstream.xyz/organisations · X: @Stackstream0X

---

### Day 52, Wed Dec 16: A second organisation streams

> `SS_D52_second-org` (C) · Outreach: none · Stacks Forum thread

**Official X**
> A second organisation just opened its first stream.
> Its own wallet, its own recipient, its own amount, and a receipt anyone can check. The register is two long now.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**Personal X**
> The first stream from the second organisation, and I set it up with them.
> Nothing about it is special, and that is the point. One team doing what another did is what adoption looks like.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**Stacks Discord**
> A second organisation has opened its first stream on mainnet. Receipt in the reply.
> The register of organisations using StackStream is public and reads live from the chain.
> For context: a stream is opened once, the balance grows with every block and they claim whenever they want, and the payer can pause, top up or cancel with anything unearned returned. Any token on Stacks, including sBTC. No fee from us.
> If you are next, reply here and I will set it up for you.
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz/organisations

**Grantees Telegram**
> The second organisation has opened its first stream on mainnet. The register is public and live, so anyone can see both entries and their receipts. Each entry is a data point on its own. If any of you pay contributors and want to be on it, the smallest version is one stream to one person and I do the setup. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> A second organisation just opened its first stream. stackstream.xyz/organisations · X: @Stackstream0X

---

### Day 53, Thu Dec 17: Is this just a grant project

> `SS_D53_just-a-grant-project` (D) · Outreach: none

**Official X**
> "This is just a grant project."
> It started that way. The difference is that it is not a grant: the contracts are open source, the audit is public, and anyone can register and open a stream without asking us.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> It is funded by a grant. It is not a grant product.
> Anyone can register an organisation and open a stream today without my permission and without me in the room. I just do the setup for people who want help.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Funded by a grant. Not a grant product. stackstream.xyz · X: @Stackstream0X

---

### Day 54, Fri Dec 18: The ecosystem

> `SS_D54_ecosystem` (E) · Outreach: Stacks Labs, Endowment, community calls, working groups

**Official X**
> Stacks has always been good at holding Bitcoin and trading it.
> What has been missing is a way to move money for work. Pay a contributor. Release a grant.
> That is the layer between Bitcoin money and utility.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The version I would give a room.
> Bitcoin on Stacks is not a number in a wallet. It is how people get paid. Everything else about the ecosystem follows from that being true.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> The question I keep coming back to is what Bitcoin on Stacks is actually for.
> Holding it and trading it are both solved. Neither of them is what Bitcoin is good at in the wider economy, which is being a unit of account that people get paid in.
> Pay is also where Bitcoin's properties matter most. A salary that arrives continuously, settles to Bitcoin, and cannot be reversed once final is a genuinely different thing from a monthly transfer, and the difference is felt by the person receiving it rather than by the treasury sending it.
> That is the layer StackStream is built for: payroll, grants and subscriptions on a Bitcoin-settled rail, with the recipients claiming as they earn.
> It is live on Stacks mainnet, independently audited, takes no fee, and there is a public register of the organisations using it.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Bitcoin on Stacks is not a number in a wallet. It is how people get paid. stackstream.xyz · X: @Stackstream0X

---

## Week 9, D57 to D60: Close

### Day 57, Mon Dec 21: The number, week 9

> `SS_D57_metric-card` (A) · No Personal X today

**Official X**
> Week nine. [D] organisation registered. [O] with a running, claimed stream. [N] streams on mainnet.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Week nine: [D] organisation, [N] streams, [O] with a real claim. stackstream.xyz · X: @Stackstream0X

---

### Day 58, Tue Dec 22: What 60 days taught us

> `SS_D58_sixty-days` (A) · Outreach: none

**Official X**
> What sixty days taught us.
> Posting did not get organisations. Talking to people did. What keeps people is the second stream, not the first.
> [N] streams, [D] organisations, [O] with a running claimed stream.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> The honest scoreboard after sixty days.
> I set a target for the period and did not hit it. I got [D]. The reason is not messaging, it is that I spent the month talking to people one at a time, and that is slow.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Sixty days ago we set a public question: does any part of the Stacks ecosystem actually want payment streaming?
> StackStream serves teams paying contributors, grant programmes releasing funds, and individuals paid as they work. All three were live throughout, on mainnet, with audited contracts. We published usage every week, straight from the chain, and tracked every conversation by where it came from.
> Result: [N] streams and [D] organisations registered. The strongest pull came from grant programmes and teams paying contributors. Small product teams showed interest and no action.
> The most useful thing we learned is not about the market. It is about the method. Nineteen posts in thirty days moved the stream count by zero. One warm conversation, followed by us doing the setup work on a call, produced the first registration. Attention is cheap. Attention plus a hand is what converts.
> That is why the next sixty days are built around the public register and a weekly outreach cadence, not around more posting.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> Sixty days, and the lesson was not about the product. stackstream.xyz · X: @Stackstream0X

---

### Day 59, Wed Dec 23: The receipts

> `SS_D59_receipts` (C) · Outreach: none

**Official X**
> Every stream, every claim, every registration, all on chain.
> That is the whole asset. Here is where to check it, and here is what each of those numbers is.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**Personal X**
> The receipts are the product, in the end.
> Anyone who wants to know whether this is real can go and check it, without believing a word I have said for sixty days.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**Grantees Telegram**
> Closing the run with the receipts rather than a summary. Every stream, every claim and every registration from this period is on chain, and the public register links each one. If you are collecting milestone evidence, the format is in the repo and free to copy. Thank you to everyone in this room who answered one question about how you get paid, because that question is what shaped the last two months. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> Everything is on chain. Check it, do not take my word. stackstream.xyz · X: @Stackstream0X

---

### Day 60, Thu Dec 24: Sixty days, in the open

> `SS_D60_sixty-days` (A, G) · Forum thread · LinkedIn · Grantees Telegram · Stacks Snacks

**Official X**
> Sixty days, in the open.
> [N] streams on mainnet. [D] organisations registered, each with a receipt. [O] with a running claimed stream.
> The register grows by one whenever a team tries this.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**Personal X**
> Sixty days of publishing real numbers.
> The best thing was not a metric. It was people on a call saying yes, then coming back a week later to say it worked.
> If you pay people by hand, my DMs are open.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**LinkedIn**
> Sixty days, published as they happened.
> We posted the real number every Monday, straight from the chain, whether it had moved or not. [N] streams on mainnet, [D] organisations registered, [O] of them with a stream running that has been claimed from. Every organisation on the register has a receipt anyone can open.
> The scheme that fitted best was grant and bounty programmes, because the recipient is known from the start and milestone logic already existed. Payroll fitted next. Small product teams showed interest and no action.
> What we shipped in the period: any token on Stacks including a team's own, from one shareable link. A public register of registered organisations, read live from the contract. Prepared setup links a team can review and sign. Linking streams to an organisation's public record. And an open read API so any app can show live payment data.
> The contracts remain open source, independently audited, live on mainnet, and backed by 125 passing contract tests. If your Stacks project pays people by hand, I will still set it up with you personally.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz/organisations

**Stacks Forum**, thread: "StackStream, sixty days in the open"
> A retrospective for the ecosystem, posted the same day as the public numbers.
> Numbers: [N] streams on mainnet, [D] organisations registered, [O] with a running, claimed stream. All checkable live from the chain. Any streams we opened ourselves are labelled: [list or "none"].
> What worked: one warm conversation followed by us doing the setup work on a call. That is the only thing that produced an organisation. Nineteen posts in thirty days produced none.
> What did not work: cold DMs to individuals with no prior relationship. Six of ten never replied, and chasing them cost time that would have gone to the people who did reply.
> Shipped in the period: streams in any token including a team's own, from one link; a public register of organisations read live from the contract; prepared setup links; streams linked to an organisation's record; an open read API.
> Changing next: [one or two lines, no dates].
> The contracts remain open source, independently audited, live on mainnet, and backed by 125 passing contract tests. If your Stacks project pays people by hand, I will still set it up for you.
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz/organisations

**Grantees Telegram**
> Sixty days done: [N] streams, [D] organisations, [O] with a running claimed stream. The clearest signal is that grant programmes want this most. Thank you to everyone who answered my question about how you get paid, it shaped the whole period. The offer to set up your first stream never expires. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**Stacks Snacks submission**
> StackStream, sixty days in the open: [N] streams on mainnet, [D] organisations registered with public receipts, and a public register that reads live from the contract. Any token on Stacks including a team's own, from one shareable link, plus an open read API for integrators.

**WhatsApp**
> Sixty days, all of it public. Thank you for watching. stackstream.xyz · X: @Stackstream0X

---

## Standing extras

### Extra A: a team registers

> Post only after the registration confirms. Name the team only with written permission, otherwise use the bracketed unnamed version. Post the next afternoon as an extra. That day's schedule still runs.
> Asset: proof card (C) of the registration. Same day: send the held Muneeb Ali message, submit to Stacks Snacks, and record the door on the scoreboard.
> **This is the single most important post in the run. Do not skip it, do not delay it, and do not skip the scheduled post to make room for it.**

**Official X**
> [Team name / A Stacks team] has registered on StackStream and opened its first streams on mainnet.
> Its people are now paid continuously, with the team in full control. Receipt in the reply.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**Personal X**
> A team just trusted something I built with how it pays its people.
> Thank you to [team name / them] for going first. It makes it easier for every team that follows.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz/organisations

**LinkedIn**
> A milestone: [team name / the team] has registered on StackStream and is streaming payments on Stacks mainnet.
> [Team name / The team] now pays [contributors / grantees / collaborators] continuously. Recipients claim whenever they choose, and the organisation can pause, top up, or cancel at any point, with unearned funds returned instantly.
> This is the proof we set out to build: a real team using audited infrastructure to pay real people more efficiently. [D] organisations are now registered, and every payment is verifiable on-chain.
> If your organisation pays people by hand, you could be next, and I will set it up with you.
> Follow @Stackstream0X on X for the weekly numbers.
> https://stackstream.xyz/organisations

**Stacks Discord**
> Follow-through rather than an announcement: the first team is registered and streaming on mainnet, [receipt link]. Thank you to this room for the sceptical questions that shaped the onboarding. Same offer for the next team: I will do the setup with you.
> Weekly numbers on X: @Stackstream0X.
> https://stackstream.xyz/organisations

**Grantees Telegram**
> A team registered on StackStream this week. Onboarding took one registration transaction and about twenty minutes on a call. If anyone here wants the same, I will set it up with you. stackstream.xyz
> Weekly numbers on X: @Stackstream0X.

**WhatsApp**
> The first team is streaming pay with us. stackstream.xyz · X: @Stackstream0X

### Extra B: a creator test publishes their answers

> Only with the creator's written permission to quote. Publish the answers unedited, including anything negative.
> **Never edit a creator's words to make them more positive. The value of this post is entirely that it is unedited.**

**Official X**
> [N] people were paid continuously on StackStream. Here is what they said about it, unedited.
> Some of it is positive. Some of it is not. All of it is real.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

### Extra C: the onboarding call

> Post only with the team's written OK, the afternoon after the call, as an extra. That day's scheduled post still runs in the morning. Asset: none, or a plain card with both logos if they agree.
> Says "onboarding call", never "registered", until the transaction confirms.

**Official X**
> First onboarding call done, with [team name].
> [Team name] builds [one line, in their words]. We walked through a stream from their own wallet.
> No claims yet. Just two builders getting a team ready to use it.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**Personal X**
> Had my onboarding call this week, with [team name].
> Builder to builder, wallet open, real questions. This is what "ready for use" looks like from the inside.
> Follow @Stackstream0X for the weekly numbers.
> https://stackstream.xyz

**WhatsApp**
> First onboarding call done. Real team, real wallet. stackstream.xyz · X: @Stackstream0X

---

## Before every post

- Numbers pulled that morning, and no `[N]`, `[D]` or `[O]` left in the copy or on the card.
- Asset filename matches the day number.
- X posts fit in one post of 280 characters or fewer.
- Settlement sentence read aloud.
- One link, on the last line.
- Follow line for @Stackstream0X present, just above the link.
- Official copy says "we", Personal copy says "I", and the two never share a sentence.
- Reply to every reply within the hour.

---

*Prepared by Jethro Irmiya, Oct 21, 2026, for the 60 day run from Oct 26 to Dec 24, 2026. Figures quoted are true at 10:59 UTC on Oct 21, 2026 and are refreshed from `https://stackstream.xyz/api/stats` on the morning of every post.*
