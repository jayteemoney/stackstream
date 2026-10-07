import { describe, it, expect, vi, afterEach } from "vitest";

// constants.ts validates the network and deployer when it is first imported, so
// each case re-imports it fresh under its own environment.
const saved = {
  network: process.env.NEXT_PUBLIC_NETWORK,
  deployer: process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER,
};

function setEnv(network?: string, deployer?: string) {
  if (network === undefined) delete process.env.NEXT_PUBLIC_NETWORK;
  else process.env.NEXT_PUBLIC_NETWORK = network;
  if (deployer === undefined) delete process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER;
  else process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER = deployer;
}

async function loadConstants(network?: string, deployer?: string) {
  vi.resetModules();
  setEnv(network, deployer);
  return import("../frontend/src/lib/constants");
}

afterEach(() => {
  setEnv(saved.network, saved.deployer);
  vi.resetModules();
});

const TESTNET_DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

describe("network configuration", () => {
  it("defaults to the live mainnet deployment when nothing is set", async () => {
    // What `npm run dev` gets with no env file. It used to default to testnet
    // with a mainnet deployer, which left the token list empty and crashed.
    const c = await loadConstants();
    expect(c.NETWORK).toBe("mainnet");
    expect(c.CONTRACT_DEPLOYER).toBe("SP2V6TCRFTYQHP8F4D9HSFZHRQNGVBQEZR0TMSM79");
    expect(c.DEFAULT_TOKEN.symbol).toBe("sBTC");
  });

  it("builds for testnet when both variables are set as a pair", async () => {
    const c = await loadConstants("testnet", TESTNET_DEPLOYER);
    expect(c.NETWORK).toBe("testnet");
    expect(c.DEFAULT_TOKEN.contractId).toBe(`${TESTNET_DEPLOYER}.mock-sip010-token`);
  });

  it("stops at startup on a testnet network with a mainnet deployer", async () => {
    await expect(loadConstants("testnet")).rejects.toThrow(/NEXT_PUBLIC_CONTRACT_DEPLOYER/);
  });

  it("stops at startup on a mainnet network with a testnet deployer", async () => {
    await expect(loadConstants("mainnet", TESTNET_DEPLOYER)).rejects.toThrow(/mainnet/);
  });

  it("rejects a network name it does not know", async () => {
    await expect(loadConstants("devnet")).rejects.toThrow(/NEXT_PUBLIC_NETWORK/);
  });
});
