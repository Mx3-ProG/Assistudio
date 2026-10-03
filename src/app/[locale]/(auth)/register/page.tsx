import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { RegisterForm } from "@/components/auth-forms";
import { repo, getSession } from "@/lib/data";
import { REF_COOKIE, sponsorCodeForSignup } from "@/lib/attribution";

/** Same-site path only (open-redirect safe). */
const safeNext = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : undefined);

export default async function Register({ params, searchParams }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  const { sponsor, next: nextParam } = await searchParams;
  const next = safeNext(nextParam);
  // Already an ambassador: go straight to what the CTA promised.
  if ((await getSession())?.affiliate) redirect(next ?? `/${locale}/dashboard`);
  const explicit = typeof sponsor === "string" ? sponsor : null;
  const r = repo();
  const [cookieStore, settings] = await Promise.all([cookies(), r.getSettings()]);
  const code = sponsorCodeForSignup(
    explicit,
    cookieStore.get(REF_COOKIE)?.value,
    settings.attributionModel,
    settings.attributionWindowDays,
  );
  const target = code ? await r.resolveReferral(code) : null;
  return <RegisterForm demo={isDemoMode} sponsorCode={target?.active ? code : null} sponsorName={target?.displayName ?? null} next={next} />;
}
