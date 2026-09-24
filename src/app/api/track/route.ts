import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { repo } from "@/lib/data";
import { isValidCode } from "@/lib/attribution";
import { trackReferral } from "@/lib/tracking";

/** Beacon used by private sales pages (/p/{slug}) to attribute the visit. */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  const { page } = (await req.json().catch(() => ({}))) as { page?: string };
  if (!page || !isValidCode(page)) return res;
  const p = await repo().getPrivatePage(page);
  if (!p) return res;
  const pending = Promise.all([
    trackReferral(req, res, { target: p.referral, privatePageId: p.id, privatePageSlug: p.slug, landingPath: `/p/${p.slug}` }),
    repo().recordPrivatePageView(p.id),
  ]);
  after(() => pending.catch((e) => console.error("[track] page view failed", e)));
  return res;
}
