"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Phone, Mail, MessageCircle, Users, MoreHorizontal, UserPlus, ExternalLink, Plus } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { MarketIcon } from "@/components/marketing/markets-grid";
import { personalize } from "@/lib/sales/personalize";
import type { SalesContent, PlaybookBody } from "@/lib/sales/content";
import type { MarketContent } from "@/content/markets";
import { trackUsage } from "@/app/actions/sales-center";
import { TrackedCopy } from "./tracked-copy";
import { cn } from "@/lib/cn";

export interface StartTarget { slug: string; icon: string; relevance: number; c: MarketContent }
type Channel = "phone" | "email" | "linkedin" | "whatsapp" | "in_person" | "other";
const CHANNELS: { key: Channel; icon: typeof Phone }[] = [
  { key: "phone", icon: Phone }, { key: "email", icon: Mail }, { key: "linkedin", icon: Users },
  { key: "whatsapp", icon: MessageCircle }, { key: "in_person", icon: UserPlus }, { key: "other", icon: MoreHorizontal },
];

export function StartSelling({ targets, messages, emails, scripts, objections, playbooks, urls, hasPage, advisorName, initialTarget }: {
  targets: StartTarget[];
  messages: SalesContent<"message">[]; emails: SalesContent<"email_template">[]; scripts: SalesContent<"call_script">[];
  objections: SalesContent<"objection">[]; playbooks: SalesContent<"playbook">[];
  urls: Record<string, string>; hasPage: Record<string, boolean>; advisorName: string; initialTarget?: string | null;
}) {
  const { t, locale } = useI18n();
  const S = t.sc.start;
  const [target, setTarget] = useState<StartTarget | null>(targets.find((x) => x.slug === initialTarget) ?? null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const base = `/${locale}/dashboard/sales-center`;

  useEffect(() => {
    if (target && channel) void trackUsage("start_selling", { target: target.slug, channel });
  }, [target, channel]);

  if (!target) {
    return (
      <section>
        <h2 className="text-[22px] font-semibold tracking-tight">{S.stepTarget}</h2>
        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {targets.map((x) => (
            <li key={x.slug}>
              <button onClick={() => setTarget(x)} className="card flex h-full w-full flex-col items-start gap-2 p-4 text-start transition hover:-translate-y-0.5 hover:shadow-md">
                <MarketIcon name={x.icon} className="size-5 text-accent" />
                <span className="text-[15px] font-semibold">{x.c.name}</span>
                <span className="line-clamp-2 text-[12.5px] text-muted">{x.c.who}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const header = (
    <div className="card flex flex-wrap items-center gap-2 p-3">
      <Badge tone="accent"><MarketIcon name={target.icon} className="size-3" />{target.c.name}</Badge>
      {channel && <Badge>{t.sc.channels[channel]}</Badge>}
      <span className="flex-1" />
      <button onClick={() => { setTarget(null); setChannel(null); }} className={buttonClass("ghost", "sm")}>{S.change}</button>
    </div>
  );

  if (!channel) {
    return (
      <section className="grid gap-4">
        {header}
        <h2 className="text-[22px] font-semibold tracking-tight">{S.stepChannel}</h2>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {CHANNELS.map(({ key, icon: Icon }) => (
            <li key={key}>
              <button onClick={() => setChannel(key)} className="card flex h-20 w-full items-center gap-3 px-4 text-start transition hover:shadow-md">
                <Icon className="size-5 text-accent" /><span className="text-[15px] font-medium">{t.sc.channels[key]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const forT = <T extends SalesContent>(xs: T[]) =>
    [...xs.filter((x) => x.targetKey === target.slug), ...xs.filter((x) => x.targetKey === null)];
  const url = urls[target.slug] ?? urls[""];
  const labels = t.sc.messages.vars;
  const fill = (s: string) => personalize(s, { advisorName, affiliateUrl: url }, labels).text;
  const playbook = forT(playbooks)[0];
  const opening = (playbook?.body as PlaybookBody | undefined)?.steps.find((s) => s.key === "opening");
  const script = forT(scripts)[0];
  const email = forT(emails).find((e) => e.stage === "first_contact") ?? forT(emails)[0];
  const msgChannel = channel === "whatsapp" ? ["whatsapp", "sms"] : channel === "linkedin" ? ["linkedin"] : channel === "in_person" ? ["in_person"] : [];
  const message = forT(messages).find((m) => m.stage === "first_contact" && m.channel && msgChannel.includes(m.channel))
    ?? forT(messages).find((m) => m.stage === (channel === "in_person" ? "follow_up" : "first_contact") && (!m.channel || msgChannel.includes(m.channel) || m.channel === "other"))
    ?? forT(messages).find((m) => m.stage === "first_contact");
  const objs = forT(objections).slice(0, 3);

  return (
    <section className="grid gap-4">
      {header}
      <div className="grid gap-4 lg:grid-cols-2">
        {opening && (
          <Card title={S.opening}>
            <p className="text-[15px]">{opening.body}</p>
            {opening.bullets?.map((b) => <p key={b} className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-[14.5px]">{b}</p>)}
          </Card>
        )}
        {target.c.discovery?.length ? (
          <Card title={S.questions}>
            <ul className="grid gap-1.5">{target.c.discovery.map((q) => <li key={q} className="rounded-xl bg-surface-2 px-3 py-2 text-[14.5px]">{q}</li>)}</ul>
          </Card>
        ) : null}
        <Card title={S.pitch}>
          <p className="text-[15px] leading-relaxed">{target.c.angle}</p>
          {target.c.avoid && <p className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-[13.5px]"><strong>{S.avoid} · </strong>{target.c.avoid}</p>}
        </Card>
        {(channel === "phone" || channel === "in_person") && script && (
          <Card title={S.script}>
            <ol className="grid gap-1.5">{script.body.steps.slice(0, 4).map((s, n) => <li key={n} className="text-[14.5px]"><span className="text-muted">{t.sc.calls.types[s.type]} · </span>{fill(s.text)}</li>)}</ol>
            <Link href={`${base}/calls/${script.key}`} className={buttonClass("primary", "md", "mt-3")}>{t.sc.open}<ArrowRight className="flip-rtl size-4" /></Link>
          </Card>
        )}
        {channel === "email" && email && (
          <Card title={S.email}>
            <p className="font-medium">{fill(email.body.subject)}</p>
            <p className="mt-2 line-clamp-6 whitespace-pre-line text-[14px] text-fg-2">{fill(email.body.body)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <TrackedCopy value={`${fill(email.body.subject)}\n\n${fill(email.body.body)}\n\n${fill(email.body.cta)}: ${url}`} kind="email_template" contentKey={email.key} variant="accent" size="md" label={t.sc.copyAll} />
              <Link href={`${base}/emails?target=${target.slug}#${email.key}`} className={buttonClass("secondary", "md")}>{t.sc.messages.personalise}</Link>
            </div>
          </Card>
        )}
        {channel !== "email" && message && (
          <Card title={S.message}>
            <p className="whitespace-pre-line rounded-xl bg-surface-2 p-3 text-[14.5px]">{fill(message.body.text)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <TrackedCopy value={fill(message.body.text)} kind="message" contentKey={message.key} variant="accent" size="md" />
              <Link href={`${base}/messages?target=${target.slug}#${message.key}`} className={buttonClass("secondary", "md")}>{t.sc.messages.personalise}</Link>
            </div>
          </Card>
        )}
        {objs.length > 0 && (
          <Card title={S.objections}>
            <ul className="grid gap-2">{objs.map((o) => <li key={o.key} className="text-[14px]"><strong>{o.body.objection}</strong><br /><span className="text-fg-2">{o.body.short}</span></li>)}</ul>
            <Link href={`${base}/objections`} className="mt-2 inline-block text-[13px] font-medium text-accent hover:underline">{t.sc.sections.objections.title} →</Link>
          </Card>
        )}
        <Card title={S.cta}>
          {hasPage[target.slug] ? (
            <>
              <p className="truncate font-mono text-[13px]" dir="ltr">{url}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TrackedCopy value={url} variant="accent" size="md" />
                <a href={url} target="_blank" rel="noopener" className={buttonClass("secondary", "md")}><ExternalLink className="size-4" />{t.sc.preview}</a>
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] text-muted">{S.noPage}</p>
              <Link href={`${base}/pages?new=1&target=${target.slug}`} className={buttonClass("accent", "md", "mt-3")}><Plus className="size-4" />{S.createPage}</Link>
            </>
          )}
        </Card>
        <Card title={S.crm}>
          <p className="text-[14px] text-muted">{S.crmBody}</p>
          <Link href={`/${locale}/dashboard/prospects?new=1&target=${target.slug}`} className={buttonClass("primary", "md", "mt-3")}><UserPlus className="size-4" />{t.sc.quick.addProspect}</Link>
        </Card>
      </div>
      {playbook && <Link href={`${base}/playbooks/${playbook.key}?target=${target.slug}`} className={buttonClass("secondary", "lg", "justify-self-start")}>{S.openPlaybook}<ArrowRight className="flip-rtl size-4" /></Link>}
    </section>
  );
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card p-4 sm:p-5", className)}>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{title}</h3>
      {children}
    </div>
  );
}
