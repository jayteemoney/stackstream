import { describe, it, expect } from "vitest";

// The read API exists twice: as Next.js route handlers (what stackstream.xyz
// serves) and as the standalone Express service that self-hosted OpenClaw
// skills run. Their formatting helpers are copies, so this pins them to the
// same output. If one changes and the other does not, this fails.
import * as service from "../openclaw-service/src/utils";
import * as hosted from "../frontend/src/lib/openclaw-server";

const AMOUNTS: Array<[bigint, number]> = [
  [0n, 6],
  [1n, 6],
  [1_200_000n, 6], // 1.2 USDA, the amount the 8-decimal bug showed as 0.012
  [123_456_789n, 8],
  [100_000_000_000n, 8],
  [5n, 0],
];

describe("OpenClaw service and hosted API agree", () => {
  it("format token amounts identically", () => {
    for (const [raw, decimals] of AMOUNTS) {
      expect(hosted.formatTokenAmount(raw, decimals)).toBe(service.formatTokenAmount(raw, decimals));
    }
  });

  it("label stream statuses identically", () => {
    for (const code of [0, 1, 2, 3, 9]) {
      expect(hosted.getStreamStatusLabel(code)).toBe(service.getStreamStatusLabel(code));
    }
  });

  it("compute stream progress identically", () => {
    const cases: Array<[number, number, number, number]> = [
      [100, 200, 150, 0],
      [100, 200, 150, 20],
      [100, 100, 150, 0],
      [100, 200, 50, 0],
      [100, 200, 500, 0],
    ];
    for (const args of cases) {
      expect(hosted.getStreamProgress(...args)).toBe(service.getStreamProgress(...args));
    }
  });
});
