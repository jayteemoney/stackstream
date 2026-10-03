# StackStream Security Review — Round 2
**Version:** v1.0.0-rc2  
**Date:** May 18, 2026  
**Branch:** `security/deep-audit-2`  
**Scope:** Full-stack audit — Clarity contracts, OpenClaw backend service, Next.js frontend  
**Reviewer:** Claude Code (claude-sonnet-4-6)

---

## Background

A prior contract-level review (April 2026, `SECURITY_REVIEW.md`) audited `stream-manager.clar` and `stream-factory.clar` with four community reviewers. It found no critical/high/medium issues and fixed two low-severity findings (L-4, L-7). The OpenClaw Express backend service and the Next.js frontend were **not** included in that review.

This audit covers everything: both contracts (looking for issues not caught previously), the OpenClaw service, and the frontend.

---

## Scope

```
contracts/stream-manager.clar       (736 lines)
contracts/stream-factory.clar       (218 lines)
openclaw-service/src/               (Express.js API proxy service)
  ├── index.ts
  ├── config.ts
  ├── stacks-client.ts
  ├── utils.ts
  ├── middleware/error-handler.ts
  ├── middleware/validate.ts
  └── routes/*.ts
frontend/src/                       (Next.js frontend)
  ├── components/openclaw/assistant-widget.tsx
  ├── components/wallet/*.tsx
  ├── lib/stacks.ts
  ├── lib/constants.ts
  ├── hooks/*.ts
  └── stores/*.ts
```

---

## Methodology

1. Read all source files end-to-end.
2. Reviewed prior findings in `SECURITY_REVIEW.md` to avoid duplicates.
3. Applied strict false-positive filtering: only HIGH/MEDIUM findings with ≥ 8/10 confidence and a concrete exploit path.
4. Verified each finding against Clarity execution semantics, Stacks post-condition model, and Node.js error propagation.

---

## Findings Summary

| ID  | Severity | Layer    | File                                      | Status |
|-----|----------|----------|-------------------------------------------|--------|
| M-1 | Medium   | Contract | `stream-manager.clar:548–604`             | Open   |
| M-2 | Medium   | Backend  | `openclaw-service/src/middleware/error-handler.ts:19` | Open |
| M-3 | Medium   | Frontend | `frontend/src/lib/stacks.ts:257–338`      | Open   |
| M-4 | Medium   | Frontend | `frontend/src/components/openclaw/assistant-widget.tsx:138–150` | Open |

**No critical or high-severity findings.** Four medium findings, zero fund-safety impact in isolation, all recommend defensive fixes before mainnet.

---

## Detailed Findings

---

### M-1 — `top-up-stream` Accepts Top-Up of an Already-Elapsed Stream

**File:** `contracts/stream-manager.clar` — lines 548–604  
**Severity:** Medium  
**Confidence:** 8/10  
**Category:** Logic flaw / token-locking

**Description:**

`top-up-stream` correctly rejects CANCELLED and DEPLETED streams, but has no guard against topping up an ACTIVE stream that has already elapsed (i.e., `stacks-block-height >= end-block`). The new `end-block` is calculated as `(+ end-block additional-blocks)` — extending from the **original** (already past) end-block. This is inconsistent with the guards already present in `pause-stream` (line 392) and `resume-stream` (line 437), both of which assert `(< current-block end-block)`.

The practical risk is fund-locking: a sender who tops up an already-elapsed stream adds real tokens to a stream the recipient may have fully earned and moved on from. Those tokens remain locked until either the sender cancels or the recipient claims. If the recipient never returns (abandoned stream), the sender cannot recover the top-up without calling `cancel-stream` — which in the worst case (all tokens streamed and fully withdrawn) would result in a successful cancel with a zero refund. The top-up funds belong to the recipient.

**Exploit Scenario:**

1. Sender creates stream S at block 1000, end-block 2000, deposit 10,000 tokens.
2. At block 2500, the stream has fully elapsed (all 10,000 earned by recipient). Recipient has claimed. Stream is ACTIVE (status not changed unless recipient claims to depletion).
3. Sender (via a UI bug, stale cached data, or error) calls `top-up-stream` with 5,000 tokens.
4. Contract accepts the transfer. `new-end-block = 2000 + additional-blocks`. `new-deposit = 15,000`.
5. Recipient, having already received everything, does not notice the extension.
6. 5,000 tokens are locked in the contract. The stream is now in a valid-but-orphaned extended state.
7. Sender calls `cancel-stream`: `streamed = min(elapsed * rate, new-deposit)`. With elapsed clamped to original-duration and original-deposit already withdrawn, `sender-refund` may be 0 if all original tokens were withdrawn, and the top-up amount flows to recipient on cancel.
8. Net outcome: sender loses 5,000 tokens they intended as an extension, not an immediate gift.

Note: this is a sender-side economic footgun, not an attack by the recipient. The recipient cannot force a top-up. However, a frontend bug or race condition could trigger it without the sender's conscious intent.

**Recommendation:**

Add an explicit end-block guard in `top-up-stream`, mirroring `pause-stream` and `resume-stream`:

```clarity
;; Cannot top up a stream that has already elapsed
(asserts! (< stacks-block-height end-block) ERR-STREAM-ENDED)
```

Place this assert after the `status` checks. This establishes a consistent invariant across all time-sensitive mutation functions.

---

### M-2 — Raw Internal Error Messages Exposed to API Clients

**File:** `openclaw-service/src/middleware/error-handler.ts` — line 19–22  
**Severity:** Medium  
**Confidence:** 8/10  
**Category:** Information disclosure

**Description:**

The error handler unconditionally forwards `err.message` verbatim to API clients for all 500 and 502 responses:

```typescript
// Line 12-16 (502 branch)
res.status(502).json({
  error: "Blockchain API unavailable",
  message: err.message,   // ← exposes raw upstream error
});

// Lines 19-22 (500 branch)
res.status(500).json({
  error: "Internal server error",
  message: err.message,   // ← exposes raw internal error
});
```

Node.js runtime errors, TypeScript/SDK exceptions, and JSON parse failures carry messages that often contain:
- Absolute file paths (`/app/dist/stacks-client.js:42`)
- Internal variable names and data shapes
- SDK version strings
- Upstream API error bodies (which may include request URLs, correlation IDs, or in edge cases API key values if a future header-authenticated call is added)

An attacker sending malformed requests to probe the service can systematically collect these messages to map the internal service structure, identify SDK versions (for targeted CVE exploitation), or discover configuration details.

**Exploit Scenario:**

1. Attacker sends a request to `/api/streams/999999999999` (stream ID beyond uint32 max after numeric coercion edge cases).
2. The Stacks SDK or JSON parser throws an unexpected exception that propagates to the error handler.
3. Response body: `{ "error": "Internal server error", "message": "Cannot convert undefined to BigInt at parseStreamData (/app/dist/stacks-client.js:82:18)" }`.
4. Attacker now knows the service uses BigInt parsing at a specific file and line, confirming the `parseStreamData` function exists, the compiled output path, and the exact failure mode.
5. With the 502 branch: if Hiro API returns an error with query parameters or correlation IDs in its message, those are forwarded verbatim to any client.

**Recommendation:**

Replace verbatim message forwarding with opaque error references. Log full details server-side only:

```typescript
import { randomUUID } from "crypto";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const ref = randomUUID();
  console.error(`[ERROR ${ref}] ${err.stack ?? err.message}`);

  if (err.message.includes("fetch")) {
    res.status(502).json({ error: "Blockchain API unavailable", ref });
    return;
  }

  res.status(500).json({ error: "Internal server error", ref });
}
```

The `ref` UUID allows operators to correlate client-reported errors with server logs without exposing internals.

---

### M-3 — Missing Post-Conditions on Claim and Cancel Transaction Builders

**File:** `frontend/src/lib/stacks.ts` — lines 257–275 (`buildClaimTx`), 278–294 (`buildClaimAllTx`), 322–338 (`buildCancelStreamTx`)  
**Severity:** Medium  
**Confidence:** 9/10  
**Category:** Missing wallet-level transfer constraint

**Description:**

Three transaction builder functions use `PostConditionMode.Allow` with **zero post-conditions**:

```typescript
// buildClaimTx — lines 257–275
return {
  postConditionMode: PostConditionMode.Allow,
  // No post-conditions ← wallet will approve any token transfer amount
};

// buildClaimAllTx — lines 278–294
return {
  postConditionMode: PostConditionMode.Allow,
  // No post-conditions
};

// buildCancelStreamTx — lines 322–338
return {
  postConditionMode: PostConditionMode.Allow,
  // No post-conditions
};
```

By contrast, `buildCreateStreamTx` (line 241) correctly includes:
```typescript
postConditions: [
  Pc.principal(params.senderAddress).willSendLte(params.depositAmount).ft(...),
],
```

In the Stacks post-condition model, `PostConditionMode.Allow` with no conditions means the wallet will sign the transaction regardless of how many tokens are transferred from the contract to any address. Post-conditions are the **user-side safety net** — they cause the wallet to display and enforce the exact expected token movement in the signing dialog. Without them, users cannot verify the claimed amount at signing time, and any supply-chain compromise or DOM manipulation that tampers with the serialized `functionArgs` (stream ID, amount, recipient principal) would produce a transaction the wallet cannot distinguish from a legitimate one.

The contract's own authorization logic remains the primary security boundary and is sound. However, the defense-in-depth layer that Stacks post-conditions provide is entirely absent for the three most sensitive user-facing operations (receiving funds and triggering refunds).

**Exploit Scenario:**

1. Attacker injects malicious JavaScript into the frontend (via compromised CDN, dependency confusion, or XSS in a future feature) that intercepts calls to `buildCancelStreamTx`.
2. The injected code changes `params.streamId` to a stream the attacker controls as recipient, where the "sender" is the victim.
3. The wallet signing prompt shows a generic "StackStream transaction" with no specific post-condition guardrail telling the user "you will refund X tokens to Y address."
4. The victim signs. The attacker's stream is cancelled, paying the attacker (as recipient) the accrued amount.
5. Because `PostConditionMode.Allow` with no conditions, the transaction succeeds unconditionally on the transfer side.

For `buildClaimTx`: without a `willSendGte(expectedAmount)` post-condition, a tampered `streamId` would cause the wallet to claim from a different stream, with no user-visible indication of the amount discrepancy.

**Recommendation:**

Add explicit post-conditions to all three builders. Since these are contract→user transfers, the contract principal is the sender:

```typescript
// buildClaimTx — after fetching claimable balance
const [contractAddr, contractName] = splitContract(STREAM_MANAGER_CONTRACT);
postConditions: [
  Pc.principal(`${contractAddr}.${contractName}`)
    .willSendLte(params.amount)
    .ft(`${tokenAddr}.${tokenName}`, "mock-sbtc"),
],
postConditionMode: PostConditionMode.Deny,

// buildCancelStreamTx — requires pre-fetching recipient-amount + sender-refund
// or use a permissive upper-bound with PostConditionMode.Deny
postConditionMode: PostConditionMode.Deny,
postConditions: [
  Pc.principal(`${contractAddr}.${contractName}`)
    .willSendLte(streamData.depositAmount - streamData.withdrawnAmount)
    .ft(...),
],
```

For `buildClaimAllTx`, fetch the claimable balance first and pass it as the expected amount. If the balance cannot be known at build time, prefer `PostConditionMode.Deny` over `Allow` so that any unexpected transfer causes the wallet to abort.

---

### M-4 — Raw User Input Interpolated Directly into API Fetch Paths

**File:** `frontend/src/components/openclaw/assistant-widget.tsx` — lines 138–150  
**Severity:** Medium  
**Confidence:** 8/10  
**Category:** Path manipulation / unintended route access

**Description:**

The `handleQuery` function in the OpenClaw AssistantWidget interpolates the raw, untrimmed user input `q` directly into URL path segments without `encodeURIComponent` encoding:

```typescript
case "stream":
  data = await fetchApi(`/api/streams/${q}`);
  break;
case "sender":
  data = await fetchApi(`/api/streams/sender/${q}`);
  break;
case "recipient":
  data = await fetchApi(`/api/streams/recipient/${q}`);
  break;
case "dao":
  data = await fetchApi(`/api/daos/${q}`);
  break;
```

A user who types a value containing `/` (a slash) causes the browser to construct a path that hits a **different route** than intended. The browser normalizes `..` path segments before sending, so `q = "../../health"` on the "stream" type resolves to `${API_BASE}/health` — the health check endpoint. More practically, `q = "0/status"` on stream type fetches `/api/streams/0/status` (the status-only endpoint) instead of `/api/streams/0`, returning a different JSON shape (`{ streamId, status, statusLabel }` vs the full stream object), causing `StreamResult` to render `undefined` fields.

While all OpenClaw endpoints serve public blockchain data (so no confidential data is leaked), the unencoded path construction means:
1. The widget can be made to silently query any API route, not just the intended one.
2. The result is rendered in the `StreamResult` / `DaoResult` components which assume a specific response shape; unexpected shapes cause silent rendering failures that mislead users about stream balances.
3. If the `OPENCLAW_API_URL` is ever changed to an internal service with non-public routes, this becomes a client-side SSRF via path (though host cannot be escaped).

**Exploit Scenario:**

1. User types `0/status` into the Stream ID field.
2. Widget fetches `${OPENCLAW_API_URL}/api/streams/0/status`.
3. Response: `{ streamId: 0, status: 0, statusLabel: "Active" }`.
4. `StreamResult` renders `data.depositAmount` as `undefined` → `formatTokenAmount(undefined)` → `0.00 msBTC`.
5. User sees a stream with 0 msBTC deposited and 0 msBTC claimable — an entirely misleading view of the stream's state.
6. More significantly for a DAO operator: `q = "nonce"` fetches `/api/streams/nonce` (`{ totalStreams: N }`) and is passed to `StreamResult` which renders corrupt data while appearing to succeed.

**Recommendation:**

Encode user input before path interpolation:

```typescript
data = await fetchApi(`/api/streams/${encodeURIComponent(q)}`);
data = await fetchApi(`/api/streams/sender/${encodeURIComponent(q)}`);
data = await fetchApi(`/api/streams/recipient/${encodeURIComponent(q)}`);
data = await fetchApi(`/api/daos/${encodeURIComponent(q)}`);
```

Additionally, add client-side pre-validation before the fetch is issued:
- **Stream type:** verify `q` is a non-negative integer string: `/^\d+$/.test(q)`.
- **Sender/Recipient/DAO types:** verify `q` matches the Stacks address pattern: `/^S[A-Z0-9]{38,40}$/.test(q)`.

These checks mirror the server-side Zod schemas in `validate.ts` and provide immediate user feedback before a network request is made.

---

## Items NOT Reported (and Why)

The following were investigated and explicitly excluded:

| Candidate | Excluded Reason |
|---|---|
| Wildcard CORS (`app.use(cors())`) | Service is stateless, no auth/cookies, all data is public blockchain state. No concrete exploit with current design. Would be an issue if auth is added in future. |
| `stxAddress` regex allows 39–41 chars | Stacks principals are 41 chars; shorter matches are invalid on-chain and rejected by Clarity. No exploit path. |
| Testnet deployer address in `.env.production` | Operational pre-deployment checklist item already noted in `SECURITY_REVIEW.md`. App simply won't function on mainnet without this update — no fund-loss risk since the contracts don't exist at the ST address on mainnet. |
| `PostConditionMode.Allow` on `buildCreateStreamTx` | This builder correctly includes a `willSendLte` post-condition constraining the sender's outbound transfer. The mode is acceptable here. |
| `err.message` in 502 branch leaking Hiro API URL | Covered under M-2. SSRF via path is excluded per standard — host is a constant. The URL exposure risk is captured in M-2's recommendation. |
| `top-up-stream` when stream is paused and past end-block | The `resume-stream` guard prevents resuming past end-block. Paused streams past end-block can be topped up and resumed (since new end-block > current-block after top-up), but this is an intended interaction. The M-1 guard would also address the paused-elapsed case. |
| Monotonically increasing stream IDs | All stream data is public on-chain. Enumeration is by design. |
| `calculate-effective-elapsed` integer underflow | `paused-at-block` is always ≤ current block (set at pause time, blocks only increase). No underflow possible. |
| `math` precision loss in frontend (`parseFloat * 1e8`) | Amounts up to ~90M msBTC safe within Number.MAX_SAFE_INTEGER. Exceeds sBTC total supply by >4×. |

---

## Contract Security Properties — Reconfirmed

The following properties from the prior review remain valid and were re-verified during this audit:

| Property | Status |
|---|---|
| Reentrancy | Not possible — Clarity execution model |
| `contract-caller` vs `tx-sender` authorization | Correct on all 8 public functions |
| Integer overflow on rate calculation | Safe — confirmed overflow analysis still holds |
| Token substitution prevention | Correct — `(is-eq token-principal (contract-of token))` on all token ops |
| Stream ID reuse | Impossible — monotonic nonce, updated only after full write |
| `stacks-block-height` usage | Correct — Clarity v3 epoch-aware |
| Streamed amount clamped to deposit | Correct — prevents over-withdrawal |
| Fund conservation on cancel | Verified: `recipient-amount + sender-refund = deposit - withdrawn` on all paths |
| Pause duration accounting | Correct — `total-paused-duration` subtracted consistently |

---

## Mainnet Readiness

Four medium findings require attention before mainnet launch. None are fund-safety blockers in isolation, but M-3 (missing post-conditions) provides a meaningful user protection layer that is already partially implemented (create-stream has it) and should be completed.

### Updated Deployment Checklist

Add to the existing checklist in `SECURITY_REVIEW.md`:

**Contracts:**
- [ ] **M-1 fix:** Add `(asserts! (< stacks-block-height end-block) ERR-STREAM-ENDED)` to `top-up-stream`

**Backend:**
- [ ] **M-2 fix:** Replace `message: err.message` with opaque error reference IDs in `error-handler.ts`

**Frontend:**
- [ ] **M-3 fix:** Add post-conditions to `buildClaimTx`, `buildClaimAllTx`, `buildCancelStreamTx`
- [ ] **M-4 fix:** `encodeURIComponent(q)` on all fetch paths in `assistant-widget.tsx` + client-side input validation

---

## Totals

| Severity | Count | Fixed | Open |
|---|---|---|---|
| Critical | 0 | — | — |
| High | 0 | — | — |
| Medium | 4 | 0 | 4 |
| Low | 0 | — | — |
| Informational | 4 | — | Documented above |

**No critical or high-severity vulnerabilities found.** The four medium findings are all fixable with straightforward code changes and none represent a path to direct fund theft given the current contract architecture.
