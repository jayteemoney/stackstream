import {
  getStream,
  getClaimableBalance,
  getStreamedAmount,
  getRemainingBalance,
  getRefundableAmount,
  getCurrentBlockHeight,
  getTokenDecimals,
  getStreamStatusLabel,
  getStreamProgress,
  formatTokenAmount,
  jsonResponse,
  errorResponse,
  STREAM_ID_RE,
} from "@/lib/openclaw-server";

export const dynamic = "force-dynamic";

// GET /api/streams/:id — full stream data with computed fields
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    if (!STREAM_ID_RE.test(rawId)) {
      return jsonResponse({ error: "Invalid stream id" }, 400);
    }
    const id = Number(rawId);

    const stream = await getStream(id);
    if (!stream) {
      return jsonResponse({ error: "Stream not found" }, 404);
    }

    const [claimable, streamed, remaining, refundable, currentBlock, decimals] =
      await Promise.all([
        getClaimableBalance(id),
        getStreamedAmount(id),
        getRemainingBalance(id),
        getRefundableAmount(id),
        getCurrentBlockHeight(),
        getTokenDecimals(stream.token),
      ]);

    const progress = getStreamProgress(
      stream.startBlock,
      stream.endBlock,
      currentBlock,
      stream.totalPausedDuration
    );

    return jsonResponse({
      streamId: id,
      ...stream,
      statusLabel: getStreamStatusLabel(stream.status),
      claimable,
      streamed,
      remaining,
      refundable,
      currentBlock,
      progress: Math.round(progress * 100) / 100,
      tokenDecimals: decimals,
      depositFormatted:
        decimals !== null
          ? formatTokenAmount(stream.depositAmount, decimals)
          : null,
      claimableFormatted:
        decimals !== null && claimable !== null
          ? formatTokenAmount(claimable, decimals)
          : null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
