import {
  getDao,
  jsonResponse,
  errorResponse,
  STACKS_ADDRESS_RE,
} from "@/lib/openclaw-server";

export const dynamic = "force-dynamic";

// GET /api/daos/:admin — DAO info by admin address
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ admin: string }> }
) {
  try {
    const { admin } = await params;
    if (!STACKS_ADDRESS_RE.test(admin)) {
      return jsonResponse({ error: "Invalid Stacks address" }, 400);
    }
    const dao = await getDao(admin);
    if (!dao) {
      return jsonResponse({ error: "DAO not found" }, 404);
    }
    return jsonResponse({
      ...dao,
      // No `totalDepositedFormatted`.
      //
      // `total-deposited` is a single uint that stream-factory increments by
      // the raw deposit of every tracked stream, regardless of which token that
      // stream uses. Summing 1e8-scale sBTC raw units with 1e6-scale USDA raw
      // units yields a number that is not an amount of anything.
      //
      // This route previously ran it through formatTokenAmount() with the
      // default 8 decimals, publishing a confidently wrong figure. There is no
      // correct single-token rendering without a per-token breakdown, and
      // `daos` has no token key to derive one from — that needs a contract
      // change, not a display fix. Until then, consumers must show the raw
      // integer with a label that says what it is, or omit it.
      totalDepositedIsCrossTokenAggregate: true,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
