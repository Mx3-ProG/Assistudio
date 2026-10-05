"use client";
import { CircleHelp } from "lucide-react";
import { useI18n } from "@/components/providers";
import { RedCount } from "@/components/ui/badge-icon";
import { useHelp } from "./help-context";

/** "? Help" in the top bar: opens the help centre from any page. The count = unread replies to help requests. */
export function HelpButton() {
  const { t } = useI18n();
  const { openCenter, centerOpen, helpUnread } = useHelp();
  const label = helpUnread > 0 ? `${t.hp.button} (${helpUnread})` : t.hp.button;
  return (
    <button type="button" onClick={openCenter} data-tour="help-button" aria-haspopup="dialog" aria-expanded={centerOpen} aria-label={label} title={t.hp.button}
      className="relative inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-[13px] font-medium text-fg-2 transition hover:bg-surface-2 hover:text-fg sm:px-3">
      <CircleHelp className="size-[18px]" />
      <span className="hidden sm:inline">{t.hp.button}</span>
      <RedCount n={helpUnread} className="absolute -end-0.5 -top-0.5 ring-2 ring-bg" />
    </button>
  );
}
