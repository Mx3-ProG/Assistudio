import { NextResponse, type NextRequest } from "next/server";
import { publicProofEvents } from "@/lib/proof-server";

/**
 * Public, read-only: published, verified, real proof events whose source is
 * still valid (month precision, anonymised label). Never generated.
 */
export async function GET(req: NextRequest) {
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 6, 1), 24);
  const items = (await publicProofEvents(limit)).map((e) => ({
    id: e.id, type: e.type, label: e.label, valueCents: e.valueCents, currency: e.currency, month: e.month, verified: e.verified, proofType: e.proofType,
  }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
