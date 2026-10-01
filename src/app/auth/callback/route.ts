import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isLocale } from "@/i18n/config";

/** Email verification, magic links, password recovery and OAuth all land here. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const nextParam = req.nextUrl.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, req.nextUrl.origin));
  }
  const first = next.split("/")[1] ?? "";
  const locale = isLocale(first) ? first : "en";
  return NextResponse.redirect(new URL(`/${locale}/login?error=callback`, req.nextUrl.origin));
}
