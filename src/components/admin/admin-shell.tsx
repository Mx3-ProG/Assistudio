"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, Inbox, ShoppingBag, Wallet, Banknote, ShieldAlert, Map, BookOpen, Settings, ScrollText, ArrowLeft, LogOut, Landmark, FilePenLine, PanelsTopLeft, ChartNoAxesCombined } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/cn";

export function AdminShell({ children, hasAffiliate }: { children: React.ReactNode; hasAffiliate: boolean }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const base = `/${locale}/admin`;
  const A = t.admin.nav;
  const items = [
    { href: base, label: A.overview, icon: LayoutGrid },
    { href: `${base}/affiliates`, label: A.affiliates, icon: Users },
    { href: `${base}/leads`, label: A.leads, icon: Inbox },
    { href: `${base}/sales`, label: A.sales, icon: ShoppingBag },
    { href: `${base}/finance`, label: A.finance, icon: Landmark },
    { href: `${base}/commissions`, label: A.commissions, icon: Wallet },
    { href: `${base}/payouts`, label: A.payouts, icon: Banknote },
    { href: `${base}/fraud`, label: A.fraud, icon: ShieldAlert },
    { href: `${base}/markets`, label: A.markets, icon: Map },
    { href: `${base}/content`, label: A.content, icon: BookOpen },
    { href: `${base}/sales-content`, label: t.sc.admin.nav, icon: FilePenLine },
    { href: `${base}/sales-pages`, label: t.sc.admin.navPages, icon: PanelsTopLeft },
    { href: `${base}/sales-analytics`, label: t.sc.admin.navAnalytics, icon: ChartNoAxesCombined },
    { href: `${base}/settings`, label: A.settings, icon: Settings },
    { href: `${base}/audit`, label: A.audit, icon: ScrollText },
  ];
  const active = (h: string) => (h === base ? pathname === base : pathname.startsWith(h));

  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-40 !border-x-0 !border-t-0 border-b !border-b-line">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href={base}><Logo /></Link>
            <span className="rounded-full bg-fg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-bg">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex"><LocaleSwitcher /><ThemeToggle /></div>
            {hasAffiliate && <Link href={`/${locale}/dashboard`} className="grid size-9 place-items-center rounded-full hover:bg-surface-2" title={t.nav.dashboard}><ArrowLeft className="flip-rtl size-4" /></Link>}
            <form action={signOut}><input type="hidden" name="locale" value={locale} />
              <button className="grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label={t.auth.logout}><LogOut className="flip-rtl size-4" /></button>
            </form>
          </div>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5">
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
              className={cn("flex h-8 shrink-0 items-center gap-2 rounded-full px-3 text-[13px] transition", active(href) ? "bg-fg text-bg" : "text-fg-2 hover:bg-surface-2")}>
              <Icon className="size-3.5" />{label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
