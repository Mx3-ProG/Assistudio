import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/data";
import { isLocale } from "@/i18n/config";
import { isOfferTier } from "@/lib/offers";
import { generateFallbackDocument } from "@/lib/contracts/service";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: RouteContext<"/api/dossier-templates/[kind]">) {
  const { kind } = await params; const session = await getSession();
  const locale = request.nextUrl.searchParams.get("locale") ?? "en"; const tier = request.nextUrl.searchParams.get("tier") ?? "pro";
  if (!session || (kind !== "brief" && kind !== "quote") || !isLocale(locale) || !isOfferTier(tier)) return new NextResponse("Not found", { status: 404 });
  try {
    const result = await generateFallbackDocument(session, locale, kind, tier);
    return new NextResponse(new Uint8Array(result.bytes), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${result.filename}"`, "cache-control": "private, no-store" } });
  } catch { return new NextResponse("A reviewed template is not published for this language.", { status: 409 }); }
}
