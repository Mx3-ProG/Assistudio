"use client";
import { useState, useTransition } from "react";
import { Pencil, Archive, ExternalLink, Plus, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { buttonClass } from "@/components/ui/button";
import { archiveSalesPage } from "@/app/actions/sales-center";
import type { PrivatePage } from "@/lib/data/types";
import { PageBuilder, type BuilderOptions } from "./page-builder";
import { ShareSheet } from "./share-sheet";

/** Opens the builder (new page) — used at the top of "My sales pages". */
export function NewPageButton({ o, initialOpen, initialTargetSlug }: { o: BuilderOptions; initialOpen: boolean; initialTargetSlug: string | null }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(initialOpen);
  if (!open) return <button onClick={() => setOpen(true)} className={buttonClass("accent", "md")}><Plus className="size-4" />{t.sc.pages.new}</button>;
  return (
    <div className="card w-full p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold">{t.sc.pages.builder}</h2>
        <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full bg-surface-2" aria-label={t.common.close}><X className="size-4" /></button>
      </div>
      <PageBuilder o={o} initialTargetSlug={initialTargetSlug} onDone={() => setOpen(false)} />
    </div>
  );
}

/** Actions under each page: share, preview, edit, archive. */
export function PageActions({ page, url, o }: { page: PrivatePage; url: string; o: BuilderOptions }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"share" | "edit" | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setMode(mode === "share" ? null : "share")} className={buttonClass(mode === "share" ? "primary" : "secondary", "sm")}>{t.sc.share}</button>
        <a href={url} target="_blank" rel="noopener" className={buttonClass("secondary", "sm")}><ExternalLink className="size-4" />{t.sc.preview}</a>
        <button onClick={() => setMode(mode === "edit" ? null : "edit")} className={buttonClass("ghost", "sm")}><Pencil className="size-4" /></button>
        <button disabled={pending} onClick={() => start(() => archiveSalesPage(page.id))} className={buttonClass("ghost", "sm")} title={t.sc.pages.archive} aria-label={t.sc.pages.archive}><Archive className="size-4" /></button>
      </div>
      {mode === "share" && <ShareSheet url={url} pageId={page.id} />}
      {mode === "edit" && <div className="rounded-2xl bg-surface-2/60 p-4"><PageBuilder o={o} page={page} onDone={() => setMode(null)} /></div>}
    </div>
  );
}
