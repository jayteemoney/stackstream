# StackStream Integration Guide

StackStream streams any SIP-010 token from a payer to a recipient on Stacks mainnet. The recipient's balance grows every block, they claim whenever they want, and the payer can pause, resume, top up, or cancel at any time. Unearned funds always return to the payer.

This guide is for teams that want to use StackStream from their own product. There are three ways in, and most teams should start with the first.

| Level | What you get | Code needed |
|---|---|---|
| **1. Use the app** | Register your organisation and open streams at [stackstream.xyz](https://stackstream.xyz) | None |
| **2. Call the contracts** | Your platform opens and manages streams itself, for example when a grant is approved | A few contract calls with Stacks.js |
| **3. Read the data** | Show stream status and balances inside your own product | HTTP GET requests |

**Custody:** StackStream never holds keys. Every stream is opened and changed by a transaction the payer signs. Funds sit in the `stream-manager` contract, and only the contract's rules can move them.

---

## Contracts (mainnet)

| Contract | Identifier |
|---|---|
| Stream manager | `SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.stream-manager` |
| Organisation registry | `SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.stream-factory` |

Source, tests and the audit report: [github.com/jayteemoney/stackstream](https://github.com/jayteemoney/stackstream).

### Tokens

Any SIP-010 token works. These are the ones the app lists today:

| Token | Contract | Asset name | Decimals |
|---|---|---|---|
| sBTC | `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token` | `sbtc-token` | 8 |
| USDA | `SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token` | `usda` | 6 |
| ALEX | `SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex` | `alex` | 8 |
| xBTC | `SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin` | `wrapped-bitcoin` | 8 |

Native STX is not a SIP-010 token, so it cannot be streamed directly.

### Time

Streams are measured in Stacks blocks. Since the Nakamoto upgrade a block arrives roughly every 5 seconds.

| Period | Blocks |
|---|---|
| 1 hour | 720 |
| 1 day | 17,280 |
| 30 days | 518,400 |

Block times vary, so treat these as estimates.

---

## Level 1: use the app

1. Go to [stackstream.xyz](https://stackstream.xyz) and connect the wallet your organisation pays from.
2. Open **Register** and give your organisation a name. This is one transaction, done once.
3. Open **Create stream**. Enter the recipient's address, the token, the amount and the duration, then sign.
4. Manage streams from the dashboard: pause, resume, top up, or cancel.

Recipients see their streams on the **Earn** page and claim from there.

---

## Level 2: call the contracts

Examples use `@stacks/connect` v8 and `@stacks/transactions` v7, the same versions the StackStream app uses.

```bash
npm install @stacks/connect @stacks/transactions
```

```ts
import { request } from "@stacks/connect";
import { Cl, Pc } from "@stacks/transactions";

const MANAGER = "SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.stream-manager";
const FACTORY = "SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79.stream-factory";
```

### Who the sender is

The contracts use `contract-caller` as the payer. This matters:

- **Called from a wallet** (the normal case): the wallet is the payer. The tokens leave that wallet, and only that wallet can pause, top up, or cancel.
- **Called from your own Clarity contract:** your contract is the payer. It must hold the tokens, and every later management call must also come from that contract.

Keep one payer per organisation. The same principal must register the organisation, open the streams, and track them.

### 1. Register your organisation, once

```ts
await request("stx_callContract", {
  contract: FACTORY,
  functionName: "register-dao",
  functionArgs: [Cl.stringUtf8("Your Organisation")],
  network: "mainnet",
});
```

Names are unique and up to 64 characters.

### 2. Open a stream

```ts
// Read the current block right before signing, then add a buffer.
// The contract rejects a start block that is already in the past when the
// transaction is mined, and wallet review plus mempool time can take minutes.
const res = await fetch("https://www.stackstream.xyz/api/blocks/current");
const { blockHeight } = await res.json();
const startBlock = blockHeight + 120;

const deposit = 500_000_000n;    // 500 USDA (6 decimals)
const durationBlocks = 518_400;  // about 30 days

await request("stx_callContract", {
  contract: MANAGER,
  functionName: "create-stream",
  functionArgs: [
    Cl.principal(recipientAddress),
    Cl.principal("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token"),
    Cl.uint(deposit),
    Cl.uint(startBlock),
    Cl.uint(durationBlocks),
    Cl.some(Cl.stringUtf8("Grant #12, milestone 1")), // or Cl.none()
  ],
  // Deny mode: the wallet refuses any token movement not listed here.
  postConditionMode: "deny",
  postConditions: [
    Pc.principal(payerAddress)
      .willSendLte(deposit)
      .ft("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token", "usda"),
  ],
  network: "mainnet",
});
```

The call returns the new stream ID, `(ok u12)` for example. Read it from the transaction result once it confirms.

**Rules the contract enforces:**

- Deposit and duration must both be greater than zero.
- `deposit × 10^12` must be at least the duration in blocks, so the per-block rate is never zero.
- The start block must not be in the past when the transaction is mined.
- The recipient cannot be the payer.
- A payer can hold at most 100 streams, and so can a recipient.

### 3. Link the stream to your organisation

```ts
await request("stx_callContract", {
  contract: FACTORY,
  functionName: "track-stream",
  functionArgs: [Cl.uint(streamId)],
  network: "mainnet",
});
```

Only the stream's sender can track it, and only once. This is what makes the stream count toward your organisation's totals.

### 4. Manage a stream

All of these must be signed by the stream's sender.

| Function | Arguments | What it does |
|---|---|---|
| `pause-stream` | `stream-id` | Stops accrual |
| `resume-stream` | `stream-id` | Restarts accrual. Paused time does not count |
| `top-up-stream` | `stream-id`, `token`, `amount` | Adds funds and extends the end at the same rate |
| `cancel-stream` | `stream-id`, `token` | Ends the stream. Earned funds go to the recipient and the rest returns to the sender, in one transaction |

For `top-up-stream`, add a post-condition that the sender sends at most `amount`. For `cancel-stream`, add one that the manager contract sends at most the stream's unclaimed balance. `remaining` from the stream endpoint below gives that figure.

### 5. Claiming, for recipients

| Function | Arguments |
|---|---|
| `claim` | `stream-id`, `token`, `amount` |
| `claim-all` | `stream-id`, `token` |

Recipients usually claim from the app's Earn page, so most integrations never need these.

### Error codes

| Code | Meaning |
|---|---|
| `u100` | Not authorised, or new streams are temporarily paused |
| `u101` | Caller is not the stream's sender |
| `u102` | Caller is not the stream's recipient |
| `u200` | Stream not found |
| `u201` | Stream is fully paid out |
| `u202` | Stream is cancelled |
| `u203` | Stream is paused |
| `u204` | Stream is not paused |
| `u207` | Stream has ended |
| `u300` | Invalid amount |
| `u301` | Invalid duration, or the deposit is too small for it |
| `u302` | Start block is in the past |
| `u303` | Invalid recipient |
| `u304` | Nothing to claim |
| `u305` | 100-stream limit reached |
| `u401` | Token does not match the stream |
| `u501` | Organisation not found |
| `u502` | Organisation already registered |
| `u503` | Caller is not the stream's sender |
| `u504` | Invalid or duplicate organisation name |
| `u505` | Stream not found |
| `u506` | Stream already tracked |
| `u507` | Organisation is deactivated |

---

## Level 3: read the data

Public, read-only, no keys. Any website can call these from the browser.

**Base URL:** `https://www.stackstream.xyz`. Use the `www` address: the bare domain redirects to it, and browsers will not follow that redirect for cross-site requests.

| Endpoint | Returns |
|---|---|
| `GET /api/streams/{id}` | One stream, with live balances |
| `GET /api/streams/sender/{address}` | IDs of streams an address pays |
| `GET /api/streams/recipient/{address}` | IDs of streams an address receives |
| `GET /api/daos/{admin}` | An organisation by its admin address |
| `GET /api/stats` | Total streams and organisations |
| `GET /api/blocks/current` | Current Stacks block height |

```ts
const base = "https://www.stackstream.xyz";

const { streamIds } = await fetch(
  `${base}/api/streams/recipient/${address}`
).then((r) => r.json());

const streams = await Promise.all(
  streamIds.map((id: number) =>
    fetch(`${base}/api/streams/${id}`).then((r) => r.json())
  )
);
```

A stream looks like this. Amounts are strings in the token's smallest unit.

```json
{
  "streamId": 11,
  "sender": "SPV9VBEA4NB0Q2N67HD6AXP2MGSEKVAJFE3T8S5R",
  "recipient": "SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79",
  "token": "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token",
  "depositAmount": "1200000",
  "withdrawnAmount": "242777",
  "startBlock": 8540837,
  "endBlock": 8542997,
  "status": 0,
  "statusLabel": "Active",
  "claimable": "957222",
  "streamed": "1199999",
  "remaining": "957223",
  "refundable": "1",
  "currentBlock": 9053473,
  "progress": 100
}
```

| Field | Meaning |
|---|---|
| `status` | `0` active, `1` paused, `2` cancelled, `3` fully paid |
| `claimable` | What the recipient can claim right now |
| `streamed` | Total earned so far |
| `remaining` | Still held by the contract for this stream |
| `refundable` | What would return to the sender on cancel now |
| `progress` | Percent of the stream's duration elapsed |

Convert amounts yourself using the token's decimals from the table above. Do not rely on the `…Formatted` fields.

Errors return JSON with an `error` field: `400` for a malformed ID or address, `404` when not found, and `502` when the upstream blockchain API is unavailable.

---

## Support

Want help integrating? Message [t.me/dev_jaytee](https://t.me/dev_jaytee). We will pair with your team on the first stream.
