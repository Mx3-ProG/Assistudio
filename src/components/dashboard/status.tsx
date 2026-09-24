import type { CommissionStatus, SaleStatus } from "@/lib/commission";
import type { PayoutStatus } from "@/lib/data/types";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
export const saleTone: Record<SaleStatus, Tone> = {
  pending: "warning", paid: "success", failed: "danger", refunded: "danger", chargeback: "danger", cancelled: "neutral",
};
export const commissionTone: Record<CommissionStatus, Tone> = {
  pending: "neutral", in_validation: "warning", on_hold: "warning", available: "accent", paid: "success", reversed: "danger",
};
export const payoutTone: Record<PayoutStatus, Tone> = {
  scheduled: "neutral", processing: "warning", paid: "success", failed: "danger", cancelled: "neutral",
};
