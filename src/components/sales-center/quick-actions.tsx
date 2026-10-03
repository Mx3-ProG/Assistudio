"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, Rocket, Link2, PanelsTopLeft, UserPlus, Phone, ShieldQuestion, Wallet, Check } from "lucide-react";
import { useI18n } from "@/components/providers";
import { track } from "@/lib/analytics/client";

/** One-tap actions, reachable immediately on mobile (horizontal scroll). */
export function QuickActions({ link, pageUrl }: { link: string; pageUrl: string | null }) {
  const { t, locale } = useI18n();
  const Q = t.sc.quick;
  const [copied, setCopied] = useState(false);
  const d = `/${locale}/dashboard`;
  const item = "flex h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13.5px] font-medium transition hover:bg-surface-2";
  return (
    <nav aria-label={Q.title} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      <Link href={`${d}/find`} className={item}><Search className="size-4 text-accent" />{Q.findProspect}</Link>
      <Link href={`${d}/sales-center/start`} className={item}><Rocket className="size-4 text-accent" />{Q.startSelling}</Link>
      <button type="button" className={item} onClick={async () => {
        await navigator.clipboard.writeText(link).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        track("affiliate_link_copied", { placement: "quick_actions" });
      }}>
        {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4 text-accent" />}{copied ? t.common.copied : Q.copyLink}
      </button>
      {pageUrl
        ? <a href={pageUrl} target="_blank" rel="noopener" className={item}><PanelsTopLeft className="size-4 text-accent" />{Q.openPage}</a>
        : <Link href={`${d}/sales-center/pages?new=1`} className={item}><PanelsTopLeft className="size-4 text-accent" />{Q.openPage}</Link>}
      <Link href={`${d}/prospects?new=1`} className={item}><UserPlus className="size-4 text-accent" />{Q.addProspect}</Link>
      <Link href={`${d}/sales-center/calls`} className={item}><Phone className="size-4 text-accent" />{Q.scripts}</Link>
      <Link href={`${d}/sales-center/objections`} className={item}><ShieldQuestion className="size-4 text-accent" />{Q.objection}</Link>
      <Link href={`${d}/commissions`} className={item}><Wallet className="size-4 text-accent" />{Q.commissions}</Link>
    </nav>
  );
}
