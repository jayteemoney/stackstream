;; SIP-010 Fungible Token Trait
;; https://github.com/stacksgov/sips/blob/main/sips/sip-010/sip-010-fungible-token-standard.md
;;
;; This is a local copy for simnet/devnet testing.
;; For mainnet, use: SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard

(define-trait sip-010-trait
  (
    ;; Transfer from the caller to a new principal
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))

    ;; The human-readable name of the token
    (get-name () (response (string-ascii 32) uint))

    ;; A symbol, or "ticker", for this token
    (get-symbol () (response (string-ascii 32) uint))

    ;; The number of decimals used (e.g., 8 for sBTC)
    (get-decimals () (response uint uint))

    ;; Balance of a principal
    (get-balance (principal) (response uint uint))

    ;; Current total supply of the token
    (get-total-supply () (response uint uint))

    ;; Optional URI pointing to token metadata
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)
