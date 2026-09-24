import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { getSession } from "@/lib/data";
import { LoginForm } from "@/components/auth-forms";

export default async function Login({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  const { next } = await searchParams;
  if (await getSession()) redirect(`/${locale}/dashboard`);
  return <LoginForm demo={isDemoMode} next={typeof next === "string" ? next : undefined} />;
}
