import { errorResponse, jsonResponse } from "@/lib/openclaw-server";
import { getProtocolMetrics } from "@/lib/protocol-metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await getProtocolMetrics();
    const response = jsonResponse(metrics);
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
