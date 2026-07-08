# StackStream Content & Marketing Plan (V2)

> Status: working draft. This plan is subject to review and change by the team as we build along.

This version realigns our marketing to a sharper differentiator. The pivot changes the message, not the channels.

---

## Positioning

**One line, used everywhere:** StackStream is real-time money, settled on Bitcoin.

**Why this and not "DAO payroll":** Streaming mechanics are commoditized. Sablier and Superfluid settle on Ethereum, Streamflow on Solana. None settle on Bitcoin. Bitcoin finality is the one claim no competitor can make, so it leads.

**Two supporting facts that make it real:**
1. After the Nakamoto upgrade, Stacks blocks arrive about every 5 seconds, so streams update in near real time. Settlement is anchored to Bitcoin, and once anchored it inherits Bitcoin finality.
2. Through sBTC, you can stream actual Bitcoin, continuously.

---

## North star metric

**The one number: total streams created.** Everything we post is judged by one question: does this give someone a reason to open a stream?

| | |
|---|---|
| **Metric** | Total streams created on mainnet (the contract's own counter, `get-stream-nonce`) |
| **Baseline** | 9 streams, as of Jul 8, 2026 (mainnet block 8,508,895) |
| **30-day target** | 40 streams by Aug 7, 2026 (about one new stream a day — team to confirm or adjust) |
| **Where to read it** | `GET /api/stats` on the OpenClaw service returns `streamsCreated` live from the chain. Anyone can verify it against the contract, which is the point. |
| **Secondary (watch, don't chase)** | `workspacesRegistered` from the same endpoint, and unique sender addresses. |

**Why this metric and not another:**
- It is **on-chain and verifiable**. We never have to trust our own spreadsheet, and neither does anyone reading our metrics posts.
- It is **cumulative**, so it never punishes us when a stream completes naturally (unlike "active streams").
- It **doubles as grant evidence** for M2/M3 proof-of-usage without extra work.
- "Teams onboarded" is the outcome we want, but it lags and cannot be verified publicly; streams created is its leading indicator.

**Operating rule:** before drafting any post, name how it could move the number (drives a visit, a demo view, or a direct conversation). If it cannot, it needs a different angle or a different week. The Monday metrics post reports the number weekly, honestly, even when it is flat.

## Call to action rule

**Every public post ends with exactly one CTA.** No post ships with nowhere to go.

| Priority | CTA | Use |
|---|---|---|
| Primary | **stackstream.xyz** | Default on every post: "Try it: stackstream.xyz" |
| Secondary | The 60-second demo clip | When the post's job is belief, not action yet |
| Tertiary | Telegram **t.me/dev_jaytee** | When the ask is "talk to us" (DAO outreach, feedback) |

**Our handles (use these, never improvise):**

| Channel | Handle / link |
|---|---|
| Website | https://stackstream.xyz |
| Official X | @Stackstream0X |
| Personal X (founder) | @dev_jayteee |
| Telegram | t.me/dev_jaytee |
| Discord | dev_jaytee (DM handle — no public server yet; stand one up before using Discord as a post CTA) |
| LinkedIn (founder) | https://www.linkedin.com/in/jethro-irmiya-a2153427b/ |

**Exceptions:** Stacks Forum and the Grantees Telegram stay soft — those channels are for substance and trust, so the CTA there is at most "link in the thread" or "DM me". Selling hard there costs more than it earns.

---

**Settlement language rule (applies to every channel):** never fuse the update cadence and Bitcoin settlement into one clause. The ~5 second rhythm is how often *streams update*; *Bitcoin finality* is inherited when Stacks state anchors to Bitcoin, on Bitcoin's own cadence. Approved shapes: "streams update in seconds; settlement inherits Bitcoin finality" (technical audiences), "your balance updates every few seconds, secured by Bitcoin" (social). Never write "settling on Bitcoin every few seconds/every block" or "once it lands, it is final" — crypto Twitter will (correctly) nitpick both.

---

## Message pillars

1. **Bitcoin-final.** The wedge. Money that cannot be reversed once final.
2. **Real-time.** About 5 second blocks, so money moves continuously, not on payday.
3. **Every token, not just one (full SIP-010 multi-token support).** Stream sBTC, STX, USDA, ALEX, or any token on Stacks. One product, every asset, so people pay and get paid in what they actually hold. In social copy say "any token", in product and developer contexts say SIP-010 multi-token support. Never let this go cold, it is a real selling point.
4. **Who it is for.** DAOs, merchants and SaaS, freelancers, grant programs. Lead with the person, not the plumbing.
5. **The roadmap moat.** Cross-chain payout via sBTC bridges, then shielded streams for private payroll. Always labelled roadmap, never shipped.

---

## Differentiator research summary (for honest messaging)

- **Interoperability:** the sBTC bridge to Wormhole is built but not yet live, and it moves tokens only, not arbitrary messages. Cross-chain payout is buildable soon by composing on that bridge. It is not a current feature. Stacks is also in the Axelar Interchain Amplifier pilot, which could unlock general message passing later.
- **Privacy:** the Verifold project shows that zero-knowledge proof checking can run inside an ordinary Stacks contract, with no network changes. That makes private, shielded streams genuinely possible on Stacks. It is early and needs expert cryptographic review, so it is a long-term moat, not a near-term promise.

**Rule:** we market what ships today (Bitcoin-final real-time streaming) and carry interop and privacy as the future. No dates promised. This keeps grant milestones safe while telling the exciting story.

---

## Content themes (rotate weekly)

- **Educate.** What is streaming money, and why does Bitcoin-final settlement matter.
- **Prove.** Real on-chain streams, transaction hashes, 60 second demos.
- **Spotlight.** One user type per post (a DAO, a freelancer, a grant program).
- **Tease the vision.** Interop and privacy explainers, clearly marked roadmap.
- **Build in public.** Milestone updates, security work, mainnet activity.

---

## Channels (re-pointed at the new message)

| Channel | Role | Cadence |
|---|---|---|
| X | Primary. Origin story, demos, spotlights, metrics. | 3 to 4 posts a week |
| Discord | Where DAOs convert. Personalised outreach plus dev-showcase. | Ongoing |
| Telegram | Community and announcements. Strong for Africa and Southeast Asia. | Cross-post + community |
| LinkedIn | Credibility for founders and budget-holders. | 1 educational piece + milestone posts |
| Stacks-native | Forum, Sigle, Stacks Weekly newsletter, a 5 minute community-call slot. | As events land |

---

## Segment angles

| Segment | Hook |
|---|---|
| DAOs & protocol teams | Retire multi-sig payday. Contributors claim as they earn. |
| Merchants & SaaS | Subscriptions that settle per second, no chargebacks. |
| Freelancers & builders | Get paid as you work, in real Bitcoin via sBTC. |
| Grant & bounty programs | Disburse in tranches with built-in clawback. We run on this ourselves. |

---

## Tie to grant milestones

The message leads with what ships today, so M3 stays safe. Interop and privacy carry the excitement as future vision, with no dates promised. Proof-of-usage posts (real streams, DAO spotlights, TVL milestones) double as M2 and M3 evidence.
