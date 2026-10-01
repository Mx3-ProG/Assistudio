import { redirect } from "next/navigation";

/** Passwords are gone: sign-in is by emailed code. Old "forgot password" links land on login. */
export default async function Forgot({ params }: PageProps<"/[locale]/forgot">) {
  const { locale } = await params;
  redirect(`/${locale}/login`);
}
