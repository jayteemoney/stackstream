import { jsonResponse, errorResponse } from "@/lib/openclaw-server";
import { getOrganisationDirectory } from "@/lib/organisations";

export const dynamic = "force-dynamic";

// GET /api/organisations: every organisation registered on stream-factory,
// newest first, with the authoritative total from get-dao-count.
export async function GET() {
  try {
    return jsonResponse(await getOrganisationDirectory());
  } catch (err) {
    return errorResponse(err);
  }
}
