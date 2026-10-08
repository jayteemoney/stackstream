# StackStream User Guide

## 1. Introduction

StackStream is payment streaming on [Stacks](https://www.stacks.co/), live on mainnet at [stackstream.xyz](https://stackstream.xyz). Instead of paying someone in one lump sum, an organisation opens a stream: the recipient's balance grows every few seconds and they claim it whenever they want. The sender can pause, resume, top up or cancel at any time, and anything not yet earned goes back to the sender.

**Who is it for?**

- **Organisations** (DAOs, teams, grant programmes) that pay people and want it on-chain and transparent
- **Recipients** (contributors, builders, creators) who want their pay as they earn it, not at the end

## 2. Prerequisites

1. **A Stacks wallet**: [Leather](https://leather.io/) or [Xverse](https://www.xverse.app/)
2. **A little STX for network fees**, for both sides. Each transaction costs a fraction of one STX (0.003 to 0.018 STX on mainnet so far). **Recipients need STX too**: claiming is a transaction, so a recipient with no STX cannot claim.
3. **The token you want to stream**, in the sender's wallet

**Tokens:** any SIP-010 token on Stacks works, including an organisation's own token. sBTC, USDA, ALEX and xBTC are pinned at the top of the token picker. Native STX cannot be streamed, because it is the network's coin rather than a SIP-010 token.

### Running on testnet

The app runs on mainnet by default. A testnet build needs both settings in `frontend/.env.local`, as a pair (see `frontend/.env.example`):

```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_DEPLOYER=ST…your-testnet-deployer
```

A mismatched pair stops the app at startup with a message naming the setting to fix. On testnet, get STX from the [Stacks faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet) and mint msBTC with the **Faucet** button in the app header.

## 3. Getting Started

### Connecting Your Wallet

1. Visit the StackStream app
2. Click **Launch App** on the landing page (or navigate to `/dashboard` or `/earn`)
3. Click **Connect Wallet** in the top navigation
4. Select your wallet provider (Leather or Xverse)
5. Approve the connection in your wallet popup

Once connected, your address appears in the navigation bar and the app loads your streams and balances.

### Navigation

The app has three main areas:

- **Dashboard**: for organisations and senders who create and manage streams
- **Earn**: for recipients who claim what they have earned
- **Organisations** (`/organisations`, also in the top menu of the home page): the public list of every registered organisation

## 4. For Organisations and Senders (Dashboard)

### Overview

The dashboard home (`/dashboard`) shows:

- **Active Streams** — Number of currently streaming payments
- **Total Deposited** — Sum of all tokens deposited into streams
- **Total Claimed** — Sum of all tokens claimed by recipients
- **Recipients** — Number of unique addresses receiving streams
- **Recent Streams** — Your most recent stream cards with quick actions

### Registering Your Organisation

Registering is optional for streaming, but it is what puts your organisation on the public directory at `/organisations` and lets your streams count on its record.

1. Go to **Dashboard > Register Workspace** (the app calls an organisation a "workspace")
2. Enter your organisation's name. Names are unique and up to 64 characters
3. Click **Register Workspace** and approve the transaction

Register from the wallet your organisation pays from: that wallet becomes the organisation's admin, and a wallet can only register once. Within about a minute the organisation appears on `/organisations` with a link to its registration receipt.

### Creating a Stream

1. Navigate to **Dashboard > Create Stream** (or click **New Stream**)
2. Fill in the form:
   - **Recipient Address** — The Stacks address that will receive tokens
   - **Token**: pick one of the verified tokens, search any SIP-010 token by name, or choose **Enter a contract id instead** and paste its contract id. See "Choosing a token" below
   - **Total Amount**: in the token's normal units (e.g. `0.5` for 0.5 sBTC, `25` for 25 USDA). You cannot enter more decimal places than the token has (8 for sBTC, 6 for USDA); the form tells you if you do
   - **Duration** — How long the stream should last (minutes, hours, days, or months)
   - **Memo** (optional) — A note attached to the stream (e.g., "January salary")
3. Review the **Stream Preview** showing:
   - Rate per block (how many tokens accrue each Stacks block, roughly every 5 seconds)
   - Start block and end block
   - Token type
4. Click **Create Stream**
5. Approve the transaction in your wallet
6. Wait for confirmation — you'll see a link to the block explorer

The stream starts about 120 blocks (roughly 10 minutes) after you submit, which leaves time for the wallet and the network to confirm it.

When it confirms, the green success box gives you the stream number. If your wallet has a registered organisation, it also offers **Link to <your organisation>**: see "Linking streams to your organisation" below.

### Choosing a Token

Every token's asset name and decimals are read from the chain before you can sign, so the amount and the transfer are always correct.

- **Verified**: sBTC, USDA, ALEX and xBTC, pinned at the top. Select and go.
- **Community**: any other token found by search or contract id. You confirm it by checking its full contract id, then click **I've checked it — continue**.
- **Impersonates a verified token** (red): a different contract using the name of a verified token, such as a second "sBTC". Check the contract id carefully; usually it is not the token you want.

**Streaming your own token from a link.** Put this link in your docs or team chat with your token's contract id, and the form opens with that token selected:

```
https://stackstream.xyz/dashboard/create?token=SP….your-token
```

### Setup Links: Prepare a Stream for Someone Else to Sign

A setup link opens the create form already filled in, so you can prepare a stream with an organisation and they only check it and sign.

1. Fill in the form (token, recipient, amount, duration, memo) but do not submit
2. Click **Copy setup link for someone else to sign** under the button
3. Send the link to the person who will pay. When they open it and connect their wallet, every field is filled in, with a banner asking them to check it before signing

The link only fills the form. Nothing moves until the payer signs in their own wallet. A link can carry `token`, `recipient`, `amount`, `duration`, `unit` (minutes, hours, days or months) and `memo`. For example, a 28-day, 500 USDA milestone:

```
https://stackstream.xyz/dashboard/create?token=SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token&recipient=SP…builder&amount=500&duration=28&unit=days&memo=Milestone%201%20of%203
```

Any value that is not valid (a malformed address, an address from the other network, a negative amount) is left out, so the field stays empty rather than holding a wrong value.

### Linking Streams to Your Organisation

A stream counts on your organisation's public record (its stream total on `/organisations`) only once it is linked. Linking is one extra transaction from the same wallet, and moves no tokens.

- **Right after creating a stream:** click **Link to <your organisation>** in the green success box
- **For older streams:** go to **Dashboard > Manage Streams**. Every stream that is not linked yet shows "Not yet counted on <name>'s public record" with a **Link to <name>** button

Only the organisation that sent a stream can link it, and only once.

### Managing Streams

Navigate to **Dashboard > Streams** to see all your streams with filter tabs:

- **All** — Every stream you've created
- **Active** — Currently streaming
- **Paused** — Temporarily halted
- **Cancelled** — Permanently stopped
- **Depleted** — Fully streamed

Each stream card shows the recipient, deposited amount, progress bar, and status badge.

#### Pause a Stream

1. Find the active stream you want to pause
2. Click the **Pause** button on the stream card
3. Approve the transaction in your wallet

While paused, no new tokens accrue. Already-accrued tokens remain claimable by the recipient.

> **Note:** A stream can only be paused after it has started (i.e., the current block must be at or past the stream's start block). Pausing before the start block is rejected to prevent accounting errors in the total paused duration.

#### Resume a Stream

1. Find the paused stream
2. Click **Resume**
3. Approve the transaction

Streaming resumes from where it left off. The total paused duration is tracked so the end date shifts accordingly.

#### Cancel a Stream

1. Click **Cancel** on any active or paused stream
2. Approve the transaction

Cancellation is permanent. Unstreamed tokens are refunded to the sender. The recipient can still claim any already-accrued tokens.

> **Trust note:** The sender can cancel at any time while the stream is active or paused. This means streams are a revocable commitment — recipients should be aware that unstreamed tokens can be reclaimed by the sender. Accrued and claimable tokens are always safe regardless of cancellation.

#### Top Up a Stream

1. Click **Top Up** on the stream card
2. Enter the amount and approve the transaction

Top-up adds tokens to the stream and extends its duration at the same rate per block.

> **Note:** Top-up is only possible while the stream's end block is still in the future. A stream that has already expired (whether active or paused) cannot be topped up — create a new stream instead.

#### Settle an Expired Paused Stream

If a stream was paused and its end block passed while it was still paused, the stream is in a stuck state: it can't be resumed (end block has passed) and can't be topped up (also blocked after end block). In this case, anyone — including a third party — can call `expire-stream` to settle it:

- The recipient receives all tokens that accrued up to the end block
- The sender is refunded the remaining unstreamed tokens
- The stream is marked Cancelled

This is a permissionless action: no sender or recipient authorization is required. It exists to ensure funds are never permanently locked.

### Protocol Administration (Contract Owner Only)

These functions are available only to the current contract owner (the address that deployed or was transferred ownership of the `stream-manager` contract).

#### Emergency Pause

The contract owner can pause all stream activity protocol-wide via `set-emergency-pause`. This is a last-resort measure for critical bugs. Individual streams are unaffected in terms of their state — once the emergency pause is lifted, streams resume normally.

#### Transfer Ownership (Two-Step)

The contract owner can rotate control to a new address using a safe two-step process:

```
Step 1 (current owner): propose-ownership(new-owner: principal)
Step 2 (new owner):     accept-ownership()
```

The ownership transfer only completes when the nominated address calls `accept-ownership`. This prevents permanent loss of admin control from a typo or wrong address. Use `get-contract-owner` to read the current owner and `get-pending-owner` to see a pending nomination.

### Analytics

Navigate to **Dashboard > Analytics** to see:

- **Total Value Locked** — Tokens currently locked in active streams
- **Burn Rate** — How many tokens stream out per day
- **Active Streams** — Count of currently streaming payments
- **Utilization** — Percentage of deposited tokens that have been streamed
- **Stream Breakdown** — Table showing each stream's recipient, deposited amount, claimed amount, and progress bar

## 5. For Contributors (Earn)

### Overview

The earn home (`/earn`) shows:

- **Total Claimable Balance** — Real-time updating display of tokens you can claim right now
- **Claim All** button — Claim all available tokens across all streams in one action
- **Total Earned** — Lifetime earnings across all streams
- **Total Claimed** — Tokens you've already withdrawn
- **Active Streams** — Number of streams currently paying you

### Viewing Your Streams

Navigate to **Earn > Streams** to see all streams where you're the recipient. Each card shows:

- Sender address
- Token type and deposited amount
- Claimable amount (updating in real-time)
- Progress bar
- Status badge

### Claiming Tokens

You can claim accrued tokens at any time:

**Claim from a specific stream:**
1. Go to **Earn > Streams**
2. Click **Claim** on the stream card
3. Approve the transaction in your wallet

**Claim all available:**
1. From the **Earn** home page, click **Claim All**
2. This claims all available tokens from all your active streams

Claimed tokens are transferred directly to your wallet. Each claim is a transaction, so keep a little STX in your wallet for the fee.

### Claim History

Navigate to **Earn > History** to see your claim records:

- Stream ID and sender
- Total deposited in the stream
- Amount you've claimed
- Stream status
- Block range (start to end)

## 5a. The Organisations Directory

`stackstream.xyz/organisations` lists every organisation registered on StackStream, newest first, read live from the contract and refreshed every minute. Each card shows the organisation's name, its admin address, when it joined, how many streams it has linked, whether it is active, and a link to its registration receipt on the explorer.

The same data is available to other sites at `GET /api/organisations`, documented in `docs/INTEGRATION_GUIDE.md`.

## 6. Key Concepts

### Block-Based Streaming

StackStream uses Stacks block heights (not wall-clock time) to calculate token accrual. Since the Nakamoto upgrade, each Stacks block is produced roughly every **5 seconds**.

- **17,280 blocks ≈ 1 day**
- **518,400 blocks ≈ 1 month**

Tokens accrue linearly: `rate_per_block × elapsed_blocks = accrued_amount`

### Stream Statuses

| Status | Code | Meaning |
|--------|------|---------|
| Active | 0 | Tokens are streaming block-by-block |
| Paused | 1 | Temporarily halted; no new tokens accrue |
| Cancelled | 2 | Permanently stopped; unstreamed tokens refunded |
| Depleted | 3 | Fully streamed; all tokens delivered |

### Precision Math

The protocol uses 12-digit precision (PRECISION = 10^12) for rate calculations to minimize rounding errors. Token amounts are passed as raw integer units — the number of decimal places depends on the token (sBTC and ALEX use 8, USDA uses 6). The frontend converts your display amount to raw units automatically. Due to integer math, streams with non-evenly-divisible amounts may have a rounding difference of ~1 smallest unit.

### Post-Conditions

StackStream uses Stacks post-conditions to protect users:

- When creating a stream, a post-condition ensures the sender sends no more than the deposit amount
- When cancelling, post-conditions ensure the correct refund and payout amounts
- These are enforced at the blockchain level — the transaction fails if conditions aren't met

## 7. Using the AI Assistant (OpenClaw)

StackStream includes an AI assistant powered by [OpenClaw](https://github.com/openclaw) that can help you query streams, check balances, and prepare transactions through natural language.

### Setup

1. Install OpenClaw following its documentation
2. Copy the skill folder into your OpenClaw skills directory:
   ```bash
   cp -r openclaw-service/skill ~/.openclaw/skills/stackstream
   ```
3. Set the environment variable in your OpenClaw config:
   ```
   STACKSTREAM_API_URL=http://localhost:3001
   ```
4. Start the StackStream API service:
   ```bash
   cd openclaw-service
   npm install
   npm run dev
   ```

### Example Conversations

**Checking a stream:**
> "Show me stream #5"
> → Returns full stream details including status, progress, claimable amount

**Finding your streams:**
> "What streams am I receiving at ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM?"
> → Lists all stream IDs where that address is a recipient

**Checking balances:**
> "What's my msBTC balance?"
> → Returns your token balance

**Building a transaction:**
> "Create a stream of 1 msBTC to ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG over 30 days"
> → Builds the transaction parameters (you still sign with your wallet)

**Understanding concepts:**
> "What does Paused status mean?"
> → Explains the status and what actions are available

## 8. Error Reference

These are the error codes from the StackStream smart contracts with explanations:

### Authorization Errors (u100–u102)

| Code | Name | Meaning |
|------|------|---------|
| u100 | ERR-NOT-AUTHORIZED | You don't have permission for this action |
| u101 | ERR-NOT-SENDER | Only the stream sender can perform this action (pause, resume, cancel, top-up) |
| u102 | ERR-NOT-RECIPIENT | Only the stream recipient can perform this action (claim) |

### Stream State Errors (u200–u208)

| Code | Name | Meaning |
|------|------|---------|
| u200 | ERR-STREAM-NOT-FOUND | The stream ID doesn't exist |
| u201 | ERR-STREAM-DEPLETED | The stream has already been fully paid out |
| u202 | ERR-STREAM-CANCELLED | The stream has been cancelled and can't be modified |
| u203 | ERR-STREAM-PAUSED | The stream is paused; resume it before claiming |
| u204 | ERR-STREAM-NOT-PAUSED | Can't resume or expire a stream that isn't paused |
| u207 | ERR-STREAM-ENDED | The stream's duration has ended (e.g., top-up rejected on expired stream) |
| u208 | ERR-STREAM-NOT-EXPIRED | Can't expire a stream whose end block hasn't passed yet |

### Validation Errors (u300–u305)

| Code | Name | Meaning |
|------|------|---------|
| u300 | ERR-INVALID-AMOUNT | Amount must be greater than zero |
| u301 | ERR-INVALID-DURATION | Duration must be at least 1 block |
| u302 | ERR-INVALID-START-TIME | Start block must be current block or later; also returned if you try to pause a stream before its start block |
| u303 | ERR-INVALID-RECIPIENT | Recipient can't be the same as sender |
| u304 | ERR-ZERO-CLAIM | Nothing to claim — no tokens have accrued yet |
| u305 | ERR-MAX-STREAMS-REACHED | A user can have at most 100 streams (as sender or recipient) |

### Token Errors (u400)

| Code | Name | Meaning |
|------|------|---------|
| u401 | ERR-TOKEN-MISMATCH | The token contract passed doesn't match the stream's token |

### DAO Factory Errors (u500–u506)

| Code | Name | Meaning |
|------|------|---------|
| u501 | ERR-DAO-NOT-FOUND | No DAO registered for this admin address |
| u502 | ERR-DAO-ALREADY-EXISTS | This address has already registered a DAO |
| u503 | ERR-NOT-DAO-ADMIN | Only the DAO admin can perform this action |
| u504 | ERR-INVALID-NAME | DAO name is empty or too long |
| u505 | ERR-STREAM-NOT-FOUND | Stream not found in factory tracking |
| u506 | ERR-ALREADY-TRACKED | This stream is already tracked by the factory |

## 9. FAQ / Troubleshooting

**Q: My transaction failed with "post-condition not met"**
A: This means the actual token transfer didn't match the expected amount. This can happen if the stream state changed between when you built the transaction and when it was mined. Try again with fresh data.

**Q: Why is my claimable amount showing zero?**
A: Check that the stream has started (current block > start block), is not paused, and is not cancelled. If the stream just started, wait for the next block for tokens to accrue.

**Q: Can I claim from a cancelled stream?**
A: Yes. Any tokens that accrued before cancellation remain claimable by the recipient.

**Q: What happens to unclaimed tokens when a stream is cancelled?**
A: Unstreamed tokens are refunded to the sender. Already-streamed but unclaimed tokens remain available for the recipient to claim.

**Q: Can I modify a stream's rate or recipient?**
A: No. Streams are immutable once created. To change terms, cancel the existing stream and create a new one.

**Q: Why does the progress bar seem stuck?**
A: If the stream is paused, progress halts. The app also polls for on-chain block updates every 30 seconds, so the bar advances in steps between polls while the live counter interpolates smoothly in between.

**Q: How do I get testnet tokens?**
A: Get testnet STX from the [Stacks faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet). For msBTC test tokens, use the mock token faucet function in the deployed contracts.

**Q: Can I stream any SIP-010 token?**
A: Yes, including your own. Search for it in the token picker, paste its contract id, or open `stackstream.xyz/dashboard/create?token=<contract-id>`. Its details are checked on-chain first. A contract that defines more than one token (sBTC and ALEX each also define a "-locked" token) is only accepted when it is one of the verified ones, because the app cannot otherwise tell which token is meant.

**Q: The recipient can't claim. What's wrong?**
A: The most common cause is that the recipient's wallet has no STX for the network fee. Send them a small amount of STX (0.05 STX covers many claims). Also check the stream has started and is not paused.

**Q: Why doesn't my stream show on my organisation's card?**
A: It has not been linked yet. Link it from the success box after creating it, or from **Dashboard > Manage Streams**. The directory refreshes within about a minute.

**Q: What's the minimum stream duration?**
A: 1 block (roughly 5 seconds since Nakamoto). Practically, streams are most useful over longer periods such as days, weeks, or months.

**Q: Is there a maximum deposit amount?**
A: There's no protocol-enforced maximum, but the amount must fit in a Clarity uint (up to 2^128 - 1).

## 10. Testing Everything End to End (USDA on mainnet)

A checklist for the recent features, run with real USDA in small amounts. It takes about 30 minutes and roughly 0.1 STX in fees.

**Before you start**

- **Two wallets.** Wallet A pays and Wallet B receives (a stream cannot pay its own sender). Wallet A needs about 2 USDA and 0.2 STX. Wallet B needs about 0.05 STX to claim.
- **Every stream you open here is real and counts on the public stream total.** Label it as your own anywhere you mention it.
- **Do not register a test organisation on mainnet.** Registration is permanent and adds to the public organisation count, even if deactivated later. Test linking (step 9) only with a wallet that is already a real registered organisation, or on testnet.

| # | What to do | What you should see |
|---|---|---|
| 1 | Wallet A: open **Create Stream** and pick **USDA** from the verified tokens | USDA selected, with a "Verified" badge and your USDA balance |
| 2 | Type `1.1234567` as the amount and submit | The form refuses: "USDA has 6 decimal places. Remove the extra digits." |
| 3 | In the token search, type `sBTC` | Several results. Any contract other than the real sBTC carries the red "Impersonates a verified token" badge |
| 4 | Fill in recipient Wallet B, amount `1`, duration `1` hour, memo `Test stream`. Click **Copy setup link for someone else to sign**, and open the link in a new tab | The new tab's form is filled in with the same values, under the banner asking you to check it |
| 5 | In that tab, click **Create Stream** and sign | A green success box with the stream number, after about one block |
| 6 | Wallet B: open **Earn** after about 10 minutes, when the stream starts | The claimable balance grows every few seconds, shown in USDA at its real value (about 0.0167 USDA per minute, not 100 times smaller) |
| 7 | Wallet B: **Partial** claim of `0.01`, then **Claim All** | Each claim confirms and the USDA arrives in Wallet B. **Earn > History** shows the claims |
| 8 | Wallet A: **Pause**, wait a minute, **Resume**, then **Top Up** `0.5` USDA | While paused, Wallet B's balance stops growing. After the top-up, the stream runs longer at the same rate |
| 9 | Only if Wallet A is already a registered organisation: click **Link to <name>** on the stream in **Manage Streams** | The button disappears. Within about a minute the organisation's stream count on `/organisations` goes up by one |
| 10 | Wallet A: **Cancel** the stream | Wallet B keeps what it earned. The unearned USDA comes back to Wallet A in the same transaction |
| 11 | Open `/dashboard/create?token=SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token` | The form opens with USDA already selected |
| 12 | Open `/dashboard/create?recipient=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM` (a testnet address) | The recipient field stays empty: a recipient from the wrong network is ignored |
| 13 | Open the assistant (chat bubble) and look up the stream number | Deposited and claimable amounts show in USDA at their real value |
| 14 | Open `/organisations` | The page loads with the live count and every organisation's card |

If any step does not match, note the step number, the stream number and a screenshot, and report it before onboarding a team.

