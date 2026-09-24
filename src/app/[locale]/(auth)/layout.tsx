import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_0%,var(--accent-soft),transparent)]" />
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={`/${locale}`} aria-label="STUDIO"><Logo /></Link>
        <div className="flex items-center gap-2"><LocaleSwitcher /><ThemeToggle /></div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">{children}</main>
    </div>
  );
}
