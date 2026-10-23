"use client";
import { unstable_isUnrecognizedActionError } from "next/navigation";

const KEY = "studio:stale-reload";

/**
 * A page opened before a deployment posts forms (server actions) the new
 * deployment no longer knows: Next answers 404 "Server action not found" and
 * nothing happens (e.g. no sign-in code is sent). Reloading loads the current
 * deployment. Reloads at most once a minute so a real failure cannot loop.
 * Returns true when a reload was started.
 */
export function reloadIfStaleDeployment(error: unknown): boolean {
  if (!unstable_isUnrecognizedActionError(error)) return false;
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Storage blocked: still reload once; a second failure shows the error page.
  }
  window.location.reload();
  return true;
}
