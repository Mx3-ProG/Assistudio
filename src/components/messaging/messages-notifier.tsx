"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { supabaseBrowser } from "@/lib/supabase/client";
import { unreadCount } from "@/app/actions/messaging";

/**
 * App-wide "new message" signal: refreshes the unread badge and shows a toast
 * when a message arrives in a conversation that isn't on screen. Realtime
 * (RLS-filtered) in production; light polling in demo mode.
 */
export function MessagesNotifier({ me, base, realtime }: { me: string; base: string; realtime: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<string | null>(null);
  const path = useRef(pathname);
  useEffect(() => { path.current = pathname; }, [pathname]);
  const refresh = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const later = () => {
      if (refresh.current) clearTimeout(refresh.current);
      refresh.current = setTimeout(() => router.refresh(), 1200);
    };
    if (!realtime) {
      let last: number | null = null;
      const tick = async () => {
        const n = await unreadCount().catch(() => null);
        if (n === null) return;
        if (last !== null && n > last && !path.current.startsWith(base)) { setToast(base); router.refresh(); }
        last = n;
      };
      void tick();
      const id = setInterval(tick, 10_000);
      return () => clearInterval(id);
    }
    const sb = supabaseBrowser();
    const ch = sb.channel(`inbox:${me}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        const row = p.new as { conversation_id?: string; sender_id?: string };
        if (!row.conversation_id || row.sender_id === me) return;
        if (!path.current.endsWith(row.conversation_id)) setToast(`${base}/${row.conversation_id}`);
        later();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, later)
      .subscribe();
    return () => { void sb.removeChannel(ch); };
  }, [me, base, realtime, router]);

  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 6000); return () => clearTimeout(id); }, [toast]);
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lg animate-rise sm:inset-x-auto sm:end-6 lg:bottom-6">
      <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent"><MessageCircle className="size-4" /></span>
      <span className="min-w-0 flex-1 text-[14px] font-medium">{t.msg.toast.generic}</span>
      <Link href={toast} onClick={() => setToast(null)} className="h-8 rounded-full bg-accent px-3 text-[12.5px] font-medium leading-8 text-accent-fg">{t.msg.toast.open}</Link>
      <button type="button" onClick={() => setToast(null)} aria-label={t.common.close} className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface-2"><X className="size-4" /></button>
    </div>
  );
}
