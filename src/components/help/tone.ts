import type { HelpStatus } from "@/lib/data/types";

export const helpTone: Record<HelpStatus, "accent" | "warning" | "success" | "neutral"> = {
  open: "accent", in_progress: "warning", resolved: "success", closed: "neutral",
};
