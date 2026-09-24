import type { CommissionStatus, SaleStatus } from "@/lib/commission";
import type { PayoutStatus } from "@/lib/data/types";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
export const saleTone: Record<SaleStatus, Tone> = {
  pending: "warning", paid: "success", failed: "danger", refunded: "danger", chargeback: "danger", cancelled: "neutral",
  disputed: "warning", partially_refunded: "warning",
};
export const commissionTone: Record<CommissionStatus, Tone> = {
  awaiting_payment: "neutral", pending: "warning", disputed: "warning", available: "accent", paid: "success", reversed: "danger",
};
export const payoutTone: Record<PayoutStatus, Tone> = {
  scheduled: "neutral", processing: "warning", paid: "success", failed: "danger", cancelled: "neutral",
};
