import {
  getSenderStreams,
  jsonResponse,
  errorResponse,
  STACKS_ADDRESS_RE,
} from "@/lib/openclaw-server";

export const dynamic = "force-dynamic";

// GET /api/streams/sender/:address — streams where address is sender
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    if (!STACKS_ADDRESS_RE.test(address)) {
      return jsonResponse({ error: "Invalid Stacks address" }, 400);
    }
    const ids = await getSenderStreams(address);
    return jsonResponse({ address, streamIds: ids, count: ids.length });
  } catch (err) {
    return errorResponse(err);
  }
}
