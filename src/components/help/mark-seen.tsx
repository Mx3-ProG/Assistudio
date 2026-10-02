"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markHelpSeen } from "@/app/actions/badges";

/** Clears the Help red dot once the page is on screen (the layout rendered before this read). */
export function MarkHelpSeen({ scope, pending }: { scope: "admin" | "dashboard"; pending: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!pending) return;
    void markHelpSeen(scope).then(() => router.refresh());
  }, [scope, pending, router]);
  return null;
}
