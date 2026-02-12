"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentBlockHeight } from "@/lib/stacks";
import { useAppStore } from "@/stores/app-store";
import { BLOCK_POLL_INTERVAL } from "@/lib/constants";
import { useEffect } from "react";

export function useBlockHeight() {
  const setCurrentBlockHeight = useAppStore((s) => s.setCurrentBlockHeight);
  const currentBlockHeight = useAppStore((s) => s.currentBlockHeight);

  const query = useQuery({
    queryKey: ["block-height"],
    queryFn: getCurrentBlockHeight,
    refetchInterval: BLOCK_POLL_INTERVAL,
  });

  useEffect(() => {
    if (query.data && query.data !== currentBlockHeight) {
      setCurrentBlockHeight(query.data);
    }
  }, [query.data, currentBlockHeight, setCurrentBlockHeight]);

  return {
    blockHeight: query.data ?? currentBlockHeight,
    isLoading: query.isLoading,
  };
}
