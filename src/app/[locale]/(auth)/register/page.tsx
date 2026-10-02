import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/env";
import { RegisterForm } from "@/components/auth-forms";
import { repo } from "@/lib/data";
import { REF_COOKIE, sponsorCodeForSignup } from "@/lib/attribution";

export default async function Register({ searchParams }: PageProps<"/[locale]/register">) {
  const { sponsor } = await searchParams;
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
  return <RegisterForm demo={isDemoMode} sponsorCode={target?.active ? code : null} sponsorName={target?.displayName ?? null} />;
}
