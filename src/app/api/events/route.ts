import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/data";
import { looksLikeBot } from "@/lib/attribution";
import { AMBASSADOR_CLIENT_EVENTS, parseFunnelPayload } from "@/lib/analytics/events";
import { recordFunnel } from "@/lib/analytics/server";

/**
 * Funnel beacon (src/lib/analytics/client.ts). Cookie-free: anonymous events
 * are stored without any identifier; the ambassador is attached only from the
 * server session, never from the request body.
 */
export async function POST(req: NextRequest) {
  const res = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  if (looksLikeBot(req.headers.get("user-agent"))) return res;
  const text = await req.text().catch(() => "");
  if (!text || text.length > 2000) return res;
  let body: unknown;
  try { body = JSON.parse(text); } catch { return res; }
  const p = parseFunnelPayload(body);
  if (!p) return res;
  const ambassadorOnly = AMBASSADOR_CLIENT_EVENTS.includes(p.event);
  const s = ambassadorOnly ? await getSession().catch(() => null) : null;
  if (ambassadorOnly && !s?.affiliate) return res;
  recordFunnel({ event: p.event, affiliateId: s?.affiliate?.id ?? null, locale: p.locale, placement: p.placement, meta: p.meta });
  return res;
}
