import { isDemoMode } from "@/lib/env";
import { hasAuthUser } from "@/lib/auth";
import { ResetForm } from "@/components/auth-forms";

/** Reached from the password-recovery email, after /auth/callback opened a session. */
export default async function Reset() {
  return <ResetForm demo={isDemoMode} hasSession={await hasAuthUser()} />;
}
