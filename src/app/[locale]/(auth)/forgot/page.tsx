import { isDemoMode } from "@/lib/env";
import { ForgotForm } from "@/components/auth-forms";

export default function Forgot() {
  return <ForgotForm demo={isDemoMode} />;
}
