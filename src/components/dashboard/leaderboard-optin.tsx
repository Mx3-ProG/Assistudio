"use client";
import { useOptimistic, useTransition } from "react";
import { useI18n } from "@/components/providers";
import { setLeaderboardOptIn } from "@/app/actions/dashboard";

export function LeaderboardOptIn({ value }: { value: boolean }) {
  const { t } = useI18n();
  const [v, setV] = useOptimistic(value);
  const [, start] = useTransition();
  return (
    <label className="flex items-center justify-between gap-4 text-[14px]">
      <span>{t.dash.leaderboard.optIn}</span>
      <input type="checkbox" role="switch" checked={v} className="size-5 accent-[var(--accent)]"
        onChange={(e) => { const next = e.target.checked; start(async () => { setV(next); await setLeaderboardOptIn(next); }); }} />
    </label>
  );
}
