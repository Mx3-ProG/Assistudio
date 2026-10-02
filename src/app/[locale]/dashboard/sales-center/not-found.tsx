"use client";

import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { useI18n } from "@/components/providers";
import { buttonClass } from "@/components/ui/button";

export default function SalesCenterNotFound() {
  const { t, locale } = useI18n();
  const base = `/${locale}/dashboard/sales-center`;
  return <section className="card mx-auto max-w-2xl p-6 text-center sm:p-10">
    <Search className="mx-auto size-8 text-accent" />
    <h1 className="mt-4 text-[26px] font-semibold tracking-tight">{t.errors.notFound}</h1>
    <p className="mx-auto mt-2 max-w-lg text-[14px] text-muted">{t.sc.startSellingHint}</p>
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      <Link href={base} className={buttonClass("primary", "md")}><ArrowLeft className="flip-rtl size-4" />{t.sc.back}</Link>
      <Link href={`${base}/start`} className={buttonClass("accent", "md")}>{t.sc.startSelling}</Link>
    </div>
  </section>;
}
