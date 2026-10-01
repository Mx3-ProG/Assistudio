import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { LOCALE_COOKIE, defaultLocale, resolveLocale } from "@/i18n/config";

/**
 * OAuth providers land here. (Email sign-in no longer uses links: the app
 * emails a one-time code instead — see src/app/actions/auth.ts.)
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const nextParam = req.nextUrl.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, req.nextUrl.origin));
  }
  const locale = resolveLocale(next.split("/")[1]) ?? resolveLocale(req.cookies.get(LOCALE_COOKIE)?.value) ?? defaultLocale;
  return NextResponse.redirect(new URL(`/${locale}/login?error=callback`, req.nextUrl.origin));
}
