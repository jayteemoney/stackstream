import {
  getCurrentBlockHeight,
  jsonResponse,
  errorResponse,
} from "@/lib/openclaw-server";

export const dynamic = "force-dynamic";

// GET /api/blocks/current — current Stacks block height
export async function GET() {
  try {
    const height = await getCurrentBlockHeight();
    return jsonResponse({ blockHeight: height });
  } catch (err) {
    return errorResponse(err);
  }
}
