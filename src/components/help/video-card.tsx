"use client";
import Image from "next/image";
import Link from "next/link";
import { BookOpenText, Check, Play } from "lucide-react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";
import { useHelpOptional } from "./help-context";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/help/clock";

/** What a card needs, already localized on the server. */
export interface VideoSummary {
  slug: string;
  category: string;
  title: string;
  description: string;
  thumb?: string;
  /** Seconds, or null for a written guide. */
  length: number | null;
  readMinutes?: number;
  essential?: number;
}

/** A tutorial in the library / "New here?": real thumbnail (or a guide icon), length, done state. */
export function VideoCard({ v, href, compact }: { v: VideoSummary; href: string; compact?: boolean }) {
  const { t } = useI18n();
  const V = t.hp.videos;
  const help = useHelpOptional();
  const done = !!help?.state.videos[v.slug]?.done;
  const progress = help?.state.videos[v.slug]?.progress ?? 0;
  return (
    <Link href={href} className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        {v.thumb ? (
          <Image src={v.thumb} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-cover object-top transition duration-500 group-hover:scale-[1.02]" />
        ) : (
          <div className="grid size-full place-items-center bg-[radial-gradient(70%_70%_at_30%_20%,var(--accent-soft),transparent)]">
            <BookOpenText className="size-9 text-accent" aria-hidden />
          </div>
        )}
        {v.length !== null && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md transition group-hover:scale-105"><Play className="ms-0.5 size-5 fill-current" /></span>
          </span>
        )}
        <span className="tabular absolute bottom-2 end-2 rounded-full bg-black/65 px-2 py-0.5 text-[11.5px] font-medium text-white">
          {v.length !== null ? clock(v.length) : fmt(V.readTime, { n: v.readMinutes ?? 2 })}
        </span>
        {done && <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[11.5px] font-semibold text-white"><Check className="size-3.5" />{V.completed}</span>}
        {!done && progress > 0.02 && <span className="absolute inset-x-0 bottom-0 h-1 bg-black/20"><span className="block h-full bg-accent" style={{ width: `${progress * 100}%` }} /></span>}
      </div>
      <div className={cn("flex flex-1 flex-col p-4", compact ? "gap-1" : "gap-1.5 sm:p-5")}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          {v.essential ? `${String(v.essential).padStart(2, "0")} · ` : ""}{v.category}
        </span>
        <span className="text-[15.5px] font-semibold leading-snug">{v.title}</span>
        {!compact && <span className="text-[13px] leading-snug text-muted">{v.description}</span>}
      </div>
    </Link>
  );
}
