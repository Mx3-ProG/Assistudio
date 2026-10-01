import { test } from "node:test";
import assert from "node:assert/strict";
import { StepError, describeError, isDuplicate, isEmailAlreadyRegistered, isMissingDbObject } from "./auth-errors.ts";

test("a missing SQL function or table is reported as a missing migration, with its step", () => {
  const pgrst = { code: "PGRST202", message: "Could not find the function public.ensure_profile(p_email) in the schema cache" };
  assert.ok(isMissingDbObject(pgrst));
  assert.ok(isMissingDbObject({ code: "42P01", message: 'relation "public.auth_login_codes" does not exist' }));
  assert.equal(describeError(new StepError("issue_code", pgrst)), "db_missing_migration (issue_code)");
});

test("configuration problems are named", () => {
  assert.equal(describeError(new Error("SUPABASE_SECRET_KEY is not set")), "service_key_missing");
  assert.equal(describeError(new StepError("create_user", { message: "Invalid API key" })), "service_key_invalid (create_user)");
});

test("duplicates and existing accounts are recognised", () => {
  assert.ok(isDuplicate({ code: "23505", message: "duplicate key value violates unique constraint" }));
  assert.ok(isEmailAlreadyRegistered({ code: "email_exists", message: "A user with this email address has already been registered" }));
  assert.ok(!isEmailAlreadyRegistered({ message: "Database error creating new user" }));
});

test("other errors keep their step and a short message", () => {
  const d = describeError(new StepError("session_open", { message: "Email link is invalid or has expired" }));
  assert.equal(d, "session_open: Email link is invalid or has expired");
  assert.ok(describeError(new StepError("x", { message: "a".repeat(500) })).length < 160);
});
