import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { demoBySlug } from "@/content/interactive-demos";
import { pick } from "@/content/help-videos";
import { Navbar } from "@/components/marketing/navbar";
import { DemoFrame } from "@/components/demos/demo-frame";
import { Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/[locale]/demos/[slug]">): Promise<Metadata> {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const d = demoBySlug(slug);
  if (!d) return {};
  return pageMetadata(locale, `/demos/${slug}`, `${pick(d.title, locale)} — Studio ATS`, pick(d.description, locale), { noindex: true });
}

/** Public page of one interactive demo, linked from the Studio page (#demos). */
export default async function PublicDemo({ params }: PageProps<"/[locale]/demos/[slug]">) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const d = demoBySlug(slug);
  if (!d) notFound();
  const t = await getDictionary(locale);
  const D = t.studio.demos;
  const title = pick(d.title, locale);
  return (
    <>
      <Navbar variant="studio" />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-6 sm:py-14">
        <Link href={`/${locale}/studio#demos`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-fg"><ArrowLeft className="flip-rtl size-3.5" />{D.back}</Link>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5"><Badge>{t.studio.demoOnly}</Badge>{d.sector && <Badge tone="accent">{pick(d.sector, locale)}</Badge>}</div>
            <h1 className="display mt-3 text-[34px] sm:text-[44px]">{title}</h1>
            <p className="mt-2 max-w-2xl text-[16px] text-muted">{pick(d.description, locale)}</p>
          </div>
          <a href={d.src} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}><ExternalLink className="size-4" />{D.newTab}</a>
        </header>
        <DemoFrame src={d.src} title={title} />
        <p className="text-[12.5px] text-muted">{D.note}</p>
      </main>
    </>
  );
}
