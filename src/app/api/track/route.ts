import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { repo } from "@/lib/data";
import { isValidCode } from "@/lib/attribution";
import { trackReferral } from "@/lib/tracking";

/** Beacon used by private (/p/{slug}) and affiliate (/a/{code}) sales pages. */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  const { page, referral, event } = (await req.json().catch(() => ({}))) as { page?: string; referral?: string; event?: "view" | "cta" };
  if (page && isValidCode(page)) {
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
  if (!referral || !isValidCode(referral)) return res;
  const target = await repo().resolveReferral(referral);
  if (!target?.active) return res;
  const pending = event === "cta"
    ? repo().recordSalesEvent({ event: "cta_click", affiliateId: target.affiliateId, linkId: target.linkId, campaignId: target.campaignId })
    : trackReferral(req, res, { target, landingPath: `/a/${target.affiliateCode}` });
  after(() => pending.catch((e) => console.error("[track] page view failed", e)));
  return res;
}
