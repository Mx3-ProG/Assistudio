import { NextResponse, type NextRequest } from "next/server";
import { PLACEMENTS, TESTIMONIAL_TYPES, toPublicTestimonial, type Placement, type TestimonialType } from "@/lib/proof";
import { publicTestimonials } from "@/lib/proof-server";

/**
 * Public, read-only: approved + consented testimonials of one placement.
 * Whitelisted fields only (no email, no account id, no storage path).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const placement = sp.get("placement");
  const type = sp.get("type");
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 12, 1), 24);
  if (placement && !(PLACEMENTS as readonly string[]).includes(placement)) return NextResponse.json({ error: "invalid_placement" }, { status: 400 });
  if (type && !(TESTIMONIAL_TYPES as readonly string[]).includes(type)) return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  const items = await publicTestimonials({ placement: (placement as Placement) || undefined, type: (type as TestimonialType) || undefined, limit });
  return NextResponse.json({ items: items.map(toPublicTestimonial) }, { headers: { "Cache-Control": "no-store" } });
}
