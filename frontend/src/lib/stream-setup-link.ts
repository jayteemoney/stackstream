/**
 * Prepared stream setup links.
 *
 * A setup link opens the create-stream form already filled in, so an
 * organisation can check a stream someone prepared with them and sign it in
 * one step:
 *
 *   /dashboard/create?token=SP….usda-token&recipient=SP…&amount=500
 *     &duration=28&unit=days&memo=Milestone%201
 *
 * A link only fills the form. Nothing is signed until the wallet owner reviews
 * it, and the token still goes through the on-chain verification in the token
 * selector. Values that fail validation are dropped rather than corrected, so
 * a bad link leaves a field empty instead of putting a wrong value in front of
 * someone about to sign.
 */

import { DURATION_UNITS, type DurationUnit } from "./constants";
import type { StacksNetworkName } from "./token-metadata";

export interface StreamPrefill {
  recipient?: string;
  amount?: string;
  durationValue?: string;
  durationUnit?: DurationUnit;
  memo?: string;
}

/** The query keys a setup link may carry, besides `token`. */
export const PREFILL_KEYS = ["recipient", "amount", "duration", "unit", "memo"] as const;

/** Matches the contract's `string-utf8 256` memo. */
export const MAX_MEMO_LENGTH = 256;

// A standard principal, or a contract principal (a stream can pay a contract).
const PRINCIPAL_RE = /^S[PMTN][0-9A-Z]{38,40}(\.[a-zA-Z][a-zA-Z0-9-]{0,39})?$/;
const POSITIVE_DECIMAL_RE = /^\d{1,30}(\.\d{1,38})?$/;
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/;

function isOnNetwork(principal: string, network: StacksNetworkName): boolean {
  const mainnet = principal[1] === "P" || principal[1] === "M";
  return network === "mainnet" ? mainnet : !mainnet;
}

function positive(value: string | null): string | undefined {
  if (!value || !POSITIVE_DECIMAL_RE.test(value)) return undefined;
  return Number(value) > 0 ? value : undefined;
}

/** Read the setup values from a query string, keeping only the valid ones. */
export function parseStreamPrefill(search: string, network: StacksNetworkName): StreamPrefill {
  const params = new URLSearchParams(search);
  const prefill: StreamPrefill = {};

  const recipient = params.get("recipient")?.trim();
  if (recipient && PRINCIPAL_RE.test(recipient) && isOnNetwork(recipient, network)) {
    prefill.recipient = recipient;
  }

  const amount = positive(params.get("amount")?.trim() ?? null);
  if (amount) prefill.amount = amount;

  const duration = positive(params.get("duration")?.trim() ?? null);
  const unit = params.get("unit")?.trim();
  const knownUnit = DURATION_UNITS.find((u) => u.value === unit)?.value;
  // A duration only makes sense with its unit, so they are taken as a pair.
  if (duration && knownUnit) {
    prefill.durationValue = duration;
    prefill.durationUnit = knownUnit;
  }

  const memo = params.get("memo")?.trim();
  if (memo && memo.length <= MAX_MEMO_LENGTH && !CONTROL_CHARS_RE.test(memo)) {
    prefill.memo = memo;
  }

  return prefill;
}

export function hasPrefill(prefill: StreamPrefill): boolean {
  return Object.values(prefill).some((v) => v !== undefined);
}

/** Build a setup link for the current form, to send to the person who will sign it. */
export function buildStreamSetupLink(
  origin: string,
  values: StreamPrefill & { token?: string }
): string {
  const params = new URLSearchParams();
  if (values.token) params.set("token", values.token);
  if (values.recipient) params.set("recipient", values.recipient.trim());
  if (values.amount) params.set("amount", values.amount.trim());
  if (values.durationValue && values.durationUnit) {
    params.set("duration", values.durationValue.trim());
    params.set("unit", values.durationUnit);
  }
  if (values.memo?.trim()) params.set("memo", values.memo.trim());
  const query = params.toString();
  return `${origin}/dashboard/create${query ? `?${query}` : ""}`;
}
