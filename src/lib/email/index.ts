import "server-only";

/**
 * Email abstraction. Resend is the default adapter (REST, no SDK dependency);
 * without RESEND_API_KEY messages are logged instead of sent (dev only).
 * Swap the adapter here without touching callers.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailAdapter {
  send(msg: EmailMessage): Promise<{ id: string | null }>;
}

const resend: EmailAdapter = {
  async send(msg) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "STUDIO <no-reply@example.com>", ...msg }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { id?: string };
    return { id: data.id ?? null };
  },
};

const logOnly: EmailAdapter = {
  async send(msg) {
    console.info("[email:dev]", msg.to, "—", msg.subject);
    return { id: null };
  },
};

export const email: EmailAdapter = process.env.RESEND_API_KEY ? resend : logOnly;
