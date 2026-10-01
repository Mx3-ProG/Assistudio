import { redirect } from "next/navigation";

/** Passwords are gone: sign-in is by emailed code. Old password-reset links land on login. */
export default async function Reset({ params }: PageProps<"/[locale]/reset">) {
  const { locale } = await params;
  redirect(`/${locale}/login`);
}
