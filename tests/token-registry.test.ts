import { describe, it, expect } from "vitest";

// The pure, network-free half of the token registry. The point of testing these
// directly is that discovery can be wrong, stale, or hostile without ever
// producing a misdirected payment — because `verifySelection` is the only path
// from a suggestion to a transaction, and it takes decimals/assetName from the
// chain rather than from the registry.
import {
  candidateFromResolved,
  classifyAll,
  classifyToken,
  dedupeByContract,
  hasPositiveSupply,
  isConfirmedEmpty,
  isValidContractId,
  normalizeRegistryRow,
  parseAssetIdentifier,
  parseTokenDeepLink,
  verifySelection,
  MAX_RESULTS,
  type DiscoveredToken,
  type RegistryRow,
} from "../frontend/src/lib/token-registry";
import type { ResolvedToken } from "../frontend/src/lib/token-metadata";

// Real mainnet contracts. `buttcoin-stxcity` is a genuine row that Hiro's
// registry returns for `?symbol=sBTC` — one of 32 — and it is why symbol
// matching alone can never be trusted in a payment selector.
const USDA = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token";
const SBTC = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";
const ALEX = "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex";
const FAKE_SBTC = "SPRFX4NGWZ2R8056122W037F8H8ST4V4D5BPG6AW.buttcoin-stxcity";
const NEW_TOKEN = "SP3NEWNEWNEWNEWNEWNEWNEWNEWNEWNEWNEWNEWNE.nt";

const CURATED_IDS = [USDA, SBTC, ALEX];
const CURATED_SYMBOLS = new Map([
  ["usda", USDA],
  ["sbtc", SBTC],
  ["alex", ALEX],
]);

function row(over: Partial<RegistryRow> = {}): RegistryRow {
  return {
    contract_principal: USDA,
    asset_identifier: `${USDA}::usda`,
    name: "USDA",
    symbol: "USDA",
    decimals: 6,
    total_supply: "1000000000000",
    ...over,
  };
}

function discovered(over: Partial<DiscoveredToken> = {}): DiscoveredToken {
  return {
    contractId: NEW_TOKEN,
    assetName: "nt",
    decimals: 6,
    symbol: "NEWTOK",
    name: "New Team Token",
    totalSupply: "1000000",
    trust: "unverified",
    ...over,
  };
}

function stubResolved(resolved: ResolvedToken | null) {
  return async (): Promise<ResolvedToken | null> => resolved;
}

describe("isValidContractId", () => {
  it("accepts mainnet and contract-address principals", () => {
    expect(isValidContractId(USDA)).toBe(true);
    expect(isValidContractId(SBTC)).toBe(true);
  });

  it("rejects a bare address with no contract name", () => {
    expect(isValidContractId("SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR")).toBe(false);
  });

  it("rejects non-base32c casing and non-strings", () => {
    expect(isValidContractId("sp2c2yfp12ajzb4mabjbaj55xecvs7e4pmmz89yzr.usda-token")).toBe(false);
    expect(isValidContractId(undefined)).toBe(false);
    expect(isValidContractId(null)).toBe(false);
    expect(isValidContractId("")).toBe(false);
    expect(isValidContractId(42)).toBe(false);
  });

  it("rejects hostile strings that would otherwise reach a URL or the DOM", () => {
    expect(isValidContractId("javascript:alert(1).foo")).toBe(false);
    expect(isValidContractId("https://evil.example/token")).toBe(false);
    expect(isValidContractId(`${USDA}\nSP3EVWKP0G9DNTB0FHWGHHTKNPMVJ0BB5Y9F8Z8E.x`)).toBe(false);
  });
});

describe("parseAssetIdentifier", () => {
  it("splits a real registry identifier into principal and asset name", () => {
    expect(parseAssetIdentifier(`${USDA}::usda`)).toEqual({
      contractId: USDA,
      assetName: "usda",
    });
  });

  it("handles hyphens in both halves (sBTC)", () => {
    expect(parseAssetIdentifier(`${SBTC}::sbtc-token`)).toEqual({
      contractId: SBTC,
      assetName: "sbtc-token",
    });
  });

  it("preserves asset-name case exactly — post-conditions are case-sensitive", () => {
    // Lowercasing "alex-Locked" here would produce a rejected transfer.
    expect(parseAssetIdentifier(`${ALEX}::alex-Locked`)?.assetName).toBe("alex-Locked");
  });

  it("returns null rather than inventing a missing asset name", () => {
    expect(parseAssetIdentifier(USDA)).toBeNull();
    expect(parseAssetIdentifier(`${USDA}::`)).toBeNull();
    expect(parseAssetIdentifier("not-an-address::usda")).toBeNull();
    expect(parseAssetIdentifier("")).toBeNull();
  });
});

describe("normalizeRegistryRow", () => {
  it("normalizes a complete row", () => {
    expect(normalizeRegistryRow(row())).toMatchObject({
      contractId: USDA,
      assetName: "usda",
      decimals: 6,
      symbol: "USDA",
    });
  });

  it("prefers the canonical image URI", () => {
    expect(
      normalizeRegistryRow(row({ image_canonical_uri: "ipfs://canon", image_uri: "https://x" }))?.icon,
    ).toBe("ipfs://canon");
    expect(normalizeRegistryRow(row({ image_uri: "https://fallback" }))?.icon).toBe(
      "https://fallback",
    );
  });

  it("refuses a row with no asset_identifier instead of guessing the asset name", () => {
    // The regression this guards: deriving the post-condition asset name from
    // the symbol or contract name. USDA's get-name is "USDA" but its asset name
    // is "usda", and conflating them makes the wallet reject the transfer.
    expect(normalizeRegistryRow(row({ asset_identifier: undefined }))).toBeNull();
  });

  it("refuses a row whose asset_identifier points at a different contract", () => {
    expect(normalizeRegistryRow(row({ asset_identifier: `${SBTC}::sbtc-token` }))).toBeNull();
  });

  it("rejects out-of-range decimals", () => {
    expect(normalizeRegistryRow(row({ decimals: -1 }))).toBeNull();
    expect(normalizeRegistryRow(row({ decimals: 39 }))).toBeNull();
    expect(normalizeRegistryRow(row({ decimals: 6.5 }))).toBeNull();
    expect(normalizeRegistryRow(row({ decimals: undefined }))).toBeNull();
  });

  it("accepts zero decimals, which is valid per SIP-010", () => {
    expect(normalizeRegistryRow(row({ decimals: 0 }))?.decimals).toBe(0);
  });

  it("trims whitespace and treats blank strings as absent", () => {
    const n = normalizeRegistryRow(row({ symbol: "  USDA  ", name: "   " }));
    expect(n?.symbol).toBe("USDA");
    expect(n?.name).toBe("");
  });

  it("refuses a malformed contract principal", () => {
    expect(normalizeRegistryRow(row({ contract_principal: "SPBAD.usda-token" }))).toBeNull();
  });
});

describe("hasPositiveSupply", () => {
  it("detects positive supply exactly, including beyond float precision", () => {
    expect(hasPositiveSupply({ totalSupply: "1000" })).toBe(true);
    expect(hasPositiveSupply({ totalSupply: "1000000000000000000000" })).toBe(true);
  });

  it("treats zero and missing supply as not positive", () => {
    expect(hasPositiveSupply({ totalSupply: "0" })).toBe(false);
    expect(hasPositiveSupply({ totalSupply: undefined })).toBe(false);
  });
});

describe("isConfirmedEmpty", () => {
  it("separates unknown supply from confirmed-empty supply", () => {
    // A deep-link candidate carries no supply figure at all. Treating unknown
    // as zero would make every unindexed token unselectable — exactly the case
    // the manual path exists to serve.
    expect(isConfirmedEmpty({ totalSupply: "0" })).toBe(true);
    expect(isConfirmedEmpty({ totalSupply: undefined })).toBe(false);
    expect(isConfirmedEmpty({ totalSupply: "" })).toBe(false);
    expect(isConfirmedEmpty({ totalSupply: "not-a-number" })).toBe(false);
  });

  it("keeps a token with unknown supply selectable", () => {
    // The onboarding requirement, stated at the classification level: a token
    // reached by contract id must not be blocked for something we never checked.
    expect(
      classifyToken(
        { contractId: NEW_TOKEN, symbol: "NEW", totalSupply: undefined, assetName: "nt" },
        CURATED_IDS,
        CURATED_SYMBOLS,
      ).trust,
    ).toBe("unverified");
  });
});

describe("classifyToken", () => {
  it("marks a hand-verified token as curated", () => {
    expect(
      classifyToken(
        { contractId: USDA, symbol: "USDA", totalSupply: "1", assetName: "usda" },
        CURATED_IDS,
        CURATED_SYMBOLS,
      ).trust,
    ).toBe("curated");
  });

  it("flags a token claiming a curated symbol as an impersonator", () => {
    // buttcoin-stxcity really is returned by ?symbol=sBTC.
    const r = classifyToken(
      { contractId: FAKE_SBTC, symbol: "sBTC", totalSupply: "21000000000000", assetName: "sBTC" },
      CURATED_IDS,
      CURATED_SYMBOLS,
    );
    expect(r.trust).toBe("impersonator");
    expect(r.impersonates).toBe(SBTC);
  });

  it("matches curated symbols case-insensitively", () => {
    expect(
      classifyToken(
        { contractId: FAKE_SBTC, symbol: "sbtc", totalSupply: "1", assetName: "sBTC" },
        CURATED_IDS,
        CURATED_SYMBOLS,
      ).trust,
    ).toBe("impersonator");
  });

  it("never flags the canonical token as impersonating itself", () => {
    expect(
      classifyToken(
        { contractId: SBTC, symbol: "sBTC", totalSupply: "1", assetName: "sbtc-token" },
        CURATED_IDS,
        CURATED_SYMBOLS,
      ).trust,
    ).toBe("curated");
  });

  it("marks only a token with no identity as unusable", () => {
    // No asset name means the row cannot say which asset it is describing.
    // There is nothing to warn about and nothing to resolve, so this is the one
    // case that is not offered for selection.
    expect(
      classifyToken(
        { contractId: NEW_TOKEN, symbol: "NEW", totalSupply: "1000", assetName: "" },
        CURATED_IDS,
        CURATED_SYMBOLS,
      ).trust,
    ).toBe("unusable");
  });

  it("warns but never blocks on a missing ticker", () => {
    // The symbol is display metadata; asset name and decimals come from the
    // chain, so a token that publishes no ticker is fully streamable.
    const result = classifyToken(
      { contractId: NEW_TOKEN, symbol: "", totalSupply: "1", assetName: "nt" },
      CURATED_IDS,
      CURATED_SYMBOLS,
    );
    expect(result.trust).toBe("unverified");
    expect(result.warnings).toHaveLength(1);
    expect(result.unusableReason).toBeUndefined();
  });

  it("warns but never blocks on a reported supply of zero", () => {
    // Supply is a hint that lags. Blocking here would fail the exact case this
    // feature exists to serve: a token deployed minutes ago whose registry row
    // has no supply yet.
    const result = classifyToken(
      { contractId: NEW_TOKEN, symbol: "NEW", totalSupply: "0", assetName: "nt" },
      CURATED_IDS,
      CURATED_SYMBOLS,
    );
    expect(result.trust).toBe("unverified");
    expect(result.warnings).toHaveLength(1);
    expect(result.unusableReason).toBeUndefined();
  });

  it("does not mistake a missing ticker for a curated-symbol impersonation", () => {
    // Guard against the empty string matching an empty curated symbol key.
    const result = classifyToken(
      { contractId: NEW_TOKEN, symbol: "", totalSupply: "1", assetName: "nt" },
      CURATED_IDS,
      CURATED_SYMBOLS,
    );
    expect(result.trust).not.toBe("impersonator");
    expect(result.impersonates).toBeUndefined();
  });

  it("still separates an impersonator that is also incomplete", () => {
    // Both signals are reported; the impersonation must not be masked by the
    // missing ticker.
    const result = classifyToken(
      { contractId: FAKE_SBTC, symbol: "sBTC", totalSupply: "0", assetName: "sBTC" },
      CURATED_IDS,
      CURATED_SYMBOLS,
    );
    expect(result.trust).toBe("impersonator");
    expect(result.impersonates).toBe(SBTC);
    expect(result.warnings).toHaveLength(1);
  });

  it("keeps a brand-new team token selectable — warn, never block", () => {
    // The onboarding requirement: deploying and streaming in the same session
    // must not hit a wall.
    expect(
      classifyToken(
        { contractId: NEW_TOKEN, symbol: "NEW", totalSupply: "1000", assetName: "nt" },
        CURATED_IDS,
        CURATED_SYMBOLS,
      ).trust,
    ).toBe("unverified");
  });
});

describe("dedupeByContract", () => {
  it("keeps the highest-trust entry when one contract appears twice", () => {
    const out = dedupeByContract([
      discovered({ contractId: USDA, trust: "impersonator" }),
      discovered({ contractId: USDA, trust: "curated" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.trust).toBe("curated");
  });

  it("orders curated, unverified, impersonator, unusable", () => {
    // An entry that cannot receive a stream must never sit above a real one.
    const out = dedupeByContract([
      discovered({ contractId: "SP3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.u", trust: "unusable" }),
      discovered({ contractId: FAKE_SBTC, trust: "impersonator" }),
      discovered({ contractId: "SP3BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.b", trust: "unverified" }),
      discovered({ contractId: USDA, trust: "curated" }),
    ]);
    expect(out.map((t) => t.trust)).toEqual([
      "curated",
      "unverified",
      "impersonator",
      "unusable",
    ]);
  });
});

describe("parseTokenDeepLink", () => {
  it("accepts a principal, which is how users actually get a contract id", () => {
    expect(parseTokenDeepLink(USDA)).toBe(USDA);
    expect(parseTokenDeepLink(SBTC)).toBe(SBTC);
  });

  it("tolerates an asset suffix and discards it for re-verification", () => {
    expect(parseTokenDeepLink(`${USDA}::usda`)).toBe(USDA);
    // A truncated `SP….::` keeps a usable principal. Safe to accept, because
    // the asset name is re-proven on-chain rather than taken from the link.
    expect(parseTokenDeepLink(`${USDA}::`)).toBe(USDA);
  });

  it("tolerates whitespace from a pasted link", () => {
    expect(parseTokenDeepLink(`  ${USDA}  `)).toBe(USDA);
  });

  it("returns null for anything malformed so the caller falls back safely", () => {
    expect(parseTokenDeepLink(null)).toBeNull();
    expect(parseTokenDeepLink(undefined)).toBeNull();
    expect(parseTokenDeepLink("")).toBeNull();
    expect(parseTokenDeepLink("   ")).toBeNull();
    expect(parseTokenDeepLink("usda")).toBeNull();
    expect(parseTokenDeepLink("../../etc/passwd")).toBeNull();
    expect(parseTokenDeepLink("https://evil.example/token")).toBeNull();
  });
});

describe("verifySelection", () => {
  it("uses chain decimals and assetName, and flags any disagreement", async () => {
    // Registry says 6/usda, chain says 8/usda-real. The chain must win, and the
    // discrepancy itself must reach the user — it can mean a renamed token,
    // a proxy, or something hostile.
    const out = await verifySelection(
      discovered({ contractId: USDA, decimals: 6, assetName: "usda" }),
      CURATED_IDS,
      CURATED_SYMBOLS,
      async () => ({
        contractId: USDA,
        assetName: "usda-real",
        decimals: 8,
        symbol: "USDA",
        curated: false,
      }),
    );
    expect(out.status).toBe("unverified");
    expect(out.resolved).toBeNull();
    expect(out.reason).toContain("usda-real");
  });

  it("verifies an uncurated token with no friction once the chain agrees", async () => {
    const out = await verifySelection(
      discovered(),
      CURATED_IDS,
      CURATED_SYMBOLS,
      stubResolved({
        contractId: NEW_TOKEN,
        assetName: "nt",
        decimals: 6,
        symbol: "NEWTOK",
        curated: false,
      }),
    );
    expect(out.status).toBe("verified");
    expect(out.resolved?.decimals).toBe(6);
  });

  it("treats a resolver failure as unverifiable, never as a default token", async () => {
    // Regression guard for the exact bug the merged PR fixed: substituting a
    // fallback here would silently stream sBTC.
    const out = await verifySelection(discovered(), CURATED_IDS, CURATED_SYMBOLS, stubResolved(null));
    expect(out.status).toBe("unverifiable");
    expect(out.resolved).toBeNull();
  });

  it("never calls the resolver for a token with no identity", async () => {
    let called = false;
    const out = await verifySelection(
      discovered({
        trust: "unusable",
        unusableReason: "No asset name — this listing cannot identify the token it describes",
      }),
      CURATED_IDS,
      CURATED_SYMBOLS,
      async () => {
        called = true;
        return null;
      },
    );
    expect(called).toBe(false);
    expect(out.status).toBe("unverifiable");
  });

  it("verifies normally when the token only carries warnings", async () => {
    // The policy in one assertion: warnings describe the listing, so they must
    // not change the verification outcome. A warned token that the chain
    // proves is still proven.
    const out = await verifySelection(
      discovered({
        symbol: "",
        trust: "unverified",
        warnings: ["This listing publishes no ticker."],
      }),
      CURATED_IDS,
      CURATED_SYMBOLS,
      stubResolved({
        contractId: NEW_TOKEN,
        assetName: "nt",
        decimals: 6,
        symbol: "NT",
      }),
    );
    expect(out.status).toBe("verified");
    expect(out.resolved?.assetName).toBe("nt");
  });

  it("carries impersonation forward even when the chain verifies the contract", async () => {
    // The contract genuinely is that token, so verification passes — but the UI
    // must still be able to warn.
    const out = await verifySelection(
      discovered({
        contractId: FAKE_SBTC,
        assetName: "sBTC",
        symbol: "sBTC",
        decimals: 6,
        trust: "impersonator",
        impersonates: SBTC,
      }),
      CURATED_IDS,
      CURATED_SYMBOLS,
      stubResolved({
        contractId: FAKE_SBTC,
        assetName: "sBTC",
        decimals: 6,
        symbol: "sBTC",
        curated: false,
      }),
    );
    expect(out.status).toBe("verified");
    expect(out.impersonates).toBe(SBTC);
  });

  it("downgrades on a decimals-only mismatch and says so", async () => {
    const out = await verifySelection(
      discovered({ decimals: 6 }),
      CURATED_IDS,
      CURATED_SYMBOLS,
      stubResolved({
        contractId: NEW_TOKEN,
        assetName: "nt",
        decimals: 8,
        symbol: "NEWTOK",
        curated: false,
      }),
    );
    expect(out.status).toBe("unverified");
    expect(out.reason).toContain("decimals");
  });

  it("keeps the display cap in a sane range", () => {
    expect(MAX_RESULTS).toBeGreaterThanOrEqual(10);
    expect(MAX_RESULTS).toBeLessThanOrEqual(100);
  });
});

describe("candidateFromResolved", () => {
  // The deep-link/manual path cannot get assetName from the registry: Hiro's
  // `/metadata/v1/search` endpoint returns `contract_id` and `token_number`,
  // with no asset identifier at all. So these fields come from the chain, and
  // these tests pin that the chain values are the ones carried forward.
  const chainResolved: ResolvedToken = {
    contractId: SBTC,
    assetName: "sbtc-token",
    decimals: 8,
    symbol: "sBTC",
    curated: true,
  };

  it("carries the chain asset name and decimals, not anything from a listing", () => {
    const c = candidateFromResolved(chainResolved);
    expect(c.contractId).toBe(SBTC);
    expect(c.assetName).toBe("sbtc-token");
    expect(c.decimals).toBe(8);
  });

  it("defaults the display name to the proven symbol when the registry has none", () => {
    // A token the registry has not indexed still needs a label.
    expect(candidateFromResolved(chainResolved).name).toBe("sBTC");
  });

  it("prefers registry cosmetics when they exist", () => {
    const c = candidateFromResolved(chainResolved, {
      name: "Synthetic Bitcoin",
      description: "1:1 BTC-backed",
      icon: "ipfs://icon",
    });
    expect(c.name).toBe("Synthetic Bitcoin");
    expect(c.description).toBe("1:1 BTC-backed");
    expect(c.icon).toBe("ipfs://icon");
    // ...but never the fields a transaction depends on.
    expect(c.assetName).toBe("sbtc-token");
    expect(c.decimals).toBe(8);
  });

  it("still gets caught as an impersonator when built from chain data alone", () => {
    // buttcoin-stxcity reports symbol "sBTC" on-chain too, so the deep-link path
    // is as protected as search — this is what makes that guarantee hold.
    const fake: ResolvedToken = {
      contractId: FAKE_SBTC,
      assetName: "sBTC",
      decimals: 6,
      symbol: "sBTC",
      curated: false,
    };
    const classified = dedupeByContract(
      classifyAll([candidateFromResolved(fake)], CURATED_IDS, CURATED_SYMBOLS),
    )[0]!;
    expect(classified.trust).toBe("impersonator");
    expect(classified.impersonates).toBe(SBTC);
  });
});
