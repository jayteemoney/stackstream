;; Mock SIP-010 Token for Testing
;; Simulates sBTC or any fungible token for local development/testing

(impl-trait .sip-010-trait.sip-010-trait)

;; ============================================================================
;; CONSTANTS
;; ============================================================================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant TOKEN-NAME "Mock sBTC")
(define-constant TOKEN-SYMBOL "msBTC")
(define-constant TOKEN-DECIMALS u8)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))

;; ============================================================================
;; DATA STORAGE
;; ============================================================================

;; Define the fungible token with no maximum supply (for testing flexibility)
(define-fungible-token mock-sbtc)

;; ============================================================================
;; SIP-010 INTERFACE IMPLEMENTATION
;; ============================================================================

;; Transfer tokens from sender to recipient
(define-public (transfer
    (amount uint)
    (sender principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (begin
    ;; Verify sender is the caller (security requirement)
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    ;; Perform the transfer using native Clarity function
    (try! (ft-transfer? mock-sbtc amount sender recipient))
    ;; Print memo if provided (for indexing)
    (match memo m (print m) 0x)
    (ok true)
  )
)

(define-read-only (get-name)
  (ok TOKEN-NAME)
)

(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL)
)

(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance mock-sbtc account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply mock-sbtc))
)

(define-read-only (get-token-uri)
  (ok none)
)

;; ============================================================================
;; MINT FUNCTION (For Testing Only)
;; ============================================================================

;; Mint tokens to any address (only contract owner can call)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ft-mint? mock-sbtc amount recipient)
  )
)

;; Faucet function - anyone can get test tokens
;; Limited to 1000 tokens per call for safety
(define-public (faucet (amount uint))
  (begin
    (asserts! (<= amount u100000000000) ERR-NOT-AUTHORIZED) ;; Max 1000 tokens (8 decimals)
    (ft-mint? mock-sbtc amount tx-sender)
  )
)
