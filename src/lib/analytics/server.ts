import "server-only";
import { after } from "next/server";
import { repo } from "@/lib/data";
import type { FunnelEventInput } from "@/lib/data/types";

/** Records a funnel event after the response is sent. Best-effort: analytics never breaks a user action. */
export function recordFunnel(e: FunnelEventInput) {
  after(() => repo().recordFunnelEvent(e).catch(() => undefined));
}
