/**
 * Sign-in error classification — pure (unit-tested).
 *
 * Every technical failure in the sign-in flow is tagged with the step it
 * happened in, then reduced to a short, non-sensitive detail shown to the
 * person ("Technical detail: …") and logged, so a failure in production can be
 * diagnosed from a screenshot.
 */
export type ErrLike = { code?: string; message?: string; status?: number; name?: string } | null | undefined;

export class StepError extends Error {
  step: string;
  cause: unknown;
  constructor(step: string, cause: unknown) {
    super(`${step}: ${messageOf(cause)}`);
    this.name = "StepError";
    this.step = step;
    this.cause = cause;
  }
}

export function messageOf(e: unknown): string {
  if (!e) return "unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  const m = (e as ErrLike)?.message;
  return typeof m === "string" ? m : JSON.stringify(e).slice(0, 200);
}

const codeOf = (e: unknown) => (e && typeof e === "object" ? String((e as ErrLike)?.code ?? "") : "");

/** SQL function or table not found: the migration that creates it is not applied. */
export function isMissingDbObject(e: unknown): boolean {
  const code = codeOf(e);
  return ["PGRST202", "PGRST205", "42883", "42P01"].includes(code)
    || /could not find the (function|table)|function .* does not exist|relation .* does not exist|schema cache/i.test(messageOf(e));
}

export const isDuplicate = (e: unknown) => codeOf(e) === "23505" || /duplicate key/i.test(messageOf(e));

export const isEmailAlreadyRegistered = (e: unknown) =>
  ["email_exists", "user_already_exists"].includes(codeOf(e)) || /already (been )?registered|already exists/i.test(messageOf(e));

/** Short, non-sensitive detail for the person and the logs. */
export function describeError(e: unknown): string {
  const step = e instanceof StepError ? e.step : "unknown";
  const cause = e instanceof StepError ? e.cause : e;
  const msg = messageOf(cause);
  if (/SUPABASE_SECRET_KEY is not set|service.?role/i.test(msg)) return "service_key_missing";
  if (/invalid api key|invalid jwt|jwt (expired|malformed)|no api key/i.test(msg)) return `service_key_invalid (${step})`;
  if (isMissingDbObject(cause)) return `db_missing_migration (${step})`;
  return `${step}: ${msg.replace(/\s+/g, " ").slice(0, 140)}`;
}
