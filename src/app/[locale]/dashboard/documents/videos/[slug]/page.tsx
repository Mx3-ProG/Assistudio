import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, Check, Lightbulb } from "lucide-react";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { HELP_VIDEOS, pick, videoBySlug, videoLength } from "@/content/help-videos";
import { BackLink } from "@/components/sales-center/back-link";
import { Notice } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { TutorialPlayer, MarkDone } from "@/components/help/tutorial-player";
import { clock } from "@/lib/help/clock";

/** One tutorial: the video in the MacBook player (or the written guide), then what to learn, steps and key points. */
export default async function Tutorial({ params }: PageProps<"/[locale]/dashboard/documents/videos/[slug]">) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  await requireAffiliate(locale);
  const v = videoBySlug(slug);
  if (!v) notFound();
  const t = await getDictionary(locale);
  const V = t.hp.videos;
  const base = `/${locale}/dashboard/documents/videos`;
  const i = HELP_VIDEOS.indexOf(v);
  const prev = HELP_VIDEOS[i - 1];
  const next = HELP_VIDEOS[i + 1];
  const length = videoLength(v);
  const p = (x: Parameters<typeof pick>[0]) => pick(x, locale);

  const list = (title: string, items: string[], icon: React.ReactNode) => (
    <section className="card p-5 sm:p-6">
      <h2 className="text-[16px] font-semibold">{title}</h2>
      <ul className="mt-3 grid gap-2.5">
        {items.map((x) => <li key={x} className="flex gap-3 text-[14.5px] leading-relaxed text-fg-2">{icon}<span>{x}</span></li>)}
      </ul>
    </section>
  );

  return (
    <div className="space-y-8">
      <div>
        <BackLink href={base} label={V.back} />
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{V.categories[v.category]}</p>
        <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[34px]">{p(v.title)}</h1>
        <p className="mt-2 max-w-3xl text-[15.5px] text-muted">
          {p(v.description)}
          <span className="tabular ms-2 text-[13px] text-muted/80">· {length !== null ? clock(length) : fmt(V.readTime, { n: v.readMinutes ?? 2 })}</span>
        </p>
      </div>

      {v.src ? (
        <div>
          <TutorialPlayer slug={v.slug} src={v.src} poster={v.thumb} start={v.start} end={v.end}
            chapters={v.chapters?.map((c) => ({ at: c.at, label: p(c.label) }))} />
          {v.start !== undefined && v.src === "/demo/partner-space.mp4" && <p className="mx-auto mt-3 max-w-[860px] text-center text-[12px] text-muted">{V.fromRecording}</p>}
        </div>
      ) : (
        <Notice><span className="inline-flex items-center gap-2"><BookOpenText className="size-4 shrink-0 text-accent" aria-hidden />{V.noVideo}</span></Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <section className="card p-5 sm:p-6">
            <h2 className="text-[16px] font-semibold">{V.explanation}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-fg-2">{p(v.explanation)}</p>
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="text-[16px] font-semibold">{V.steps}</h2>
            <ol className="mt-3 grid gap-3">
              {v.steps.map((s, n) => (
                <li key={s.en} className="flex gap-3 text-[14.5px] leading-relaxed text-fg-2">
                  <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">{n + 1}</span>
                  <span>{p(s)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div className="space-y-4">
          {list(V.learn, v.learn.map(p), <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden />)}
          {list(V.remember, v.remember.map(p), <Lightbulb className="mt-1 size-4 shrink-0 text-warning" aria-hidden />)}
          <MarkDone slug={v.slug} label={v.src ? V.markDone : V.markRead} />
        </div>
      </div>

      <nav className="flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between" aria-label={V.title}>
        {prev ? (
          <Link href={`${base}/${prev.slug}`} className={buttonClass("secondary", "md", "justify-start")}><ArrowLeft className="flip-rtl size-4" /><span className="truncate">{V.prev}</span></Link>
        ) : <span className="hidden sm:block" />}
        <Link href={base} className={buttonClass("ghost", "md")}>{V.back}</Link>
        {next ? (
          <Link href={`${base}/${next.slug}`} className={buttonClass("accent", "md", "justify-end")}><span className="truncate">{V.next}</span><ArrowRight className="flip-rtl size-4" /></Link>
        ) : <span className="hidden sm:block" />}
      </nav>
    </div>
  );
}
