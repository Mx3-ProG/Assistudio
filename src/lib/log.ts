/**
 * Structured JSON logs (one line per event) for webhooks, payments,
 * commissions, email failures and attribution errors.
 *
 * Redaction is by key: anything that looks like a secret, a credential,
 * banking data or unnecessary personal data is replaced before writing.
 * Log ids and amounts, never people.
 */
type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const REDACT = /secret|password|token|api[_-]?key|authorization|signature|cookie|email|phone|address|iban|bic|card|account_number|routing|name$/i;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (typeof value === "object") {
    const out: Fields = {};
    for (const [k, v] of Object.entries(value as Fields)) out[k] = REDACT.test(k) ? "[redacted]" : redact(v, depth + 1);
    return out;
  }
  if (typeof value === "string") {
    // Stripe / Resend / Supabase secrets that leak into free text.
    return value.replace(/\b(sk|rk|whsec|re)_(live|test)?_?[A-Za-z0-9]{8,}\b/g, "[redacted]").slice(0, 2000);
  }
  return value;
}

function write(level: Level, scope: string, message: string, fields: Fields = {}) {
  const line = JSON.stringify({ level, scope, message, at: new Date().toISOString(), ...(redact(fields) as Fields) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const log = {
  info: (scope: string, message: string, fields?: Fields) => write("info", scope, message, fields),
  warn: (scope: string, message: string, fields?: Fields) => write("warn", scope, message, fields),
  error: (scope: string, message: string, fields?: Fields) => write("error", scope, message, fields),
};
