"use client";
import { useOptimistic, useTransition } from "react";
import { Star } from "lucide-react";
import { useI18n } from "@/components/providers";
import { toggleFavorite } from "@/app/actions/sales-center";
import { cn } from "@/lib/cn";

export function FavoriteButton({ kind, contentKey, initial, className }: { kind: string; contentKey: string; initial: boolean; className?: string }) {
  const { t } = useI18n();
  const [on, setOn] = useOptimistic(initial);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? t.sc.unfavorite : t.sc.favorite}
      title={on ? t.sc.unfavorite : t.sc.favorite}
      onClick={() => start(async () => { setOn(!on); await toggleFavorite(kind, contentKey, !on); })}
      className={cn("grid size-9 shrink-0 place-items-center rounded-full transition hover:bg-surface-2", on ? "text-warning" : "text-muted", className)}
    >
      <Star className={cn("size-[18px]", on && "fill-current")} />
    </button>
  );
}
