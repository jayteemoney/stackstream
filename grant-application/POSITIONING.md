# StackStream, Ecosystem Positioning

**Written:** Oct 21, 2026
**Owner:** Jethro Irmiya
**Companions:** `CONTENT_SCHEDULE_V2.md` (the 60 day run), `ECOSYSTEM_OUTREACH_V2.md` (the outreach wave), `MARKETING_PLAN_V2.md` (voice and CTA rules), `M3_EVIDENCE_PACKAGE.md` (the record).

This is the spine. Every post, every DM, every call and every forum thread in the next 60 days is built from what is here. If a message cannot be traced back to one of the five proof points in section 3, it does not ship.

---

## 1. Where StackStream sits in the Stacks ecosystem

**The one sentence.** Stacks is a Bitcoin layer with excellent money and no way to move it continuously. StackStream is the payment layer that closes that gap.

**The layer map.** Stacks today is strong in two places and empty in a third.

| Layer | State on Stacks | Examples |
|---|---|---|
| **Store value** | Mature. Bitcoin-anchored savings and lending. | sBTC, Granite, Zest, Stacking DAO, Bitflow, Velar |
| **Trade value** | Mature. DEXs, perps, launchpads. | Bitflow, Velar, Zest |
| **Move value for work** | **Empty.** Every payment is a one-off transfer. | Nobody. This is us. |

Every team in the ecosystem already sits on top of the first two layers and does its own payment plumbing in the third. They open a spreadsheet, chase a signer, and transfer a lump sum. That work is invisible on a dashboard and expensive in time, and it is the part of running a DAO that scales worst.

**So the position is this.** StackStream is not a DeFi product competing with the DEXes. It is the rail the DeFi products sit on when money moves for work instead of for trading. Bitcoin gives Stacks its money. StackStream gives Stacks its payroll, its grant disbursement and its subscriptions.

**The wedge that nobody else has.** Streaming payment is proven, but not on Bitcoin. Sablier runs on Ethereum, Superfluid on Ethereum, Streamflow on Solana. Every one of them settles on a different chain than the one Bitcoin settles on. Stacks settles to Bitcoin, so a stream here inherits Bitcoin finality. That is the only claim in this space that a competitor cannot copy by raising money, and it is the claim that makes the whole thing worth building here rather than elsewhere.

**Why this matters for the ecosystem, stated in their language, not ours.** Stacks has spent years proving it can hold and trade Bitcoin. The natural next question any serious builder asks is: what is Bitcoin actually *for*? The answer that keeps showing up is payments for people who do work. StackStream is the answer to that question for Stacks, and it is the layer that turns Bitcoin in Stacks into a salary rather than a balance.

---

## 2. The three schemes

The ecosystem has three places where money moves for work. Each one is a scheme, a set of teams, a different message and a different ask. We do not pitch all three to anyone.

| Scheme | Who runs it | How money moves today | What streaming changes | The ask |
|---|---|---|---|---|
| **1. Payroll** | Protocol DAOs, working groups, agencies, funded teams paying contributors, ambassadors, moderators | One transfer at month end, a signer to chase, someone always missed | Pay grows while the work happens, the recipient claims it, the payer keeps every control | One stream to one contributor for one month |
| **2. Grants and bounties** | DeGrants, the Endowment, bounty programmes, grant funds passed to collaborators | Milestone payments approved and sent by hand, then written up in a report | Funds release as the work ships, unreleased funds stay with the funder and return instantly, and the payment is the report | One grant or one bounty run as a stream |
| **3. Subscriptions** | Tools, content, communities, SaaS charging recurring | A recurring transfer on a calendar date, with chargebacks and no partial month | Charge only while the service is used, and it settles in real time | One subscription priced per period |

**The one to lead with, and why.** Scheme 2 is the strongest fit and it is where the first real adoption came from. In it the recipient is known from the start, the funder already understands milestone logic and clawback because that is literally how grants work, and the reporting burden is already real. A streamed grant removes a task that already exists rather than adding a new one. That is the easiest possible yes.

**The one that multiplies.** Scheme 3 reversed is the recipient side: a creator or freelancer paid by a Stacks project. One creator is one introduction to a payer. This is not a conversion channel, it is a distribution channel, and it is how a scheme 1 or scheme 2 target gets discovered.

---

## 3. The five proof points

Everything public is built on one of these. Nothing else gets said.

| # | Proof point | Where it lives | How to show it |
|---|---|---|---|
| **P1** | **The register.** A public list of every organisation that registered on StackStream, read live from the contract, with a receipt for each. | `stackstream.xyz/organisations` | Link it. Show the card. It updates every minute, so a screenshot is always stale and the live page is always right. |
| **P2** | **A live stream, with its receipt.** Real funds, a real rate per block, a real block range, checkable by a stranger. | Explorer, `stackstream.xyz/api/streams/{id}` | Hash, block, amount, sender, recipient. Explorer link in the first reply, never as the post's link. |
| **P3** | **Recipient-side truth.** What the people actually paid said, and what they did next. | The creator test, the feedback form | A quote, unedited, with the person's role and the payment they received. This is the hardest thing to fake and the strongest thing to publish. |
| **P4** | **Open code, open data, open money.** Independent audit findings and triage in the repo, contracts verified on the explorer, a public read API anyone can call, 125 passing contract tests including fuzzing. | `github.com/jayteemoney/stackstream`, `audits/` | Quote the number, link the repo. The audit is a paid community bounty with 13 independent reviewers, zero critical findings and four real bugs fixed before mainnet. |
| **P5** | **Cost, stated plainly.** No fee from us, and a fraction of one STX in network fees per transaction. | Measured on mainnet, 0.003 to 0.018 STX per transaction | Say it early and plainly. Budget is the objection that kills these conversations silently. |

**A sixth, quieter proof: the negative one.** We publish the number when it is small. The first 30 days ended at 11 streams and 1 organisation, and the creator test took it to 16 a week later. We published both numbers. A founder who publishes an unflattering number they control the disclosure of reads as trustworthy. That credibility is an asset and it has to be spent, not saved.

---

## 4. The messaging spine

**One line, used everywhere, in this order of preference:**

> StackStream is how a Stacks team pays people continuously, settled on Bitcoin.

Variants that stay inside the same promise:

- **Position:** Stacks has excellent money and no way to move it continuously. StackStream is the payment layer for work.
- **Bitcoin:** Streaming payroll exists on Ethereum and Solana. It did not exist on Bitcoin. Now it does.
- **Register:** The organisations using StackStream are listed publicly, with a receipt each. Here is the list.
- **One person:** Your pay grows while you work. You claim it whenever you want.

**The three questions every message answers, in this order:**

1. **What is it?** A stream. One payment that arrives continuously instead of all at once.
2. **Why is it safe?** Audited, open source, funds sit in the contract and never with us, and the payer keeps full control the whole time.
3. **What do I do next?** One stream, one person, one month, and we do the setup with you.

**The one link, always last:** `https://stackstream.xyz`. Except on developer posts, which use the GitHub repo, and except in DMs, where the link can be the directory or the repo depending on what is being asked about.

---

## 5. The native user loop

The goal is not a spike of streams. A spike of streams is what a bounty campaign produces and it disappears the week the bounty ends. The goal is people and teams who are still using this in February. There are exactly three loops, and every part of the next 60 days should feed one of them.

```
  PAYER SIDE                          RECIPIENT SIDE                    REGISTER SIDE
  ---------                          --------------                    -------------
  Stream opens once                   Balance grows, they               Register once and
  and stops being a                    claim it, which is a               appear on the public
  monthly chore                        reason to open the                register with a
       |                               wallet every day                       |
       v                                    |                               v
  More contributors,                   They tell the next              Their stream count
  longer streams,                       payer about it                    grows there, which
  their own token                              |                          is an asset they
       |                                    v                               |
       +---------------> trusted word of mouth <-------------+               |
```

**The retention mechanics we are actually relying on.**

| Loop | Mechanism | Why it sustains | How we can tell it is working |
|---|---|---|---|
| Recipient | A growing claimable balance and a claim habit | The habit is the product. A person who has claimed once checks again | Claims per recipient, repeat claims, second week of returning |
| Payer | Set once, stop doing payday | Removes a recurring task, so there is no reason to go back to the spreadsheet | A second stream from the same sender, a longer duration, a top up |
| Register | A public record that grows | The entry is permanent and public, so leaving it costs something | Stream count per organisation, and whether a new registration came from the directory |

**The metric that replaces vanity.** Streams created is a cumulative counter and it rewards activity we do ourselves. From Day 1 of the next run, the number we report weekly is **organisations with at least one stream still running and claimed from**. That is harder to move, it cannot be gamed by self-funding, and it is the number that actually predicts a native user base. We keep reporting total streams as a secondary figure because it is verifiable, but the headline is organisations.

**The one thing that most threatens the recipient loop:** claiming costs the recipient a transaction and a little STX, and the app currently says nothing about that fee. A recipient whose wallet is empty sees a balance they cannot touch, and that is the exact moment a native user is lost. Closing this is a product task, listed in section 8.

---

## 6. Who we are talking to, and what each one needs to hear

| Audience | What they already know | The one thing they need | Do not lead with |
|---|---|---|---|
| **Protocol DAOs and funded teams** (Bitflow, Zest, Stacking DAO, Velar, Taptive) | They pay contributors by hand and it is annoying | That it removes a recurring chore they own personally | Bitcoin finality. They do not care, and it is not why they would switch |
| **Grant and bounty programmes** (DeGrants, the Endowment, fellow grantees) | Milestone release, clawback, and the reporting that follows | That the payment becomes the report, so reporting stops being a task | Payroll. A grant team of two has no payroll pain |
| **Grant teams** (PaySats, DeepStack, Privara) | They pay contributors from grant money, in small amounts, by hand | A working, cheap, boring way to pay their own contributors | Anything about scale. They want to try it this week |
| **Creators and freelancers paid by Stacks projects** | They wait, sometimes a month, for money they already earned | That their pay can grow while they work | Anything about the payer side. They only need to forward a link |
| **Wallets and infrastructure** (Xverse, Leather, integrators) | They care about daily active users and developer tooling | A read API and a setup link that work today | A partnership. Nobody integrates a product with 16 streams |
| **The Endowment and ecosystem funders** | They fund things that grow natively in the ecosystem | Public, verifiable proof that a real organisation changed how it pays people | Milestone talk. Read the register instead |

---

## 7. Objections, answered the way we answer them

| They say | We say |
|---|---|
| We already have a spreadsheet and a multisig | The spreadsheet is not the problem. Month end is. One stream, one person, one month, and see how the end of the month feels. |
| What if nobody claims it | Nothing is lost. It keeps accruing and waits in the contract. Claim a little every day, or all of it on the last day. |
| Can you take the money back | Only what has not been earned yet, and only in one transaction. What has been earned is the recipient's, and cancelling does not touch it. |
| Is it safe | Do not trust it, check it. 13 independent reviewers, 125 passing contract tests including fuzzing, the report and the triage are in the repo, and the contracts are verified on the explorer. |
| What does it cost | No fee from us. A fraction of one STX in network fees per transaction, measured on mainnet. |
| Can we use our own token | Yes. Any token on Stacks, including yours, checked against the chain before anyone signs. One link puts it in your docs. |
| Can we cancel | Any time. Unearned funds come straight back, in the same transaction. |
| Is there a protocol fee or a subscription | None. There is no fee from us and no plan to charge one. |
| Native STX? | Not streamable. STX is the network's own coin, not a token a contract can hold. sBTC, USDA, ALEX, xBTC and any other token on Stacks work. |
| We do not want our name in public | Fine. Registration is what puts you on the register, and that is the point of it. If you would rather not be named publicly we can keep it off our posts, but the receipt is on the chain either way. |
| Not right now | Understood. Can I check back in a quarter, and is there anyone you would point me at? |
| Why should we go first | The cost of being wrong is one cancelled stream and a fraction of one STX in fees. The cost of being right is that your team stops doing payday by hand. |
| Who else uses it | Right now one organisation is on the register, and five creators are being paid from its wallet on a test we funded. One of those five streams is linked to the organisation's public record, one creator has claimed, and the rest are still growing. That is the honest answer. You would be the second, and I will do the setup with you personally. |

---

## 8. What we never claim, and what still needs building

**Never claimed, in copy or on an asset, ever:**

- Private or shielded streams. Research exists, it is not shipped. Say "not today" and say why.
- Cross chain payout. sBTC bridges move tokens, not payments.
- A protocol fee, a plan, or a subscription from users. There is no fee from us.
- A number we did not read that morning. Every figure comes from `stackstream.xyz/api/stats` or from the chain.
- "Settles on Bitcoin every few seconds". The balance updates with every block. Settlement inherits Bitcoin finality. Never in the same clause.
- Anything about a team before their transaction confirms, and nothing about a team without written permission.

**Still missing that the next 60 days depend on.** These are the honest gaps between where the campaign wants to go and where the product is, found while reading the codebase on Oct 21.

| # | Gap | Why it matters now | Proposed fix | Cost |
|---|---|---|---|---|
| **G1** | **There is no protocol wide value streamed figure.** The factory's `total-deposited` sums raw units across tokens with different decimals, so it is not an amount of anything, and the API deliberately refuses to format it. There is no `get-total-deposited`. | The M3 target is $10,000 equivalent streamed. **Right now that number cannot be computed from the chain at all.** We cannot evidence the milestone we are chasing. | Add per token accounting to the factory, or compute it off chain from stream events and publish it as a verified readout. | Contract change plus an indexer |
| **G2** | **Claim All is N separate wallet prompts**, one per stream. | It is the first thing a new recipient touches. Five streams means five wallet popups. This is the friction that turns a curious first-time user back. | One claim-all transaction per token rather than per stream, or a batched claim in the contract | Contract change, needs care |
| **G3** | **Recipients are never told what a claim costs.** There is no fee estimate anywhere in the recipient flow. | A recipient with an empty wallet sees money they cannot touch, and leaves. | Show the estimated network fee and the STX needed next to the claim button | Small, frontend only |
| **G4** | **Three names for one thing.** The contract says DAO, the app says Workspace, our marketing says Organisation. | The next 60 days lean entirely on "the register". If a team clicks through from an Organisation to a Workspace, the story breaks at the last step. | Pick one. We recommend **Organisation** everywhere in the UI, because that is what the directory and the evidence use. DAO stays an implementation detail. | Small, frontend only |
| **G5** | **A registered organisation has no URL of its own.** There is no slug, no per organisation page, no shareable link to "their" record. | The strongest invitation we have is "look at the register". A team wants to send their own link, and there is not one. | Add a per organisation page and a copyable share link | Small, frontend only |
| **G6** | **A registered organisation has no follower mechanism.** | A registered team has no reason to come back and no way to be reached. | A subscribe or notify affordance on the organisation record, at minimum an email or Telegram opt-in | Small, frontend only |

**G4, G5 and G6 are the difference between a registration and a native user.** A registration that is a dead end on a directory page is a data point. A registration that has its own page, its own link, its own subscribers and its own growing stream count is a relationship. The next 60 days of content is designed to make people register, and these three are what make them stay.

---

## 9. One paragraph to keep in your head

> Stacks has Bitcoin money and no way to move it continuously. StackStream is the layer that moves it, for work: payroll, grants, subscriptions. It settles on Bitcoin, so nobody else can copy it. There is a public register of the organisations using it, with a receipt each, and it is growing. The next 60 days are about moving two more organisations onto that register and turning the first one into a case study people repeat.

---

*Jethro Irmiya, Oct 21, 2026. Figures quoted are true at 10:59 UTC on Oct 21, 2026 and are refreshed from `https://stackstream.xyz/api/stats` on the morning of every post.*
