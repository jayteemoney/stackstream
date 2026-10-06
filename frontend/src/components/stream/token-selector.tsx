"use client";

/**
 * Token selector for the create-stream flow.
 *
 * WHY THIS SHAPE
 *
 * Three entry paths, in decreasing order of how much we trust the input:
 *
 *   1. Curated tokens. Hand-verified, pinned at the top, always available even
 *      when the registry is down.
 *   2. Search. Queries Hiro's SIP-010 metadata registry. This is how a team
 *      selects its own token without a code change — the whole point of the
 *      feature. Search is discovery only; the selection still has to survive
 *      `verifySelection`, which reads decimals and the asset name from the
 *      chain.
 *   3. A contract id, from a `?token=` deep link or pasted by hand. This is how
 *      users actually obtain a contract id — a team puts the link in its own
 *      docs or Slack, so nobody has to type 41 characters.
 *
 * The safety rules this component is responsible for:
 *
 *   - The full principal is always visible, never just a symbol. `?symbol=sBTC`
 *     returns 32 contracts including `buttcoin-stxcity`, so a user choosing
 *     between them on symbol alone cannot make a safe choice.
 *   - Curated symbols returned by search are marked when the result is NOT the
 *     canonical contract, so an impersonator is never presented as the real
 *     thing.
 *   - Unverified tokens are selectable (blocking would defeat onboarding) but
 *     require an explicit confirm showing the principal.
 *   - Nothing reaches the caller until the chain has verified it. A registry
 *     that is wrong, stale, or malicious can only suggest — never stream.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCuratedTokens, useTokenSearch } from "@/hooks/use-token-search";
import { resolveTokenMetadata } from "@/lib/token-metadata-client";
import { contractIdNetwork } from "@/lib/token-metadata";
import { NETWORK, NETWORK_LABEL } from "@/lib/constants";
import {
  MAX_RESULTS,
  classifyAll,
  dedupeByContract,
  isValidContractId,
  candidateFromResolved,
  lookupDecorations,
  parseTokenDeepLink,
  verifySelection,
  type ContractId,
  type DiscoveredToken,
  type VerifyStatus,
} from "@/lib/token-registry";
import type { ResolvedToken, TokenConfig } from "@/lib/token-metadata";
import {
  AlertTriangle,
  Check,
  Copy,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";

/**
 * What the parent receives on selection.
 *
 * `resolved` is always chain-verified — `assetName` and `decimals` came from
 * the contract, never from a listing. The rest is display context.
 */
export interface TokenSelection {
  resolved: ResolvedToken;
  /** Chain-proven decimals. The parent's amount maths must use this. */
  decimals: number;
  /** Symbol for labels. Proven from chain, or the curated entry. */
  symbol: string;
  name?: string;
  icon?: string;
  description?: string;
  trust: DiscoveredToken["trust"];
  impersonates?: ContractId;
}

interface TokenSelectorProps {
  /**
   * The current selection.
   *
   * Non-nullable by design. There is no "no token selected" state because
   * there is no safe default to fall back to — the parent seeds the curated
   * default and every subsequent change is chain-verified. Allowing null here
   * would push a null check onto callers at exactly the point where they build
   * a transaction.
   */
  value: TokenSelection;
  /** Always receives a chain-verified selection. */
  onChange: (selection: TokenSelection) => void;
  disabled?: boolean;
}

/** Shorten a principal for display without hiding its distinguishing tail. */
function shortPrincipal(contractId: ContractId): string {
  const [deployer, contract] = contractId.split(".");
  if (!deployer || !contract) return contractId;
  return `${deployer.slice(0, 6)}…${deployer.slice(-4)}.${contract}`;
}

/** Full principal, wrapped, with a copy button. */
function Principal({ contractId }: { contractId: ContractId }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contractId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be denied; the text is on screen either way, so this is
      // not worth interrupting the user over.
    }
  };

  return (
    <div className="flex items-start gap-2 rounded-lg bg-surface-2 px-2.5 py-2">
      <code
        className="flex-1 break-all font-mono text-[11px] leading-relaxed text-zinc-400"
        title={contractId}
      >
        {contractId}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:text-zinc-300"
        aria-label="Copy contract id"
        title="Copy contract id"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

/**
 * The trust badge.
 *
 * Wording is deliberately neutral for unverified tokens. Teams are onboarding
 * new tokens, and a hostile warning would just teach users to click past it —
 * which is exactly the wrong instinct to build around a payment. The
 * impersonator badge is the exception: that one is unambiguous and specific.
 */
function TrustBadge({
  token,
  status,
}: {
  token: DiscoveredToken;
  status?: VerifyStatus;
}) {
  if (token.trust === "impersonator") {
    return (
      <Badge variant="cancelled" className="shrink-0">
        <AlertTriangle className="h-3 w-3" />
        Impersonates a verified token
      </Badge>
    );
  }

  if (status === "unverified") {
    return (
      <Badge variant="paused" className="shrink-0">
        <AlertTriangle className="h-3 w-3" />
        Unverified
      </Badge>
    );
  }

  if (token.trust === "curated") {
    return (
      <Badge variant="active" className="shrink-0">
        <ShieldCheck className="h-3 w-3" />
        Verified
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="shrink-0">
      Community
    </Badge>
  );
}

/** A single row in the search results. */
function ResultRow({
  token,
  selected,
  disabled,
  onPick,
}: {
  token: DiscoveredToken;
  selected: boolean;
  disabled?: boolean;
  onPick: (token: DiscoveredToken) => void;
}) {
  const unusable = token.trust === "unusable";
  return (
    <button
      type="button"
      onClick={() => onPick(token)}
      disabled={disabled || unusable}
      className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-brand-500/50 bg-brand-500/10"
          : "border-transparent hover:bg-surface-2"
      } ${unusable ? "cursor-not-allowed opacity-45" : ""} disabled:cursor-not-allowed`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-100">
            {token.symbol || "(no symbol)"}
          </span>
          <TrustBadge token={token} />
        </div>
        <div className="mt-0.5 truncate text-xs text-zinc-500">
          {token.name || "(unnamed token)"}
        </div>
        <div className="mt-1 font-mono text-[10px] text-zinc-600" title={token.contractId}>
          {shortPrincipal(token.contractId)} · {token.decimals} decimals
        </div>
        {unusable && token.unusableReason && (
          <div className="mt-1 text-[11px] text-amber-500/80">{token.unusableReason}</div>
        )}
        {token.warnings?.map((warning) => (
          <div key={warning} className="mt-1 text-[11px] text-zinc-500">
            {warning}
          </div>
        ))}
      </div>
    </button>
  );
}

export function TokenSelector({ value, onChange, disabled }: TokenSelectorProps) {
  const curated = useCuratedTokens();
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState("");
  const [confirming, setConfirming] = useState<DiscoveredToken | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const search = useTokenSearch(query);

  const curatedIds = useMemo(() => curated.map((t) => t.contractId), [curated]);
  const curatedSymbols = useMemo(
    () => new Map(curated.map((t) => [t.symbol.toLowerCase(), t.contractId])),
    [curated],
  );

  const toSelection = (resolved: ResolvedToken, token: DiscoveredToken): TokenSelection => ({
    resolved,
    decimals: resolved.decimals,
    symbol: resolved.symbol,
    name: token.name,
    icon: token.icon,
    description: token.description,
    trust: token.trust,
    impersonates: token.impersonates,
  });

  /** Verify a candidate against the chain before it becomes the selection. */
  const verify = async (candidate: DiscoveredToken): Promise<boolean> => {
    setVerifying(true);
    try {
      const result = await verifySelection(candidate, resolveTokenMetadata);

      if (result.status === "verified" && result.resolved) {
        onChange(toSelection(result.resolved, candidate));
        setConfirming(null);
        setShowManual(false);
        setManual("");
        setManualError(null);
        return true;
      }

      // Unverifiable or contradictory: never select, and say exactly why.
      setManualError(
        result.reason ??
          "This token could not be verified on-chain, so it cannot be streamed safely.",
      );
      return false;
    } finally {
      setVerifying(false);
    }
  };

  /**
   * A curated token is already chain-proven (the curated entry IS the source of
   * truth for its asset name), so it selects without a confirm step.
   */
  const pickCurated = (token: TokenConfig) => {
    onChange({
      resolved: {
        contractId: token.contractId,
        assetName: token.assetName,
        decimals: token.decimals,
        symbol: token.symbol,
        curated: true,
      },
      decimals: token.decimals,
      symbol: token.symbol,
      name: token.name,
      icon: token.icon,
      description: token.description,
      trust: "curated",
    });
    setQuery("");
    setManualError(null);
  };

  /**
   * A discovered token is untrusted until the chain says otherwise. Verified
   * results apply immediately; anything else needs the user to confirm a
   * specific, fully-shown principal.
   */
  const pickDiscovered = (token: DiscoveredToken) => {
    if (token.trust === "unverified" || token.trust === "impersonator") {
      setConfirming(token);
      setManualError(null);
      return;
    }
    void verify(token);
  };

  /**
   * Resolve a known contract id, from either the manual field or a deep link.
   *
   * Takes the id as an argument rather than reading the `manual` state, so the
   * deep-link path can call it directly. Reading state here would race: the
   * deep link sets the field and immediately calls this, and React has not
   * committed the state update yet, so it would verify the previous value.
   */
  const selectByContractId = async (contractId: ContractId) => {
    setManualError(null);
    // Checked before any chain read: the node would answer a wrong-network id
    // with a bare "not found", which reads as if the token does not exist.
    if (contractIdNetwork(contractId) !== NETWORK) {
      setManualError(
        `That contract is not on ${NETWORK_LABEL}. Check you copied the ${NETWORK_LABEL.toLowerCase()} contract id.`,
      );
      return;
    }
    setVerifying(true);
    try {
      // The chain is the authority here, and it is the only source: the
      // registry's `/search` endpoint does not return an asset identifier, so
      // `assetName` and `decimals` cannot come from a listing even in principle.
      // A token deployed minutes ago that is not indexed still resolves, which
      // is the whole reason this path exists.
      const resolved = await resolveTokenMetadata(contractId);
      if (!resolved) {
        setManualError(
          "Could not read this token's asset name and decimals from the contract, so it cannot be streamed safely.",
        );
        return;
      }

      // Cosmetics only, and safe to fail: the contract is already proven.
      const decorations = await lookupDecorations(contractId);
      const candidate = dedupeByContract(
        classifyAll(
          [candidateFromResolved(resolved, decorations)],
          curatedIds,
          curatedSymbols,
        ),
      )[0]!;

      if (candidate.trust === "unverified" || candidate.trust === "impersonator") {
        setConfirming(candidate);
        return;
      }
      // Curated tokens resolve to the curated entry, so the values are identical
      // and there is nothing left to re-prove.
      onChange(
        toSelection(
          {
            contractId: candidate.contractId,
            assetName: candidate.assetName,
            decimals: candidate.decimals,
            symbol: candidate.symbol,
            curated: true,
          },
          candidate,
        ),
      );
      setShowManual(false);
      setManual("");
      setManualError(null);
    } finally {
      setVerifying(false);
    }
  };

  /** Manual path: validate the shape, then verify on-chain. */
  const submitManual = async () => {
    const parsed = parseTokenDeepLink(manual);
    if (!isValidContractId(parsed)) {
      setManualError(
        `That is not a valid contract id. It should look like ${NETWORK === "mainnet" ? "SP" : "ST"}….contract-name.`,
      );
      return;
    }
    await selectByContractId(parsed);
  };

  // A `?token=` deep link is the intended way a team hands its token to a user:
  // they put the link in their docs or Slack and nobody types 41 characters.
  //
  // Applied once on mount, and the param is then stripped from the URL so a
  // refresh does not silently re-apply a stale selection over one the user has
  // since changed.
  //
  // `selectByContractId` is held in a ref rather than listed as a dependency:
  // the link must be consumed exactly once, while the function is re-created on
  // every render. Listing it would re-run the effect and re-apply the link on
  // each render, which is precisely the bug this guard prevents.
  const selectByRef = useRef(selectByContractId);
  selectByRef.current = selectByContractId;
  const deepLinkApplied = useRef(false);

  useEffect(() => {
    if (deepLinkApplied.current) return;
    deepLinkApplied.current = true;

    const params = new URLSearchParams(window.location.search);
    const linked = parseTokenDeepLink(params.get("token"));
    if (!linked) return;

    setShowManual(true);
    setManual(linked);
    void selectByRef.current(linked);

    params.delete("token");
    const rest = params.toString();
    window.history.replaceState(
      null,
      "",
      rest ? `${window.location.pathname}?${rest}` : window.location.pathname,
    );
  }, []);

  const searchResults = search.results.slice(0, MAX_RESULTS);

  return (
    <div className="space-y-3">
      {/* ---- Selected token ----
          The full principal is always shown, not just its symbol: a
          mistyped-but-real contract id resolving to a different token is only
          catchable by seeing the whole string. */}
      <div className="space-y-2 rounded-xl border border-border bg-surface-1 p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-100">
            {value.symbol || "(no symbol)"}
          </span>
          {value.trust === "curated" ? (
            <Badge variant="active">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="default">Community</Badge>
          )}
          <Badge variant="default" className="shrink-0 font-mono">
            {value.decimals} decimals
          </Badge>
        </div>
        {value.name && <div className="text-xs text-zinc-500">{value.name}</div>}
        <Principal contractId={value.resolved.contractId} />
      </div>

      {/* ---- Curated tokens ---- */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-300">
          Verified tokens
        </label>
        <div className="grid gap-1.5">
          {curated.map((token) => (
            <button
              key={token.contractId}
              type="button"
              onClick={() => pickCurated(token)}
              disabled={disabled}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                value.resolved.contractId === token.contractId
                  ? "border-brand-500/50 bg-brand-500/10"
                  : "border-border hover:bg-surface-2"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-100">{token.symbol}</span>
                  <Badge variant="active" className="shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                </div>
                <div className="truncate text-xs text-zinc-500">{token.name}</div>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-zinc-600">
                {token.decimals} decimals
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- Search ---- */}
      <div className="space-y-1.5">
        <label
          htmlFor="token-search"
          className="block text-sm font-medium text-zinc-300"
        >
          Or use your team&apos;s token
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <Input
            id="token-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any SIP-010 token…"
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
            className="pl-9"
          />
        </div>

        {search.isSearching && (
          <div className="flex items-center gap-2 px-1 py-2 text-xs text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching…
          </div>
        )}

        {search.isSearchable && !search.isSearching && searchResults.length > 0 && (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {searchResults.map((token) => (
              <ResultRow
                key={token.contractId}
                token={token}
                selected={value.resolved.contractId === token.contractId}
                disabled={disabled || verifying}
                onPick={pickDiscovered}
              />
            ))}
          </div>
        )}

        {search.isSearchable && !search.isSearching && searchResults.length === 0 && (
          <p className="px-1 py-2 text-xs text-zinc-600">
            No tokens matched. If yours was just deployed, use the contract id below —
            new tokens can take a moment to be indexed.
          </p>
        )}
      </div>

      {/* ---- Contract id: deep link or pasted ---- */}
      <div className="space-y-1.5">
        {!showManual ? (
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-zinc-300 hover:underline"
          >
            Enter a contract id instead
          </button>
        ) : (
          <div className="space-y-2">
            <label
              htmlFor="token-manual"
              className="block text-sm font-medium text-zinc-300"
            >
              Contract id
            </label>
            <Input
              id="token-manual"
              value={manual}
              onChange={(e) => {
                setManual(e.target.value);
                setManualError(null);
              }}
              placeholder={`${NETWORK === "mainnet" ? "SP" : "ST"}….contract-name`}
              disabled={disabled || verifying}
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitManual();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void submitManual()}
              disabled={disabled || verifying || !manual.trim()}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying on-chain…
                </>
              ) : (
                "Use this token"
              )}
            </Button>
          </div>
        )}
        {manualError && (
          <p className="flex items-start gap-1.5 px-1 text-xs text-amber-500/90">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {manualError}
          </p>
        )}
      </div>

      {/* ---- Explicit confirm for anything not hand-verified ---- */}
      {confirming && (
        <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium text-zinc-100">
                Confirm {confirming.symbol || "this token"}
              </p>
              <p className="text-xs text-zinc-400">
                {confirming.trust === "impersonator"
                  ? "A verified token uses this symbol, and this is a different contract. Check the contract id below before continuing."
                  : "This token is not on our verified list. Check the contract id below before continuing."}
              </p>
            </div>
          </div>

          <Principal contractId={confirming.contractId} />

          {confirming.impersonates && (
            <div className="space-y-1">
              <p className="text-[11px] text-zinc-500">Verified token with this symbol:</p>
              <Principal contractId={confirming.impersonates} />
            </div>
          )}

          {confirming.warnings?.length ? (
            <ul className="space-y-1">
              {confirming.warnings.map((warning) => (
                <li key={warning} className="text-[11px] text-zinc-400">
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => void verify(confirming)}
              disabled={disabled || verifying}
              className="flex-1"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "I've checked it — continue"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirming(null)}
              disabled={verifying}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
