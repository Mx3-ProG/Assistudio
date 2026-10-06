import type { Metadata } from "next";
import { MessageSquareQuote } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { repo } from "@/lib/data";
import { Navbar } from "@/components/marketing/navbar";
import { ReviewForm } from "@/components/proof/review-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/review/[token]">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return { title: `${t.pf.invite.title} — Studio ATS`, robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };
}

/**
 * Client review through a private, single-use invite created by staff
 * (Admin → Reviews & proof). Clients have no account: the token is the only
 * credential and only its hash is stored. Never indexed.
 */
export default async function ClientReviewPage({ params }: PageProps<"/[locale]/review/[token]">) {
  const { locale, token } = (await params) as { locale: Locale; token: string };
  const t = await getDictionary(locale);
  const I = t.pf.invite;
  const invite = /^[A-Za-z0-9_-]{32,64}$/.test(token) ? await repo().lookupTestimonialInvite(token).catch(() => null) : null;
  const closed = !invite ? I.states.missing : invite.state !== "open" ? I.states[invite.state] : null;

  return (
    <>
      <Navbar variant="studio" />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
        <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-accent"><MessageSquareQuote className="size-4" />{I.title}</p>
        {closed ? (
          <p className="card mt-6 p-6 text-[15px]">{closed}</p>
        ) : (
          <>
            <h1 className="display mt-4 text-[34px] sm:text-[46px]">{invite!.companyName ? fmt(I.hello, { company: invite!.companyName }) : t.pf.form.title}</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-fg-2">{I.lead}</p>
            <div className="card mt-8 p-5 sm:p-7">
              <ReviewForm mode="client" token={token} locale={locale}
                defaults={{ name: invite!.contactName ?? "", company: invite!.companyName }} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
