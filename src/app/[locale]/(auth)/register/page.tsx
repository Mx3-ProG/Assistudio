import { isDemoMode } from "@/lib/env";
import { RegisterForm } from "@/components/auth-forms";

export default function Register() {
  return <RegisterForm demo={isDemoMode} />;
}
