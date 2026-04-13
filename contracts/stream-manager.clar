;; StackStream - Payment Streaming Protocol
;; A Sablier-style payment streaming contract for DAOs on Stacks
;;
;; Enables continuous, block-by-block token distribution from sender to recipient.
;; Supports pause/resume, cancellation, and partial claims.

;; ============================================================================
;; TRAITS
;; ============================================================================

(use-trait sip-010-trait .sip-010-trait.sip-010-trait)

;; ============================================================================
;; CONSTANTS
;; ============================================================================

;; Contract owner for emergency functions
(define-constant CONTRACT-OWNER tx-sender)

;; Precision multiplier for rate calculations (1e12)
;; This provides sufficient precision for tokens with up to 18 decimals
(define-constant PRECISION u1000000000000)

;; Stream status values
(define-constant STATUS-ACTIVE u0)
(define-constant STATUS-PAUSED u1)
(define-constant STATUS-CANCELLED u2)
(define-constant STATUS-DEPLETED u3)

;; Maximum streams per user (DoS prevention)
(define-constant MAX-STREAMS-PER-USER u100)

;; ============================================================================
;; ERROR CODES
;; ============================================================================

;; Authorization errors (u100-u199)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-NOT-SENDER (err u101))
(define-constant ERR-NOT-RECIPIENT (err u102))

;; Stream state errors (u200-u299)
(define-constant ERR-STREAM-NOT-FOUND (err u200))
(define-constant ERR-STREAM-DEPLETED (err u201))
(define-constant ERR-STREAM-CANCELLED (err u202))
(define-constant ERR-STREAM-PAUSED (err u203))
(define-constant ERR-STREAM-NOT-PAUSED (err u204))
(define-constant ERR-STREAM-ENDED (err u207))

;; Validation errors (u300-u399)
(define-constant ERR-INVALID-AMOUNT (err u300))
(define-constant ERR-INVALID-DURATION (err u301))
(define-constant ERR-INVALID-START-TIME (err u302))
(define-constant ERR-INVALID-RECIPIENT (err u303))
(define-constant ERR-ZERO-CLAIM (err u304))
(define-constant ERR-MAX-STREAMS-REACHED (err u305))

;; Token errors (u400-u499)
(define-constant ERR-TOKEN-MISMATCH (err u401))

;; ============================================================================
;; DATA STORAGE
;; ============================================================================

;; Global stream counter (monotonically increasing, never reused)
(define-data-var stream-nonce uint u0)

;; Emergency pause flag (circuit breaker)
(define-data-var emergency-paused bool false)

;; Primary stream storage
(define-map streams
  uint  ;; stream-id
  {
    sender: principal,
    recipient: principal,
    token: principal,
    deposit-amount: uint,
    withdrawn-amount: uint,
    start-block: uint,
    end-block: uint,
    rate-per-block: uint,
    status: uint,
    paused-at-block: uint,
    total-paused-duration: uint,
    created-at-block: uint,
    memo: (optional (string-utf8 256))
  }
)

;; Index: sender -> list of stream IDs
(define-map sender-streams
  principal
  (list 100 uint)
)

;; Index: recipient -> list of stream IDs
(define-map recipient-streams
  principal
  (list 100 uint)
)

;; Stream counts for pagination
(define-map sender-stream-count principal uint)
(define-map recipient-stream-count principal uint)

;; ============================================================================
;; PRIVATE HELPER FUNCTIONS
;; ============================================================================

;; Calculate effective elapsed blocks, accounting for pauses
(define-private (calculate-effective-elapsed
    (start-block uint)
    (end-block uint)
    (status uint)
    (paused-at-block uint)
    (total-paused-duration uint)
  )
  (let (
    (current-block stacks-block-height)
    (duration (- end-block start-block))
    ;; If paused, use pause time; otherwise use current time
    (effective-current
      (if (is-eq status STATUS-PAUSED)
        paused-at-block
        current-block))
    ;; Calculate raw elapsed (0 if not started yet)
    (raw-elapsed
      (if (< effective-current start-block)
        u0
        (- effective-current start-block)))
    ;; Subtract paused duration
    (adjusted-elapsed
      (if (> raw-elapsed total-paused-duration)
        (- raw-elapsed total-paused-duration)
        u0))
  )
    ;; Clamp to max duration
    (if (> adjusted-elapsed duration)
      duration
      adjusted-elapsed)
  )
)

;; Calculate streamed amount using high-precision rate
(define-private (calculate-streamed-amount-internal
    (deposit-amount uint)
    (rate-per-block uint)
    (effective-elapsed uint)
  )
  (let (
    ;; Calculate streamed amount using precision math
    (streamed (/ (* effective-elapsed rate-per-block) PRECISION))
  )
    ;; Ensure we never exceed deposit (handles rounding)
    (if (> streamed deposit-amount)
      deposit-amount
      streamed)
  )
)

;; Add stream ID to sender's list
(define-private (add-sender-stream (sender principal) (stream-id uint))
  (let (
    (current-list (default-to (list) (map-get? sender-streams sender)))
    (current-count (default-to u0 (map-get? sender-stream-count sender)))
  )
    (map-set sender-streams sender
      (unwrap! (as-max-len? (append current-list stream-id) u100) ERR-MAX-STREAMS-REACHED))
    (map-set sender-stream-count sender (+ current-count u1))
    (ok true)
  )
)

;; Add stream ID to recipient's list
(define-private (add-recipient-stream (recipient principal) (stream-id uint))
  (let (
    (current-list (default-to (list) (map-get? recipient-streams recipient)))
    (current-count (default-to u0 (map-get? recipient-stream-count recipient)))
  )
    (map-set recipient-streams recipient
      (unwrap! (as-max-len? (append current-list stream-id) u100) ERR-MAX-STREAMS-REACHED))
    (map-set recipient-stream-count recipient (+ current-count u1))
    (ok true)
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS - STREAM CREATION
;; ============================================================================

;; Create a new payment stream
;;
;; @param recipient - Address that will receive streamed tokens
;; @param token - SIP-010 token contract to stream
;; @param deposit-amount - Total tokens to stream (transferred immediately)
;; @param start-block - Burn block height when streaming begins
;; @param duration-blocks - Number of burn blocks over which to stream
;; @param memo - Optional description (max 256 UTF-8 chars)
;;
;; @returns Stream ID on success
(define-public (create-stream
    (recipient principal)
    (token <sip-010-trait>)
    (deposit-amount uint)
    (start-block uint)
    (duration-blocks uint)
    (memo (optional (string-utf8 256)))
  )
  (begin
    ;; Validation checks FIRST (before any calculations that could fail)
    (asserts! (not (var-get emergency-paused)) ERR-NOT-AUTHORIZED)
    (asserts! (> deposit-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> duration-blocks u0) ERR-INVALID-DURATION)
    ;; Integer rate = (deposit * PRECISION) / duration must be >= 1, otherwise
    ;; rate-per-block is 0 (no accrual) and top-up-stream divides by zero.
    (asserts! (>= (* deposit-amount PRECISION) duration-blocks) ERR-INVALID-DURATION)
    (asserts! (>= start-block stacks-block-height) ERR-INVALID-START-TIME)
    (asserts! (not (is-eq recipient contract-caller)) ERR-INVALID-RECIPIENT)
    (asserts! (not (is-eq recipient (as-contract tx-sender))) ERR-INVALID-RECIPIENT)

    ;; Check stream limits
    (asserts! (< (default-to u0 (map-get? sender-stream-count contract-caller)) MAX-STREAMS-PER-USER) ERR-MAX-STREAMS-REACHED)
    (asserts! (< (default-to u0 (map-get? recipient-stream-count recipient)) MAX-STREAMS-PER-USER) ERR-MAX-STREAMS-REACHED)

    ;; Prevent zero rate-per-block: deposit * PRECISION must be >= duration-blocks
    ;; Without this, tiny deposits over long durations produce rate = 0 causing silent math failures
    (asserts! (>= (* deposit-amount PRECISION) duration-blocks) ERR-INVALID-DURATION)

    ;; Now calculate values and execute (safe after validation)
    (let (
      (sender contract-caller)
      (stream-id (+ (var-get stream-nonce) u1))
      (end-block (+ start-block duration-blocks))
      (token-principal (contract-of token))
      (rate-per-block (/ (* deposit-amount PRECISION) duration-blocks))
    )
      ;; Transfer tokens from sender to contract escrow
      (try! (contract-call? token transfer
        deposit-amount
        sender
        (as-contract tx-sender)
        none))

      ;; Store stream data
      (map-set streams stream-id {
        sender: sender,
        recipient: recipient,
        token: token-principal,
        deposit-amount: deposit-amount,
        withdrawn-amount: u0,
        start-block: start-block,
        end-block: end-block,
        rate-per-block: rate-per-block,
        status: STATUS-ACTIVE,
        paused-at-block: u0,
        total-paused-duration: u0,
        created-at-block: stacks-block-height,
        memo: memo
      })

      ;; Update indexes
      (try! (add-sender-stream sender stream-id))
      (try! (add-recipient-stream recipient stream-id))

      ;; Increment nonce
      (var-set stream-nonce stream-id)

      ;; Emit event
      (print {
        event: "stream-created",
        stream-id: stream-id,
        sender: sender,
        recipient: recipient,
        token: token-principal,
        deposit-amount: deposit-amount,
        start-block: start-block,
        end-block: end-block,
        rate-per-block: rate-per-block,
        duration-blocks: duration-blocks
      })

      (ok stream-id)
    )
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS - CLAIMS
;; ============================================================================

;; Claim earned tokens from a stream
;;
;; @param stream-id - ID of the stream to claim from
;; @param token - SIP-010 token contract (must match stream's token)
;; @param amount - Amount to claim (use max uint for all available)
;;
;; @returns Amount claimed on success
(define-public (claim
    (stream-id uint)
    (token <sip-010-trait>)
    (amount uint)
  )
  (let (
    (caller contract-caller)
    (stream-data (unwrap! (map-get? streams stream-id) ERR-STREAM-NOT-FOUND))
    (recipient (get recipient stream-data))
    (status (get status stream-data))
    (token-principal (get token stream-data))
    (deposit (get deposit-amount stream-data))
    (withdrawn (get withdrawn-amount stream-data))
    (start-block (get start-block stream-data))
    (end-block (get end-block stream-data))
    (rate (get rate-per-block stream-data))
    (paused-at (get paused-at-block stream-data))
    (total-paused (get total-paused-duration stream-data))

    ;; Calculate claimable
    (effective-elapsed (calculate-effective-elapsed start-block end-block status paused-at total-paused))
    (streamed (calculate-streamed-amount-internal deposit rate effective-elapsed))
    (claimable (if (> streamed withdrawn) (- streamed withdrawn) u0))

    ;; Determine actual claim amount (min of requested and available)
    (claim-amount (if (> amount claimable) claimable amount))
    (new-withdrawn (+ withdrawn claim-amount))
  )
    ;; Authorization: only recipient can claim
    (asserts! (is-eq caller recipient) ERR-NOT-RECIPIENT)

    ;; State checks
    (asserts! (not (is-eq status STATUS-CANCELLED)) ERR-STREAM-CANCELLED)
    (asserts! (> claim-amount u0) ERR-ZERO-CLAIM)
    (asserts! (is-eq token-principal (contract-of token)) ERR-TOKEN-MISMATCH)

    ;; Transfer tokens from contract to recipient
    (try! (as-contract (contract-call? token transfer
      claim-amount
      tx-sender
      recipient
      none)))

    ;; Update stream state
    (map-set streams stream-id (merge stream-data {
      withdrawn-amount: new-withdrawn,
      ;; Mark as depleted if fully withdrawn
      status: (if (is-eq new-withdrawn deposit) STATUS-DEPLETED status)
    }))

    ;; Emit event
    (print {
      event: "tokens-claimed",
      stream-id: stream-id,
      recipient: recipient,
      amount: claim-amount,
      total-withdrawn: new-withdrawn,
      remaining: (- deposit new-withdrawn)
    })

    (ok claim-amount)
  )
)

;; Claim all available tokens from a stream
(define-public (claim-all
    (stream-id uint)
    (token <sip-010-trait>)
  )
  ;; Use max uint to claim all available
  (claim stream-id token u340282366920938463463374607431768211455)
)

;; ============================================================================
;; PUBLIC FUNCTIONS - STREAM CONTROL
;; ============================================================================

;; Pause an active stream
;;
;; @param stream-id - ID of the stream to pause
;; @returns true on success
(define-public (pause-stream (stream-id uint))
  (let (
    (caller contract-caller)
    (stream-data (unwrap! (map-get? streams stream-id) ERR-STREAM-NOT-FOUND))
    (sender (get sender stream-data))
    (status (get status stream-data))
    (current-block stacks-block-height)
  )
    ;; Authorization: only sender can pause
    (asserts! (is-eq caller sender) ERR-NOT-SENDER)

    ;; State checks
    (asserts! (is-eq status STATUS-ACTIVE) ERR-STREAM-PAUSED)
    (asserts! (not (is-eq status STATUS-CANCELLED)) ERR-STREAM-CANCELLED)
    (asserts! (not (is-eq status STATUS-DEPLETED)) ERR-STREAM-DEPLETED)
    (asserts! (< current-block (get end-block stream-data)) ERR-STREAM-ENDED)

    ;; Update stream state
    (map-set streams stream-id (merge stream-data {
      status: STATUS-PAUSED,
      paused-at-block: current-block
    }))

    ;; Emit event
    (print {
      event: "stream-paused",
      stream-id: stream-id,
      sender: sender,
      paused-at: current-block
    })

    (ok true)
  )
)

;; Resume a paused stream
;;
;; @param stream-id - ID of the stream to resume
;; @returns true on success
(define-public (resume-stream (stream-id uint))
  (let (
    (caller contract-caller)
    (stream-data (unwrap! (map-get? streams stream-id) ERR-STREAM-NOT-FOUND))
    (sender (get sender stream-data))
    (status (get status stream-data))
    (paused-at (get paused-at-block stream-data))
    (total-paused (get total-paused-duration stream-data))
    (current-block stacks-block-height)
    ;; Calculate duration of this pause
    (pause-duration (- current-block paused-at))
    (new-total-paused (+ total-paused pause-duration))
  )
    ;; Authorization: only sender can resume
    (asserts! (is-eq caller sender) ERR-NOT-SENDER)

    ;; State checks
    (asserts! (is-eq status STATUS-PAUSED) ERR-STREAM-NOT-PAUSED)

    ;; Cannot resume a stream whose end-block has already passed
    ;; Prevents zombie ACTIVE state — recipient can still claim earned tokens via claim
    (asserts! (< current-block (get end-block stream-data)) ERR-STREAM-ENDED)

    ;; Update stream state
    (map-set streams stream-id (merge stream-data {
      status: STATUS-ACTIVE,
      paused-at-block: u0,
      total-paused-duration: new-total-paused
    }))

    ;; Emit event
    (print {
      event: "stream-resumed",
      stream-id: stream-id,
      sender: sender,
      resumed-at: current-block,
      pause-duration: pause-duration,
      total-paused-duration: new-total-paused
    })

    (ok true)
  )
)

;; Cancel a stream and return remaining funds
;;
;; @param stream-id - ID of the stream to cancel
;; @param token - SIP-010 token contract
;; @returns Tuple with recipient-amount and sender-refund
(define-public (cancel-stream
    (stream-id uint)
    (token <sip-010-trait>)
  )
  (let (
    (caller contract-caller)
    (stream-data (unwrap! (map-get? streams stream-id) ERR-STREAM-NOT-FOUND))
    (sender (get sender stream-data))
    (recipient (get recipient stream-data))
    (status (get status stream-data))
    (token-principal (get token stream-data))
    (deposit (get deposit-amount stream-data))
    (withdrawn (get withdrawn-amount stream-data))
    (start-block (get start-block stream-data))
    (end-block (get end-block stream-data))
    (rate (get rate-per-block stream-data))
    (paused-at (get paused-at-block stream-data))
    (total-paused (get total-paused-duration stream-data))

    ;; Calculate final amounts
    (effective-elapsed (calculate-effective-elapsed start-block end-block status paused-at total-paused))
    (streamed (calculate-streamed-amount-internal deposit rate effective-elapsed))
    (recipient-amount (if (> streamed withdrawn) (- streamed withdrawn) u0))
    (sender-refund (- deposit streamed))
  )
    ;; Authorization: only sender can cancel
    (asserts! (is-eq caller sender) ERR-NOT-SENDER)

    ;; State checks
    (asserts! (not (is-eq status STATUS-CANCELLED)) ERR-STREAM-CANCELLED)
    (asserts! (not (is-eq status STATUS-DEPLETED)) ERR-STREAM-DEPLETED)
    (asserts! (is-eq token-principal (contract-of token)) ERR-TOKEN-MISMATCH)

    ;; Transfer earned amount to recipient (if any)
    (if (> recipient-amount u0)
      (try! (as-contract (contract-call? token transfer
        recipient-amount
        tx-sender
        recipient
        none)))
      true)

    ;; Transfer refund to sender (if any)
    (if (> sender-refund u0)
      (try! (as-contract (contract-call? token transfer
        sender-refund
        tx-sender
        sender
        none)))
      true)

    ;; Update stream state
    (map-set streams stream-id (merge stream-data {
      status: STATUS-CANCELLED,
      withdrawn-amount: streamed
    }))

    ;; Emit event
    (print {
      event: "stream-cancelled",
      stream-id: stream-id,
      sender: sender,
      recipient: recipient,
      recipient-amount: recipient-amount,
      sender-refund: sender-refund
    })

    (ok { recipient-amount: recipient-amount, sender-refund: sender-refund })
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS - STREAM TOP-UP
;; ============================================================================

;; Top up an existing stream with additional tokens
;; Extends the stream's end block proportionally to maintain the same rate.
;;
;; @param stream-id - ID of the stream to top up
;; @param token - SIP-010 token contract (must match stream's token)
;; @param amount - Additional tokens to deposit
;;
;; @returns true on success
(define-public (top-up-stream
    (stream-id uint)
    (token <sip-010-trait>)
    (amount uint)
  )
  (let (
    (caller contract-caller)
    (stream-data (unwrap! (map-get? streams stream-id) ERR-STREAM-NOT-FOUND))
    (sender (get sender stream-data))
    (status (get status stream-data))
    (token-principal (get token stream-data))
    (deposit (get deposit-amount stream-data))
    (end-block (get end-block stream-data))
    (rate (get rate-per-block stream-data))
    ;; Calculate additional blocks: amount / (rate / PRECISION) = amount * PRECISION / rate
    (additional-blocks (/ (* amount PRECISION) rate))
    (new-deposit (+ deposit amount))
    (new-end-block (+ end-block additional-blocks))
  )
    ;; Authorization: only sender can top up
    (asserts! (is-eq caller sender) ERR-NOT-SENDER)

    ;; Validation
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-eq token-principal (contract-of token)) ERR-TOKEN-MISMATCH)

    ;; Prevent zero-extension top-ups: amount * PRECISION must be >= rate-per-block
    ;; Without this, amounts too small to extend the stream by 1 block are silently accepted —
    ;; tokens transfer to escrow but end-block is unchanged, making them unreachable by recipient
    (asserts! (>= (* amount PRECISION) rate) ERR-INVALID-AMOUNT)

    ;; State checks: can't top up cancelled or depleted streams
    (asserts! (not (is-eq status STATUS-CANCELLED)) ERR-STREAM-CANCELLED)
    (asserts! (not (is-eq status STATUS-DEPLETED)) ERR-STREAM-DEPLETED)

    ;; Transfer additional tokens to contract
    (try! (contract-call? token transfer
      amount
      caller
      (as-contract tx-sender)
      none))

    ;; Update stream data
    (map-set streams stream-id (merge stream-data {
      deposit-amount: new-deposit,
      end-block: new-end-block
    }))

    ;; Emit event
    (print {
      event: "stream-topped-up",
      stream-id: stream-id,
      sender: sender,
      additional-amount: amount,
      new-deposit-total: new-deposit,
      new-end-block: new-end-block,
      additional-blocks: additional-blocks
    })

    (ok true)
  )
)

;; ============================================================================
;; READ-ONLY FUNCTIONS
;; ============================================================================

;; Get complete stream data
(define-read-only (get-stream (stream-id uint))
  (map-get? streams stream-id)
)

;; Get current stream status
(define-read-only (get-stream-status (stream-id uint))
  (match (map-get? streams stream-id)
    stream (some (get status stream))
    none
  )
)

;; Calculate tokens streamed so far
(define-read-only (get-streamed-amount (stream-id uint))
  (match (map-get? streams stream-id)
    stream
    (let (
      (effective-elapsed (calculate-effective-elapsed
        (get start-block stream)
        (get end-block stream)
        (get status stream)
        (get paused-at-block stream)
        (get total-paused-duration stream)))
    )
      (some (calculate-streamed-amount-internal
        (get deposit-amount stream)
        (get rate-per-block stream)
        effective-elapsed))
    )
    none
  )
)

;; Calculate tokens available to claim
(define-read-only (get-claimable-balance (stream-id uint))
  (match (map-get? streams stream-id)
    stream
    (let (
      (effective-elapsed (calculate-effective-elapsed
        (get start-block stream)
        (get end-block stream)
        (get status stream)
        (get paused-at-block stream)
        (get total-paused-duration stream)))
      (streamed (calculate-streamed-amount-internal
        (get deposit-amount stream)
        (get rate-per-block stream)
        effective-elapsed))
      (withdrawn (get withdrawn-amount stream))
    )
      (some (if (> streamed withdrawn) (- streamed withdrawn) u0))
    )
    none
  )
)

;; Calculate remaining balance in stream
(define-read-only (get-remaining-balance (stream-id uint))
  (match (map-get? streams stream-id)
    stream
    (some (- (get deposit-amount stream) (get withdrawn-amount stream)))
    none
  )
)

;; Calculate refundable amount if cancelled now
(define-read-only (get-refundable-amount (stream-id uint))
  (match (map-get? streams stream-id)
    stream
    (let (
      (effective-elapsed (calculate-effective-elapsed
        (get start-block stream)
        (get end-block stream)
        (get status stream)
        (get paused-at-block stream)
        (get total-paused-duration stream)))
      (streamed (calculate-streamed-amount-internal
        (get deposit-amount stream)
        (get rate-per-block stream)
        effective-elapsed))
    )
      (some (- (get deposit-amount stream) streamed))
    )
    none
  )
)

;; Get all stream IDs for a sender
(define-read-only (get-sender-streams (sender principal))
  (default-to (list) (map-get? sender-streams sender))
)

;; Get all stream IDs for a recipient
(define-read-only (get-recipient-streams (recipient principal))
  (default-to (list) (map-get? recipient-streams recipient))
)

;; Get stream count for a sender
(define-read-only (get-sender-stream-count (sender principal))
  (default-to u0 (map-get? sender-stream-count sender))
)

;; Get stream count for a recipient
(define-read-only (get-recipient-stream-count (recipient principal))
  (default-to u0 (map-get? recipient-stream-count recipient))
)

;; Get current stream nonce (next stream ID will be nonce + 1)
(define-read-only (get-stream-nonce)
  (var-get stream-nonce)
)

;; Check if contract is in emergency pause mode
(define-read-only (is-emergency-paused)
  (var-get emergency-paused)
)

;; ============================================================================
;; ADMIN FUNCTIONS
;; ============================================================================

;; Emergency pause - stops all new stream creation
;; Does NOT affect existing streams (they can still be claimed/cancelled)
(define-public (set-emergency-pause (paused bool))
  (begin
    (asserts! (is-eq contract-caller CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set emergency-paused paused)
    (print {
      event: "emergency-pause-set",
      paused: paused
    })
    (ok true)
  )
)
