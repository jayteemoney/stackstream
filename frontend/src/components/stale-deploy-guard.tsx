"use client";

/**
 * Self-healing for tabs left open across deploys.
 *
 * Every deploy replaces the content-hashed chunk files, so a tab still
 * running the previous build fails as soon as it lazily loads anything
 * ("module factory is not available", ChunkLoadError, ...). The only correct
 * recovery is reloading onto the new build — this guard does it once,
 * automatically, instead of showing users module gibberish.
 */

import { useEffect } from "react";
import { isStaleChunk } from "@/lib/wallet-errors";

const RELOADED_AT_KEY = "stale-deploy-reloaded-at";
const RELOAD_LOOP_WINDOW_MS = 30_000;

function reloadOnceForNewDeploy() {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT_KEY) ?? 0);
    // If we already reloaded very recently, don't loop — the failure is
    // something else (offline, blocked CDN) and reloading won't help.
    if (Date.now() - last < RELOAD_LOOP_WINDOW_MS) return;
    sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  } catch {
    /* sessionStorage unavailable — still better to reload than stay broken */
  }
  window.location.reload();
}

export function StaleDeployGuard() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isStaleChunk(event.error ?? event.message)) {
        event.preventDefault();
        reloadOnceForNewDeploy();
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isStaleChunk(event.reason)) {
        event.preventDefault();
        reloadOnceForNewDeploy();
      }
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
