"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStacksTx } from "@/hooks/use-stacks-tx";
import { buildTrackStreamTx } from "@/lib/stacks";
import { formatTxError } from "@/lib/utils";

/**
 * Links one stream to the sender's organisation, so it counts on the
 * organisation's public record. Render it only for an unlinked stream whose
 * sender has an active workspace; the contract refuses anything else.
 */
export function LinkStreamButton({
  streamId,
  workspaceName,
  onLinked,
  size = "sm",
}: {
  streamId: number;
  workspaceName: string;
  onLinked: () => void;
  size?: "sm" | "md";
}) {
  const { execute, isWorking } = useStacksTx();

  async function link() {
    const result = await execute(buildTrackStreamTx(streamId));
    if (result?.confirmed) {
      toast.success(`Stream #${streamId} now counts for ${workspaceName}`);
      onLinked();
    } else if (result && !result.confirmed) {
      toast.error(formatTxError("Could not link the stream", result));
    }
  }

  return (
    <Button variant="outline" size={size} onClick={link} loading={isWorking}>
      <Link2 className="h-3.5 w-3.5" />
      Link to {workspaceName}
    </Button>
  );
}
