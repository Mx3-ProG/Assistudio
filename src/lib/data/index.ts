import "server-only";
import { cache } from "react";
import { isDemoMode, assertConfigured } from "@/lib/env";
import { demoRepo } from "./demo";
import { supabaseRepo } from "./supabase";
import type { Repo } from "./repo";

export function repo(): Repo {
  assertConfigured();
  return isDemoMode ? demoRepo : supabaseRepo;
}

/** Deduplicated per request. */
export const getSession = cache(() => repo().getSession());

export type * from "./types";
export type { Range } from "./repo";
