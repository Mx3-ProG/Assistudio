import { MessageSquareQuote } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader, Card, CardHeader, Notice } from "@/components/ui/primitives";
import { ReviewForm } from "@/components/proof/review-form";
import { MyTestimonials } from "@/components/proof/my-testimonials";

/** "Give my review": the partner writes (or films) a review; nothing is published without consent and moderation. */
export default async function ReviewPage({ params }: PageProps<"/[locale]/dashboard/review">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const F = t.pf.form;
  const mine = await repo().listMyTestimonials(s).catch(() => []);
  const waiting = mine.some((r) => r.status === "pending");

  return (
    <>
      <PageHeader title={F.title} subtitle={F.subtitle} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card className="p-5 sm:p-7">
          {/* Same element either way, so the "thank you" survives the refresh that follows a submission. */}
          <ReviewForm mode="ambassador" locale={locale} defaults={{ name: s.fullName }} blocked={waiting ? <Notice>{F.errors.already_pending}</Notice> : null} />
        </Card>
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><MessageSquareQuote className="size-4 text-accent" />{t.pf.my.title}</span>} />
          <div className="px-5 pb-3 sm:px-6"><MyTestimonials t={t} locale={locale} items={mine} /></div>
        </Card>
      </div>
    </>
  );
}
