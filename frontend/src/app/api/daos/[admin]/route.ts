import {
  getDao,
  formatTokenAmount,
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
      totalDepositedFormatted: formatTokenAmount(dao.totalDeposited),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
