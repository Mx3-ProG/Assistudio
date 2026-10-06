import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { formatDate } from "@/lib/money";
import type { MyTestimonial } from "@/lib/proof";
import { withdrawMyReview } from "@/app/actions/proof";
import { Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { ConfirmSubmit } from "./confirm-submit";

const TONE = { pending: "warning", approved: "success", rejected: "neutral", hidden: "neutral" } as const;

/** The partner's own reviews: status, where they appear, and consent withdrawal. */
export function MyTestimonials({ t, locale, items }: { t: Dictionary; locale: Locale; items: MyTestimonial[] }) {
  const M = t.pf.my;
  if (!items.length) return <p className="text-[14px] text-muted">{M.empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((r) => (
        <li key={r.id} className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TONE[r.status]}>{M.status[r.status]}</Badge>
            {r.consentWithdrawn && <Badge>{M.withdrawn}</Badge>}
            <span className="text-[12px] text-muted">{r.ref} · {formatDate(r.createdAt, locale)}</span>
          </div>
          <p className="mt-2 line-clamp-3 text-[14px] text-fg-2">“{r.content}”</p>
          {r.status === "approved" && r.placements.length > 0 && (
            <p className="mt-1 text-[12px] text-muted">{fmt(M.placements, { list: r.placements.map((p) => t.pf.admin.places[p]).join(", ") })}</p>
          )}
          {!r.consentWithdrawn && (
            <form action={withdrawMyReview} className="mt-2">
              <input type="hidden" name="id" value={r.id} />
              <ConfirmSubmit message={M.withdrawConfirm} className={buttonClass("ghost", "sm", "text-danger")}>{M.withdraw}</ConfirmSubmit>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
