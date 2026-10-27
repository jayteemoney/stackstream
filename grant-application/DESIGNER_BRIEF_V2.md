# StackStream, Brand Designer Brief
## 60 days of visual content: Monday Oct 26 to Thursday Dec 24, 2026

**From:** Jethro Irmiya, founder
**To:** Brand designer
**Written:** Oct 21, 2026
**First assets live:** Monday Oct 26, 2026

---

## 1. Read this first

Everything we have published for the last 30 days has been words. It has been honest, it has been consistent, and it did not move a single number. We are now doing the thing that should have come first, which is showing a number that goes up in real time, and showing the receipts.

**What StackStream is, in one sentence.** It is payment streaming on the Stacks blockchain: instead of paying someone once a month, an organisation opens a stream, the recipient's balance grows continuously, block by block, and they claim whenever they want.

**Why anyone cares.** Everyone has been paid late, or waited a month for money they earned in week one. Streaming closes that gap, and it is the first time it has been built secured by Bitcoin, which is the part nobody else can copy.

**The single most important visual idea in this document.** A number going up, continuously, in real time. That is the product. If a person watches a balance tick upward for three seconds, they understand StackStream completely and no copy is needed. Every asset either shows that or supports it.

**What is new in this run, and it is the reason the brief changed.** We shipped a public register on Oct 7. Every organisation that registers appears on a public list, read live from the contract, with a receipt for each entry. It is the only thing about StackStream a stranger can verify in ten seconds without taking our word for it, and it is now the spine of the campaign. Two assets are new: the register card, and the layer map. One layout is new: the metric card now leads with organisations instead of streams.

**Where we honestly are, as of Oct 21, 2026 at 10:59 UTC, mainnet block 9,268,739.** 16 streams created, 1 organisation registered, 0 organisations with a running claimed stream, 5 creators being paid continuously since Oct 19 on a test we funded ourselves. Small numbers, published anyway, every week, because they come straight from the blockchain and anyone can check them.

**Do not design a victory graphic.** The last asset of the run has to work whether the numbers tripled or barely moved, and it will be published either way. Design it as a readout, not a celebration. The most trustworthy thing about us is that we publish the number when it is small, and every asset in this document has to survive that test.

---

## 2. What I owe you, by end of day Thursday Oct 22

Nothing in this brief can start until you have these. If any are missing, message me and I will send them within the hour.

| Item | Where |
|---|---|
| Logo, SVG and PNG | `frontend/public/logo.svg`, `frontend/public/logo-mark.png` |
| Bitcoin mark | `frontend/public/bitcoin.svg` |
| Live product to screenshot | https://stackstream.xyz |
| Live public register, to screenshot | https://stackstream.xyz/organisations |
| Live public numbers, refreshed on demand | https://stackstream.xyz/api/stats |
| The five creator stream receipts, for the proof cards | https://stackstream.xyz/api/streams/{id}, one per creator |
| The 60-second demo recording, for pulling frames | I will send the file |
| The five creator answers, unedited, for the Day 9 voice card | I will send the raw responses |
| Founder photos for the human-note posts | I will send a folder |
| Existing content plans, for tone and copy reference | `CONTENT_SCHEDULE_V2.md`, `POSITIONING.md` |

**Correction against the September brief.** The asset `logo-oval.png` does not exist. Use `logo.svg` and `logo-mark.png` in `frontend/public`. Everything else in the September brief still applies.

**One hard dependency on me.** No organisation name appears on any asset until I give you written permission, in writing, for that specific name. Until then every name is a placeholder field. This is not a style preference, it is a promise we make to the teams on the register, and breaking it is unrecoverable. See rule 5.10.

---

## 3. Brand system, use these exact values

The product is dark-first with Bitcoin orange as the accent. These are pulled directly from the live site's design tokens, so anything you make will sit correctly next to the actual product. Verified against `frontend/src/app/globals.css` on Oct 21, 2026.

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

**Colour discipline, and this matters more than it sounds.** Orange is the only accent. It marks exactly one thing per asset: the number, the layer, or the moment the asset exists to communicate. The moment a second accent colour appears, everything stops being emphatic and the whole system flattens.

**Two exceptions, and only two.** Charts may use a green and a red for genuinely opposed quantities, such as earned versus unearned in a cancelled stream. Pick one green and one red, write the hex values into the style sheet, and never introduce a third.

---

## 4. First deliverable: the style sheet

**Due end of day Friday Oct 23. This comes before any individual post asset.**

One page, exported as PNG and as an editable source file, showing:

1. The eight-step orange ramp and the five dark surfaces, labelled with hex values
2. Type scale: headline, subhead, body, caption, and the numeral treatment in Geist Mono, with the exact sizes you will use at 1080px wide
3. The chart green and chart red you have chosen, with hex values
4. Logo lockup: minimum size, clear space, and how it sits on `#09090b`
5. The eight templates from section 6, each shown once at 1:1
6. The four new layouts from section 7, each shown once at 1:1
7. A placeholder field treatment, so we both know exactly what `[N]`, `[D]`, `[O]` and `[ORG NAME]` look like when they are still unfilled

Once I approve this page, you never have to ask me a colour or type question again for the rest of the 60 days. That is the point of doing it first.

---

## 5. Rules that cannot be broken

Some of these look pedantic. Each one exists because breaking it has cost us something real, or would cost us a team.

**5.1 Never write "settles on Bitcoin every few seconds."** The balance *updates* with every block. Bitcoin *finality* is inherited when the state settles to Bitcoin, on Bitcoin's own schedule. These may never appear in the same clause.

- Approved for social: **"Your balance grows with every block, secured by Bitcoin."**
- Approved for technical: **"Streams update in seconds. Settlement inherits Bitcoin finality."**
- Never: "settles on Bitcoin every few seconds", "final the instant it lands", or anything that fuses the two.

**5.2 Never invent a number.** Not in a chart, not in a mockup, not as placeholder text that might survive to export. Every figure comes from `https://stackstream.xyz/api/stats` or from me. If you need a number and do not have it, leave the field as `[N]`, `[D]` or `[O]` in the layout and I will fill it before posting. A fabricated chart in this ecosystem is unrecoverable.

**5.3 Every public asset has exactly one call to action, on its own final line, as a full link.** Never two. The link is `https://stackstream.xyz` on most days, `https://stackstream.xyz/organisations` on the register days (D2, D51, D52, D59, D60), and `https://github.com/jayteemoney/stackstream` on the two developer days (D37, D38). Telegram (`t.me/dev_jaytee`) never appears on an asset or as a post's link: it is for DMs and replies only.

**5.4 Our handles, exactly as written, never improvised.**

| | |
|---|---|
| Website | `stackstream.xyz` |
| Official X | `@Stackstream0X` |
| Personal X | `@dev_jayteee` (three e's, this is the one people get wrong) |
| Telegram | `t.me/dev_jaytee` (two e's). For DMs and replies only, never on an asset |

**5.5 No em dashes anywhere in copy on an asset.** Commas or full stops. Read the copy out loud before exporting, because a dash is easy to type and hard to see.

**5.6 Text must survive a phone.** Assume the asset is viewed at 30% of the size you are designing it at. Smallest type on any 1080px asset is 28px. If a chart needs more than five labels to make sense, it is the wrong chart.

**5.7 Everything is captioned and everything is readable muted.** Most people watch video with the sound off. Every motion asset carries burned-in captions.

**5.8 No jargon on any asset.** Banned: escrow, protocol, primitive, SIP-010, vault, on-chain settlement layer. Say "the money sits in a contract", "a stream", "any token on Stacks". The only exceptions are Days 37 and 38, which are aimed at developers and may use precise terms.

**5.9 Tokens and cost, exactly.** Never show STX in a token strip or list: native STX is the network's coin and cannot be streamed. Show sBTC, USDA, ALEX and xBTC, plus a blank "your token" badge, because any team can now stream its own token. On cost, write "No fee from us" and "a fraction of one STX in network fees". Never "a few STX", which overstates the real cost about a thousand times.

**5.10 No team named without written permission.** Not on a register card, not in a receipt screenshot, not in a segment scene, not in a chart label. Every organisation name is a `[ORG NAME]` placeholder until I send written permission for that name. This applies to the one organisation currently on the register and to any that joins during the run. Other people's product names, such as wallets, protocols and grant programmes, are fine as plain text, but never use a third party logo.

**5.11 Organisations lead, streams are secondary.** Since Day 1 of this run, the headline figure is organisations registered, and the second figure is organisations with a running claimed stream. Total streams is a third-line figure. A card that leads with 16 streams when there is 1 organisation is doing the opposite of what we are trying to say.

**5.12 No target figures, no deadlines, no milestones we have not hit.** No "3 organisations by December", no "in 60 days we will". The assets describe what is true on the morning they are published.

**5.13 Never draw a fee estimate the product does not show.** The app does not currently display an estimated claim fee, so no asset may show one. The honest line is "a fraction of one STX in network fees".

**5.14 Never use stock imagery.** No smiling people with laptops, no handshake, no skyline. Either a real photograph of a real person, or an illustration in our system, or nothing. Pick one approach in the style sheet and hold it for the whole run.

---

## 6. The eight templates

Sixty days is only workable if it is eight reusable templates rather than forty-four original designs. Build these once, in the style sheet, and then each day is a content swap rather than a new design. These carry over from the September run.

**Template A, the Metric Card.** Runs every Monday, nine times. One enormous number in Geist Mono, orange, filling most of the frame. Small label under it. Two secondary figures below in muted grey. Bottom left, a timestamp, the block height, and the words "read live from the contract". This is our most distinctive recurring asset because nobody else in the ecosystem publishes verifiable numbers weekly. Make it look like a readout, not a marketing graphic. **The layout changes in this run**, see section 7.

**Template B, the Explainer Diagram.** Sender, contract, recipient, and the flow between them. Built once as a master diagram, then reused with different parts highlighted in orange depending on which idea that day's post is teaching. This is the workhorse, and this run it gains two new layouts, see section 7.

**Template C, the Proof Card.** A real transaction on the blockchain, framed and made legible. Cropped explorer screenshot, the hash, the block, the amount, a green confirmed marker. Deliberately plain. It should look like evidence rather than design, because the moment it looks designed it stops working as proof.

**Template D, the Objection Card.** Two stacked panels. Top, the doubt, in muted grey on `surface-1`. Bottom, the answer, in white with the key phrase in orange, on `surface-2`. Used for every "yes but what if" post.

**Template E, the Segment Scene.** A specific person or team pictured in their situation. Illustration or a strongly treated photograph, your call, but pick one approach in the style sheet and hold it for all 60 days.

**Template F, the Human Note.** Founder photo, quiet treatment, a short handwritten-feeling line. Warmer and less produced than everything else. Slightly off-system on purpose. These are the posts that build trust, and over-designing them kills them. This run it gains one new layout, see section 7.

**Template G, the Comparison Chart.** Us against Sablier and Streamflow. Rows are properties, columns are the three products. One orange column, two muted. No animation, no gradient, no decoration. Let the single differentiating row do the work.

**Template H, the Ticking Balance Loop.** A short seamless loop of a balance counting upward in Geist Mono, orange, on `#09090b`. Six to eight seconds, loops invisibly, works with no sound and no context. Deliver in 1:1, 9:16 and 16:9. **This asset will be reused more than any other thing you make**, so it is worth spending disproportionate time on it. If you deliver nothing else by Monday Oct 26, deliver this.

---

## 7. The four new layouts in this run

These are the ones that have no September precedent. They are new work and they are the visual identity of this campaign.

**7.1 A-new, the Organisations Metric Card.** The same read-only discipline as Template A, reordered. The lead figure is `[D]`, organisations registered. The second figure is `[O]`, organisations with a running claimed stream. The third is `[N]`, total streams, smaller and muted. Only `[D]` and `[O]` get the orange. The composition is identical on all nine Mondays, and the numbers are the only thing that changes. That repetition is the point: after nine weeks the card is a recognisable object, and a reader who has seen it six times knows the number is real before they read it. A small block-height line and a timestamp in the bottom left, in Geist Mono, muted.

**7.2 B-register, the Register Card.** A rendering of one row of `stackstream.xyz/organisations`, in our own system rather than a screenshot, so it can be exported cleanly and read at phone size. The row shows: an organisation name, the date it joined, its linked stream count, and a receipt chip. The name is `[ORG NAME]` until permission exists, the date is `[DATE]`, the count is `[N]`. The card should look like a record rather than a badge, because the whole claim is that this list is read live from the contract and not written by us. A short line underneath: "read live from the contract, updates every minute". One variant of this layout shows two rows, so the card can carry the "grows as teams join" idea without faking a number.

**7.3 B-layer-map, the Layer Map.** Three horizontal bands, stacked, left to right aligned on the same axis. Top band: storing value, shown as settled and labelled with plain names of the well known projects on Stacks. Middle band: trading value, shown as busy and labelled the same way. Bottom band: moving value for work, shown as empty, with the empty state made obvious. Then, in orange, StackStream's own line sits in that empty band, and it is the only orange thing in the frame. The labels for other projects are plain text, never logos. The point of the layout is the empty third band, so give it the most space and make the emptiness read as an opportunity, not as a gap. This is the asset that has to survive a room full of Stacks builders, so keep it precise and unfussy.

**7.4 F-voices, the Creator Voice Card.** A real quote from a real person who is being paid. Their words, unedited, never shortened for tone and never cleaned up. The frame carries their name, their role, and what they were paid, in small muted type. If we have a photograph of the person, use it, small and quiet, on `surface-1`. If we do not, the card is typographic: the quote in large Geist Sans on `surface-1` with a single orange vertical rule at the left margin, and no photograph at all. The second half of the card is a single line in muted type: what they did next, for example "claimed on day three, then again on day six". **A quote card is a record of a person. It gets the least design in the set, not the most.**

---

## 8. The 60 days

The weekly rhythm is fixed and repeats, so you always know roughly what is coming: **Monday** is the real number, **Tuesday** teaches an idea, **Wednesday** shows proof, **Thursday** kills an objection, **Friday** pictures a specific kind of team. **Weekdays only.** Days 6, 7, 13, 14, 20, 21, 27, 28, 34, 35, 41, 42, 48, 49, 55 and 56 are not posted and need no asset.

Bracketed values are numbers I fill in on the morning of posting, from `stackstream.xyz/api/stats`. Leave them as visible placeholder fields in the layout.

### Week 1, D1 to D5: the register opens

| Day | Date | Asset | Template | What it must show |
|---|---|---|---|---|
| 1 | Mon Oct 26 | `SS_D01_metric-card` | A-new | The new organisations metric card. `[D]` organisations, `[O]` with a running claimed stream, `[N]` total streams. Timestamp, block height, "read live from the contract" |
| 2 | Tue Oct 27 | `SS_D02_the-register` | B-register | One register row as a record: `[ORG NAME]`, `[DATE]`, `[N]` streams, receipt chip. Link is `stackstream.xyz/organisations` |
| 3 | Wed Oct 28 | `SS_D03_five-streams` | C | One real creator stream receipt. Hash, block, amount, rate per block, confirmed marker. Plain |
| 4 | Thu Oct 29 | `SS_D04_where-money-sits` | D | Doubt on top: "where does the money sit while it streams". Answer below: "in the contract, never with us" |
| 5 | Fri Oct 30 | `SS_D05_grant-programmes` | E | A grant programme. A funding bar releasing in stages as milestones complete, the unreleased portion clearly still with the funder |

### Week 2, D8 to D12: proof of use

| Day | Date | Asset | Template | What it must show |
|---|---|---|---|---|
| 8 | Mon Nov 2 | `SS_D08_metric-card` | A-new | Identical composition to Day 1. Only the numbers change |
| 9 | Tue Nov 3 | `SS_D09_creator-voices` | F-voices | One unedited creator quote, their role, what they were paid, and what they did next. No invented quote, ever. If the feedback is not in hand, use Day 47's copy instead |
| 10 | Wed Nov 4 | `SS_D10_claim-receipts` | C | A claim transaction receipt. The same stream, the moment of claiming |
| 11 | Thu Nov 5 | `SS_D11_nobody-claims` | D | Doubt: "what if nobody ever claims it". Answer: "it keeps accruing, nothing is lost, claim it all on the last day" |
| 12 | Fri Nov 6 | `SS_D12_creators` | E | A creator being paid. The recipient side, which we have under served. Balance growing while they work |

### Week 3, D15 to D19: the position

| Day | Date | Asset | Template | What it must show |
|---|---|---|---|---|
| 15 | Mon Nov 9 | `SS_D15_metric-card` | A-new | The card, unchanged |
| 16 | Tue Nov 10 | `SS_D16_layer-map` | B-layer-map | Storing value, trading value, and the empty band for moving value for work, with StackStream in orange in that band |
| 17 | Wed Nov 11 | `SS_D17_sbtc` | C and H | A receipt paid in sBTC, plus a version of the ticking balance loop showing an sBTC amount. Two assets |
| 18 | Thu Nov 12 | `SS_D18_why-this-project` | D | Doubt: "why on Stacks and not anywhere else". Answer: "streaming payment exists on Ethereum and Solana, it did not exist on Bitcoin" |
| 19 | Fri Nov 13 | `SS_D19_protocol-teams` | E | A protocol team paying distributed contributors by hand at month end |

### Week 4, D22 to D26: payroll

| Day | Date | Asset | Template | What it must show |
|---|---|---|---|---|
| 22 | Mon Nov 16 | `SS_D22_metric-card` | A-new | The card, unchanged |
| 23 | Tue Nov 17 | `SS_D23_month-end` | B and E | Two assets. The manual month end drawn honestly: spreadsheet, a signer to chase, one person missed. Then the same team with one stream running and nothing to do. Highest converting asset in the run, give it the most time |
| 24 | Wed Nov 18 | `SS_D24_payroll-stream` | C | A payroll stream live. Receipt plus the rate per block, so the growth is legible |
| 25 | Thu Nov 19 | `SS_D25_multisig` | D | Doubt: "our multisig is fine". Answer: "the spreadsheet is not the problem, month end is" |
| 26 | Fri Nov 20 | `SS_D26_team-size` | E | A team of three to fifteen. The size that actually pays people by hand and has no process |

### Week 5, D29 to D33: grants and bounties

| Day | Date | Asset | Template | What it must show |
|---|---|---|---|---|
| 29 | Mon Nov 23 | `SS_D29_metric-card` | A-new | The card, unchanged |
| 30 | Tue Nov 24 | `SS_D30_grant-stages` | B | Grant stages as a diagram. A milestone bar releasing as work ships, the unreleased part visibly still inside the funder's control |
| 31 | Wed Nov 25 | `SS_D31_grant-milestone` | C | A grant milestone streamed. Receipt, with the milestone context in one muted line |
| 32 | Thu Nov 26 | `SS_D32_thank-you` | F | Thank you to the five creators. Founder photo, quiet, warm. This is the week of Thanksgiving, so it lands as a human moment, not a post |
| 33 | Fri Nov 27 | `SS_D33_degrants` | E | A community grants programme deciding an award. The award made by people, then paid by a stream |

### Week 6, D36 to D40: the builder's view

| Day | Date | Asset | Template | What it must show |
|---|---|---|---|---|
| 36 | Mon Nov 30 | `SS_D36_metric-card` | A-new | The card, unchanged |
| 37 | Tue Dec 1 | `SS_D37_open-data` | C, developer | Read API card, terminal aesthetic, Geist Mono. `GET /api/streams/{id}`, `GET /api/organisations`, `GET /api/stats`, 125 passing contract tests including fuzzing, the audit in the repo. Jargon allowed on this one. Link is the GitHub repo |
| 38 | Wed Dec 2 | `SS_D38_integrator` | C | An app reading live balances from the read API. Use a real product screenshot and lay our overlay on top, matching the app's surfaces exactly. Link is the GitHub repo |
| 39 | Thu Dec 3 | `SS_D39_would-have-to-build` | D | Doubt: "we would have to build this ourselves". Answer: "you do not, and here is a setup link" |
| 40 | Fri Dec 4 | `SS_D40_wallets` | E | A wallet team. Daily active users, and what a wallet gets from a payment that is already there |

### Week 7, D43 to D47: subscriptions, and the person being paid

| Day | Date | Asset | Template | What it must show |
|---|---|---|---|---|
| 43 | Mon Dec 7 | `SS_D43_metric-card` | A-new | The card, unchanged |
| 44 | Tue Dec 8 | `SS_D44_subscriptions` | B | Charge only while it is used. Two panels: a fixed transfer on the same date each month, against a stream that accrues with usage and stops when it stops |
| 45 | Wed Dec 9 | `SS_D45_subscription` | C | A subscription running. Receipt, with the period visible |
| 46 | Thu Dec 10 | `SS_D46_recipient-needs` | D | Doubt: "what does the person being paid actually need". Answer: a little STX in the wallet and a fraction of one STX in fees. **No fee estimate is drawn anywhere on this card**, see rule 5.13 |
| 47 | Fri Dec 11 | `SS_D47_person-being-paid` | E | The person being paid, a creator at their desk, a balance growing while they work |

### Week 8, D50 to D54: the pattern

| Day | Date | Asset | Template | What it must show |
|---|---|---|---|---|
| 50 | Mon Dec 14 | `SS_D50_metric-card` | A-new | The card, unchanged |
| 51 | Tue Dec 15 | `SS_D51_more-than-one` | B-register | The same organisation's record, with its stream count grown, beside a second record. Names are placeholders until permission exists. Link is `stackstream.xyz/organisations` |
| 52 | Wed Dec 16 | `SS_D52_second-org` | C | The second organisation's first stream receipt. If no second organisation exists, this stays as a placeholder card and does not ship. Link is `stackstream.xyz/organisations` |
| 53 | Thu Dec 17 | `SS_D53_just-a-grant-project` | D | Doubt: "is this just a grant project". Answer: three ways money moves for work, and grants are the easiest of them |
| 54 | Fri Dec 18 | `SS_D54_ecosystem` | E | The ecosystem. A working group paying people by hand, in a community that is otherwise sophisticated |

### Week 9, D57 to D60: close

| Day | Date | Asset | Template | What it must show |
|---|---|---|---|---|
| 57 | Mon Dec 21 | `SS_D57_metric-card` | A-new | The card, unchanged |
| 58 | Tue Dec 22 | `SS_D58_sixty-days` | A | The nine Monday numbers as a small chart, nine columns, one orange column for the current figure. Honest at any height. Add a small sparkline of the nine weeks underneath |
| 59 | Wed Dec 23 | `SS_D59_receipts` | C | The receipts of the run, several stacked, each with its hash and block. The record of what actually happened. Link is `stackstream.xyz/organisations` |
| 60 | Thu Dec 24 | `SS_D60_sixty-days` | A and G | Two assets. One is the 60-day summary, designed to work whether the numbers went up a lot or barely moved. The other is the comparison chart, us against Sablier and Streamflow. Link is `stackstream.xyz/organisations` |

---

## 9. Formats, naming and delivery

**Sizes. Every asset ships in all four unless the day's spec says otherwise.**

| Ratio | Pixels | Used for |
|---|---|---|
| 1:1 | 1080 x 1080 | X, LinkedIn |
| 4:5 | 1080 x 1350 | LinkedIn, best feed real estate |
| 9:16 | 1080 x 1920 | WhatsApp status, stories |
| 16:9 | 1600 x 900 | Stacks Forum, blog headers, link previews |

**Safe zone:** keep all text and key elements inside a 10% margin on every edge. The 9:16 crop loses the top and bottom in most viewers.

**File naming, exactly this pattern, because I will be pulling files under time pressure:**

`SS_D01_metric-card_1x1.png`

Day number always two digits. Ratio as `1x1`, `4x5`, `9x16`, `16x9`. The asset id in section 8 is the filename prefix, exactly as written.

**Formats:** static as PNG, plus the editable source. Motion as MP4 (H.264) and a WebP or GIF fallback under 5MB. Anything with type also as SVG where possible.

**Delivery:** one shared folder, one subfolder per week, `Week1` through `Week9`, plus `Batch0` for the style sheet and the hero assets. Sources in a `_source` subfolder at the top level, not scattered.

---

## 10. Production schedule

We ship Monday Oct 26, which is five days from today. Week one is deliberately the lightest week and leans hardest on templates.

| Batch | Contains | Due | Notes |
|---|---|---|---|
| **Batch 0** | Style sheet (section 4), Template H, and the A-new metric card | **Fri Oct 23, end of day** | Approval on the style sheet unblocks everything else |
| **Batch 1** | Days 1 to 5 | **Sun Oct 25, end of day** | One clear day of buffer before we post |
| **Batch 2** | Days 8 to 12 | Fri Oct 30 | |
| **Batch 3** | Days 15 to 19 | Fri Nov 6 | |
| **Batch 4** | Days 22 to 26 | Fri Nov 13 | Day 23 is two assets, B and E |
| **Batch 5** | Days 29 to 33 | Fri Nov 20 | |
| **Batch 6** | Days 36 to 40 | Fri Nov 27 | |
| **Batch 7** | Days 43 to 47 | Fri Dec 4 | |
| **Batch 8** | Days 50 to 54 | Fri Dec 11 | Day 52 depends on a second organisation existing, so it ships as a placeholder if it does not |
| **Batch 9** | Days 57 to 60, plus any reshoots | Fri Dec 18 | Day 60 is two assets, A and G |

**If Batch 0 and Batch 1 cannot both land, prioritise in this order:** Template H, then the A-new metric card, then the B-register card. Those three cover the first week on their own and the rest can follow midweek.

**A missed day is skipped, not reposted.** If an asset is late, the words go out on their own. The schedule does not slide and weekends are never used to catch up.

**Review loop.** I review within four hours of delivery and give you one consolidated set of notes, not a trickle. Two revision rounds per asset are budgeted. If an asset needs a third round, the design is not the problem and we should talk instead of iterating.

---

## 11. Definition of done

An asset is finished when all of these are true. Check them yourself before delivering, because I will check them before posting and a bounce costs us both a day.

- [ ] Exported in all four ratios, unless the day's row says otherwise
- [ ] All text inside the 10% safe margin
- [ ] Smallest type is at least 28px at 1080 wide
- [ ] Every numeral is Geist Mono
- [ ] Exactly one accent colour is doing work
- [ ] Exactly one call to action, as a full link, on its own final line
- [ ] Handles spelled correctly: `@Stackstream0X`, `@dev_jayteee`
- [ ] No Telegram link on the asset, and no STX in any token list
- [ ] Zero invented numbers. Unknown figures left as visible `[N]`, `[D]`, `[O]` fields
- [ ] No organisation name anywhere unless I sent written permission for it
- [ ] Rule 5.1 checked by reading the copy out loud
- [ ] No em dashes
- [ ] Motion assets are captioned and readable with the sound off
- [ ] Filename follows `SS_D07_slug_1x1.png`
- [ ] Editable source is in `_source`

---

## 12. How to reach me

Telegram `t.me/dev_jaytee` is fastest and I will answer within the hour during working hours. If you are blocked on anything, ask immediately rather than guessing. A wrong assumption caught in five minutes costs nothing; the same assumption caught at delivery costs a day we do not have.

**Three things to ask me about rather than decide alone:** any number that appears on an asset, any organisation name that appears on an asset, and any wording change to a settlement claim. Everything else, including the visual direction, is yours.

---

*Jethro Irmiya, Oct 21, 2026. Live figures quoted here were true at 10:59 UTC on Oct 21, 2026 at mainnet block 9,268,739, and are refreshed from https://stackstream.xyz/api/stats on the morning of each post.*
