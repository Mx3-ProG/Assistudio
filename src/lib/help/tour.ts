/**
 * The guided tour, as data. Each step points at a real element through a
 * stable `data-tour="…"` attribute (never a CSS class) and may first navigate
 * to its page. The tour only navigates and highlights: it never clicks, so it
 * cannot create, send, change or delete anything.
 *
 * Texts live in the dictionary (`hp.tour.steps[id]`). A step whose target is
 * missing (permissions, feature off, hidden on this screen size) is skipped.
 */
export type TourPlacement = "top" | "bottom" | "start" | "end";

export interface TourStep {
  id: "overview" | "navProspects" | "addProspect" | "navSalesCenter" | "intents" | "kit" | "documents" | "commissions" | "help";
  /** Path under /{locale}; null = whatever page the partner is on. */
  route: string | null;
  /** Value of the `data-tour` attribute to highlight. */
  target: string;
  placement: TourPlacement;
}

export const TOUR_STEPS: TourStep[] = [
  { id: "overview", route: "/dashboard", target: "next-action", placement: "bottom" },
  { id: "navProspects", route: "/dashboard", target: "nav-prospects", placement: "end" },
  { id: "addProspect", route: "/dashboard/prospects", target: "add-prospect", placement: "bottom" },
  { id: "navSalesCenter", route: "/dashboard/prospects", target: "nav-sales-center", placement: "end" },
  { id: "intents", route: "/dashboard/sales-center", target: "sales-intents", placement: "top" },
  { id: "kit", route: "/dashboard/sales-center", target: "sales-kit", placement: "top" },
  { id: "documents", route: "/dashboard/documents", target: "video-help", placement: "bottom" },
  { id: "commissions", route: "/dashboard/commissions", target: "commission-flow", placement: "bottom" },
  { id: "help", route: null, target: "help-button", placement: "bottom" },
];

/** Contextual help: which topic the help centre opens with, from the current path. */
export type HelpTopic = "home" | "prospects" | "salesCenter" | "documents" | "commissions" | "link" | "referrals" | "other";

export function topicFor(pathname: string): HelpTopic {
  const p = pathname.replace(/^\/[a-z]{2}(?=\/)/, "");
  if (p === "/dashboard" || p === "/dashboard/") return "home";
  if (p.startsWith("/dashboard/prospects")) return "prospects";
  if (p.startsWith("/dashboard/sales-center") || p.startsWith("/dashboard/sales-kit") || p.startsWith("/dashboard/find")) return "salesCenter";
  if (p.startsWith("/dashboard/documents")) return "documents";
  if (["/dashboard/commissions", "/dashboard/sales", "/dashboard/recurring", "/dashboard/payouts"].some((x) => p.startsWith(x))) return "commissions";
  if (p.startsWith("/dashboard/link") || p.startsWith("/dashboard/promo-codes") || p.startsWith("/dashboard/campaigns")) return "link";
  if (p.startsWith("/dashboard/referrals")) return "referrals";
  return "other";
}
