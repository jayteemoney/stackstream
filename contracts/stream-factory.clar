;; StackStream - Stream Factory Contract
;; DAO registry and stream analytics layer.
;;
;; NOTE: Stream creation happens directly via stream-manager (due to Clarity's
;; tx-sender security model for SIP-010 token transfers). This contract provides:
;; - DAO registration and management
;; - Stream tracking and analytics per DAO
;; - Name registry for DAO discovery

;; ============================================================================
;; CONSTANTS
;; ============================================================================

;; Error codes
(define-constant ERR-DAO-NOT-FOUND (err u501))
(define-constant ERR-DAO-ALREADY-EXISTS (err u502))
(define-constant ERR-NOT-DAO-ADMIN (err u503))
(define-constant ERR-INVALID-NAME (err u504))
(define-constant ERR-STREAM-NOT-FOUND (err u505))
(define-constant ERR-ALREADY-TRACKED (err u506))

;; ============================================================================
;; DATA STORAGE
;; ============================================================================

;; DAO registry
(define-map daos
  principal  ;; DAO admin address
  {
    name: (string-utf8 64),
    admin: principal,
    total-streams-created: uint,
    total-deposited: uint,
    created-at-block: uint,
    is-active: bool
  }
)

;; Map from DAO name to admin (reverse lookup)
(define-map dao-names
  (string-utf8 64)
  principal
)

;; Track which streams belong to which DAO (via factory tracking)
(define-map dao-stream-tracked
  { dao: principal, stream-id: uint }
  bool
)

;; Total DAOs registered
(define-data-var dao-count uint u0)

;; ============================================================================
;; DAO REGISTRY FUNCTIONS
;; ============================================================================

;; Register a new DAO in the registry
;;
;; @param name - DAO display name (max 64 UTF-8 chars)
;; @returns true on success
(define-public (register-dao (name (string-utf8 64)))
  (let (
    (caller contract-caller)
  )
    ;; Validation
    (asserts! (> (len name) u0) ERR-INVALID-NAME)
    (asserts! (is-none (map-get? daos caller)) ERR-DAO-ALREADY-EXISTS)
    (asserts! (is-none (map-get? dao-names name)) ERR-INVALID-NAME)

    ;; Store DAO data
    (map-set daos caller {
      name: name,
      admin: caller,
      total-streams-created: u0,
      total-deposited: u0,
      created-at-block: stacks-block-height,
      is-active: true
    })

    ;; Store reverse lookup
    (map-set dao-names name caller)

    ;; Increment counter
    (var-set dao-count (+ (var-get dao-count) u1))

    ;; Emit event
    (print {
      event: "dao-registered",
      admin: caller,
      name: name
    })

    (ok true)
  )
)

;; Update DAO name
(define-public (update-dao-name (new-name (string-utf8 64)))
  (let (
    (caller contract-caller)
    (dao-data (unwrap! (map-get? daos caller) ERR-DAO-NOT-FOUND))
    (old-name (get name dao-data))
  )
    (asserts! (> (len new-name) u0) ERR-INVALID-NAME)
    (asserts! (is-none (map-get? dao-names new-name)) ERR-INVALID-NAME)

    ;; Remove old name mapping
    (map-delete dao-names old-name)

    ;; Update DAO data
    (map-set daos caller (merge dao-data { name: new-name }))
    (map-set dao-names new-name caller)

    (print {
      event: "dao-name-updated",
      admin: caller,
      old-name: old-name,
      new-name: new-name
    })

    (ok true)
  )
)

;; Deactivate a DAO (soft delete)
(define-public (deactivate-dao)
  (let (
    (caller contract-caller)
    (dao-data (unwrap! (map-get? daos caller) ERR-DAO-NOT-FOUND))
  )
    (map-set daos caller (merge dao-data { is-active: false }))

    (print {
      event: "dao-deactivated",
      admin: caller
    })

    (ok true)
  )
)

;; ============================================================================
;; STREAM TRACKING
;; ============================================================================

;; Track a stream that was created via stream-manager.
;; The DAO admin calls this after creating a stream directly to update analytics.
;;
;; @param stream-id - ID of the stream to track
;; @returns true on success
(define-public (track-stream (stream-id uint))
  (let (
    (caller contract-caller)
    (dao-data (unwrap! (map-get? daos caller) ERR-DAO-NOT-FOUND))
    ;; Verify stream exists and belongs to caller
    (stream (unwrap! (contract-call? .stream-manager get-stream stream-id) ERR-STREAM-NOT-FOUND))
  )
    ;; Verify caller is the stream sender
    (asserts! (is-eq caller (get sender stream)) ERR-NOT-DAO-ADMIN)

    ;; Verify not already tracked
    (asserts! (is-none (map-get? dao-stream-tracked { dao: caller, stream-id: stream-id })) ERR-ALREADY-TRACKED)

    ;; Mark as tracked
    (map-set dao-stream-tracked { dao: caller, stream-id: stream-id } true)

    ;; Update DAO stats
    (map-set daos caller (merge dao-data {
      total-streams-created: (+ (get total-streams-created dao-data) u1),
      total-deposited: (+ (get total-deposited dao-data) (get deposit-amount stream))
    }))

    (print {
      event: "stream-tracked",
      dao: caller,
      stream-id: stream-id,
      deposit-amount: (get deposit-amount stream)
    })

    (ok true)
  )
)

;; ============================================================================
;; READ-ONLY FUNCTIONS
;; ============================================================================

;; Get DAO information
(define-read-only (get-dao (admin principal))
  (map-get? daos admin)
)

;; Get DAO admin by name
(define-read-only (get-dao-by-name (name (string-utf8 64)))
  (match (map-get? dao-names name)
    admin (map-get? daos admin)
    none
  )
)

;; Get total registered DAOs
(define-read-only (get-dao-count)
  (var-get dao-count)
)

;; Check if a principal is a registered DAO
(define-read-only (is-registered-dao (admin principal))
  (match (map-get? daos admin)
    dao-data (get is-active dao-data)
    false
  )
)

;; Check if a stream is tracked by a DAO
(define-read-only (is-stream-tracked (dao principal) (stream-id uint))
  (is-some (map-get? dao-stream-tracked { dao: dao, stream-id: stream-id }))
)
