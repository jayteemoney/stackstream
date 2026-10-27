# StackStream Content & Marketing Plan (V2)

> Status: working plan for the 60-day run from Mon Oct 26 to Thu Dec 24, 2026. Supersedes the July draft in place. The record of what was actually shipped is in `M3_EVIDENCE_PACKAGE.md`; the day-by-day plan is in `CONTENT_SCHEDULE_V2.md`.

This version keeps the sharper differentiator and replaces the metric. The pivot changes what we count, not the channels.

---

## Positioning

**One line, used everywhere:** StackStream is real-time money, settled on Bitcoin.

**Why this and not "DAO payroll":** Streaming mechanics are commoditized. Sablier and Superfluid settle on Ethereum, Streamflow on Solana. None settle on Bitcoin. Bitcoin finality is the one claim no competitor can make, so it leads.

**Two supporting facts that make it real:**
1. A stream balance grows with every Stacks block, and Stacks state inherits Bitcoin finality once it is anchored to Bitcoin.
2. Through sBTC, you can stream actual Bitcoin, continuously.

**The cadence fact, and why the copy changed.** Mainnet has been producing Stacks blocks at roughly 9 to 10 seconds each over the last month, not the 5 seconds the app assumes. So public copy says "grows with every block" and never a precise seconds figure. The app's 5-second constant is a known bug, recorded in `M3_EVIDENCE_PACKAGE.md` Section 8, and it must not leak into a public claim. Any duration the product shows in blocks has to be read from the chain, not from that constant.

---

## North star metric

**The one number: organisations with at least one running, claimed stream.** Everything we post is judged by one question: does this give one organisation a reason to open a stream, and one recipient a reason to claim?

| | |
|---|---|
| **Metric** | Organisations with at least one stream still running that a recipient has claimed from. Derived from `streamsCreated` and `workspacesRegistered` in `/api/stats`, plus the stream receipts and the organisation record |
| **Baseline** | Oct 21, 2026, block 9,268,739: 16 streams, 1 organisation registered, **0** organisations with a running claimed stream. 11 of the 16 streams are our own test streams. The other 5 are a sponsored creator test |
| **Target for this run** | 3 organisations registered, and 3 with a running claimed stream. The grant's $10,000-equivalent side cannot be measured from the chain today, so it is tracked as a gap in `M3_EVIDENCE_PACKAGE.md` Section 8, not as a public figure |
| **Where to read it** | `GET /api/stats` for the counters, `GET /api/organisations` for the register, `/api/streams/{id}` for each receipt. Anyone can verify all three against the contract |
| **Secondary (watch, don't chase)** | New sender addresses, total streams created, claims per week, and the number of recipients who claim twice |

**Why this metric and not total streams created:**
- Total streams is **contaminated by our own work**. Eleven of the sixteen on mainnet are ours. A campaign can raise that number without a single outsider, and we would be the only people who could not tell the difference.
- "Teams onboarded" is the outcome we want, but registration alone is not usage. A running, claimed stream is the first moment a real organisation's money has actually moved to a real person.
- It is still **on-chain and verifiable**. Every part of it is a contract read, not a spreadsheet.
- It **doubles as grant evidence** for M3 without extra work, and it is honest when it is flat.

**Operating rule:** before drafting any post, name how it could move a registration, a first stream, or a first claim. If it cannot, it needs a different angle or a different week. The Monday post reports streams, organisations and claimed-from organisations honestly, even when all three are flat. A flat week is published. A flat week is never explained away.

**The sponsored-test rule.** The five creator streams are a test StackStream funded from a StackStream wallet on Oct 19. The organisation's wallet paid them out. Public copy says "we funded this one" whenever the test appears, and the test is never offered as evidence of organic adoption. It is evidence that the payer-side flow works.

---

## Call to action rule

**Every public post ends with exactly one CTA.** No post ships with nowhere to go.

| Priority | CTA | Use |
|---|---|---|
| Primary | **stackstream.xyz** | Default on every post: "Try it: stackstream.xyz" |
| Secondary | The 60-second demo clip | When the post's job is belief, not action yet |
| Tertiary | Telegram **t.me/dev_jaytee** | When the ask is "talk to us" (DAO outreach, feedback) |

**One link per post, last.** Registration links and receipts go in the first reply, never in the post.

**Our handles (use these, never improvise):**

| Channel | Handle / link |
|---|---|
| Website | https://stackstream.xyz |
| Official X | @Stackstream0X |
| Personal X (founder) | @dev_jayteee |
| Telegram | t.me/dev_jaytee |
| Discord | dev_jaytee (DM handle, no public server yet; stand one up before using Discord as a post CTA) |
| LinkedIn (founder) | https://www.linkedin.com/in/jethro-irmiya-a2153427b/ |

**Exceptions:** Stacks Forum and the Grantees Telegram stay soft. Those channels are for substance and trust, so the CTA there is at most "link in the thread" or "DM me". Selling hard there costs more than it earns.

---

**Settlement language rule (applies to every channel):** never fuse the update cadence and Bitcoin settlement into one clause. The per-block rhythm is how often *streams update*; *Bitcoin finality* is inherited when Stacks state anchors to Bitcoin, on Bitcoin's own cadence. Approved shapes: "streams update with every block; settlement inherits Bitcoin finality" (technical audiences), "your balance grows with every block, secured by Bitcoin" (social). Never write "settling on Bitcoin every few seconds", "settling every block", or "once it lands, it is final". Crypto Twitter will (correctly) nitpick all three.

---

## Message pillars

1. **Bitcoin-final.** The wedge. Money that cannot be reversed once final.
2. **Real-time.** The balance grows with every block, so money moves continuously, not on payday. Never a seconds figure.
3. **Every token, not just one (full SIP-010 multi-token support).** Stream sBTC, USDA, ALEX, or any token on Stacks. One product, every asset, so people pay and get paid in what they actually hold. In social copy say "any token"; in product and developer contexts say SIP-010 multi-token support. Never let this go cold, it is a real selling point.
4. **Who it is for.** Organisations, grant programmes, freelancers, creators. Lead with the person, not the plumbing.
5. **The roadmap moat.** Cross-chain payout via sBTC bridges, then shielded streams for private payroll. Always labelled roadmap, never shipped.

---

## What we do not say

- No deadlines, countdowns, or public targets. Our calendar is not the reader's urgency.
- No "settles on Bitcoin every few seconds" or any clause that fuses cadence and finality.
- No "5 creators being paid" without "we funded this one". The test is sponsored and labelled that way everywhere.
- No "$10,000 streamed" or any volume figure. We cannot read that number from the chain today.
- No "audited by a firm". It was an independent paid community bounty: 13 reviewers, $150 pool, zero critical findings, four real bugs fixed before mainnet.
- No native STX as a streamable token. STX is the network's own coin, not a SIP-010 token a contract can hold.
- No claim that the five streams are linked to the organisation's public record. One is; four are not yet.

---

## Differentiator research summary (for honest messaging)

- **Interoperability:** the sBTC bridge to Wormhole is built but not yet live, and it moves tokens only, not arbitrary messages. Cross-chain payout is buildable soon by composing on that bridge. It is not a current feature. Stacks is also in the Axelar Interchain Amplifier pilot, which could unlock general message passing later.
- **Privacy:** the Verifold project shows that zero-knowledge proof checking can run inside an ordinary Stacks contract, with no network changes. That makes private, shielded streams genuinely possible on Stacks. It is early and needs expert cryptographic review, so it is a long-term moat, not a near-term promise.

**Rule:** we market what ships today (Bitcoin-final real-time streaming, any token, the public register) and carry interop and privacy as the future. No dates promised. This keeps grant milestones safe while telling the exciting story.

---

## Content themes (rotate weekly)

- **Educate.** What is streaming money, and why does Bitcoin-final settlement matter.
- **Prove.** Real on-chain streams, transaction hashes, 60 second demos.
- **Spotlight.** One user type per post (a grant programme, a freelancer, a creator being paid).
- **Tease the vision.** Interop and privacy explainers, clearly marked roadmap.
- **Build in public.** Milestone updates, security work, mainnet activity, including the flat weeks.

---

## Channels (re-pointed at the new message and the real cadence)

| Channel | Role | Cadence |
|---|---|---|
| Official X | Primary. The count, demos, proof, metrics | 5 weekdays a week |
| Personal X | Founder voice. Why this exists, what broke, what we learned | 4 weekdays a week |
| WhatsApp | Direct, personal, one ask | Whenever there is a specific person to tell |
| LinkedIn | Credibility for founders and budget-holders | 1 piece a week plus milestone posts |
| Stacks Forum | Substance and the long tail. One thread, added to | As events land |
| Stacks Discord | Where Stacks builders convert | As events land |
| Grantees Telegram | Peer proof for other grantees. Soft CTA | As events land |
| Stacks Snacks | One submission per week | Weekly |

---

## Segment angles

| Segment | Hook |
|---|---|
| Grant & bounty programmes | A milestone releases as work ships. The payment is the report. |
| DAOs & protocol teams | Retire multi-sig payday. Contributors claim as they earn. |
| Freelancers & builders | Get paid as you work, in real Bitcoin via sBTC. |
| Creators & service businesses | A subscription as a stream, charged only while the service is used. |

---

## Tie to grant milestones

The message leads with what ships today, so M3 stays defensible. The grant asks for 3 organisations and $10,000 equivalent streamed. The organisation side is counted from the register. The value side is genuinely blocked by a missing aggregate and is written down as a gap rather than estimated. Proof-of-usage posts (real streams, real claims, the register) double as M2 and M3 evidence, and the sponsored creator test is labelled as sponsored every time it is used.
