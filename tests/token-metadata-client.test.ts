import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The chain is mocked: these tests are about the cache policy around the reads,
// not the reads themselves. `NEXT_PUBLIC_NETWORK` is unset here, so the module
// runs as a testnet build and every contract id below is a testnet one.
const readOnly = vi.fn();
// Mocked by path: the frontend resolves its own copy of the package, which is a
// different module from the one at the repo root.
vi.mock("../frontend/node_modules/@stacks/transactions", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    fetchCallReadOnlyFunction: (args: { functionName: string }) => readOnly(args.functionName),
    cvToJSON: (value: unknown) => value,
  };
});

import {
  clearTokenMetadataCache,
  getTokenDecimals,
  resolveTokenMetadata,
} from "../frontend/src/lib/token-metadata-client";

const TOKEN = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG.team-token";
// Deliberately not curated: curated entries resolve without a chain read.
const MAINNET_TOKEN = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.some-team-token";

function chainAnswers() {
  readOnly.mockImplementation(async (fn: string) => {
    if (fn === "get-decimals") return { success: true, value: { value: "6" } };
    if (fn === "get-symbol") return { success: true, value: { value: "TEAM" } };
    throw new Error(`unexpected ${fn}`);
  });
}

function interfaceAnswers(fungibleTokens: { name: string }[]) {
  return vi.fn(async () => ({
    ok: true,
    json: async () => ({ fungible_tokens: fungibleTokens }),
  }));
}

beforeEach(() => {
  clearTokenMetadataCache();
  readOnly.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("token metadata cache", () => {
  it("resolves a testnet token on a testnet build", async () => {
    chainAnswers();
    vi.stubGlobal("fetch", interfaceAnswers([{ name: "team" }]));
    const resolved = await resolveTokenMetadata(TOKEN);
    expect(resolved).toEqual({
      contractId: TOKEN,
      assetName: "team",
      decimals: 6,
      symbol: "TEAM",
      curated: false,
    });
  });

  it("refuses a contract from the other network without touching the chain", async () => {
    chainAnswers();
    vi.stubGlobal("fetch", interfaceAnswers([{ name: "usda" }]));
    expect(await resolveTokenMetadata(MAINNET_TOKEN)).toBeNull();
    expect(readOnly).not.toHaveBeenCalled();
  });

  it("caches a hit forever", async () => {
    chainAnswers();
    expect(await getTokenDecimals(TOKEN)).toBe(6);
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(await getTokenDecimals(TOKEN)).toBe(6);
    expect(readOnly).toHaveBeenCalledTimes(1);
  });

  it("retries a miss once the negative TTL has passed", async () => {
    // A rate limit is not a fact about the token, so it must not stick.
    readOnly.mockRejectedValueOnce(new Error("429 Too Many Requests"));
    expect(await getTokenDecimals(TOKEN)).toBeNull();

    chainAnswers();
    // Still inside the TTL: the miss is served from cache, no new request.
    vi.advanceTimersByTime(30_000);
    expect(await getTokenDecimals(TOKEN)).toBeNull();
    expect(readOnly).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(31_000);
    expect(await getTokenDecimals(TOKEN)).toBe(6);
    expect(readOnly).toHaveBeenCalledTimes(2);
  });

  it("shares one in-flight request between concurrent callers", async () => {
    chainAnswers();
    const results = await Promise.all([
      getTokenDecimals(TOKEN),
      getTokenDecimals(TOKEN),
      getTokenDecimals(TOKEN),
    ]);
    expect(results).toEqual([6, 6, 6]);
    expect(readOnly).toHaveBeenCalledTimes(1);
  });

  it("still refuses a multi-asset contract rather than guessing", async () => {
    chainAnswers();
    vi.stubGlobal("fetch", interfaceAnswers([{ name: "team" }, { name: "team-locked" }]));
    expect(await resolveTokenMetadata(TOKEN)).toBeNull();
  });
});
