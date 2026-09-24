import {
  MousePointerClick, UserRound, Inbox, CalendarCheck, Hourglass, CreditCard, BadgeCheck, Banknote, Repeat, UserMinus,
} from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { ActivityEvent, ActivityType } from "@/lib/data/types";
import { formatMoney, formatRelative } from "@/lib/money";
import { cn } from "@/lib/cn";

const META: Record<ActivityType, { icon: typeof Inbox; tone: string }> = {
  click: { icon: MousePointerClick, tone: "bg-surface-2 text-muted" },
  visitor: { icon: UserRound, tone: "bg-surface-2 text-muted" },
  lead: { icon: Inbox, tone: "bg-accent-soft text-accent" },
  appointment: { icon: CalendarCheck, tone: "bg-accent-soft text-accent" },
  sale_pending: { icon: Hourglass, tone: "bg-warning-soft text-warning" },
  payment_confirmed: { icon: CreditCard, tone: "bg-success-soft text-success" },
  commission_validated: { icon: BadgeCheck, tone: "bg-success-soft text-success" },
  commission_paid: { icon: Banknote, tone: "bg-success-soft text-success" },
  renewal: { icon: Repeat, tone: "bg-success-soft text-success" },
  customer_lost: { icon: UserMinus, tone: "bg-danger-soft text-danger" },
};

/** Live activity. Payloads carry no unnecessary personal data (profession, refs, amounts only). */
export function ActivityFeed({ events, t, locale }: { events: ActivityEvent[]; t: Dictionary; locale: Locale }) {
  if (!events.length) return <p className="px-6 py-10 text-center text-[14px] text-muted">{t.dash.activityEmpty}</p>;
  return (
    <ul className="divide-y divide-line">
      {events.map((e) => {
        const m = META[e.type];
        const detail =
          typeof e.payload.amount_cents === "number" ? formatMoney(e.payload.amount_cents, locale)
          : typeof e.payload.profession === "string" ? e.payload.profession
          : typeof e.payload.sale_ref === "string" ? e.payload.sale_ref
          : typeof e.payload.source === "string" ? e.payload.source : null;
        return (
          <li key={e.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", m.tone)}><m.icon className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium">{t.dash.activity[e.type]}</p>
              {detail && <p className="truncate text-[12px] text-muted">{detail}</p>}
            </div>
            <time className="shrink-0 text-[12px] text-muted" dateTime={e.occurredAt}>{formatRelative(e.occurredAt, locale)}</time>
          </li>
        );
      })}
    </ul>
  );
}
