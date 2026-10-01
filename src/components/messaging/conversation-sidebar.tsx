"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, Megaphone, MessageCircle, ShieldCheck, UserPlus, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { cn } from "@/lib/cn";
import { fmt } from "@/i18n/format";
import { formatRelative } from "@/lib/money";
import type { Contact, Contacts, ConversationSummary, LastMessagePreview, SupportInboxRow } from "@/lib/messaging/types";
import {
  blockProfile, openDirect, openSupport, removeFriend, requestFriend, respondFriend, unblockProfile,
} from "@/app/actions/messaging";
import { Avatar } from "./thread";

/** Two-pane frame: list on the side, thread in the main area (one pane at a time on mobile). */
export function MessagesFrame({ base, sidebar, children, className }: { base: string; sidebar: React.ReactNode; children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const inThread = pathname.replace(/\/$/, "") !== base && pathname.startsWith(`${base}/`) && !pathname.startsWith(`${base}/reports`);
  return (
    <div className={cn("grid min-h-[440px] overflow-hidden rounded-3xl border border-line bg-surface shadow-sm lg:grid-cols-[340px_1fr]", className)}>
      <aside className={cn("min-h-0 flex-col border-e border-line bg-bg-elevated/60 lg:flex", inThread ? "hidden" : "flex")}>{sidebar}</aside>
      <div className={cn("min-h-0 min-w-0", inThread ? "block" : "hidden lg:block")}>{children}</div>
    </div>
  );
}

export function SelectConversation() {
  const { t } = useI18n();
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent"><MessageCircle className="size-6" /></span>
        <p className="mt-3 text-[14px] text-muted">{t.msg.selectConversation}</p>
      </div>
    </div>
  );
}

/** `now` comes from the server render so relative times hydrate identically. */
function usePreview(now: number) {
  const { t, locale } = useI18n();
  return (p: LastMessagePreview | null, me: string) => {
    if (!p) return "";
    const text = p.deleted ? t.msg.preview.deleted : p.kind === "text" ? p.body ?? "" : t.msg.preview[p.kind];
    return { text: p.senderId === me && !p.deleted ? `${t.msg.you}: ${text}` : text, when: formatRelative(p.createdAt, locale, now) };
  };
}

function Row({ href, onClick, active, name, icon, sub, preview, when, unread }: {
  href?: string; onClick?: () => void; active: boolean; name: string; icon?: React.ReactNode; sub?: string | null;
  preview: string; when?: string; unread: number;
}) {
  const cls = cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start transition", active ? "bg-surface shadow-sm ring-1 ring-line" : "hover:bg-surface-2");
  const inner = (
    <>
      <Avatar name={name} icon={icon} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn("truncate text-[14px]", unread ? "font-semibold" : "font-medium")}>{name}</span>
          {when && <span className="ms-auto shrink-0 text-[11px] text-muted">{when}</span>}
        </span>
        {sub && <span className="block truncate text-[11.5px] text-accent">{sub}</span>}
        <span className="flex items-center gap-2">
          <span className={cn("min-w-0 flex-1 truncate text-[13px]", unread ? "text-fg" : "text-muted")}>{preview}</span>
          {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-fg">{unread > 99 ? "99+" : unread}</span>}
        </span>
      </span>
    </>
  );
  return href ? <Link href={href} className={cls} aria-current={active ? "page" : undefined}>{inner}</Link>
    : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

/** Affiliate sidebar: conversations + contacts. */
export function ConversationSidebar({ base, me, now, conversations, contacts }: {
  base: string; me: string; now: number; conversations: ConversationSummary[]; contacts: Contacts;
}) {
  const { t } = useI18n();
  const M = t.msg;
  const [tab, setTab] = useState<"chats" | "contacts">("chats");
  const pathname = usePathname();
  const router = useRouter();
  const preview = usePreview(now);
  const [pending, start] = useTransition();
  const hasSupport = conversations.some((c) => c.kind === "support");
  const requests = contacts.incoming.length;

  const goSupport = () => start(async () => {
    const r = await openSupport();
    if (r.ok) router.push(`${base}/${r.data}`);
  });

  return (
    <>
      <div className="px-4 pb-3 pt-4">
        <h1 className="text-[20px] font-semibold tracking-tight">{M.title}</h1>
        <div className="mt-3 grid grid-cols-2 rounded-full bg-surface-2 p-1 text-[13px] font-medium" role="tablist">
          {(["chats", "contacts"] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn("flex h-8 items-center justify-center gap-1.5 rounded-full transition", tab === k ? "bg-surface shadow-sm" : "text-muted")}>
              {M.tabs[k]}
              {k === "contacts" && requests > 0 && <span className="grid size-4 place-items-center rounded-full bg-accent text-[10px] text-accent-fg">{requests}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {tab === "chats" ? (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((c) => {
              const p = preview(c.lastMessage, me);
              const name = c.kind === "announcements" ? M.announcements : c.kind === "support" ? M.support : c.peerName ?? M.unknown;
              const icon = c.kind === "announcements" ? <Megaphone className="size-5" /> : c.kind === "support" ? <ShieldCheck className="size-5" /> : undefined;
              const sub = c.kind === "direct" && c.relationship ? M.relationship[c.relationship] : null;
              return (
                <li key={c.id}>
                  <Row href={`${base}/${c.id}`} active={pathname.endsWith(c.id)} name={name} icon={icon} sub={sub}
                    preview={p ? p.text : c.kind === "announcements" ? M.announcementsHint : c.kind === "support" ? M.supportHint : ""}
                    when={p ? p.when : undefined} unread={c.unread} />
                </li>
              );
            })}
            {!hasSupport && (
              <li>
                <Row onClick={goSupport} active={false} name={M.support} icon={<ShieldCheck className="size-5" />} preview={M.supportHint} unread={0} />
              </li>
            )}
            {conversations.filter((c) => c.kind === "direct").length === 0 && (
              <li className="px-3 py-6 text-center text-[13px] text-muted">{M.empty}</li>
            )}
          </ul>
        ) : (
          <ContactsPanel base={base} contacts={contacts} onSupport={goSupport} busy={pending} />
        )}
      </div>
    </>
  );
}

function ContactsPanel({ base, contacts, onSupport, busy }: { base: string; contacts: Contacts; onSupport: () => void; busy: boolean }) {
  const { t } = useI18n();
  const C = t.msg.contacts;
  const errors = t.msg.errors as Record<string, string>;
  const router = useRouter();
  const [code, setCode] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const open = (c: Contact) => start(async () => {
    const r = await openDirect(c.profileId);
    if (r.ok) router.push(`${base}/${r.data}`); else setNote({ ok: false, text: errors[r.error] ?? errors.generic });
  });
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => {
    const r = await fn();
    if (!r.ok) setNote({ ok: false, text: errors[r.error ?? "generic"] ?? errors.generic });
    router.refresh();
  });

  const people = (title: string, list: Contact[], empty: string | null, extra?: (c: Contact) => React.ReactNode) => (
    <section className="mt-5">
      <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {list.length === 0 ? (empty && <p className="px-2 py-2 text-[13px] text-muted">{empty}</p>) : (
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {list.map((c) => (
            <li key={c.profileId} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-surface-2">
              <Avatar name={c.name ?? "?"} className="size-9 text-[13px]" />
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{c.name ?? t.msg.unknown}</span>
              {extra?.(c)}
              {c.canMessage && (
                <button type="button" disabled={pending} onClick={() => open(c)}
                  className="h-8 rounded-full bg-accent px-3 text-[12.5px] font-medium text-accent-fg disabled:opacity-50">{C.message}</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="px-2">
      <button type="button" onClick={onSupport} disabled={busy}
        className="flex w-full items-center gap-3 rounded-2xl bg-accent-soft px-3 py-3 text-start text-accent transition hover:brightness-95 disabled:opacity-60">
        <ShieldCheck className="size-5" /><span className="text-[14px] font-medium">{t.msg.contactSupport}</span>
      </button>

      {!contacts.canUseDirect ? (
        <p className="mt-4 rounded-2xl bg-surface-2 p-3 text-[13px] text-fg-2">{C.pendingOnly}</p>
      ) : (
        <>
          <form className="mt-4 rounded-2xl border border-line bg-surface p-3"
            onSubmit={(e) => {
              e.preventDefault();
              const v = code.trim();
              if (!v) return;
              start(async () => {
                const r = await requestFriend(v);
                if (r.ok) { setNote({ ok: ["sent", "accepted", "already"].includes(r.data), text: C.results[r.data] }); setCode(""); router.refresh(); }
                else setNote({ ok: false, text: errors[r.error] ?? errors.generic });
              });
            }}>
            <h3 className="flex items-center gap-2 text-[14px] font-semibold"><UserPlus className="size-4 text-accent" />{C.addTitle}</h3>
            <p className="mt-1 text-[12px] text-muted">{C.addHint}</p>
            <div className="mt-2.5 flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={C.codePlaceholder} maxLength={40} aria-label={C.codePlaceholder}
                className="h-9 min-w-0 flex-1 rounded-full border border-line bg-surface-2 px-3 text-[13px] outline-none focus:border-accent" />
              <button type="submit" disabled={pending || !code.trim()} className="h-9 shrink-0 rounded-full bg-fg px-3 text-[12.5px] font-medium text-bg disabled:opacity-50">{C.add}</button>
            </div>
          </form>
          {note && <p role="status" className={cn("mt-2 px-2 text-[12.5px]", note.ok ? "text-success" : "text-danger")}>{note.text}</p>}

          {contacts.incoming.length > 0 && (
            <section className="mt-5">
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{C.incoming}</h3>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {contacts.incoming.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-2xl px-2 py-2">
                    <Avatar name={r.name ?? "?"} className="size-9 text-[13px]" />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{r.name ?? t.msg.unknown}</span>
                    <button type="button" disabled={pending} onClick={() => act(() => respondFriend(r.id, true))} aria-label={C.accept} title={C.accept}
                      className="grid size-8 place-items-center rounded-full bg-success-soft text-success"><Check className="size-4" /></button>
                    <button type="button" disabled={pending} onClick={() => act(() => respondFriend(r.id, false))} aria-label={C.decline} title={C.decline}
                      className="grid size-8 place-items-center rounded-full bg-surface-2 text-muted"><X className="size-4" /></button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {contacts.sponsor && people(C.sponsor, [contacts.sponsor], null)}
          {people(C.recruits, contacts.recruits, C.noRecruits)}
          {people(C.friends, contacts.friends, C.noFriends, (c) => (
            <>
              <button type="button" disabled={pending} className="text-[12px] text-muted hover:text-fg"
                onClick={() => window.confirm(fmt(C.confirmRemove, { name: c.name ?? "" })) && act(() => removeFriend(c.profileId))}>{C.remove}</button>
              <button type="button" disabled={pending} className="text-[12px] text-muted hover:text-danger"
                onClick={() => window.confirm(fmt(C.confirmBlock, { name: c.name ?? "" })) && act(() => blockProfile(c.profileId))}>{C.block}</button>
            </>
          ))}

          {contacts.outgoing.length > 0 && (
            <section className="mt-5">
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{C.outgoing}</h3>
              <ul className="mt-1.5">
                {contacts.outgoing.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-2 py-1.5 text-[13px] text-fg-2">
                    <span className="min-w-0 flex-1 truncate">{r.name ?? t.msg.unknown}</span>
                    <button type="button" disabled={pending} onClick={() => act(() => removeFriend(r.profileId))} className="text-[12px] text-muted hover:text-fg">{t.common.cancel}</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {contacts.blocked.length > 0 && (
            <section className="mt-5">
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{C.blocked}</h3>
              <ul className="mt-1.5">
                {contacts.blocked.map((b) => (
                  <li key={b.profileId} className="flex items-center gap-3 px-2 py-1.5 text-[13px] text-fg-2">
                    <span className="min-w-0 flex-1 truncate">{b.name ?? t.msg.unknown}</span>
                    <button type="button" disabled={pending} onClick={() => act(() => unblockProfile(b.profileId))} className="text-[12px] text-muted hover:text-fg">{C.unblock}</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section className="mt-6 rounded-2xl bg-surface-2 p-3">
        <h3 className="text-[12.5px] font-semibold">{C.rulesTitle}</h3>
        <ul className="mt-1.5 list-disc ps-4 text-[12px] text-fg-2">
          {C.rules.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </section>
    </div>
  );
}

/** Staff sidebar: shared Support inbox + own conversations (announcements, DMs). */
export function AdminConversationSidebar({ base, me, now, inbox, conversations, reportsOpen }: {
  base: string; me: string; now: number; inbox: SupportInboxRow[]; conversations: ConversationSummary[]; reportsOpen: number;
}) {
  const { t } = useI18n();
  const M = t.msg;
  const A = M.admin;
  const pathname = usePathname();
  const preview = usePreview(now);
  const [tab, setTab] = useState<"inbox" | "mine">("inbox");
  const inboxUnread = inbox.reduce((a, r) => a + r.unread, 0);
  const mineUnread = conversations.reduce((a, r) => a + r.unread, 0);

  return (
    <>
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[20px] font-semibold tracking-tight">{A.title}</h1>
          <Link href={`${base}/reports`} className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium",
            pathname.startsWith(`${base}/reports`) ? "bg-fg text-bg" : "bg-surface-2 text-fg-2 hover:bg-surface-3")}>
            {A.reports}{reportsOpen > 0 && <span className="grid size-4 place-items-center rounded-full bg-danger text-[10px] text-white">{reportsOpen}</span>}
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 rounded-full bg-surface-2 p-1 text-[13px] font-medium" role="tablist">
          {([["inbox", A.inbox, inboxUnread], ["mine", A.myConversations, mineUnread]] as const).map(([k, label, n]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn("flex h-8 items-center justify-center gap-1.5 rounded-full transition", tab === k ? "bg-surface shadow-sm" : "text-muted")}>
              <span className="truncate">{label}</span>
              {n > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-accent-fg">{n}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <ul className="flex flex-col gap-0.5">
          {tab === "inbox" ? (
            inbox.length === 0 ? <li className="px-3 py-6 text-center text-[13px] text-muted">{A.inboxEmpty}</li> : inbox.map((r) => {
              const p = preview(r.lastMessage, me);
              return (
                <li key={r.id}>
                  <Row href={`${base}/${r.id}`} active={pathname.endsWith(r.id)} name={r.subjectName ?? M.unknown}
                    sub={r.subjectStatus && r.subjectStatus !== "approved" ? r.subjectStatus : null}
                    preview={p ? p.text : ""} when={p ? p.when : undefined} unread={r.unread} />
                </li>
              );
            })
          ) : conversations.map((c) => {
            const p = preview(c.lastMessage, me);
            const name = c.kind === "announcements" ? M.announcements : c.kind === "support" ? M.support : c.peerName ?? M.unknown;
            return (
              <li key={c.id}>
                <Row href={`${base}/${c.id}`} active={pathname.endsWith(c.id)} name={name}
                  icon={c.kind === "announcements" ? <Megaphone className="size-5" /> : undefined}
                  sub={c.kind === "announcements" ? A.announceHint : null}
                  preview={p ? p.text : ""} when={p ? p.when : undefined} unread={c.unread} />
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

/** "Message" button for staff pages (affiliate list…): opens that member's Support thread. */
export function MessageMemberButton({ profileId, base }: { profileId: string; base: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending}
      onClick={() => start(async () => { const r = await openSupport(profileId); if (r.ok) router.push(`${base}/${r.data}`); })}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 text-[12.5px] font-medium hover:bg-surface-3 disabled:opacity-50">
      <MessageCircle className="size-3.5" />{t.msg.admin.messageMember}
    </button>
  );
}
