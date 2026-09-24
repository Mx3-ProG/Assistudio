"use client";
import { useMemo, useState } from "react";
import { Mail, MessageCircle, TriangleAlert } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { fmt } from "@/i18n/format";
import type { SalesContent } from "@/lib/sales/content";
import { mailtoHref, whatsappHref } from "@/lib/sales/personalize";
import { PersonalizePanel, PersonalizeProvider, usePersonalize } from "./personalizer";
import { Filters, type FilterState } from "./filters";
import { FavoriteButton } from "./favorite-button";
import { TrackedCopy } from "./tracked-copy";
import { FallbackBadge } from "./fallback-badge";

type Item = SalesContent<"message"> & { fallback?: boolean };

export function MessageLibrary({ items, targets, urls, defaultUrl, advisorName, favorites, initial }: {
  items: Item[]; targets: { slug: string; name: string }[]; urls: Record<string, string>; defaultUrl: string;
  advisorName: string; favorites: string[]; initial: FilterState;
}) {
  const [f, setF] = useState(initial);
  const url = (f.target && urls[f.target]) || urls[""] || defaultUrl;
  return (
    <PersonalizeProvider key={url} defaults={{ advisorName, affiliateUrl: url }}>
      <Inner items={items} targets={targets} favorites={favorites} f={f} setF={setF} />
    </PersonalizeProvider>
  );
}

function Inner({ items, targets, favorites, f, setF }: {
  items: Item[]; targets: { slug: string; name: string }[]; favorites: string[]; f: FilterState; setF: (v: FilterState) => void;
}) {
  const { t } = useI18n();
  const list = useMemo(() => items.filter((m) =>
    (!f.target || m.targetKey === null || m.targetKey === f.target)
    && (!f.channel || m.channel === f.channel)
    && (!f.stage || m.stage === f.stage)), [items, f]);
  const channels = [...new Set(items.map((m) => m.channel).filter(Boolean))] as string[];
  const stages = [...new Set(items.map((m) => m.stage).filter(Boolean))] as string[];
  return (
    <div className="grid gap-4">
      <Filters value={f} onChange={setF} targets={targets} channels={channels} stages={stages} />
      <PersonalizePanel />
      {list.length === 0 && <div className="card"><EmptyState title={t.sc.empty} /></div>}
      {list.map((m) => <MessageCard key={m.id} m={m} targets={targets} fav={favorites.includes(`message:${m.key}`)} />)}
    </div>
  );
}

function MessageCard({ m, targets, fav }: { m: Item; targets: { slug: string; name: string }[]; fav: boolean }) {
  const { t } = useI18n();
  const { apply, vars } = usePersonalize();
  const { text, missing } = apply(m.body.text);
  const M = t.sc.messages;
  const ch = t.sc.channels as Record<string, string>;
  const st = t.sc.stages as Record<string, string>;
  const target = targets.find((x) => x.slug === m.targetKey);
  return (
    <article id={m.key} className="card scroll-mt-20 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold">{m.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {m.stage && <Badge tone="accent">{st[m.stage]}</Badge>}
            {m.channel && <Badge>{ch[m.channel]}</Badge>}
            {target && <Badge>{target.name}</Badge>}
            <FallbackBadge show={m.fallback} label={t.sc.englishFallback} />
          </div>
        </div>
        <FavoriteButton kind="message" contentKey={m.key} initial={fav} />
      </div>
      <p className="mt-3 whitespace-pre-line rounded-2xl bg-surface-2 p-4 text-[15px] leading-relaxed" dir="auto">{text}</p>
      {missing.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-warning">
          <TriangleAlert className="size-3.5 shrink-0" />{fmt(M.missing, { list: missing.map((k) => M.vars[k]).join(", ") })}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <TrackedCopy value={text} kind="message" contentKey={m.key} variant="accent" size="md" className="flex-1 sm:flex-none" />
        <a href={whatsappHref(text)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}><MessageCircle className="size-4" />{M.sendWhatsapp}</a>
        <a href={mailtoHref(null, vars.company ?? "", text)} className={buttonClass("secondary", "md")}><Mail className="size-4" />{M.sendEmail}</a>
      </div>
    </article>
  );
}
