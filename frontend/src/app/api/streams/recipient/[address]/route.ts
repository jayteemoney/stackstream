import {
  getRecipientStreams,
  jsonResponse,
  errorResponse,
  STACKS_ADDRESS_RE,
} from "@/lib/openclaw-server";

export const dynamic = "force-dynamic";

// GET /api/streams/recipient/:address — streams where address is recipient
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    if (!STACKS_ADDRESS_RE.test(address)) {
      return jsonResponse({ error: "Invalid Stacks address" }, 400);
    }
    const ids = await getRecipientStreams(address);
    return jsonResponse({ address, streamIds: ids, count: ids.length });
  } catch (err) {
    return errorResponse(err);
  }
}
