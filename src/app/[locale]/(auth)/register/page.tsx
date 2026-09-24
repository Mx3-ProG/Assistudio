import { isDemoMode } from "@/lib/env";
import { RegisterForm } from "@/components/auth-forms";
import { repo } from "@/lib/data";
import { isValidCode } from "@/lib/attribution";

export default async function Register({ searchParams }: PageProps<"/[locale]/register">) {
  const { sponsor } = await searchParams;
  const code = typeof sponsor === "string" && isValidCode(sponsor) ? sponsor : null;
  const target = code ? await repo().resolveReferral(code) : null;
  return <RegisterForm demo={isDemoMode} sponsorCode={target?.active ? code : null} sponsorName={target?.displayName ?? null} />;
}
