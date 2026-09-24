import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/** Request-scoped client acting as the signed-in user. RLS applies. */
export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) jar.set(name, value, options);
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS — only for narrowly-scoped server tasks:
 * click/lead ingestion, public referral resolution, payment webhooks, cron.
 * Never import from client components; never pass user-controlled filters
 * without validation.
 */
export function supabaseService() {
  if (!env.supabaseServiceKey) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
