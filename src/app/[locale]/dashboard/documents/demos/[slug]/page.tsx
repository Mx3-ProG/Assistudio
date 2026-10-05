import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { requireSession } from "@/lib/auth";
import { demoBySlug } from "@/content/interactive-demos";
import { pick } from "@/content/help-videos";
import { BackLink } from "@/components/sales-center/back-link";
import { PageHeader, Notice } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { DemoFrame } from "@/components/demos/demo-frame";

/** One interactive demo for partners (the public version is /[locale]/demos/[slug]). */
export default async function Demo({ params }: PageProps<"/[locale]/dashboard/documents/demos/[slug]">) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  await requireSession(locale);
  const d = demoBySlug(slug);
  if (!d) notFound();
  const t = await getDictionary(locale);
  const L = t.hp.library;
  const title = pick(d.title, locale);
  return (
    <div className="space-y-4">
      <BackLink href={`/${locale}/dashboard/documents#demos`} label={L.demoBack} />
      <PageHeader title={title} subtitle={pick(d.description, locale)}
        action={<a href={d.src} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}><ExternalLink className="size-4" />{L.demoNewTab}</a>} />
      <DemoFrame src={d.src} title={fmt(L.demoFrame, { name: title })} />
      <Notice>{L.demoNote}</Notice>
    </div>
  );
}
