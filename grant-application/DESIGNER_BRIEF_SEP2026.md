# StackStream, Brand Designer Brief
## 30 days of visual content: Monday Sep 14 to Tuesday Oct 13, 2026

**From:** Jethro Irmiya, founder
**To:** Brand designer
**Written:** Sep 9, 2026
**First assets live:** Monday Sep 14

---

## 1. Read this first

Everything we have published so far has been words. It has been honest and it has been consistent, and it has not been enough. People scroll past text. What we are missing is the thing that makes someone stop, understand in two seconds, and believe it.

That is what you are being brought in to build, and this document is meant to give you everything you need so that you never have to guess or wait on me.

**What StackStream is, in one sentence.** It is payment streaming on the Stacks blockchain: instead of paying someone once a month, an organisation opens a stream and the recipient's balance grows continuously, every few seconds, and they take what they have earned whenever they want.

**Why anyone cares.** Everyone has been paid late, or waited a month for money they earned in week one. Streaming closes that gap. And this is the first time it has been built where the money settles on Bitcoin, which is the part nobody else can copy.

**The single most important visual idea in this whole document.** A number going up, continuously, in real time. That is the product. If a person watches a balance tick upward for three seconds, they understand StackStream completely and no copy is needed. Every asset you make either shows that or supports it.

**Where we honestly are.** Eleven streams created on mainnet, zero organisations registered, as of Sep 8. Small numbers. We publish them anyway, every week, because they come straight from the blockchain and anyone can check them. Do not treat this as a problem to design around. It is the most trustworthy thing about us and the metric card is a hero asset, not an embarrassment.

---

## 2. What I owe you, by end of day today

Nothing in this brief can start until you have these. If any are missing, message me and I will send them within the hour.

| Item | Where |
|---|---|
| Logo, SVG and PNG | `logo.svg`, `logo-oval.png` |
| Bitcoin mark | `bitcoin.svg` |
| Live product to screenshot | https://stackstream.xyz |
| Live public numbers, refreshed on demand | https://stackstream.xyz/api/stats |
| The 60-second demo recording, for pulling frames | I will send the file |
| Existing content plans, for tone reference | `CONTENT_SCHEDULE.md`, `MARKETING_PLAN_V2.md` |
| Founder photos for the human-note posts | I will send a folder |

---

## 3. Brand system, use these exact values

The product is dark-first with Bitcoin orange as the accent. These are pulled directly from the live site's design tokens, so anything you make will sit correctly next to the actual product.

**Brand orange**

| Token | Hex |
|---|---|
| brand-50 | `#fff7ed` |
| brand-100 | `#ffedd5` |
| brand-200 | `#fed7aa` |
| brand-300 | `#fdba74` |
| brand-400 | `#fb923c` |
| brand-500 | `#f97316` |
| brand-600 | `#ea580c` |
| brand-700 | `#c2410c` |

`brand-500` is the primary accent. `brand-400` for anything that needs to glow on dark.

**Dark surfaces**

| Token | Hex | Use |
|---|---|---|
| surface-0 | `#09090b` | Page background, the default canvas for every asset |
| surface-1 | `#0f0f13` | Cards sitting on the background |
| surface-2 | `#18181b` | Raised cards |
| surface-3 | `#1e1e23` | Higher still |
| surface-4 | `#27272a` | Highest, and the default border colour |

**Text and lines**

| Token | Hex | Use |
|---|---|---|
| foreground | `#fafafa` | Primary text |
| muted | `#a1a1aa` | Secondary text |
| muted-foreground | `#71717a` | Labels, captions, axis text |
| border | `#27272a` | Card borders, dividers |
| border-subtle | `#1e1e23` | Quiet dividers |

**Type.** The product uses Geist Sans and Geist Mono. Use them. **Every number is set in Geist Mono, without exception**, because monospaced digits do not jitter when a value changes, and half of what we publish is numbers that change.

**Colour discipline, and this matters more than it sounds.** Orange is the only accent. It marks exactly one thing per asset: the number, or the moment, that the asset exists to communicate. The moment a second accent colour appears, everything stops being emphatic and the whole system flattens.

**Two exceptions, and only two.** Charts may use a green and a red for genuinely opposed quantities, such as earned versus unearned in a cancelled stream. Pick one green and one red, write the hex values into the style sheet in section 4, and never introduce a third.

---

## 4. First deliverable: the style sheet

**Due end of day Thursday Sep 10. This comes before any individual post asset.**

One page, exported as PNG and as an editable source file, showing:

1. The eight-step orange ramp and the five dark surfaces, labelled with hex values
2. Type scale: headline, subhead, body, caption, and the numeral treatment in Geist Mono, with the exact sizes you will use at 1080px wide
3. The chart green and chart red you have chosen, with hex values
4. Logo lockup: minimum size, clear space, and how it sits on `#09090b`
5. The eight asset templates from section 6, each shown once at 1:1

Once I approve this page, you never have to ask me a colour or type question again for the rest of the 30 days. That is the point of doing it first.

---

## 5. Rules that cannot be broken

Some of these will look pedantic. Each one exists because breaking it has cost us something real.

**5.1 Never write "settles on Bitcoin every few seconds."** This is the most important line in this document. It is factually wrong and this audience will catch it and say so publicly. The balance *updates* every few seconds. Bitcoin *finality* is inherited when the state settles to Bitcoin, on Bitcoin's own schedule. These are two different things and they may never appear in the same clause.

- Approved for social: **"Your balance updates every few seconds, secured by Bitcoin."**
- Approved for technical: **"Streams update in seconds. Settlement inherits Bitcoin finality."**
- Never: "settles on Bitcoin every few seconds", "final the instant it lands", or anything that fuses the two.

**5.2 Never invent a number.** Not in a chart, not in a mockup, not as placeholder text that might survive to export. Every figure in every asset comes from `https://stackstream.xyz/api/stats` or from me directly. If you need a number and do not have it, leave the field as `[N]` in the layout and I will fill it before posting. A fabricated chart in this ecosystem is unrecoverable.

**5.3 Every public asset has exactly one call to action, on its own final line, as a full link.** Default `stackstream.xyz`. Use `t.me/dev_jaytee` when the post's ask is "talk to us". Never two.

**5.4 Our handles, exactly as written, never improvised.**

| | |
|---|---|
| Website | `stackstream.xyz` |
| Official X | `@Stackstream0X` |
| Personal X | `@dev_jayteee` (three e's, this is the one people get wrong) |
| Telegram | `t.me/dev_jaytee` (two e's, and yes it differs from the X handle by one letter) |

**5.5 No em dashes anywhere in copy on an asset.** Commas or full stops.

**5.6 Text must survive a phone.** Assume the asset is viewed at 30% of the size you are designing it at. Smallest type on any 1080px asset is 28px. If a chart needs more than five labels to make sense, it is the wrong chart.

**5.7 Everything is captioned and everything is readable muted.** Most people watch video with the sound off. Every motion asset carries burned-in captions.

**5.8 No jargon on any asset.** Banned: escrow, protocol, primitive, SIP-010, vault, on-chain settlement layer. Say "the money sits in a contract", "a stream", "any token on Stacks". The only exception is the two technical explainers on Day 10 and Day 24, which are aimed at developers and may use precise terms.

---

## 6. The eight templates

Thirty days is only workable if it is eight reusable templates rather than thirty original designs. Build these once, in the style sheet, and then each day is a content swap rather than a new design.

**Template A, the Metric Card.** Runs every Monday, five times. One enormous number in Geist Mono, orange, filling most of the frame. Small label under it. Two secondary figures below in muted grey. Bottom left, a timestamp and the words "read live from the contract". This is our most distinctive recurring asset because nobody else in the ecosystem publishes verifiable numbers weekly. Make it look like a readout, not a marketing graphic.

**Template B, the Explainer Diagram.** Sender, contract, recipient, and the flow between them. Built once as a master diagram, then reused with different parts highlighted in orange depending on which idea that day's post is teaching. This is the workhorse.

**Template C, the Proof Card.** A real transaction on the blockchain, framed and made legible. Cropped explorer screenshot, the hash, the block, the amount, a green confirmed marker. Deliberately plain. It should look like evidence rather than design, because the moment it looks designed it stops working as proof.

**Template D, the Objection Card.** Two stacked panels. Top, the doubt, in muted grey on `surface-1`. Bottom, the answer, in white with the key phrase in orange, on `surface-2`. Used for every "yes but what if" post.

**Template E, the Segment Scene.** A specific person or team pictured in their situation. Illustration or a strongly treated photograph, your call, but pick one approach in the style sheet and hold it for all 30 days. Never generic stock imagery.

**Template F, the Human Note.** Founder photo, quiet treatment, a short handwritten-feeling line. Warmer and less produced than everything else. Slightly off-system on purpose. These are the posts that build trust, and over-designing them kills them.

**Template G, the Comparison Chart.** Us against Sablier and Streamflow. Rows are properties, columns are the three products. One orange column, two muted. No animation, no gradient, no decoration. Let the single differentiating row do the work.

**Template H, the Ticking Balance Loop.** The hero asset of the entire month, and the one to build first. A short seamless loop of a balance counting upward in Geist Mono, orange, on `#09090b`. Six to eight seconds, loops invisibly, works with no sound and no context. Deliver in 1:1, 9:16 and 16:9. **This one asset will be reused more than any other thing you make this month**, so it is worth spending disproportionate time on. If you deliver nothing else by Monday, deliver this.

---

## 7. Formats, naming and delivery

**Sizes. Every asset ships in all four unless the day's spec says otherwise.**

| Ratio | Pixels | Used for |
|---|---|---|
| 1:1 | 1080 x 1080 | X, LinkedIn |
| 4:5 | 1080 x 1350 | LinkedIn, best feed real estate |
| 9:16 | 1080 x 1920 | WhatsApp status, stories |
| 16:9 | 1600 x 900 | Stacks Forum, blog headers, link previews |

**Safe zone:** keep all text and key elements inside a 10% margin on every edge. The 9:16 crop loses the top and bottom in most viewers.

**File naming, exactly this pattern, because I will be pulling files under time pressure:**

`SS_D07_ticking-balance_1x1.png`

Day number always two digits. Ratio as `1x1`, `4x5`, `9x16`, `16x9`.

**Formats:** static as PNG, plus the editable source. Motion as MP4 (H.264) and a WebP or GIF fallback under 5MB. Anything with type also as SVG where possible.

**Delivery:** one shared folder, one subfolder per week, `Week1` through `Week5`. Sources in a `_source` subfolder at the top level, not scattered.

---

## 8. Production schedule

We ship Monday Sep 14, which is five days from today. That is genuinely tight, so week one is deliberately the lightest week and leans hardest on templates.

| Batch | Contains | Due | Notes |
|---|---|---|---|
| **Batch 0** | Style sheet (section 4) plus Template H, the ticking balance loop | **Thu Sep 10, end of day** | Approval on the style sheet unblocks everything else |
| **Batch 1** | Days 1 to 7 | **Sat Sep 12, end of day** | Two clear days of buffer before we post |
| **Batch 2** | Days 8 to 14 | Fri Sep 18 | |
| **Batch 3** | Days 15 to 21 | Fri Sep 25 | |
| **Batch 4** | Days 22 to 28 | Fri Oct 2 | |
| **Batch 5** | Days 29 to 30, plus any reshoots | Fri Oct 9 | |

**If Batch 0 and Batch 1 cannot both land, prioritise in this order:** Template H, then the Day 1 metric card, then the Day 3 explainer diagram. Those three cover the first week on their own and the rest can follow midweek.

**Review loop.** I review within four hours of delivery and give you one consolidated set of notes, not a trickle. Two revision rounds per asset are budgeted. If an asset needs a third round, the design is not the problem and we should talk instead of iterating.

---

## 9. The 30 days

The weekly rhythm is fixed and repeats, so you always know roughly what is coming: **Monday** is the real number, **Tuesday** teaches an idea, **Wednesday** shows proof, **Thursday** kills an objection, **Friday** pictures a specific kind of team, **Saturday** is a human note, **Sunday** is a bigger idea.

Bracketed values like `[N]` are numbers I fill in on the morning of posting. Leave them as visible placeholder fields in the layout.

### Week 1: Sep 14 to Sep 20, what streaming actually is

| Day | Date | Post | Asset | Template |
|---|---|---|---|---|
| 1 | Mon Sep 14 | The number, week 1 | Metric card: `[N]` streams created, `[D]` organisations registered, timestamp, "read live from the contract" | A |
| 2 | Tue Sep 15 | The tap, not the bucket | Split infographic. Left, a bucket filled once a month, cold grey. Right, a tap running continuously, orange. The single clearest picture of what we do | B |
| 3 | Wed Sep 16 | Watch it move | **The ticking balance loop.** Six to eight seconds, seamless, no logo until the last frame. Cold open on the number | H |
| 4 | Thu Sep 17 | Where the money actually sits | Diagram answering "who is holding my funds". Sender, contract, recipient, with the contract highlighted and a lock. Copy: "It never touches us" | B, D |
| 5 | Fri Sep 18 | Payday that runs itself | Segment scene: a small team of five. Left panel, month-end chaos, spreadsheet, chasing signatures, someone missed. Right panel, five quiet streams already running | E |
| 6 | Sat Sep 19 | Why I built this | Founder photo, quiet. One line: "I have been paid late. So has everyone I know" | F |
| 7 | Sun Sep 20 | Money that moves like water | Wide conceptual piece. Streaming as continuous flow versus discrete lumps. The most artistic asset of the month, use the range | E |

### Week 2: Sep 21 to Sep 27, proof and control

| Day | Date | Post | Asset | Template |
|---|---|---|---|---|
| 8 | Mon Sep 21 | The number, week 2 | Metric card, same layout as Day 1. **Identical composition every Monday**, only the numbers change. The repetition is the point | A |
| 9 | Tue Sep 22 | You are never locked in | Four-icon strip: pause, resume, top up, cancel. Under cancel: "everything unearned comes straight back" | B |
| 10 | Wed Sep 23 | A real transaction | Proof card from an actual mainnet transaction. Hash, block, amount, confirmed. Plain and unglamorous on purpose | C |
| 11 | Thu Sep 24 | What if nobody claims it? | Objection card. Doubt on top. Answer below: "It keeps accruing. Nothing is lost. Claim all of it on the last day if you like" | D |
| 12 | Fri Sep 25 | Grants that release as work ships | Segment scene: a grant programme. A funding bar releasing in stages as milestones complete, unreleased portion clearly still inside the funder's control | E, B |
| 13 | Sat Sep 26 | The number nobody wants to post | Founder note about publishing eleven streams instead of hiding it. Quiet, honest, no chart | F |
| 14 | Sun Sep 27 | Nobody else can do this bit | Comparison chart. StackStream, Sablier, Streamflow. Rows: real-time, any token, non-custodial, cancellable, **settlement**. One orange cell carries the whole asset | G |

### Week 3: Sep 28 to Oct 4, who it is for

| Day | Date | Post | Asset | Template |
|---|---|---|---|---|
| 15 | Mon Sep 28 | The number, week 3 | Metric card | A |
| 16 | Tue Sep 29 | Any token you actually hold | Token strip: sBTC, STX, USDA, ALEX, all flowing through one stream. Kill the assumption that this is STX-only | B |
| 17 | Wed Sep 30 | Two minutes, start to finish | Screen-recorded flow: connect, create stream, watch it start. Captioned, muted-readable, under 40 seconds | H, C |
| 18 | Thu Oct 1 | What does it cost? | Objection card. Answer: "No protocol fee. Stacks gas only, a few STX." Make the number visually tiny, that is the message | D |
| 19 | Fri Oct 2 | Paid as you work | Segment scene: a contributor watching their balance grow while working. The recipient-side view, which we have under-served | E |
| 20 | Sat Oct 3 | Building this alone | Founder note, behind the scenes, warm and unpolished | F |
| 21 | Sun Oct 4 | Bitcoin is the difference | The settlement explainer, and **the single most language-sensitive asset of the month**. Two clearly separate timelines: stream updates in seconds, settlement inherits Bitcoin finality. Two tracks, visually distinct, never merged into one arrow. Re-read rule 5.1 before starting this one | B |

### Week 4: Oct 5 to Oct 11, trust and depth

| Day | Date | Post | Asset | Template |
|---|---|---|---|---|
| 22 | Mon Oct 5 | The number, week 4 | Metric card | A |
| 23 | Tue Oct 6 | Cancel it and see | Diagram of a cancelled stream splitting into two: earned to the recipient, unearned back to the sender, in the same transaction. Use the chart green and red here | B |
| 24 | Wed Oct 7 | Open code, tested | Developer-facing card. Contract line count, 125 passing tests including fuzz tests, independently audited, report in the repo. Terminal aesthetic, Geist Mono. Jargon is allowed on this one | C |
| 25 | Thu Oct 8 | Is it safe? | Objection card on custody and audit. Answer: "The funds sit in the contract. Never with us. Not at any point" | D |
| 26 | Fri Oct 9 | How teams pay people today | Segment scene: the manual month-end process drawn honestly, every step, every place it breaks. Then the same thing as one stream. This is the highest-converting asset in the set, give it the most time | E, B |
| 27 | Sat Oct 10 | What I got wrong | Founder note on lessons from the last three months. Vulnerable and specific | F |
| 28 | Sun Oct 11 | Where this goes | Roadmap piece: cross-chain payout and private streams. **Every element on this asset carries a visible "roadmap, not shipped" marker.** We do not promise dates and we do not let a viewer mistake a plan for a feature | B |

### Week 5: Oct 12 to Oct 13, closing

| Day | Date | Post | Asset | Template |
|---|---|---|---|---|
| 29 | Mon Oct 12 | The number, week 5 | Metric card, final one. Add a small sparkline of all five Mondays underneath, so 30 days of honesty is visible in one glance | A |
| 30 | Tue Oct 13 | Thirty days in the open | Summary infographic. Every weekly number, what shipped, what did not. **Design this to work whether the numbers went up a lot or barely moved.** If they barely moved we still post it, so it cannot be a victory graphic | A, G |

---

## 10. Definition of done

An asset is finished when all of these are true. Check them yourself before delivering, because I will check them before posting and a bounce costs us both a day.

- [ ] Exported in all four ratios, unless the day's row says otherwise
- [ ] All text inside the 10% safe margin
- [ ] Smallest type is at least 28px at 1080 wide
- [ ] Every numeral is Geist Mono
- [ ] Exactly one accent colour is doing work
- [ ] Exactly one call to action, as a full link, on its own final line
- [ ] Handles spelled correctly: `@Stackstream0X`, `@dev_jayteee`, `t.me/dev_jaytee`
- [ ] Zero invented numbers. Unknown figures left as visible `[N]` fields
- [ ] Rule 5.1 checked by reading the copy out loud
- [ ] No em dashes
- [ ] Motion assets are captioned and readable with the sound off
- [ ] Filename follows `SS_D07_slug_1x1.png`
- [ ] Editable source is in `_source`

---

## 11. How to reach me

Telegram `t.me/dev_jaytee` is fastest and I will answer within the hour during working hours. If you are blocked on anything, ask immediately rather than guessing. A wrong assumption caught in five minutes costs nothing; the same assumption caught at delivery costs a day we do not have.

**Two things to ask me about rather than decide alone:** any number that appears on an asset, and any wording change to a settlement claim. Everything else, including the visual direction, is yours.

---

*Jethro Irmiya, Sep 9, 2026. Live figures quoted here were true on Sep 8, 2026 and are refreshed from https://stackstream.xyz/api/stats on the morning of each post.*
