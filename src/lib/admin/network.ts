/**
 * Admin network — pure logic (unit-tested). Turns the per-affiliate
 * aggregates of admin_network_stats() into what the admin page shows:
 * sponsor/recruit tree, conversion rate, rankings and "needs attention".
 *
 * Money rule: `pendingCents` is never counted as earned or owed.
 */
import type { AdminNetworkStats } from "../data/types.ts";

export type NetworkNeed =
  | "application" | "help" | "contract" | "payout_due" | "fraud" | "disputed" | "onboarding" | "inactive";

/** Highest priority first. */
export const NEED_ORDER: NetworkNeed[] = ["help", "contract", "application", "fraud", "disputed", "payout_due", "onboarding", "inactive"];

export interface NetworkMember extends AdminNetworkStats {
  sponsorName: string | null;
  /** Direct recruits' ids. */
  recruitIds: string[];
  /** Every affiliate below this one in the sponsor tree. */
  networkSize: number;
  /** CRM prospects + inbound leads not yet in the CRM. */
  totalProspects: number;
  /** Paid first sales ÷ max(total prospects, paid first sales): a buyer who never was in the CRM counts as a prospect. Null when both are 0. */
  conversionRate: number | null;
  needs: NetworkNeed[];
}

export interface NetworkOptions {
  payoutMinimumCents: number;
  /** Contract dossiers waiting for a staff decision, per affiliate id. */
  dossiersToAct?: Record<string, number>;
  now?: number;
  inactiveDays?: number;
}

const DAY = 86_400_000;

/** Never above 100%: sales that came straight from a link, without a recorded prospect, count as their own prospect. */
export function conversion(paidSales: number, prospects: number): number | null {
  const base = Math.max(prospects, paidSales);
  return base > 0 ? paidSales / base : null;
}

export function buildNetwork(rows: AdminNetworkStats[], opts: NetworkOptions): NetworkMember[] {
  const now = opts.now ?? Date.now();
  const inactiveMs = (opts.inactiveDays ?? 30) * DAY;
  const byId = new Map(rows.map((r) => [r.id, r]));
  const children = new Map<string, string[]>();
  for (const r of rows) {
    if (r.sponsorId && byId.has(r.sponsorId)) children.set(r.sponsorId, [...(children.get(r.sponsorId) ?? []), r.id]);
  }
  const sizeCache = new Map<string, number>();
  const networkSize = (id: string, seen = new Set<string>()): number => {
    const hit = sizeCache.get(id);
    if (hit !== undefined) return hit;
    seen.add(id);
    let n = 0;
    for (const c of children.get(id) ?? []) if (!seen.has(c)) n += 1 + networkSize(c, seen);
    sizeCache.set(id, n);
    return n;
  };

  return rows.map((r) => {
    const totalProspects = r.prospects + r.leads;
    const needs: NetworkNeed[] = [];
    if (r.openHelp > 0) needs.push("help");
    if ((opts.dossiersToAct?.[r.id] ?? 0) > 0) needs.push("contract");
    if (r.status === "pending") needs.push("application");
    if (r.openFraud > 0) needs.push("fraud");
    if (r.disputedCents > 0) needs.push("disputed");
    if (r.status === "approved" && r.availableCents > 0 && r.availableCents >= opts.payoutMinimumCents) needs.push("payout_due");
    if (r.status === "approved" && !r.onboardingCompleted) needs.push("onboarding");
    const last = r.lastActivityAt ? Date.parse(r.lastActivityAt) : null;
    if (r.status === "approved" && now - Date.parse(r.createdAt) > inactiveMs && (last === null || now - last > inactiveMs)) needs.push("inactive");
    needs.sort((a, b) => NEED_ORDER.indexOf(a) - NEED_ORDER.indexOf(b));
    return {
      ...r,
      sponsorName: r.sponsorId ? byId.get(r.sponsorId)?.name ?? null : null,
      recruitIds: children.get(r.id) ?? [],
      networkSize: networkSize(r.id),
      totalProspects,
      conversionRate: conversion(r.paidSales, totalProspects),
      needs,
    };
  });
}

export type RankMetric = "revenue" | "prospects" | "recruits" | "conversion" | "sales" | "earned";

/** Conversion is only ranked from this many prospects, so 1/1 does not top the board. */
export const MIN_PROSPECTS_FOR_CONVERSION = 3;

const metricValue: Record<RankMetric, (m: NetworkMember) => number | null> = {
  revenue: (m) => m.revenueCents,
  prospects: (m) => m.totalProspects,
  recruits: (m) => m.recruits,
  conversion: (m) => (m.totalProspects >= MIN_PROSPECTS_FOR_CONVERSION ? m.conversionRate : null),
  sales: (m) => m.paidSales,
  /** Earned = available + paid. Pending is excluded on purpose. */
  earned: (m) => m.availableCents + m.paidCents,
};

export function rankBy(members: NetworkMember[], metric: RankMetric, limit = 5): { member: NetworkMember; value: number }[] {
  return members
    .map((member) => ({ member, value: metricValue[metric](member) }))
    .filter((x): x is { member: NetworkMember; value: number } => x.value !== null && x.value > 0)
    .sort((a, b) => b.value - a.value || a.member.name.localeCompare(b.member.name))
    .slice(0, limit);
}

export interface NetworkTotals {
  members: number;
  approved: number;
  active30d: number;
  withSponsor: number;
  prospects: number;
  paidSales: number;
  revenueCents: number;
  pendingCents: number;
  availableCents: number;
  paidCents: number;
  needAttention: number;
  conversionRate: number | null;
}

export function networkTotals(members: NetworkMember[], now = Date.now()): NetworkTotals {
  const sum = (f: (m: NetworkMember) => number) => members.reduce((a, m) => a + f(m), 0);
  const prospects = sum((m) => m.totalProspects);
  const paidSales = sum((m) => m.paidSales);
  return {
    members: members.length,
    approved: members.filter((m) => m.status === "approved").length,
    active30d: members.filter((m) => m.lastActivityAt && now - Date.parse(m.lastActivityAt) <= 30 * DAY).length,
    withSponsor: members.filter((m) => m.sponsorId).length,
    prospects,
    paidSales,
    revenueCents: sum((m) => m.revenueCents),
    pendingCents: sum((m) => m.pendingCents + m.disputedCents),
    availableCents: sum((m) => m.availableCents),
    paidCents: sum((m) => m.paidCents),
    needAttention: members.filter((m) => m.needs.length > 0).length,
    conversionRate: members.reduce((a, m) => a + Math.max(m.totalProspects, m.paidSales), 0) > 0
      ? paidSales / members.reduce((a, m) => a + Math.max(m.totalProspects, m.paidSales), 0) : null,
  };
}

export type SortKey = "recent" | "name" | RankMetric | "owed" | "needs";

export function sortMembers(members: NetworkMember[], key: SortKey): NetworkMember[] {
  const out = [...members];
  const by = (f: (m: NetworkMember) => number) => out.sort((a, b) => f(b) - f(a) || a.name.localeCompare(b.name));
  switch (key) {
    case "name": return out.sort((a, b) => a.name.localeCompare(b.name));
    case "recent": return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "owed": return by((m) => m.availableCents);
    case "needs": return by((m) => (m.needs.length ? 100 - NEED_ORDER.indexOf(m.needs[0]) : 0));
    case "conversion": return by((m) => m.conversionRate ?? -1);
    default: return by((m) => metricValue[key](m) ?? -1);
  }
}

export function filterMembers(members: NetworkMember[], q: string, filter: "all" | "needs" | "pending" | "inactive" | "top"): NetworkMember[] {
  const needle = q.trim().toLowerCase();
  return members.filter((m) => {
    if (needle && ![m.name, m.email, m.code, m.country ?? "", m.sponsorName ?? ""].some((x) => x.toLowerCase().includes(needle))) return false;
    if (filter === "needs") return m.needs.length > 0;
    if (filter === "pending") return m.status === "pending";
    if (filter === "inactive") return m.needs.includes("inactive");
    if (filter === "top") return m.paidSales > 0;
    return true;
  });
}
