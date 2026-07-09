import {
  getStreamNonce,
  getDaoCount,
  getCurrentBlockHeight,
  getNetwork,
  jsonResponse,
  errorResponse,
} from "@/lib/openclaw-server";

export const dynamic = "force-dynamic";

interface StatsSnapshot {
  network: string;
  blockHeight: number;
  streamsCreated: number;
  workspacesRegistered: number;
  asOf: string;
}

// The north-star number changes at most once per new stream, so a short cache
// keeps repeated polls from burning Hiro quota. Module state persists per warm
// serverless instance, which is enough — a cold start just refetches.
const CACHE_TTL_MS = 60_000;
let cached: { snapshot: StatsSnapshot; expires: number } | null = null;

// GET /api/stats — protocol usage counters, all verifiable on-chain.
// streamsCreated mirrors stream-manager's get-stream-nonce (total streams ever
// opened), the project's north-star growth metric.
export async function GET() {
  try {
    if (cached && Date.now() < cached.expires) {
      return jsonResponse(cached.snapshot);
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
    return jsonResponse(snapshot);
  } catch (err) {
    return errorResponse(err);
  }
}
