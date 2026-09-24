import { Languages } from "lucide-react";
import { Badge } from "@/components/ui/primitives";

/** Content shown in English because no reviewed translation is published yet. */
export function FallbackBadge({ show, label }: { show?: boolean; label: string }) {
  if (!show) return null;
  return <Badge tone="warning"><Languages className="size-3" />{label}</Badge>;
}
