import { NextResponse, type NextRequest } from "next/server";
import { env, isDemoMode, isProductionDeployment, isSupabaseConfigured } from "@/lib/env";
import { supabaseService } from "@/lib/supabase/server";
import { transportKind } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Sign-in / email diagnostic. Open in a browser:
 *   https://<site>/api/health/email?key=<CRON_SECRET>
 * Reports configuration (never secret values), the Supabase Auth email
 * provider, the provisioning migrations, and which domains the
 * Resend API key (sign-in codes + transactional emails) can send from.
 * Read-only: sends nothing, writes nothing.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!env.cronSecret || key !== env.cronSecret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const report: Record<string, unknown> = {
    deployment: { production: isProductionDeployment, demoMode: isDemoMode, siteUrl: env.siteUrl },
    config: {
      supabaseUrl: Boolean(env.supabaseUrl),
      supabaseAnonKey: Boolean(env.supabaseAnonKey),
      supabaseServiceKey: Boolean(env.supabaseServiceKey),
      resendApiKey: Boolean(env.resendApiKey),
      emailFrom: env.emailFrom,
      emailReplyTo: env.emailReplyTo,
      transport: transportKind,
    },
  };

  // Database: are the sign-in migrations applied? (read-only calls)
  const db: Record<string, string> = {};
  if (isSupabaseConfigured && env.supabaseServiceKey) {
    const sb = supabaseService();
    const probe = async (name: string, run: () => PromiseLike<{ error: { message: string } | null }>) => {
      try {
        const { error } = await run();
        db[name] = error ? `ERROR: ${error.message}` : "ok";
      } catch (e) {
        db[name] = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
      }
    };
    await probe("function ensure_profile (20261002090000_ensure_profile, optional)", () => sb.rpc("ensure_profile", { p_email: "healthcheck@invalid.invalid" }));
    await probe("table profiles", () => sb.from("profiles").select("id", { head: true, count: "exact" }).limit(1));
  } else {
    db.skipped = "Supabase URL or service role key missing";
  }
  report.database = db;

  // Supabase Auth: is the email provider (needed to open the session) enabled?
  if (env.supabaseUrl && env.supabaseAnonKey) {
    try {
      const res = await fetch(`${env.supabaseUrl}/auth/v1/settings`, { headers: { apikey: env.supabaseAnonKey }, signal: AbortSignal.timeout(10_000) });
      const st = (await res.json().catch(() => ({}))) as { external?: { email?: boolean }; disable_signup?: boolean; mailer_autoconfirm?: boolean };
      report.supabaseAuth = res.ok
        ? {
            emailProviderEnabled: st.external?.email ?? null,
            signupsAllowed: st.disable_signup === undefined ? null : !st.disable_signup,
            reminder: "Sign-in codes are sent by the app through Resend (see `resend` below), not by Supabase Auth. Supabase only opens the session, so its email provider must stay enabled.",
          }
        : { httpStatus: res.status };
    } catch (e) {
      report.supabaseAuth = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Resend: which domains does this key belong to, and are they verified?
  if (env.resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${env.resendApiKey}` },
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await res.json().catch(() => ({}))) as { data?: { name: string; status: string; region?: string }[]; message?: string; name?: string };
      const fromDomain = env.emailFrom.match(/@([^>\s]+)/)?.[1]?.toLowerCase() ?? null;
      if (res.ok) {
        const domains = (body.data ?? []).map((d) => ({ name: d.name, status: d.status, region: d.region }));
        report.resend = {
          domains,
          senderDomain: fromDomain,
          senderDomainStatus: domains.find((d) => d.name.toLowerCase() === fromDomain)?.status
            ?? "NOT IN THIS RESEND ACCOUNT — add/verify it in the account that owns this API key",
        };
      } else {
        report.resend = {
          httpStatus: res.status,
          error: body.message ?? body.name ?? "unknown",
          hint: res.status === 401 && /restricted/i.test(String(body.name ?? body.message))
            ? "Key is 'sending access' only: it cannot list domains. Use Admin → Settings → test email to see the send result."
            : "The key is rejected by Resend: check RESEND_API_KEY on Vercel (Production).",
        };
      }
    } catch (e) {
      report.resend = { error: e instanceof Error ? e.message : String(e) };
    }
  } else {
    report.resend = { error: "RESEND_API_KEY not set on this deployment" };
  }

  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
