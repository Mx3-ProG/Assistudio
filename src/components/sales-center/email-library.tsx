"use client";
import { useMemo, useState } from "react";
import { Mail, TriangleAlert } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Badge, EmptyState, Notice } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { fmt } from "@/i18n/format";
import type { SalesContent } from "@/lib/sales/content";
import { mailtoHref } from "@/lib/sales/personalize";
import { PersonalizePanel, PersonalizeProvider, usePersonalize } from "./personalizer";
import { Filters, type FilterState } from "./filters";
import { FavoriteButton } from "./favorite-button";
import { TrackedCopy } from "./tracked-copy";
import { FallbackBadge } from "./fallback-badge";

type Item = SalesContent<"email_template"> & { fallback?: boolean };

export function EmailLibrary({ items, targets, urls, defaultUrl, advisorName, favorites, initial }: {
  items: Item[]; targets: { slug: string; name: string }[]; urls: Record<string, string>; defaultUrl: string;
  advisorName: string; favorites: string[]; initial: FilterState;
}) {
  const { t } = useI18n();
  const [f, setF] = useState(initial);
  const url = (f.target && urls[f.target]) || urls[""] || defaultUrl;
  const list = useMemo(() => items.filter((m) =>
    (!f.target || m.targetKey === null || m.targetKey === f.target) && (!f.stage || m.stage === f.stage)), [items, f]);
  const stages = [...new Set(items.map((m) => m.stage).filter(Boolean))] as string[];
  return (
    <PersonalizeProvider key={url} defaults={{ advisorName, affiliateUrl: url }}>
      <div className="grid gap-4">
        <Filters value={f} onChange={setF} targets={targets} stages={stages} />
        <PersonalizePanel />
        <Notice>{t.sc.emails.sendingLater}</Notice>
        {list.length === 0 && <div className="card"><EmptyState title={t.sc.empty} /></div>}
        {list.map((m) => <EmailCard key={m.id} m={m} url={url} fav={favorites.includes(`email_template:${m.key}`)} />)}
      </div>
    </PersonalizeProvider>
  );
}

function EmailCard({ m, url, fav }: { m: Item; url: string; fav: boolean }) {
  const { t } = useI18n();
  const { apply } = usePersonalize();
  const E = t.sc.emails;
  const subject = apply(m.body.subject);
  const preview = apply(m.body.preview);
  const body = apply(m.body.body);
  const cta = apply(m.body.cta);
  const full = `${body.text}\n\n${cta.text}: ${url}`;
  const missing = [...new Set([...subject.missing, ...body.missing])];
  const st = t.sc.stages as Record<string, string>;
  return (
    <article id={m.key} className="card scroll-mt-20 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold">{m.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {m.stage && <Badge tone="accent">{st[m.stage]}</Badge>}
            <FallbackBadge show={m.fallback} label={t.sc.englishFallback} />
          </div>
        </div>
        <FavoriteButton kind="email_template" contentKey={m.key} initial={fav} />
      </div>
      <dl className="mt-3 grid gap-2 rounded-2xl bg-surface-2 p-4 text-[14.5px]" dir="auto">
        <div className="flex items-start gap-2"><dt className="w-20 shrink-0 text-[12px] text-muted">{E.subject}</dt><dd className="font-medium">{subject.text}</dd></div>
        <div className="flex items-start gap-2"><dt className="w-20 shrink-0 text-[12px] text-muted">{E.preview}</dt><dd className="text-fg-2">{preview.text}</dd></div>
        <div className="mt-1 whitespace-pre-line border-t border-line pt-3 leading-relaxed">{body.text}</div>
        <div className="text-accent">{cta.text} → <span className="break-all font-mono text-[12.5px]">{url}</span></div>
      </dl>
      {missing.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-warning">
          <TriangleAlert className="size-3.5 shrink-0" />{fmt(t.sc.messages.missing, { list: missing.map((k) => t.sc.messages.vars[k]).join(", ") })}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <TrackedCopy value={`${subject.text}\n\n${full}`} kind="email_template" contentKey={m.key} label={t.sc.copyAll} variant="accent" size="md" className="flex-1 sm:flex-none" />
        <TrackedCopy value={subject.text} label={E.subject} size="md" />
        <a href={mailtoHref(null, subject.text, full)} className={buttonClass("secondary", "md")}><Mail className="size-4" />{E.openMail}</a>
      </div>
    </article>
  );
}
