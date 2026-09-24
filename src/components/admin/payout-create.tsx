"use client";
import { useActionState } from "react";
import type { AdminState } from "@/app/actions/admin";
import { buttonClass } from "@/components/ui/button";

export function PayoutCreate({ action, affiliateId, label }: { action: (s: AdminState, f: FormData) => Promise<AdminState>; affiliateId: string; label: string }) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(action, {});
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="affiliateId" value={affiliateId} />
      <button disabled={pending} className={buttonClass("primary", "sm")}>{label}</button>
      {state.error && <span className="text-[12px] text-danger">{state.error}</span>}
    </form>
  );
}
