import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { defaultLocale, isLocale, resolveLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { isValidCode } from "@/lib/attribution";

/**
 * 1. Locale routing: every page lives under /{locale}/…
 * 2. Referral capture: any page URL carrying ?ref=CODE is routed through
 *    /s/CODE, the single place where clicks are recorded and cookies set.
 * 3. Supabase session refresh + optimistic auth redirect for private areas
 *    (the real authorisation check happens server-side in every page/action).
 * 4. Private areas and private sales pages are never indexable.
 */

function preferredLocale(req: NextRequest): Locale {
  const fromCookie = resolveLocale(req.cookies.get(LOCALE_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const l = resolveLocale(part.split(";")[0].trim());
    if (l) return l;
  }
  return defaultLocale;
}

const PRIVATE_AREA = /^\/[a-z]{2}\/(dashboard|admin)(\/|$)/;
const NOINDEX_AREA = /^\/[a-z]{2}\/(dashboard|admin|p|review|login|register|forgot|reset|buy|success)(\/|$)/;

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  // --- 2. referral capture
  const ref = searchParams.get("ref");
  if (ref && isValidCode(ref)) {
    const url = req.nextUrl.clone();
    url.pathname = `/s/${ref}`;
    const params = new URLSearchParams();
    const cleaned = new URLSearchParams(searchParams);
    cleaned.delete("ref");
    for (const [k, v] of searchParams) if (k.startsWith("utm_")) params.set(k, v);
    const qs = [...cleaned].filter(([k]) => !k.startsWith("utm_"));
    params.set("to", pathname + (qs.length ? `?${new URLSearchParams(qs)}` : ""));
    url.search = params.toString();
    return NextResponse.redirect(url);
  }

  // --- 1. locale routing
  if (!isLocale(first)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next({ request: { headers: new Headers(req.headers) } });
  if (req.cookies.get(LOCALE_COOKIE)?.value !== first) {
    res.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  if (NOINDEX_AREA.test(pathname)) res.headers.set("X-Robots-Tag", "noindex, nofollow");

  // --- 3. session refresh (only when Supabase is configured)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Explicit demo previews use their isolated in-memory session even when
  // Supabase variables are present in the deployment environment.
  if (process.env.STUDIO_DEMO_MODE !== "true" && !req.cookies.has("studio_demo_session") && url && key && PRIVATE_AREA.test(pathname)) {
    const sb = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    });
    const { data } = await sb.auth.getUser();
    if (!data.user) {
      const login = req.nextUrl.clone();
      login.pathname = `/${first}/login`;
      login.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(login);
    }
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/|api/|s/|auth/|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)"],
};
