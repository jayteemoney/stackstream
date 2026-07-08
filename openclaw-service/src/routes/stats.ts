import { Router } from "express";
import {
  getStreamNonce,
  getDaoCount,
  getCurrentBlockHeight,
  getNetwork,
} from "../stacks-client";

const router = Router();

interface StatsSnapshot {
  network: string;
  blockHeight: number;
  streamsCreated: number;
  workspacesRegistered: number;
  asOf: string;
}

// The north-star number changes at most once per new stream, so a short cache
// keeps repeated dashboard/marketing polls from burning Hiro quota.
const CACHE_TTL_MS = 60_000;
let cached: { snapshot: StatsSnapshot; expires: number } | null = null;

// GET /api/stats — protocol usage counters, all verifiable on-chain.
// streamsCreated mirrors stream-manager's get-stream-nonce (total streams ever
// opened), the project's north-star growth metric.
router.get("/", async (_req, res, next) => {
  try {
    if (cached && Date.now() < cached.expires) {
      res.json(cached.snapshot);
      return;
    }
    const [streamsCreated, workspacesRegistered, blockHeight] =
      await Promise.all([
        getStreamNonce(),
        getDaoCount(),
        getCurrentBlockHeight(),
      ]);
    const snapshot: StatsSnapshot = {
      network: getNetwork(),
      blockHeight,
      streamsCreated,
      workspacesRegistered,
      asOf: new Date().toISOString(),
    };
    cached = { snapshot, expires: Date.now() + CACHE_TTL_MS };
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});

export default router;
