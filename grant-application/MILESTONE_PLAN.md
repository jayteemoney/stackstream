# StackStream — Milestone Plan (Revised)

## Stacks Endowment Grant | $8,000 | 3-Milestone Structure

---

## Pre-Grant Baseline (What Is Already Built)

Before any grant activity begins, StackStream already has:

| Component | Status |
|---|---|
| `stream-manager.clar` (736 lines) | Deployed to testnet — all 8 public functions, 12 read-only functions |
| `stream-factory.clar` (218 lines) | Deployed to testnet — DAO registry, name system, analytics |
| Test suite | 66 passing tests across 13 suites (Clarinet SDK + Vitest) |
| Next.js frontend (10 pages) | Live on Vercel — all 7 contract interactions wired |
| OpenClaw API | Express.js REST API for on-chain queries and transaction building |
| Wallet integration | Leather + Xverse via @stacks/connect |

This baseline means the grant period is not about building from scratch — it is about hardening, deploying, and proving that real users will use it.

---

## Milestone 1: Complete Production Hardening for Mainnet

**Disbursement: $1,600 (20%)**

### Acceptance Criteria (from grant agreement)
1. Expanded test coverage and fuzzing for streaming math
2. Public review notes
3. Release candidate ready for mainnet deployment

---

### What Needs to Change From Current State

The existing 66 tests cover the happy path and basic error cases well. What is missing for production confidence:

- No property-based / fuzz tests that probe the streaming math with adversarial inputs
- No formal invariant documentation
- No independent review by anyone outside the project
- No formal deployment checklist or RC tag in the repository

All four of these gaps are addressed in this milestone.

---

### Deliverable 1.1 — Expanded Test Coverage and Fuzzing

**Target: 100+ tests, streaming math invariants verified with randomized inputs**

The existing test structure in `stream-manager.test.ts` covers discrete scenarios. This deliverable adds a property-based test layer that runs the streaming math against thousands of generated inputs.

**Fuzz targets (critical invariants that must hold for ALL valid inputs):**

| Invariant | Test Description |
|---|---|
| Conservation: `streamed + remaining == deposit` | For any deposit amount (1 to u128-max), any duration (1 to 100,000 blocks), verify no tokens are created or destroyed |
| Claim bound: `claimed <= streamed_at_time` | Recipient can never claim more than has accrued at the current block |
| Pause accounting: zero drift across pause/resume | After N pause/resume cycles, the total elapsed time tracked by the contract equals real elapsed minus total paused duration |
| Top-up correctness | After a top-up, the new rate per block updates correctly; claimed history is preserved |
| Cancel split: `recipient_gets + sender_gets == unclaimed_balance` | On cancellation, the sum of both refunds equals the total remaining balance |

**Implementation approach:**

Because Clarinet's simnet is deterministic, fuzz testing is implemented by generating random parameter sets in Vitest and running each set through the simnet. A simple helper generates 500–1,000 random stream configurations and asserts invariants after each operation. This does not require an external fuzzing library — just parameterized loops with `Math.random()` seeded inputs logged for reproducibility.

**Success metric:** 100+ tests passing with a published coverage summary showing all 5 invariants are exercised.

---

### Deliverable 1.2 — Community Security Review and Public Review Notes

**Target: Published review document with findings, responses, and mitigations**

This is the primary evidence item for "public review notes" in the acceptance criteria. The approach:

1. **Self-audit against the Stacks security checklist** — every public function in `stream-manager.clar` reviewed for:
   - `tx-sender` authorization on all mutating calls
   - Integer overflow/underflow bounds (Clarity `uint` prevents underflow; multiplication overflow requires manual verification given the 1e12 precision scaling)
   - Token conservation on every exit path
   - Front-running exposure on claim operations

2. **Community peer review submission** — Post to Stacks developer Discord (`#clarity-smart-contracts` and `#dev-showcase`) with a direct link to the contract source and a request for review. Offer a small STX bounty ($100–$200 worth) for substantive findings. Document every response received.

3. **Publish the review document** — A markdown file in the repository (`SECURITY_REVIEW.md`) that lists:
   - Each function reviewed
   - Potential concern identified (or "none identified")
   - Resolution or mitigation
   - Community comments received and responses

This document becomes the "public review notes" artifact submitted for M1 verification.

**Success metric:** `SECURITY_REVIEW.md` published in the repository with all functions covered.

---

### Deliverable 1.3 — Release Candidate for Mainnet Deployment

**Target: Tagged RC in GitHub, deployment checklist complete, contracts ready to deploy to mainnet**

A release candidate means the contracts are finalized and every step of the mainnet deployment is documented and pre-validated.

**Release candidate checklist:**

- [ ] All contract references updated for mainnet SIP-010 trait (`SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard`)
- [ ] `Clarinet.toml` deployment plan updated with mainnet addresses
- [ ] Post-deployment validation script written (calls every read-only function to confirm deployment success)
- [ ] Emergency-pause admin key management documented
- [ ] GitHub tag `v1.0.0-rc1` created on the commit that includes the above

**Success metric:** GitHub release tag `v1.0.0-rc1` exists with release notes describing the RC scope.

---

### Milestone 1 — Evidence Submission

| Evidence Item | Format |
|---|---|
| Test run output | Screenshot or CI log showing 100+ tests passing |
| Coverage summary | Markdown table of invariants tested with pass/fail |
| `SECURITY_REVIEW.md` | Published in repository — public URL |
| RC release tag | GitHub release link (`v1.0.0-rc1`) |

---

### Milestone 1 — Cost Allocation (from $1,600 disbursement)

| Item | Estimated Cost | Notes |
|---|---|---|
| Community review bounty | $200 | STX bounty for substantive findings from community reviewers |
| CI/CD pipeline (GitHub Actions) | $0 | GitHub Actions free tier covers this |
| Clarinet tooling | $0 | Open-source |
| Hosting (Vercel + Railway) | $40 | 1 month of production hosting pre-mainnet |
| Developer time (test writing + review) | ~$1,200 | Core time allocation — 2–3 weeks of focused work |
| Contingency | $160 | Buffer for unexpected tooling or testnet STX needs |
| **Total** | **$1,600** | |

---

## Milestone 2: Launch StackStream on Mainnet

**Disbursement: $2,400 (30%)**

### Acceptance Criteria (from grant agreement)
1. Verified contracts on mainnet
2. Production frontend live
3. At least 5 successful mainnet streams created and claimed end-to-end

---

### What Needs to Change From Current State

The frontend currently points to testnet. The contracts are testnet-deployed. To satisfy M2:
- Contracts must be deployed to mainnet and verifiable on Stacks Explorer
- Frontend must switch environment to mainnet
- 5 real streams must be created on mainnet and at least partially claimed — these can be your own streams initially (self-funded demo streams) to establish the baseline

---

### Deliverable 2.1 — Mainnet Contract Deployment and Verification

**Target: Both contracts deployed to Stacks mainnet, verified on explorer**

Steps:
1. Fund the mainnet deployer wallet with enough STX for deployment gas (~1,000–2,000 STX for safety)
2. Run `clarinet deployments apply --mainnet` using the deployment plan from the RC
3. Verify both contracts on Stacks Explorer: `stream-manager` and `stream-factory`
4. Confirm each public function is callable by running the post-deployment validation script
5. Record both contract addresses and publish them in the repository `README.md`

**Success metric:** Both contract addresses visible on Stacks Explorer mainnet with source verification.

---

### Deliverable 2.2 — Production Frontend Live

**Target: Frontend on production domain, pointed at mainnet contracts, mobile-responsive**

The frontend is already deployed on Vercel. The changes needed:
- Update environment variables: swap testnet contract addresses for mainnet addresses
- Update Stacks network config: switch from `StacksTestnet` to `StacksMainnet` in `@stacks/connect`
- Remove the testnet faucet UI (or gate it behind a testnet toggle)
- Confirm mobile responsiveness (the existing frontend was built with Tailwind — a quick audit pass is sufficient)
- Set up a production domain (e.g., `stackstream.xyz` or similar) pointing at Vercel

**Success metric:** Live URL accessible on a production domain, wallet connection and stream creation working on mainnet.

---

### Deliverable 2.3 — 5 End-to-End Mainnet Streams

**Target: 5 streams created AND partially claimed on mainnet, with transaction hashes**

This is both a technical verification step and the foundation of the marketing strategy (see Section 5). The first 5 streams establish that the protocol works end-to-end on mainnet.

**Approach:**
- Create streams from your own wallet to your own secondary wallet (self-funded, even small amounts — 10–50 STX per stream is sufficient)
- Alternatively, recruit 2–3 early supporters (from the Stacks Discord community) who each create a stream before the milestone deadline
- For each stream: document the creation tx hash and the claim tx hash

**These 5 streams also serve as your first social media content** — each one is a shareable transaction on Stacks Explorer.

**Success metric:** 5 transaction pairs (create + claim) on mainnet, with explorer links submitted as evidence.

---

### Milestone 2 — Evidence Submission

| Evidence Item | Format |
|---|---|
| Contract addresses | Stacks Explorer links for both contracts |
| Production frontend | Live URL |
| 5 streams | Transaction hashes: 5 creates + 5 claims on mainnet |

---

### Milestone 2 — Cost Allocation (from $2,400 disbursement)

| Item | Estimated Cost | Notes |
|---|---|---|
| Mainnet deployment gas | $100 | ~1,000 STX at market rate for deployment transactions |
| STX for 5 demo streams | $100 | Self-funded streams to prove end-to-end functionality |
| Domain registration (1 year) | $15 | `stackstream.xyz` or similar |
| Vercel Pro (3 months) | $60 | For production SLA and custom domain |
| Railway (OpenClaw API, 3 months) | $60 | Hosting for the data service |
| Marketing content creation | $300 | Demo video, launch graphics, thread writing (Loom + Canva) |
| Community campaign (bounties/raffles) | $200 | Incentive for early users to create streams |
| Developer time (deployment + frontend switch) | ~$1,400 | Core time allocation |
| Contingency | $165 | Buffer |
| **Total** | **$2,400** | |

---

## Milestone 3: Prove Real Usage

**Disbursement: $4,000 (50%)**

### Acceptance Criteria (from grant agreement)
Either:
- **Option A:** At least 3 real teams or DAOs creating streams
- **Option B:** At least 25 active streams AND at least $10,000 equivalent streamed on mainnet

> Strategic note: Pursue Option A as the primary path — 3 real DAO relationships are more durable than 25 self-generated streams. However, build toward both simultaneously. If 3 DAOs are signed, each DAO running 8–10 streams gets you to 25 organically.

---

### Deliverable 3.1 — DAO Onboarding (Primary Path to Acceptance)

**Target: 3 real, identifiable teams or DAOs with streams registered in `stream-factory`**

**What counts as a "real team or DAO":**
- A named organization (DAO, project, community group, protocol) that registers in the factory contract AND creates at least one stream to a real recipient
- Not your own wallet streamed to your own wallet
- Must be independently verifiable on-chain

**Pipeline strategy (start building this in M1, accelerate in M2):**

Tier 1 targets — DAOs and teams that are already paying contributors in Stacks:
- Active Stacks protocol DAOs (reach out via Stacks Discord `#building-on-stacks`)
- Grant recipients from Stacks Endowment who need to pay contributors
- Stacks community working groups

Tier 2 targets — freelancers and builders who can self-organize:
- Developers building on Stacks who could stream payment to a collaborator
- Community moderators or content creators being paid by a Stacks project

Tier 3 targets — outside the Stacks core but Bitcoin-aligned:
- Teams exploring Stacks as a Bitcoin Layer 2 who want to trial streaming payroll

**Success metric:** 3 unique DAO or team principals with `register-dao` calls on mainnet, each with at least 1 stream created.

---

### Deliverable 3.2 — Volume Accumulation (Secondary Path)

**Target: 25 active streams and $10,000 equivalent streamed**

If 3 DAOs are each running 8+ streams, this is automatic. If DAO onboarding is slower, supplement with:
- A public testnet-to-mainnet migration campaign (bring testnet users to mainnet)
- A community streaming challenge (e.g., "stream any amount to a contributor for 30 days, share your tx")
- Developer integrations (another Stacks app integrates StackStream and creates streams on behalf of their users)

**$10,000 equivalent:** At STX market price, this is approximately 4,000–8,000 STX total deposited across all streams. Three DAOs each putting 1,500–3,000 STX into streams exceeds this threshold.

---

### Milestone 3 — Evidence Submission

| Evidence Item | Format |
|---|---|
| 3 DAOs | `register-dao` transaction hashes + team/DAO names |
| Stream evidence | Links to on-chain streams from each DAO |
| Volume (if pursuing Option B) | Dashboard screenshot + Stacks Explorer links showing cumulative streamed amount |

---

### Milestone 3 — Cost Allocation (from $4,000 disbursement)

| Item | Estimated Cost | Notes |
|---|---|---|
| Marketing and community campaigns | $600 | Paid promotion on X, campaign bounties, community contests |
| DAO onboarding support | $300 | Time spent doing 1-on-1 calls, setup walkthroughs with DAO operators |
| Developer documentation | $0 | Time only — no tooling cost |
| Ecosystem outreach (presentations, AMAs) | $100 | Content creation for community calls |
| Infrastructure (Vercel + Railway, 3 more months) | $120 | Ongoing hosting |
| Chainhook event indexer | $200 | For production stream event tracking |
| Community incentive program | $400 | STX rewards for early adopters (stream creation bounties) |
| Developer time (documentation + support + iteration) | ~$2,000 | Core time allocation |
| Contingency | $280 | Buffer |
| **Total** | **$4,000** | |

---

## Section 4 — Total Cost Summary Across All Three Milestones

| Category | M1 | M2 | M3 | Total |
|---|---|---|---|---|
| Developer / builder time | $1,200 | $1,400 | $2,000 | **$4,600** |
| Infrastructure & hosting | $40 | $120 | $120 | **$280** |
| Deployment & gas costs | — | $100 | — | **$100** |
| Marketing & campaigns | — | $300 | $600 | **$900** |
| Community bounties & incentives | $200 | $200 | $400 | **$800** |
| Documentation & content | — | — | — | **$0** (time only) |
| Contingency | $160 | $165 | $280 | **$605** |
| Domain & tooling | — | $75 | — | **$75** |
| Indexer & analytics | — | — | $200 | **$200** |
| Demo streams (self-funded) | — | $100 | — | **$100** |
| Review bounty | $200 | — | — | **$200** |
| Onboarding support | — | — | $300 | **$300** |
| **Milestone total** | **$1,600** | **$2,400** | **$4,000** | **$8,000** |

> Developer time is the dominant cost across all milestones, which reflects the reality of a solo builder. Infrastructure and marketing costs are intentionally lean — StackStream's core costs are Vercel + Railway which run under $50/month combined.

---

## Section 5 — Marketing Strategy: Getting Real Traction

This is the section the grant team is watching most closely. M2 and M3 both require proof of real usage, which means marketing and ecosystem positioning matter as much as the technical work. The strategy below is organized by platform and phase.

---

### Phase 0 — Pre-Launch (During M1)

Build awareness before the mainnet launch so there is an audience ready when it goes live. Do not wait until contracts are deployed to start talking.

**Goals for Phase 0:**
- Establish a presence on every relevant platform
- Build a small but engaged follower base in the Stacks ecosystem
- Create content that educates the audience about the problem StackStream solves

---

### Platform 1 — X (Twitter)

X is the primary channel for Stacks ecosystem activity. Most builders, DAOs, and investors follow Stacks conversations on X.

**During M1 (pre-launch content):**

1. **Origin story thread** — "I built a Bitcoin-native payroll protocol because DAOs on Stacks have no streaming infrastructure. Here is how it works." Walk through the problem, show a testnet demo GIF, link the repo.

2. **Educational content** — "What is payment streaming and why does your DAO need it?" Explain block-by-block streaming with a simple visual. This is for DAO operators, not developers.

3. **Build-in-public updates** — Every time you finish a test suite expansion or publish the security review, tweet about it. "Just published our public security review for StackStream — here is what we found and how we fixed it." These demonstrate rigor and build trust.

4. **Target and tag the right accounts:**
   - `@Stacks` (official Stacks account)
   - `@HiroSystems` (tooling)
   - `@StacksOrg`
   - Stacks grant recipients who are DAOs — they are your potential customers

**During M2 (launch content):**

5. **Launch thread** — "StackStream is live on mainnet. Bitcoin-native payment streaming for DAOs. Here are the contract addresses, here is the frontend, and here is the first stream created on-chain." Include the Stacks Explorer link to the first mainnet stream.

6. **Live demo posts** — Record a 60-second Loom video of creating a stream and claiming from it on mainnet. Post it as a video tweet. Short demos convert skeptics better than any text.

7. **Proof-of-stream posts** — Every time one of the 5 demo streams is created or claimed, post the transaction hash. This creates a visible trail of on-chain activity.

**During M3 (adoption content):**

8. **DAO spotlight** — When a DAO onboards, ask permission to announce it. "Proud to welcome [DAO name] as the first real team using StackStream for contributor compensation." Tag them. Let their community discover StackStream.

9. **Metrics updates** — Post TVL milestones: "25 streams live. $5,000 streamed. Growing." These signal momentum to the next DAO considering adoption.

10. **Weekly ecosystem content** — One thread per week about payment streaming, DAO treasury management, or Bitcoin DeFi. This builds authority even on weeks when there is no product news.

---

### Platform 2 — Discord

Discord is where you find and convert DAOs — it is the working environment of every active Stacks project.

**Key Stacks Discord channels:**
- `#dev-showcase` — Post the security review and the mainnet launch
- `#clarity-smart-contracts` — Engage in technical conversations; mention StackStream when relevant
- `#building-on-stacks` — Find other teams that might be your first DAO users
- `#grants` — Post updates that are relevant to the grant community; other grantees may be your first customers

**Tactics:**
1. **Post the security review for community input** (M1 deliverable) — this is both a technical requirement and a community engagement opportunity. It brings you credibility before launch.
2. **Announce the mainnet launch** in `#dev-showcase` with the same launch thread content as X.
3. **Direct outreach** — Identify 5–10 active DAO teams in the Stacks Discord and send a direct message. Personalize each one: "I see you're building [X], StackStream could help you pay contributors on-chain. Can I show you a 5-minute demo?"
4. **Create a StackStream Discord** — Once there is any audience (even 20–30 people), having your own server lets you own the community instead of depending on Stacks' Discord.

---

### Platform 3 — Telegram

Telegram is stronger than Discord in some geographic markets (especially West Africa, East Africa, and parts of Southeast Asia). It is also used by many crypto communities for announcements.

**Setup:**
1. Create a **StackStream Telegram channel** for announcements (one-way broadcast)
2. Create a **StackStream Telegram group** for community discussion
3. Cross-post all major announcements from X to Telegram

**Target groups to join and engage in:**
- Stacks community Telegram groups (there are several active ones)
- Africa Bitcoin / Stacks communities — StackStream has a particularly strong value proposition for DAO operators in markets where traditional payroll infrastructure is unreliable or expensive
- Web3 DAO operator groups

**Tactics:**
- Share the launch announcement in relevant groups (do not spam — be helpful)
- Post demo videos in the Telegram group since Telegram native video plays well
- Use Telegram polls to get feedback: "What token would you use for streaming payroll — STX, sBTC, or other SIP-010?"

---

### Platform 4 — LinkedIn

LinkedIn is slower to convert than X or Discord but has a different audience: DAO founders, startup operators, and people with budget authority who are not always present on crypto-native platforms.

**Content strategy:**
1. **Article: "Why Bitcoin-native payroll matters for DAOs"** — 500-word post explaining the problem. Link to StackStream at the end. Not a sales pitch — an educational piece.
2. **Product announcement post** — When mainnet launches, post a professional announcement: "StackStream is now live on Stacks mainnet. If your DAO pays contributors manually, there is a better way."
3. **Milestone updates** — Post when each grant milestone is met. This demonstrates execution credibility to anyone doing due diligence.
4. **Connect with Stacks ecosystem leaders** — The Stacks Foundation, Hiro Systems, and major Stacks projects all have LinkedIn presences. Follow, engage with their content, and be visible.

LinkedIn is not where you will find your first DAO users, but it is where you build the credibility that makes the second and third wave of adoption easier.

---

### Platform 5 — Skool

Skool communities are organized around education and cohort-based learning. The right Skool communities for StackStream are:

- Web3/blockchain builder communities where DAO operators gather
- Crypto education communities where people learning about DeFi primitives would find streaming finance interesting
- African tech/startup communities on Skool

**Tactics:**
1. Post in the relevant Skool community with an educational framing: "How does block-by-block payment streaming work? Here is what I built."
2. Offer a live walkthrough session for community members — Skool supports live events
3. Use Skool as a content distribution channel for the same educational material you are posting on X and LinkedIn

---

### Ecosystem-Specific Positioning

Beyond social media, there are Stacks-native distribution channels that are often more valuable than general social media:

1. **Stacks Forum (forum.stacks.org)** — Post the security review and the mainnet launch announcement. The forum is indexed and discoverable by anyone researching Stacks projects.

2. **Stacks Weekly Newsletter** — Submit a project update for inclusion. This reaches the entire Stacks developer and investor community in one send.

3. **Hiro Hacks / Community Calls** — Stacks and Hiro Systems host regular community calls. Request to present StackStream for 5 minutes at one of these. Live demos convert.

4. **Stacks Ecosystem Directory** — Submit StackStream to the official Stacks app directory once mainnet is live.

5. **Sigle.io** — The on-chain blogging platform built on Stacks. Publish the technical blog post there instead of (or in addition to) Medium/Mirror. This signals ecosystem commitment and is discovered by Stacks users organically.

---

### Marketing Cadence (Week-by-Week Overlay)

| Week | Milestone Phase | Marketing Action |
|---|---|---|
| Week 1 | M1 begins | Origin story thread on X. Set up StackStream Twitter account if not done. Join Stacks Discord channels. |
| Week 2 | M1 — testing | "Building in public" tweet about fuzz testing. First post in Stacks Discord. |
| Week 3 | M1 — review | Publish security review. Post about it on X, Discord, and the Stacks Forum. Request community review. |
| Week 4 | M2 begins | RC announcement: "StackStream v1.0.0-rc1 is ready. Mainnet deployment coming." |
| Week 5 | M2 — deployment | Mainnet deployment tweet + Discord announcement. First stream created. Post the tx hash. |
| Week 6 | M2 — frontend | Production frontend live post. Demo video on X and Telegram. |
| Week 7 | M2 — 5 streams | "5 streams live on mainnet" proof post. Begin direct outreach to DAOs. |
| Week 8 | M3 begins | LinkedIn article published. First DAO outreach DMs sent. Community campaign launched. |
| Week 9 | M3 — adoption | Follow up with DAO leads. Metrics update post: streams, TVL, DAOs. |
| Week 10 | M3 — completion | DAO spotlight posts. Final metrics post. Submit M3 evidence to Stacks Endowment. |

---

## Section 6 — Recommended Tools

These tools are selected for alignment with the Stacks ecosystem, low cost, and direct utility for building and marketing StackStream.

### Development and Testing

| Tool | Purpose | Cost | Why This One |
|---|---|---|---|
| Clarinet v3.6.0 | Smart contract testing and simnet | Free | Already in use; official Stacks tooling |
| Vitest | Test runner | Free | Already in use; fast, TypeScript-native |
| GitHub Actions | CI/CD for automated test runs | Free (public repo) | Runs tests on every push; generates coverage artifacts for M1 evidence |
| Hiro Platform (explorer.hiro.so) | Contract verification and monitoring | Free | Official Stacks block explorer; where you submit contract addresses as evidence |
| Stacks.js (`@stacks/connect`, `@stacks/transactions`) | Wallet integration and transaction building | Free | Official SDK; already in use |

### Infrastructure and Hosting

| Tool | Purpose | Cost | Why This One |
|---|---|---|---|
| Vercel | Frontend hosting | Free–$20/month | Already in use; zero-config Next.js deployment |
| Railway | OpenClaw API hosting | ~$20/month | Already in use; simple Node.js deployment |
| Chainhook (by Hiro) | On-chain event indexing for streams | Free (self-hosted) or Hiro API | Stacks-native event indexing; lets you query stream history without running a full node |

### Analytics and Monitoring

| Tool | Purpose | Cost | Why This One |
|---|---|---|---|
| PostHog | Frontend usage analytics (privacy-first) | Free up to 1M events | Open-source; no PII required; gives you DAU, stream creation funnel, drop-off analysis |
| Vercel Analytics | Core web vitals and page-level traffic | Free on Vercel | Built in; zero setup |
| Hiro API | On-chain data (TVL, stream counts) | Free | Official Stacks API; already used by OpenClaw |

### Marketing and Content

| Tool | Purpose | Cost | Why This One |
|---|---|---|---|
| Loom | Demo video recording | Free (up to 5 min) | Fastest way to record and share screen-capture demos; no editing needed |
| Canva | Social media graphics and diagrams | Free | Fast production of X headers, announcement cards, and architecture diagrams |
| Typefully | X thread drafting and scheduling | Free (basic) | Lets you draft threads offline and schedule posting; important for consistent cadence |
| Buffer | Multi-platform post scheduling (X, LinkedIn) | Free (3 channels) | Cross-post the same content to X and LinkedIn from one place |

### Community and DAO Outreach

| Tool | Purpose | Cost | Why This One |
|---|---|---|---|
| Discord (StackStream server) | Community hub | Free | Essential once you have more than 20 engaged users |
| Telegram (channel + group) | Announcement + community discussion | Free | High engagement in crypto communities; especially strong in Africa and Southeast Asia |
| Guild.xyz | Token-gated Discord roles | Free | Lets you reward early stream creators with a "Streamer" Discord role — a light gamification mechanic |
| Zealy (formerly Crew3) | Community quests and leaderboard | Free (basic) | Run structured campaigns: "Create your first stream, earn XP." Tracks who is participating in your growth campaign. |

### DAO Discovery and Prospecting

| Tool | Purpose | Cost | Why This One |
|---|---|---|---|
| Stacks Explorer DAO search | Find active DAO contracts on Stacks | Free | Identify which Stacks projects have multi-sig wallets or DAO contracts — these are your prospects |
| Stacks Forum search | Find active DAO discussions | Free | Search for "DAO", "payroll", "contributor" to find teams that are actively discussing compensation problems |
| GitHub (github.com/stacks-network ecosystem) | Find active builders | Free | Developers active on GitHub repos in the Stacks org are potential power users |

---

## Section 7 — Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mainnet deployment gas costs exceed estimate | Low | Low | Budget includes $100 gas buffer; contracts are not large |
| Community security review receives no responses | Medium | Medium | Offer a tangible STX bounty ($100+); post in multiple channels; if no community response, document the self-audit as the review and note that no community issues were raised |
| 5 mainnet streams require more STX than available | Low | Low | 5 streams at 10 STX each = 50 STX; well within budget |
| DAO onboarding takes longer than M3 timeline | Medium | High | Start DAO outreach during M2, not M3. Build a pipeline of 8–10 leads so 3 can convert even if 5 drop off. |
| $10,000 TVL threshold requires more STX activity than community generates | Medium | Medium | Pursue Option A (3 DAOs) as primary; supplement with developer-created streams if needed |
| STX price drop reduces real-dollar value of grant | Low | Low | Grant is in USD equivalent — price fluctuation affects timing of disbursements, not the amount |

---

## Summary Table

| Milestone | Core Deliverable | Grant % | Amount | Primary Evidence |
|---|---|---|---|---|
| M1: Hardening | 100+ tests, public security review, RC tag | 20% | $1,600 | Test log, `SECURITY_REVIEW.md`, GitHub release |
| M2: Launch | Mainnet contracts, production frontend, 5 streams | 30% | $2,400 | Explorer links, live URL, tx hashes |
| M3: Traction | 3 DAOs using StackStream OR 25 streams + $10K | 50% | $4,000 | DAO on-chain registrations, stream data, dashboard |
| **Total** | | **100%** | **$8,000** | |
