import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/data";
import { DOSSIER_COOKIE, authorizeDocument } from "@/lib/contracts/service";

export async function GET(request: NextRequest, { params }: RouteContext<"/api/dossier-documents/[id]">) {
  const { id } = await params; const session = await getSession().catch(() => null);
  const result = await authorizeDocument({ documentId: id, session, reference: request.nextUrl.searchParams.get("reference") ?? undefined, clientCookie: request.cookies.get(DOSSIER_COOKIE)?.value });
  if (!result) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(result.bytes), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${result.reference}-${result.kind}.pdf"`, "cache-control": "private, no-store" } });
}
