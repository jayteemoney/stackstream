# StackStream Security Audit - Recommendations for Future Versions

**Audit Date:** May 13, 2026  
**Auditor:** Security Review 2026  
**Version Reviewed:** v1.0.0-rc1

---

## Overview

This document outlines recommendations for future versions of StackStream. These are **not security vulnerabilities** in v1.0.0-rc1, but rather suggestions for enhancements, optimizations, and additional features that could improve the protocol in subsequent releases.

**Current Status:** v1.0.0-rc1 is **READY FOR MAINNET** as-is.

---

## High Priority Recommendations (v1.1)

### 1. Event Versioning

**Current State:**
Events don't include version or schema information.

**Issue:**
If event structure changes in future versions, off-chain indexers may break or misinterpret data.

**Recommendation:**
Add a `version` field to all events:

```clarity
(print {
  event: "stream-created",
  version: "1.0.0",  ;; Add this
  stream-id: stream-id,
  sender: sender,
  recipient: recipient,
  ;; ... rest of fields
})
```

**Benefits:**
- Off-chain indexers can handle multiple versions
- Backward compatibility for analytics
- Clear migration path for upgrades

**Priority:** High  
**Effort:** Low  
**Breaking Change:** No (additive only)

---

### 2. Concurrent Stream Limit (Replace Lifetime Limit)

**Current State:**
100-stream limit is per-principal **lifetime**, not concurrent.

**Issue:**
Once a user creates 100 streams (even if all are completed), they cannot create more. This is documented as L-2 but limits long-term usability.

**Recommendation:**
Change to concurrent limit:

```clarity
;; Instead of:
(define-map sender-streams principal (list 100 uint))

;; Track active streams only:
(define-map active-sender-streams principal (list 100 uint))

;; On stream completion (DEPLETED or CANCELLED):
;; Remove from active list
```

**Benefits:**
- Users can create unlimited streams over time
- Limit still prevents DoS (100 concurrent)
- Better UX for long-term users

**Priority:** High  
**Effort:** Medium  
**Breaking Change:** Yes (requires migration)

---

### 3. Non-Cancellable Stream Flag

**Current State:**
All streams are revocable by sender (L-11 design decision).

**Issue:**
Recipients must trust senders not to cancel. This limits use cases where stronger guarantees are needed (e.g., vesting, salaries).

**Recommendation:**
Add optional `is-cancellable` flag:

```clarity
(define-public (create-stream
  (recipient principal)
  (token <sip-010-trait>)
  (deposit-amount uint)
  (start-block uint)
  (duration-blocks uint)
  (is-cancellable bool)  ;; Add this
)
  ;; ... existing logic
  (map-set streams stream-id {
    ;; ... existing fields
    is-cancellable: is-cancellable,
  })
)

(define-public (cancel-stream (stream-id uint) (token <sip-010-trait>))
  (let ((stream (unwrap! (map-get? streams stream-id) ERR-STREAM-NOT-FOUND)))
    ;; Add this check:
    (asserts! (get is-cancellable stream) ERR-STREAM-NOT-CANCELLABLE)
    ;; ... rest of cancel logic
  )
)
```

**Considerations:**
- What if non-cancellable stream has a bug?
- Could add emergency-cancel by owner as escape hatch
- Requires careful design and testing

**Benefits:**
- Stronger guarantees for recipients
- Enables vesting and salary use cases
- Opt-in (backward compatible)

**Priority:** High  
**Effort:** Medium  
**Breaking Change:** No (additive, default to cancellable)

---

## Medium Priority Recommendations (v1.2)

### 4. Token Allowlist

**Current State:**
Any SIP-010 token can be used.

**Issue:**
Malicious tokens could:
- Refuse transfers (DoS)
- Have hidden fees
- Be non-standard implementations

**Recommendation:**
Add optional token allowlist:

```clarity
(define-map allowed-tokens principal bool)

(define-public (add-allowed-token (token principal))
  (begin
    (asserts! (is-eq contract-caller (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (ok (map-set allowed-tokens token true))
  )
)

(define-public (create-stream ...)
  ;; Add optional check:
  (asserts! 
    (or 
      (not (var-get allowlist-enabled))
      (default-to false (map-get? allowed-tokens (contract-of token)))
    )
    ERR-TOKEN-NOT-ALLOWED
  )
  ;; ... rest of logic
)
```

**Considerations:**
- Should be opt-in (allowlist-enabled flag)
- Governance-controlled
- Requires trusted token curation

**Benefits:**
- Reduces malicious token risk
- Curated list for frontend
- Optional (doesn't restrict permissionless use)

**Priority:** Medium  
**Effort:** Low  
**Breaking Change:** No (opt-in feature)

---

### 5. Batch Operations

**Current State:**
Each operation requires a separate transaction.

**Issue:**
Users with multiple streams pay gas for each claim/cancel.

**Recommendation:**
Add batch functions:

```clarity
(define-public (claim-multiple 
  (stream-ids (list 10 uint))
  (tokens (list 10 <sip-010-trait>))
  (amounts (list 10 uint))
)
  (ok (map claim-internal stream-ids tokens amounts))
)

(define-public (cancel-multiple
  (stream-ids (list 10 uint))
  (tokens (list 10 <sip-010-trait>))
)
  (ok (map cancel-internal stream-ids tokens))
)
```

**Considerations:**
- Limit batch size (e.g., 10) to prevent gas issues
- All-or-nothing vs partial success?
- Error handling for batch operations

**Benefits:**
- Gas optimization for power users
- Better UX for multi-stream management
- Reduces transaction count

**Priority:** Medium  
**Effort:** Medium  
**Breaking Change:** No (additive)

---

### 6. DAO Reactivation

**Current State:**
Deactivated DAOs cannot be reactivated.

**Issue:**
If DAO deactivates by mistake, they must register with new address/name.

**Recommendation:**
Add reactivation function:

```clarity
(define-public (reactivate-dao)
  (let ((dao-data (unwrap! (map-get? daos contract-caller) ERR-DAO-NOT-FOUND)))
    (asserts! (not (get is-active dao-data)) ERR-DAO-ALREADY-ACTIVE)
    (ok (map-set daos contract-caller (merge dao-data { is-active: true })))
  )
)
```

**Benefits:**
- Recovers from accidental deactivation
- Preserves analytics and name
- Simple implementation

**Priority:** Medium  
**Effort:** Low  
**Breaking Change:** No (additive)

---

### 7. Update Factory Analytics on Top-Up

**Current State:**
`total-deposited` in factory doesn't update when streams are topped up (I-1).

**Issue:**
Analytics become stale, underreporting actual deposits.

**Recommendation:**
Option A: Update factory from stream-manager:

```clarity
;; In stream-manager.clar top-up-stream:
(try! (contract-call? .stream-factory update-dao-deposit dao-principal amount))
```

Option B: Document that off-chain indexing is preferred:

```markdown
Note: Factory analytics show initial deposits only.
For accurate totals including top-ups, use off-chain indexing.
```

**Considerations:**
- Option A adds cross-contract call (gas cost)
- Option B is simpler but requires off-chain infrastructure
- Analytics are non-critical (no funds at risk)

**Benefits:**
- More accurate on-chain analytics
- Better DAO dashboards

**Priority:** Medium  
**Effort:** Low (Option B) / Medium (Option A)  
**Breaking Change:** No

---

## Low Priority Recommendations (v2.0+)

### 8. Streaming Rate Changes

**Current State:**
Rate is fixed at creation (top-up preserves rate).

**Use Case:**
Sender wants to increase/decrease payment rate without cancelling.

**Recommendation:**
Add `adjust-rate` function:

```clarity
(define-public (adjust-rate 
  (stream-id uint)
  (new-rate uint)
  (token <sip-010-trait>)
)
  ;; Recalculate end-block based on:
  ;; - Current withdrawn amount
  ;; - Remaining deposit
  ;; - New rate
  ;; Complex math, needs careful design
)
```

**Considerations:**
- Complex calculation (remaining deposit / new rate)
- What if new rate is too high (ends immediately)?
- What if new rate is too low (extends far into future)?
- Requires extensive testing

**Priority:** Low  
**Effort:** High  
**Breaking Change:** No (additive)

---

### 9. Recipient Acceptance Requirement

**Current State:**
Streams can be created to any recipient without their consent.

**Use Case:**
Prevent unwanted streams (spam, griefing, compliance).

**Recommendation:**
Add opt-in acceptance:

```clarity
(define-map recipient-accepts-streams principal bool)

(define-public (set-accept-streams (accept bool))
  (ok (map-set recipient-accepts-streams contract-caller accept))
)

(define-public (create-stream ...)
  ;; Check if recipient requires acceptance:
  (asserts!
    (or
      (not (default-to false (map-get? recipient-accepts-streams recipient)))
      ;; Recipient has opted in
    )
    ERR-RECIPIENT-NOT-ACCEPTING
  )
  ;; ... rest of logic
)
```

**Considerations:**
- Opt-in (default allows all streams)
- May reduce usability
- Compliance benefit for regulated entities

**Priority:** Low  
**Effort:** Low  
**Breaking Change:** No (opt-in)

---

### 10. Partial Cancellation

**Current State:**
Cancel terminates entire stream.

**Use Case:**
Sender wants to reduce stream amount without full cancellation.

**Recommendation:**
Add `reduce-stream` function:

```clarity
(define-public (reduce-stream
  (stream-id uint)
  (reduction-amount uint)
  (token <sip-010-trait>)
)
  ;; Transfer reduction-amount back to sender
  ;; Recalculate end-block with reduced deposit
  ;; Preserve rate
)
```

**Considerations:**
- Similar to top-up but in reverse
- Must ensure reduction doesn't go below withdrawn amount
- Complex edge cases

**Priority:** Low  
**Effort:** Medium  
**Breaking Change:** No (additive)

---

### 11. Pausable by Recipient

**Current State:**
Only sender can pause.

**Use Case:**
Recipient wants to pause claiming (e.g., tax optimization, compliance).

**Recommendation:**
Add `pause-by-recipient` function:

```clarity
(define-public (pause-by-recipient (stream-id uint))
  (let ((stream (unwrap! (map-get? streams stream-id) ERR-STREAM-NOT-FOUND)))
    (asserts! (is-eq contract-caller (get recipient stream)) ERR-NOT-AUTHORIZED)
    ;; Same pause logic as pause-stream
  )
)
```

**Considerations:**
- Separate pause flags for sender vs recipient?
- Or single pause state (either party can pause)?
- Resume logic needs update

**Priority:** Low  
**Effort:** Medium  
**Breaking Change:** No (additive)

---

### 12. Stream Templates

**Current State:**
Each stream created individually.

**Use Case:**
DAO wants to create many identical streams (e.g., salary for 50 employees).

**Recommendation:**
Add template system:

```clarity
(define-map stream-templates uint {
  token: principal,
  deposit-amount: uint,
  duration-blocks: uint,
  is-cancellable: bool,
})

(define-public (create-from-template
  (template-id uint)
  (recipients (list 50 principal))
)
  ;; Create multiple streams from template
  ;; One transaction, multiple streams
)
```

**Benefits:**
- Gas optimization for bulk creation
- Consistent parameters
- Better UX for DAOs

**Priority:** Low  
**Effort:** High  
**Breaking Change:** No (additive)

---

## Gas Optimization Opportunities

### 1. Reduce Map Reads

**Current State:**
Some functions read the same map multiple times.

**Optimization:**
Cache map reads in `let` bindings.

**Example:**
```clarity
;; Before:
(asserts! (is-eq (get status stream) STATUS-ACTIVE) ...)
(asserts! (is-eq (get sender stream) contract-caller) ...)

;; After:
(let (
  (status (get status stream))
  (sender (get sender stream))
)
  (asserts! (is-eq status STATUS-ACTIVE) ...)
  (asserts! (is-eq sender contract-caller) ...)
)
```

**Impact:** Minor gas savings per transaction

---

### 2. Optimize Event Data

**Current State:**
Events include all stream data.

**Optimization:**
Include only changed fields + stream-id (indexers can fetch full data).

**Impact:** Reduced transaction size, minor gas savings

---

## Testing Recommendations

### 1. Formal Verification

**Recommendation:**
Use formal verification tools to prove invariants:
- Token conservation
- Pause accounting
- Rate preservation

**Tools:**
- Clarinet's property-based testing (already used)
- External formal verification services

---

### 2. Mainnet Simulation

**Recommendation:**
Run extended simulation on testnet:
- 1000+ streams
- Various token types
- Multi-month duration
- All edge cases

**Goal:**
Catch any issues not visible in unit tests.

---

### 3. Upgrade Testing

**Recommendation:**
Test upgrade path from v1.0 to v1.1:
- Data migration
- Backward compatibility
- Event schema changes

---

## Documentation Recommendations

### 1. Integration Guide

**Create:**
- Step-by-step integration guide for frontends
- Code examples in JavaScript/TypeScript
- Common patterns and best practices

---

### 2. Security Best Practices

**Document:**
- Recommended claim frequency
- Token selection criteria
- Multi-sig for owner key
- Emergency procedures

---

### 3. Governance Framework

**Define:**
- How to propose protocol changes
- Community voting mechanism
- Upgrade process

---

## Monitoring Recommendations

### 1. On-Chain Metrics

**Track:**
- Total value locked (TVL)
- Active streams count
- Claim frequency
- Emergency pause events
- Ownership transfers

---

### 2. Alerting

**Set up alerts for:**
- Emergency pause activated
- Ownership transfer proposed
- Unusual claim patterns
- Failed transactions spike

---

### 3. Analytics Dashboard

**Build:**
- Real-time protocol stats
- Per-DAO analytics
- Token distribution
- User growth metrics

---

## Conclusion

StackStream v1.0.0-rc1 is production-ready as-is. These recommendations are for future enhancements and should be prioritized based on:

1. **User feedback** - What features do users actually need?
2. **Usage patterns** - What pain points emerge in production?
3. **Ecosystem evolution** - How does Stacks ecosystem change?

**Recommended Roadmap:**

**v1.1 (3-6 months post-launch):**
- Event versioning
- Concurrent stream limit
- Non-cancellable flag

**v1.2 (6-12 months post-launch):**
- Token allowlist
- Batch operations
- DAO reactivation

**v2.0 (12+ months post-launch):**
- Rate changes
- Stream templates
- Advanced features based on user feedback

---

**Auditor:** Security Review 2026  
**Date:** May 13, 2026  
**Status:** Recommendations for future versions
