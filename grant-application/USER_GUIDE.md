# StackStream User Guide

## 1. Introduction

StackStream is a Bitcoin-native payroll streaming protocol built on [Stacks](https://www.stacks.co/). It lets DAOs pay contributors continuously — tokens stream block-by-block instead of in lump sums. Recipients can claim accrued tokens at any time, and senders can pause, resume, cancel, or top up streams as needed.

**Who is it for?**

- **DAO admins** who want to pay contributors with transparent, on-chain payroll
- **Contributors** who want real-time access to earned tokens without waiting for payment cycles

## 2. Prerequisites

Before using StackStream, you need:

1. **A Stacks wallet** — [Leather](https://leather.io/) or [Xverse](https://www.xverse.app/)
2. **STX for transaction fees** — A small amount of STX to pay gas fees
3. **SIP-010 tokens** — The tokens you want to stream (e.g., msBTC on testnet)

### Getting Testnet Tokens

If you're testing on testnet:
- Get testnet STX from the [Stacks faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet)
- Mint testnet msBTC from the mock token faucet in the StackStream contracts

## 3. Getting Started

### Connecting Your Wallet

1. Visit the StackStream app
2. Click **Launch App** on the landing page (or navigate to `/dashboard` or `/earn`)
3. Click **Connect Wallet** in the top navigation
4. Select your wallet provider (Leather or Xverse)
5. Approve the connection in your wallet popup

Once connected, your address appears in the navigation bar and the app loads your streams and balances.

### Navigation

The app has two main sections:

- **Dashboard** — For DAO admins/senders who create and manage streams
- **Earn** — For contributors/recipients who claim tokens from streams

## 4. For DAO Admins (Dashboard)

### Overview

The dashboard home (`/dashboard`) shows:

- **Active Streams** — Number of currently streaming payments
- **Total Deposited** — Sum of all tokens deposited into streams
- **Total Claimed** — Sum of all tokens claimed by recipients
- **Recipients** — Number of unique addresses receiving streams
- **Recent Streams** — Your most recent stream cards with quick actions

### Creating a Stream

1. Navigate to **Dashboard > Create Stream** (or click **New Stream**)
2. Fill in the form:
   - **Recipient Address** — The Stacks address that will receive tokens
   - **Total Amount** — Amount of msBTC to stream (e.g., `0.5` for 0.5 msBTC)
   - **Duration** — How many days the stream should last
   - **Memo** (optional) — A note attached to the stream (e.g., "January salary")
3. Review the **Stream Preview** showing:
   - Rate per block (how many tokens accrue each ~10 min block)
   - Start block and end block
   - Token type
4. Click **Create Stream**
5. Approve the transaction in your wallet
6. Wait for confirmation — you'll see a link to the block explorer

The stream begins at the next Stacks block after the start block you set.

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

#### Resume a Stream

1. Find the paused stream
2. Click **Resume**
3. Approve the transaction

Streaming resumes from where it left off. The total paused duration is tracked so the end date shifts accordingly.

#### Cancel a Stream

1. Click **Cancel** on any active or paused stream
2. Approve the transaction

Cancellation is permanent. Unstreamed tokens are refunded to the sender. The recipient can still claim any already-accrued tokens.

#### Top Up a Stream

Top-up adds tokens to an existing stream, extending its duration at the same rate per block. This is done through the protocol's `top-up-stream` function.

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

Claimed tokens are transferred directly to your wallet.

### Claim History

Navigate to **Earn > History** to see your claim records:

- Stream ID and sender
- Total deposited in the stream
- Amount you've claimed
- Stream status
- Block range (start to end)

## 6. Key Concepts

### Block-Based Streaming

StackStream uses Stacks block heights (not wall-clock time) to calculate token accrual. Each Stacks block takes approximately **10 minutes**.

- **144 blocks ≈ 1 day**
- **4,320 blocks ≈ 1 month**

Tokens accrue linearly: `rate_per_block × elapsed_blocks = accrued_amount`

### Stream Statuses

| Status | Code | Meaning |
|--------|------|---------|
| Active | 0 | Tokens are streaming block-by-block |
| Paused | 1 | Temporarily halted; no new tokens accrue |
| Cancelled | 2 | Permanently stopped; unstreamed tokens refunded |
| Depleted | 3 | Fully streamed; all tokens delivered |

### Precision Math

The protocol uses 12-digit precision (PRECISION = 10^12) for rate calculations to minimize rounding errors. Token amounts use 8 decimal places (matching sBTC). Due to integer math, streams with non-evenly-divisible amounts may have a rounding difference of ~1 micro-token.

### Post-Conditions

StackStream uses Stacks post-conditions to protect users:

- When creating a stream, a post-condition ensures the sender sends no more than the deposit amount
- When cancelling, post-conditions ensure the correct refund and payout amounts
- These are enforced at the blockchain level — the transaction fails if conditions aren't met

## 7. Using the Assistant Widget (OpenClaw)

StackStream includes a built-in assistant widget powered by the OpenClaw data service. It provides a quick way to query on-chain data directly from the UI without navigating between pages.

### How to Use

1. Click the assistant button in the bottom-right corner of the app
2. Select a query type from the tabs: **Stream**, **Sender**, **Recipient**, **DAO**, or **Block**
3. Enter the relevant input and submit

### Query Types

| Tab | Input | What You Get |
|-----|-------|-------------|
| **Stream** | Stream ID (e.g., `1`) | Full stream details — sender, recipient, deposit, streamed, claimable, remaining, progress %, status |
| **Sender** | Stacks address | List of stream IDs created by that address |
| **Recipient** | Stacks address | List of stream IDs where that address receives tokens |
| **DAO** | Admin address | DAO name, status, total streams, total deposited |
| **Block** | *(no input needed)* | Current Stacks block height |

## 8. Error Reference

These are the error codes from the StackStream smart contracts with explanations:

### Authorization Errors (u100–u102)

| Code | Name | Meaning |
|------|------|---------|
| u100 | ERR-NOT-AUTHORIZED | You don't have permission for this action |
| u101 | ERR-NOT-SENDER | Only the stream sender can perform this action (pause, resume, cancel, top-up) |
| u102 | ERR-NOT-RECIPIENT | Only the stream recipient can perform this action (claim) |

### Stream State Errors (u200–u207)

| Code | Name | Meaning |
|------|------|---------|
| u200 | ERR-STREAM-NOT-FOUND | The stream ID doesn't exist |
| u201 | ERR-STREAM-DEPLETED | The stream has already been fully paid out |
| u202 | ERR-STREAM-CANCELLED | The stream has been cancelled and can't be modified |
| u203 | ERR-STREAM-PAUSED | The stream is paused; resume it before claiming |
| u204 | ERR-STREAM-NOT-PAUSED | Can't resume a stream that isn't paused |
| u207 | ERR-STREAM-ENDED | The stream's duration has ended |

### Validation Errors (u300–u305)

| Code | Name | Meaning |
|------|------|---------|
| u300 | ERR-INVALID-AMOUNT | Amount must be greater than zero |
| u301 | ERR-INVALID-DURATION | Duration must be at least 1 block |
| u302 | ERR-INVALID-START-TIME | Start block must be current block or later |
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
A: If the stream is paused, progress halts. Also, Stacks blocks take ~10 minutes, so visible progress updates are gradual. The app polls for block updates every 30 seconds.

**Q: How do I get testnet tokens?**
A: Get testnet STX from the [Stacks faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet). For msBTC test tokens, use the mock token faucet function in the deployed contracts.

**Q: Can I stream any SIP-010 token?**
A: The protocol supports any SIP-010 compliant token. On testnet, msBTC (mock sBTC) is the default token available.

**Q: What's the minimum stream duration?**
A: 1 block (~10 minutes). Practically, streams are most useful over longer periods — days, weeks, or months.

**Q: Is there a maximum deposit amount?**
A: There's no protocol-enforced maximum, but the amount must fit in a Clarity uint (up to 2^128 - 1).
