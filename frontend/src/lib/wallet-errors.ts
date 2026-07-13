/**
 * Wallet (JSON-RPC) error classification for @stacks/connect v8.
 *
 * Errors can arrive as JsonRpcError instances, plain Errors, or foreign
 * objects from wallet extensions — never rely on instanceof. Classify by
 * numeric code first, message shape second.
 */

interface WalletErrorLike {
  code?: number;
  message?: string;
}

function asErrorLike(err: unknown): WalletErrorLike {
  if (typeof err === "object" && err !== null) return err as WalletErrorLike;
  return { message: String(err) };
}

/** -31001 UserCanceled (connect UI) · -32000 UserRejection (wallet) */
export function isUserCancel(err: unknown): boolean {
  const e = asErrorLike(err);
  if (e.code === -31001 || e.code === -32000) return true;
  return /cancel|rejected|denied/i.test(e.message ?? "");
}

/**
 * -31000: "Provider did not return a response". In practice this means the
 * extension's background worker was suspended by the browser and dropped the
 * request while waking up — an immediate retry succeeds.
 */
export function isNoResponse(err: unknown): boolean {
  const e = asErrorLike(err);
  if (e.code === -31000) return true;
  return /did not return a response/i.test(e.message ?? "");
}

/** Thrown when the page cannot see any injected Stacks wallet provider. */
export function isNoWalletFound(err: unknown): boolean {
  return /no installed stacks wallet/i.test(asErrorLike(err).message ?? "");
}

/** Human-readable detail for unknown failures, so toasts are debuggable. */
export function walletErrorDetail(err: unknown): string {
  const e = asErrorLike(err);
  const msg = e.message?.slice(0, 140) ?? "Unknown error";
  return e.code !== undefined ? `${msg} (code ${e.code})` : msg;
}
