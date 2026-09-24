import "server-only";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * Email transport. Resend is the default adapter (REST, no SDK dependency);
 * without RESEND_API_KEY messages are logged instead of sent (dev only).
 * Callers never use this directly: they go through EmailService
 * (src/lib/email/service.ts), which renders templates and logs email_events.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Same key → Resend sends at most once (safe retries). */
  idempotencyKey?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailAdapter {
  name: string;
  send(msg: EmailMessage): Promise<{ id: string | null }>;
}

const resend: EmailAdapter = {
  name: "resend",
  async send(msg) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
        ...(msg.idempotencyKey ? { "Idempotency-Key": msg.idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from: env.emailFrom,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        ...(env.emailReplyTo ? { reply_to: env.emailReplyTo } : {}),
        ...(msg.tags ? { tags: msg.tags } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { id?: string };
    return { id: data.id ?? null };
  },
};

const logOnly: EmailAdapter = {
  name: "log",
  async send(msg) {
    log.info("email", "dev email (not sent: RESEND_API_KEY missing)", { subject: msg.subject, key: msg.idempotencyKey });
    return { id: null };
  },
};

export const email: EmailAdapter = env.resendApiKey ? resend : logOnly;
