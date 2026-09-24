-- =============================================================================
-- Minimal stand-in for the parts of a Supabase database the migrations rely
-- on, so the SQL test suites can run on a plain local Postgres (no Docker).
-- NEVER apply this to a real Supabase project: it already provides all of it.
-- =============================================================================

do $$ begin
  create role anon nologin;
exception when duplicate_object then null; end $$;
do $$ begin
  create role authenticated nologin;
exception when duplicate_object then null; end $$;
do $$ begin
  create role service_role nologin bypassrls;
exception when duplicate_object then null; end $$;

create schema if not exists auth;
create schema if not exists extensions;

create table if not exists auth.users (
  id                 uuid primary key,
  email              text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

-- Same contract as Supabase: the JWT subject of the current request.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.sub', true),
                         current_setting('request.jwt.sub', true)), '')::uuid
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- Supabase grants table privileges broadly and relies on RLS.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- Supabase Realtime publication (migrations may add tables to it).
do $$ begin
  create publication supabase_realtime;
exception when duplicate_object then null; end $$;
