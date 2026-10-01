"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Clock, MessageCircle, Mail, Phone, Users, MoreHorizontal } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { TrackedCopy } from "@/components/sales-center/tracked-copy";
import { markFollowUpSent } from "@/app/actions/sales-center";
import { whatsappHref, mailtoHref } from "@/lib/sales/personalize";
import { fmt } from "@/i18n/format";
import { formatRelative } from "@/lib/money";

export interface FollowUpItem {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  stageLabel: string;
  daysSince: number;
  sequenceKey: string;
  step: { day: number; goal: string; channel: string; text: string } | null;
  plannedAt: string | null;
  plannedLabel: string | null;
}

const ICON: Record<string, typeof Phone> = { phone: Phone, email: Mail, linkedin: Users, whatsapp: MessageCircle, sms: MessageCircle, instagram: MessageCircle };

/** Today's follow-ups from the CRM: the message to send, one tap to copy / open the app, one tap to plan the next one. */
export function FollowUpList({ due, upcoming }: { due: FollowUpItem[]; upcoming: FollowUpItem[] }) {
  const { t, locale } = useI18n();
  const F = t.cp.followUps;
  return (
    <div className="grid gap-8">
      <section>
        <h2 className="mb-3 text-[15px] font-semibold">{F.due} <span className="tabular text-muted">· {due.length}</span></h2>
        {due.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-[15px] font-medium">{F.none}</p>
            <p className="mt-1 text-[13px] text-muted">{F.noneHint}</p>
            <Link href={`/${locale}/dashboard/prospects?new=1`} className={buttonClass("secondary", "md", "mt-4")}>{F.addFirst}</Link>
          </div>
        ) : (
          <ul className="grid gap-3">{due.map((x) => <DueRow key={x.id} x={x} />)}</ul>
        )}
      </section>
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold">{F.upcoming}</h2>
          <ul className="card divide-y divide-line">
            {upcoming.map((x) => (
              <li key={x.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <Clock className="size-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{x.name}{x.company && <span className="text-muted"> · {x.company}</span>}</p>
                  <p className="truncate text-[12px] text-muted">{x.plannedLabel}</p>
                </div>
                {x.plannedAt && <span className="shrink-0 text-[12px] text-muted">{fmt(F.planned, { when: formatRelative(x.plannedAt, locale) })}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DueRow({ x }: { x: FollowUpItem }) {
  const { t, locale } = useI18n();
  const F = t.cp.followUps;
  const [state, setState] = useState<"idle" | "sent" | "finished">("idle");
  const [pending, start] = useTransition();
  const step = x.step!;
  const Icon = ICON[step.channel] ?? MoreHorizontal;
  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">{x.name}{x.company && <span className="font-normal text-muted"> · {x.company}</span>}</p>
        <Badge tone="warning"><Icon className="size-3" />{fmt(F.step, { day: step.day, goal: step.goal })}</Badge>
      </div>
      <p className="mt-1 text-[12px] text-muted">{fmt(F.since, { n: x.daysSince, stage: x.stageLabel })} · {t.sc.channels[step.channel as keyof typeof t.sc.channels] ?? step.channel}</p>
      <p className="mt-3 whitespace-pre-line rounded-xl bg-surface-2 p-3 text-[14.5px] leading-relaxed">{step.text}</p>
      {state === "idle" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <TrackedCopy value={step.text} kind="sequence" contentKey={x.sequenceKey} variant="accent" size="md" />
          {x.phone && (step.channel === "whatsapp" || step.channel === "sms") && (
            <a href={whatsappHref(step.text, x.phone)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}><MessageCircle className="size-4" />WhatsApp</a>
          )}
          {x.email && step.channel === "email" && (
            <a href={mailtoHref(x.email, step.goal, step.text)} className={buttonClass("secondary", "md")}><Mail className="size-4" />Email</a>
          )}
          <button disabled={pending} onClick={() => start(async () => {
            const r = await markFollowUpSent(x.id, x.sequenceKey, locale);
            if (r.ok) setState(r.finished ? "finished" : "sent");
          })} className={buttonClass("primary", "md")}><Check className="size-4" />{F.sent}</button>
        </div>
      ) : (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-success">
          <Check className="size-4" />{state === "sent" ? F.sentDone : F.finished}
          <Link href={`/${locale}/dashboard/prospects`} className="font-medium text-accent hover:underline">{F.openCrm}</Link>
        </p>
      )}
    </li>
  );
}
