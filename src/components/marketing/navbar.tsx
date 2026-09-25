"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { buttonClass } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { Logo } from "./logo";
import { cn } from "@/lib/cn";

export function Navbar({ variant = "partners" }: { variant?: "partners" | "studio" }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const p = (path: string) => `/${locale}${path}`;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const links = variant === "partners"
    ? [
        { href: p("/#how"), label: t.nav.howItWorks },
        { href: p("/#sell"), label: t.nav.whatYouSell },
        { href: p("/#markets"), label: t.nav.markets },
        { href: p("/studio"), label: t.nav.discover },
        { href: p("/pricing"), label: t.nav.pricing },
        { href: p("/faq"), label: t.nav.faq },
      ]
    : [
        { href: p("/studio#features"), label: t.nav.whatYouSell },
        { href: p("/studio#pricing"), label: t.nav.pricing },
        { href: p("/studio#faq"), label: t.nav.faq },
      ];

  return (
    <header className={cn("sticky top-0 z-50 transition-all duration-300", scrolled || open ? "glass border-x-0 border-t-0 !border-b-line" : "border-b border-transparent")}>
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={p("/")} className="shrink-0" aria-label="Studio ATS">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 xl:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] text-fg-2 transition hover:text-fg">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
          {variant === "partners" ? (
            <>
              <Link href={p("/login")} className="hidden rounded-full px-3 py-1.5 text-[13px] text-fg-2 hover:text-fg sm:inline-flex">
                {t.nav.login}
              </Link>
              <Link href={p("/register")} className={buttonClass("primary", "sm")}>
                {t.nav.becomePartner}
              </Link>
            </>
          ) : (
            <a href="#request" className={buttonClass("primary", "sm")}>
              {t.studio.cta}
            </a>
          )}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-fg xl:hidden"
            aria-expanded={open}
            aria-label={t.common.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-line px-4 pb-6 pt-2 xl:hidden">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block border-b border-line py-3.5 text-[17px] font-medium">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={p("/login")} onClick={() => setOpen(false)} className="block py-3.5 text-[17px] font-medium">
                {t.nav.login}
              </Link>
            </li>
          </ul>
          <div className="mt-4 flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
