import { describe, it, expect } from "vitest";

import { parseOkUint } from "../frontend/src/lib/stacks";
import { claimSuccessMessage } from "../frontend/src/lib/utils";

describe("parseOkUint", () => {
  it("reads the amount a claim paid out", () => {
    expect(parseOkUint("(ok u842000)")).toBe(842000n);
  });

  it("ignores anything that is not an ok uint", () => {
    expect(parseOkUint("(ok true)")).toBeUndefined();
    expect(parseOkUint("(err u105)")).toBeUndefined();
    expect(parseOkUint("(ok u12) trailing")).toBeUndefined();
    expect(parseOkUint(undefined)).toBeUndefined();
  });
});

describe("claimSuccessMessage", () => {
  it("names the amount when the chain returned it", () => {
    expect(claimSuccessMessage(842000n, 6, "USDA")).toBe("Claimed 0.842 USDA to your wallet");
  });

  it("still confirms the claim when the amount is unknown", () => {
    expect(claimSuccessMessage(undefined, 6, "USDA")).toBe("Claimed to your wallet");
  });
});
