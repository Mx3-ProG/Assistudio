import "server-only";
import { randomUUID } from "node:crypto";
import { env, isProductionDeployment } from "@/lib/env";
import { formatCode } from "@/lib/auth-code";
import { email } from "./index";
import { renderEmail } from "./templates";

/**
 * Sends a one-time sign-in code, synchronously (the person is waiting on the
 * page). Deliberately not written to the email_events outbox: the code must
 * never be stored in clear text. Throws if the message cannot be sent.
 */
export async function sendSignInCode(input: { to: string; code: string; locale: string }) {
  if (email.name === "log" && isProductionDeployment) {
    throw new Error("RESEND_API_KEY is not set: sign-in codes cannot be delivered");
  }
  const rendered = renderEmail("auth.login_code", { code: formatCode(input.code) }, { locale: input.locale, appUrl: env.siteUrl });
  await email.send({
    to: input.to, ...rendered, idempotencyKey: `login_code:${randomUUID()}`,
    tags: [{ name: "template", value: "auth_login_code" }],
  });
}
