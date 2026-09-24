import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { repo } from "@/lib/data";
import { isValidCode } from "@/lib/attribution";
import { defaultLocale, resolveLocale, LOCALE_COOKIE } from "@/i18n/config";
import { trackReferral } from "@/lib/tracking";

/**
 * Affiliate entry point: /s/{slug|code|linkCode}[?to=/fr/studio&utm_…]
 * Records the click, sets the attribution cookie, then redirects to a clean URL.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/s/[code]">) {
  const { code } = await ctx.params;
  const locale = resolveLocale(req.cookies.get(LOCALE_COOKIE)?.value)
    ?? resolveLocale(req.headers.get("accept-language")?.split(",")[0]) ?? defaultLocale;

  // Only same-origin relative destinations (no open redirect).
  const to = req.nextUrl.searchParams.get("to");
  const dest = to && to.startsWith("/") && !to.startsWith("//") && !to.includes("\\") ? to : `/${locale}/studio`;
  const res = NextResponse.redirect(new URL(dest, req.nextUrl.origin), 307);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");

  if (!isValidCode(code)) return res;
  const target = await repo().resolveReferral(code);
  if (!target) return res;

  // Cookies must be set before responding; the DB write can finish after.
  const pending = trackReferral(req, res, { target, landingPath: dest });
  after(() => pending.catch((e) => console.error("[track] click failed", e)));
  return res;
}
