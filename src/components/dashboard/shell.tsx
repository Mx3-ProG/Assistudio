"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid, Link2, Users, ShoppingBag, Wallet, Repeat,
  Banknote, BarChart3, Trophy, Bell, MessageCircle, Settings, Shield, MoreHorizontal, X, LogOut, Network, Rocket, Tag, FileSignature, LifeBuoy,
} from "lucide-react";
import { useI18n } from "@/components/providers";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/cn";
import { MessagesNotifier } from "@/components/messaging/messages-notifier";
import { BadgeIcon, RedCount } from "@/components/ui/badge-icon";
import { HelpProvider } from "@/components/help/help-context";
import { HelpButton } from "@/components/help/help-button";

/** `tour`: stable anchor for the guided tour (see src/lib/help/tour.ts). */
type Item = { href: string; label: string; icon: typeof LayoutGrid; badge?: number; tour?: string };

const NON_TEXT_INPUTS = new Set(["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"]);

/** Whether the focused element brings up the on-screen keyboard. */
function isTextField(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  if (el instanceof HTMLInputElement) return !el.readOnly && !NON_TEXT_INPUTS.has(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

/** True while the user is typing in a field — the mobile tab bar steps aside so it never covers the text. */
function useTyping() {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    // focusout fires before focus lands on the next field, so re-check once it has.
    const sync = () => setTimeout(() => setTyping(isTextField(document.activeElement)), 0);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
    };
  }, []);
  return typing;
}

export function DashboardShell({ children, userId, userName, unread, isStaff, leaderboard, messages, help, staffHelp }: {
  children: React.ReactNode; userId: string; userName: string; unread: number; isStaff: boolean; leaderboard: boolean;
  /** Unread replies to the partner's help requests; staff: open requests (dot on Admin). */
  help: number; staffHelp: number;
  /** Unread messages + who is signed in (for the live notifier). */
  messages: { unread: number; me: string; realtime: boolean };
}) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const typing = useTyping();
  const base = `/${locale}/dashboard`;
  const n = t.dash.nav;

  const groups: { label?: string; items: Item[] }[] = [
    { items: [
      { href: base, label: n.overview, icon: LayoutGrid },
      { href: `${base}/messages`, label: t.msg.nav, icon: MessageCircle, badge: messages.unread },
      { href: `${base}/help`, label: t.net.help.nav, icon: LifeBuoy, badge: help },
      ...(isStaff ? [{ href: `/${locale}/admin`, label: n.admin, icon: Shield, badge: staffHelp }] : []),
    ] },
    {
      // V0.4: the copilot is the entry point; the V0 pages it replaces (sales kit,
      // product, find, campaigns) stay reachable from its toolbox, not from here.
      label: n.groupSell,
      items: [
        { href: `${base}/sales-center`, label: t.cp.nav.copilot, icon: Rocket, tour: "nav-sales-center" },
        { href: `${base}/prospects`, label: n.prospects, icon: Users, tour: "nav-prospects" },
        { href: `${base}/link`, label: t.cp.nav.linkCode, icon: Link2 },
        { href: `${base}/promo-codes`, label: n.promoCodes, icon: Tag },
        { href: `${base}/documents`, label: t.ct.nav.affiliate, icon: FileSignature },
      ],
    },
    {
      label: n.groupEarn,
      items: [
        { href: `${base}/sales`, label: n.sales, icon: ShoppingBag },
        { href: `${base}/commissions`, label: n.commissions, icon: Wallet },
        { href: `${base}/recurring`, label: n.recurring, icon: Repeat },
        { href: `${base}/payouts`, label: n.payouts, icon: Banknote },
        { href: `${base}/analytics`, label: n.analytics, icon: BarChart3 },
        { href: `${base}/referrals`, label: n.referrals, icon: Network },
        ...(leaderboard ? [{ href: `${base}/leaderboard`, label: n.leaderboard, icon: Trophy }] : []),
      ],
    },
    {
      label: n.groupAccount,
      items: [
        { href: `${base}/notifications`, label: n.notifications, icon: Bell, badge: unread },
        { href: `${base}/settings`, label: n.settings, icon: Settings },
      ],
    },
  ];
  const isActive = (href: string) => (href === base ? pathname === base : pathname.startsWith(href));
  const tabs: Item[] = [
    { href: base, label: n.overview, icon: LayoutGrid },
    { href: `${base}/sales-center`, label: t.cp.nav.copilot, icon: Rocket, tour: "nav-sales-center" },
    { href: `${base}/prospects`, label: n.prospects, icon: Users, tour: "nav-prospects" },
    { href: `${base}/commissions`, label: n.commissions, icon: Wallet },
  ];

  const nav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-6">
      {groups.map((g, i) => (
        <div key={i}>
          {g.label && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{g.label}</p>}
          <ul className="grid gap-0.5">
            {g.items.map(({ href, label, icon: Icon, badge, tour }) => (
              <li key={href}>
                <Link
                  href={href}
                  data-tour={tour}
                  onClick={onNavigate}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-3 rounded-xl px-3 text-[14px] transition",
                    isActive(href) ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-fg-2 hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <Icon className={cn("size-4", isActive(href) ? "text-accent" : "text-muted")} />
                  <span className="flex-1 truncate">{label}</span>
                  <RedCount n={badge ?? 0} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <HelpProvider userId={userId} helpUnread={help}>
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-e border-line bg-bg-elevated/60 px-3 py-5 lg:flex">
        <Link href={base} className="mb-7 px-3"><Logo /></Link>
        <div className="no-scrollbar -mx-1 flex-1 overflow-y-auto px-1">{nav()}</div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line px-2 pt-4">
          <span className="truncate text-[13px] text-fg-2">{userName}</span>
          <form action={signOut}>
            <input type="hidden" name="locale" value={locale} />
            <button className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" aria-label={t.auth.logout} title={t.auth.logout}>
              <LogOut className="flip-rtl size-4" />
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Top bar */}
        <header className="glass sticky top-0 z-40 !border-x-0 !border-t-0 border-b !border-b-line">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Link href={base} className="lg:hidden"><Logo /></Link>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex sm:items-center sm:gap-2"><LocaleSwitcher /><ThemeToggle /></div>
              {/* Staff: one click to the back office, with open help requests. */}
              {isStaff && (
                <Link href={`/${locale}/admin`} aria-label={staffHelp > 0 ? `${n.admin} (${staffHelp})` : n.admin}
                  title={n.admin} className="relative inline-flex h-9 items-center gap-1.5 rounded-full bg-fg px-2.5 text-[13px] font-semibold text-bg transition hover:opacity-90 sm:px-3">
                  <Shield className="size-4" /><span className="hidden sm:inline">{n.admin}</span>
                  <RedCount n={staffHelp} className="absolute -end-1 -top-1 ring-2 ring-bg" />
                </Link>
              )}
              {/* Help centre: contextual answers, tutorials, guided tour — and the request form (which keeps the current page). */}
              <HelpButton />
              <BadgeIcon href={`${base}/messages`} icon={MessageCircle} count={messages.unread} label={t.msg.nav} />
              <BadgeIcon href={`${base}/notifications`} icon={Bell} count={unread} label={n.notifications} />
            </div>
          </div>
        </header>

        <MessagesNotifier me={messages.me} base={`${base}/messages`} realtime={messages.realtime} scope="dashboard" />
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className={cn("glass fixed inset-x-0 bottom-0 z-40 !border-x-0 !border-b-0 border-t pb-[env(safe-area-inset-bottom)] lg:hidden", typing && "hidden")} aria-label="Primary">
        <ul className="grid grid-cols-5">
          {tabs.map(({ href, label, icon: Icon, tour }) => (
            <li key={href}>
              <Link href={href} data-tour={tour} aria-current={isActive(href) ? "page" : undefined} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium", isActive(href) ? "text-accent" : "text-muted")}>
                <Icon className="size-5" />
                <span className="max-w-full truncate px-1">{label}</span>
              </Link>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setMore(true)} className="flex w-full flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium text-muted">
              <MoreHorizontal className="size-5" />
              <span>{t.common.menu}</span>
            </button>
          </li>
        </ul>
      </nav>

      {more && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMore(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[28px] bg-bg-elevated px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 shadow-lift">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2"><LocaleSwitcher /><ThemeToggle /></div>
              <button onClick={() => setMore(false)} className="grid size-9 place-items-center rounded-full bg-surface-2" aria-label={t.common.close}><X className="size-4" /></button>
            </div>
            {nav(() => setMore(false))}
            <form action={signOut} className="mt-6">
              <input type="hidden" name="locale" value={locale} />
              <button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-surface-2 text-[14px]"><LogOut className="flip-rtl size-4" />{t.auth.logout}</button>
            </form>
          </div>
        </div>
      )}
    </div>
    </HelpProvider>
  );
}
