import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { repo } from "@/lib/data";
import { isValidCode } from "@/lib/attribution";
import { trackReferral } from "@/lib/tracking";

/** Beacon used by private sales pages (/p/{slug}) to attribute the visit. */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  const { page, event } = (await req.json().catch(() => ({}))) as { page?: string; event?: "view" | "cta" };
  if (!page || !isValidCode(page)) return res;
  const p = await repo().getPrivatePage(page);
  if (!p) return res;
  const pending = event === "cta"
    ? repo().recordSalesEvent({ event: "cta_click", affiliateId: p.referral.affiliateId, privatePageId: p.id, campaignId: p.campaignId })
    : Promise.all([
        trackReferral(req, res, { target: p.referral, privatePageId: p.id, privatePageSlug: p.slug, landingPath: `/p/${p.slug}` }),
        repo().recordPrivatePageView(p.id),
      ]);
  after(() => pending.catch((e) => console.error("[track] page view failed", e)));
  return res;
}
