"use client";
import { useEffect } from "react";
import { trackOnce } from "@/lib/analytics/client";

/** Counts one home view per browser tab session (no identifier, no cookie). */
export function HomeView() {
  useEffect(() => trackOnce("home", "home_view"), []);
  return null;
}
