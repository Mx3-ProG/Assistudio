import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { getSession } from "@/lib/data";
import { hasAuthUser } from "@/lib/auth";
import { LoginForm, type AuthNotice } from "@/components/auth-forms";

export default async function Login({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  const { next, error } = await searchParams;
  if (await getSession()) redirect(`/${locale}/dashboard`);
  const notice: AuthNotice | undefined =
    (await hasAuthUser()) ? "accountUnavailable" : error === "callback" ? "linkExpired" : undefined;
  return <LoginForm demo={isDemoMode} next={typeof next === "string" ? next : undefined} notice={notice} />;
}
