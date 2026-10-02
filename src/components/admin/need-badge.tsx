import type { NetworkNeed } from "@/lib/admin/network";
import { Badge } from "@/components/ui/primitives";

const tone: Record<NetworkNeed, "danger" | "warning" | "accent" | "success" | "neutral"> = {
  help: "danger", contract: "warning", application: "accent", fraud: "danger", disputed: "warning",
  payout_due: "success", onboarding: "neutral", inactive: "neutral",
};

export function NeedBadge({ need, label }: { need: NetworkNeed; label: string }) {
  return <Badge tone={tone[need]}>{label}</Badge>;
}
