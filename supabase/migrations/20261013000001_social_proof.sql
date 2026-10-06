-- =============================================================================
-- Studio ATS — social proof (V1.0): testimonials, consent, moderation,
-- verified proof events. Mirrored by src/lib/proof.ts (pure, tested).
--
--   ambassador (dashboard) ─┐                                   ┌─▶ public_testimonials(placement)
--                           ├─▶ testimonial `pending` ─(staff)─▶ `approved` / `rejected` / `hidden`
--   client (invite link) ───┘        consent logged                └─▶ placements[] (home, offers, …)
--
--   paid payout / paid sale / approved testimonial ─(staff_create_proof_event)─▶ social_proof_events
--        value + date read from the source row, never typed ─(publish)─▶ public_proof_events()
--
-- Rules enforced here (not only in the UI):
--   * Nothing is ever published without the author's consent; withdrawing it
--     hides the testimonial at once. Consents are append-only.
--   * `verified` is computed at submission from the database (approved partner
--     account / customer with a paid sale). Nobody can set it by hand.
--   * The words of a testimonial (content, recommendation, rating, author) are
--     immutable: staff edit presentation metadata only (placements, service,
--     a MORE private name display, featuring, order) and may remove media.
--   * A proof event copies its value from a real source row and is re-checked
--     when published and at every public read (a refunded / failed source stops
--     showing). `proof_type = 'demo'` rows can never be published.
--   * Public reads go through SECURITY DEFINER functions returning a whitelist
--     of columns: no email, no ids of people, no storage paths.
-- Clients have no account: they write through a single-use invite whose token
-- is only stored hashed (sha256), checked by server-only code (service role).
-- =============================================================================

create type public.testimonial_type as enum ('client', 'ambassador');
create type public.testimonial_status as enum ('pending', 'approved', 'rejected', 'hidden');
create type public.testimonial_media as enum ('text', 'video');

create table public.testimonial_invites (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers (id),
  token_hash   text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  locale       text not null default 'fr',
  note         text check (note is null or length(note) <= 300),
  created_by   uuid references public.profiles (id),
  expires_at   timestamptz not null,
  used_at      timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index testimonial_invites_customer_idx on public.testimonial_invites (customer_id, created_at desc);

create table public.testimonials (
  id                uuid primary key default gen_random_uuid(),
  public_ref        text not null unique default ('AVI-' || public.gen_code(6)),
  testimonial_type  public.testimonial_type not null,
  -- Author: a partner account (profile + affiliate) or a customer (through an invite).
  profile_id        uuid references public.profiles (id),
  affiliate_id      uuid references public.affiliates (id),
  customer_id       uuid references public.customers (id),
  invite_id         uuid unique references public.testimonial_invites (id),
  author_name       text not null check (length(btrim(author_name)) between 2 and 80),
  -- 'full' | 'first_name' | 'initials': chosen by the author; staff may only make it more private.
  author_display    text not null default 'first_name' check (author_display in ('full', 'first_name', 'initials')),
  display_mode      text not null default 'first_name' check (display_mode in ('full', 'first_name', 'initials')),
  company_name      text check (company_name is null or length(company_name) <= 120),
  profession        text check (profession is null or length(profession) <= 80),
  activity          text check (activity is null or length(activity) <= 120),
  rating            smallint check (rating is null or rating between 1 and 5),
  content           text not null check (length(btrim(content)) between 10 and 2000),
  recommendation    text check (recommendation is null or length(recommendation) <= 1000),
  locale            text not null default 'fr',
  media_type        public.testimonial_media not null default 'text',
  video_path        text,
  video_mime        text,
  video_width       int check (video_width is null or video_width between 1 and 8000),
  video_height      int check (video_height is null or video_height between 1 and 8000),
  video_duration_ms int check (video_duration_ms is null or video_duration_ms between 0 and 600000),
  poster_path       text,
  photo_path        text,
  logo_path         text,
  consent           boolean not null check (consent),
  consent_at        timestamptz not null,
  consent_version   text not null check (length(consent_version) between 1 and 40),
  consent_text      text not null check (length(consent_text) between 10 and 2000),
  consent_withdrawn_at timestamptz,
  status            public.testimonial_status not null default 'pending',
  verified          boolean not null default false,
  verified_basis    text check (verified_basis is null or verified_basis in ('approved_partner', 'paying_customer')),
  -- Presentation metadata (staff).
  placements        text[] not null default '{}',
  service           text check (service is null or service in ('website', 'crm', 'automation', 'maintenance', 'support', 'tools', 'other')),
  case_study_key    text check (case_study_key is null or case_study_key ~ '^[a-z0-9][a-z0-9-]{0,60}$'),
  show_company      boolean not null default true,
  featured          boolean not null default false,
  sort              int not null default 0,
  reviewed_by       uuid references public.profiles (id),
  reviewed_at       timestamptz,
  review_note       text check (review_note is null or length(review_note) <= 1000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint testimonials_author check (
    (testimonial_type = 'ambassador' and profile_id is not null and affiliate_id is not null and customer_id is null)
    or (testimonial_type = 'client' and customer_id is not null and invite_id is not null and profile_id is null)),
  constraint testimonials_video check ((media_type = 'video') = (video_path is not null)),
  constraint testimonials_placements check (
    placements <@ array['home', 'offers', 'client', 'ambassador', 'sales_center', 'app', 'case_study']::text[]),
  constraint testimonials_publishable check (status <> 'approved' or consent_withdrawn_at is null),
  constraint testimonials_verified_basis check (verified = (verified_basis is not null))
);
create index testimonials_status_idx on public.testimonials (status, created_at desc);
create index testimonials_profile_idx on public.testimonials (profile_id) where profile_id is not null;
create index testimonials_placements_idx on public.testimonials using gin (placements) where status = 'approved';
create trigger testimonials_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();

-- The author's words and the verification can never change after submission.
create or replace function public.testimonials_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.content is distinct from old.content or new.recommendation is distinct from old.recommendation
     or new.rating is distinct from old.rating or new.author_name is distinct from old.author_name
     or new.author_display is distinct from old.author_display
     or new.company_name is distinct from old.company_name or new.profession is distinct from old.profession
     or new.activity is distinct from old.activity
     or new.testimonial_type is distinct from old.testimonial_type or new.profile_id is distinct from old.profile_id
     or new.affiliate_id is distinct from old.affiliate_id or new.customer_id is distinct from old.customer_id
     or new.invite_id is distinct from old.invite_id or new.verified is distinct from old.verified
     or new.verified_basis is distinct from old.verified_basis or new.consent_at is distinct from old.consent_at
     or new.consent_version is distinct from old.consent_version or new.consent_text is distinct from old.consent_text
     or new.locale is distinct from old.locale or new.created_at is distinct from old.created_at then
    raise exception 'proof.immutable';
  end if;
  -- Media can be removed, never swapped for another file.
  if (new.video_path is distinct from old.video_path and new.video_path is not null)
     or (new.poster_path is distinct from old.poster_path and new.poster_path is not null)
     or (new.photo_path is distinct from old.photo_path and new.photo_path is not null)
     or (new.logo_path is distinct from old.logo_path and new.logo_path is not null) then
    raise exception 'proof.immutable';
  end if;
  if old.consent_withdrawn_at is not null and new.consent_withdrawn_at is null then
    raise exception 'proof.immutable';
  end if;
  return new;
end $$;
create trigger testimonials_guard before update on public.testimonials
  for each row execute function public.testimonials_guard();

create table public.testimonial_consents (
  id              bigint generated always as identity primary key,
  testimonial_id  uuid not null references public.testimonials (id),
  profile_id      uuid references public.profiles (id),
  customer_id     uuid references public.customers (id),
  action          text not null check (action in ('granted', 'withdrawn')),
  consent_version text not null,
  consent_text    text,
  created_at      timestamptz not null default now()
);
create index testimonial_consents_testimonial_idx on public.testimonial_consents (testimonial_id, created_at);
create trigger testimonial_consents_immutable before update or delete on public.testimonial_consents
  for each row execute function public.forbid_mutation();

create table public.social_proof_events (
  id               uuid primary key default gen_random_uuid(),
  type             text not null check (type in ('commission_paid', 'new_client', 'testimonial_published')),
  source_table     text not null check (source_table in ('payouts', 'sales', 'testimonials')),
  source_id        uuid not null,
  proof_type       text not null default 'real' check (proof_type in ('real', 'demo')),
  -- Never a name, an email or a company: e.g. "Partenaire Studio ATS", "Studio Pro".
  anonymized_label text not null check (length(anonymized_label) between 2 and 80),
  value_cents      bigint check (value_cents is null or value_cents >= 0),
  currency         char(3),
  occurred_at      timestamptz not null,
  verified         boolean not null default false,
  published        boolean not null default false,
  published_at     timestamptz,
  created_by       uuid references public.profiles (id),
  created_at       timestamptz not null default now(),
  unique (type, source_id),
  constraint social_proof_events_publishable check (not published or (verified and proof_type = 'real'))
);
create index social_proof_events_public_idx on public.social_proof_events (occurred_at desc) where published;

-- -----------------------------------------------------------------------------
-- RLS: authors read their own testimonials, staff read everything; no direct writes.
-- -----------------------------------------------------------------------------
alter table public.testimonials enable row level security;
alter table public.testimonial_consents enable row level security;
alter table public.testimonial_invites enable row level security;
alter table public.social_proof_events enable row level security;

create policy testimonials_read on public.testimonials for select
  using (profile_id = auth.uid() or public.is_staff());
create policy testimonial_consents_read on public.testimonial_consents for select
  using (profile_id = auth.uid() or public.is_staff());
create policy testimonial_invites_read on public.testimonial_invites for select using (public.is_staff());
create policy social_proof_events_read on public.social_proof_events for select using (public.is_staff());

revoke insert, update, delete on public.testimonials, public.testimonial_consents,
  public.testimonial_invites, public.social_proof_events from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Helpers (internal)
-- -----------------------------------------------------------------------------
create or replace function public.proof_display_rank(p text) returns int
language sql immutable as $$ select case p when 'full' then 3 when 'first_name' then 2 else 1 end $$;

create or replace function public.proof_display_name(p_name text, p_mode text) returns text
language sql immutable as $$
  select case p_mode
    when 'full' then btrim(p_name)
    when 'first_name' then split_part(btrim(p_name), ' ', 1)
    else (select string_agg(left(w, 1) || '.', ' ') from regexp_split_to_table(btrim(p_name), '\s+') w)
  end
$$;

-- Media must sit under the author's own folder of the private bucket:
--   a/{profile_id}/…  (partners)   c/{invite_id}/…  (clients)
create or replace function public.proof_check_media(p_path text, p_prefix text, p_kind text) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  v_mime text;
begin
  if p_path is null or p_path = '' then return null; end if;
  if p_path !~ ('^' || p_prefix || '/[a-f0-9]{32}\.(mp4|webm|mov|jpg|png|webp)$') then
    raise exception 'proof.invalid_media';
  end if;
  if p_kind = 'video' and p_path !~ '\.(mp4|webm|mov)$' then raise exception 'proof.invalid_media'; end if;
  if p_kind <> 'video' and p_path !~ '\.(jpg|png|webp)$' then raise exception 'proof.invalid_media'; end if;
  -- On Supabase, the object must exist (uploaded through the signed URL).
  if to_regclass('storage.objects') is not null then
    execute 'select metadata->>''mimetype'' from storage.objects where bucket_id = $1 and name = $2'
      into v_mime using 'testimonial-media', p_path;
    if v_mime is null then raise exception 'proof.media_missing'; end if;
  end if;
  return p_path;
end $$;

-- Shared insert for both kinds of author. `p` is the validated form (jsonb).
create or replace function public.proof_insert_testimonial(
  p_type public.testimonial_type, p_profile uuid, p_affiliate uuid, p_customer uuid, p_invite uuid,
  p_prefix text, p_verified_basis text, p jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_video text := public.proof_check_media(nullif(p->>'video_path', ''), p_prefix, 'video');
  v_display text := coalesce(nullif(p->>'author_display', ''), 'first_name');
begin
  if coalesce((p->>'consent')::boolean, false) is not true then raise exception 'proof.consent_required'; end if;
  insert into public.testimonials (
    testimonial_type, profile_id, affiliate_id, customer_id, invite_id,
    author_name, author_display, display_mode, company_name, profession, activity, rating, content, recommendation, locale,
    media_type, video_path, video_mime, video_width, video_height, video_duration_ms, poster_path, photo_path, logo_path,
    consent, consent_at, consent_version, consent_text, verified, verified_basis, show_company)
  values (
    p_type, p_profile, p_affiliate, p_customer, p_invite,
    btrim(p->>'author_name'), v_display, v_display, nullif(btrim(p->>'company_name'), ''), nullif(btrim(p->>'profession'), ''),
    nullif(btrim(p->>'activity'), ''), nullif(p->>'rating', '')::smallint, btrim(p->>'content'), nullif(btrim(p->>'recommendation'), ''),
    coalesce(nullif(p->>'locale', ''), 'fr'),
    case when v_video is null then 'text' else 'video' end::public.testimonial_media, v_video,
    case when v_video is null then null else nullif(p->>'video_mime', '') end,
    nullif(p->>'video_width', '')::int, nullif(p->>'video_height', '')::int, nullif(p->>'video_duration_ms', '')::int,
    public.proof_check_media(nullif(p->>'poster_path', ''), p_prefix, 'image'),
    public.proof_check_media(nullif(p->>'photo_path', ''), p_prefix, 'image'),
    public.proof_check_media(nullif(p->>'logo_path', ''), p_prefix, 'image'),
    true, now(), p->>'consent_version', p->>'consent_text',
    p_verified_basis is not null, p_verified_basis, true)
  returning id into v_id;
  insert into public.testimonial_consents (testimonial_id, profile_id, customer_id, action, consent_version, consent_text)
  values (v_id, p_profile, p_customer, 'granted', p->>'consent_version', p->>'consent_text');
  return v_id;
end $$;

-- -----------------------------------------------------------------------------
-- Partner: "Give my review"
-- -----------------------------------------------------------------------------
create or replace function public.submit_ambassador_testimonial(p jsonb) returns table (id uuid, ref text)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  a public.affiliates%rowtype;
  v_id uuid;
begin
  if me is null then raise exception 'proof.not_allowed'; end if;
  select * into a from public.affiliates where profile_id = me and deleted_at is null for update;
  if not found then raise exception 'proof.not_allowed'; end if;
  -- One review waiting for moderation at a time, three per 30 days at most.
  if exists (select 1 from public.testimonials t where t.profile_id = me and t.status = 'pending') then
    raise exception 'proof.already_pending';
  end if;
  if (select count(*) from public.testimonials t where t.profile_id = me and t.created_at > now() - interval '30 days') >= 3 then
    raise exception 'proof.rate_limited';
  end if;
  v_id := public.proof_insert_testimonial('ambassador', me, a.id, null, null, 'a/' || me::text,
    case when a.status = 'approved' then 'approved_partner' end, p);
  perform public.log_audit('testimonial.submit', 'testimonial', v_id::text, null,
    jsonb_build_object('type', 'ambassador', 'verified', a.status = 'approved'), null);
  return query select t.id, t.public_ref from public.testimonials t where t.id = v_id;
end $$;

-- The author withdraws consent: hidden at once, never shown again. Clients have
-- no account: staff record their withdrawal request (audited).
create or replace function public.withdraw_testimonial(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  t public.testimonials%rowtype;
begin
  select * into t from public.testimonials where testimonials.id = p_id for update;
  if not found then raise exception 'proof.not_allowed'; end if;
  if t.profile_id is distinct from auth.uid() and not (t.testimonial_type = 'client' and public.is_staff()) then
    raise exception 'proof.not_allowed';
  end if;
  if t.consent_withdrawn_at is not null then return; end if;
  update public.testimonials set consent_withdrawn_at = now(), status = 'hidden', placements = '{}', featured = false
   where testimonials.id = p_id;
  insert into public.testimonial_consents (testimonial_id, profile_id, customer_id, action, consent_version)
  values (p_id, t.profile_id, t.customer_id, 'withdrawn', t.consent_version);
  update public.social_proof_events set published = false
   where source_table = 'testimonials' and source_id = p_id;
  perform public.log_audit('testimonial.withdraw', 'testimonial', p_id::text,
    jsonb_build_object('status', t.status), jsonb_build_object('status', 'hidden'), null);
end $$;

-- -----------------------------------------------------------------------------
-- Client: single-use invite (server-only, service role)
-- -----------------------------------------------------------------------------
create or replace function public.staff_create_testimonial_invite(p_customer uuid, p_token_hash text, p_days int, p_locale text, p_note text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  if not exists (select 1 from public.customers where customers.id = p_customer and deleted_at is null) then
    raise exception 'proof.not_found';
  end if;
  insert into public.testimonial_invites (customer_id, token_hash, locale, note, created_by, expires_at)
  values (p_customer, p_token_hash, coalesce(nullif(p_locale, ''), 'fr'), nullif(btrim(p_note), ''), auth.uid(),
          now() + make_interval(days => greatest(1, least(coalesce(p_days, 30), 90))))
  returning id into v_id;
  perform public.log_audit('testimonial.invite', 'customer', p_customer::text, null, jsonb_build_object('invite', v_id), null);
  return v_id;
end $$;

create or replace function public.staff_revoke_testimonial_invite(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  update public.testimonial_invites set revoked_at = now() where id = p_id and used_at is null and revoked_at is null;
  perform public.log_audit('testimonial.invite_revoke', 'testimonial_invite', p_id::text, null, null, null);
end $$;

-- What the invite page may show: never the customer's email.
create or replace function public.testimonial_invite_lookup(p_token_hash text)
returns table (invite_id uuid, state text, company_name text, contact_name text, locale text)
language sql stable security definer set search_path = public as $$
  select i.id,
         case when i.revoked_at is not null then 'revoked' when i.used_at is not null then 'used'
              when i.expires_at <= now() then 'expired' else 'open' end,
         c.company_name, c.contact_name, i.locale
    from public.testimonial_invites i join public.customers c on c.id = i.customer_id
   where i.token_hash = p_token_hash
$$;

create or replace function public.submit_client_testimonial(p_token_hash text, p jsonb) returns table (id uuid, ref text)
language plpgsql security definer set search_path = public as $$
declare
  i public.testimonial_invites%rowtype;
  v_id uuid;
  v_paid boolean;
begin
  select * into i from public.testimonial_invites where token_hash = p_token_hash for update;
  if not found or i.used_at is not null or i.revoked_at is not null or i.expires_at <= now() then
    raise exception 'proof.invite_invalid';
  end if;
  v_paid := exists (select 1 from public.sales s where s.customer_id = i.customer_id and s.status = 'paid');
  v_id := public.proof_insert_testimonial('client', null, null, i.customer_id, i.id, 'c/' || replace(i.id::text, '-', ''),
    case when v_paid then 'paying_customer' end, p);
  update public.testimonial_invites set used_at = now() where testimonial_invites.id = i.id;
  perform public.log_audit('testimonial.submit', 'testimonial', v_id::text, null,
    jsonb_build_object('type', 'client', 'verified', v_paid), null);
  return query select t.id, t.public_ref from public.testimonials t where t.id = v_id;
end $$;

-- -----------------------------------------------------------------------------
-- Staff moderation (audited)
-- -----------------------------------------------------------------------------
create or replace function public.staff_review_testimonial(p_id uuid, p_status public.testimonial_status, p_note text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  t public.testimonials%rowtype;
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  select * into t from public.testimonials where id = p_id for update;
  if not found then raise exception 'proof.not_found'; end if;
  if p_status = 'pending' then raise exception 'proof.invalid_transition'; end if;
  if p_status = 'approved' and t.consent_withdrawn_at is not null then raise exception 'proof.consent_withdrawn'; end if;
  if p_status = 'rejected' and coalesce(btrim(p_note), '') = '' then raise exception 'proof.reason_required'; end if;
  if t.status = p_status then return; end if;
  update public.testimonials
     set status = p_status, reviewed_by = auth.uid(), reviewed_at = now(), review_note = nullif(btrim(p_note), ''),
         placements = case when p_status = 'approved' then placements else '{}' end,
         featured = case when p_status = 'approved' then featured else false end
   where id = p_id;
  if p_status <> 'approved' then
    update public.social_proof_events set published = false where source_table = 'testimonials' and source_id = p_id;
  end if;
  perform public.log_audit('testimonial.' || p_status::text, 'testimonial', p_id::text,
    jsonb_build_object('status', t.status), jsonb_build_object('status', p_status), nullif(btrim(p_note), ''));
end $$;

-- Presentation only. The name display can only become more private than the author chose.
create or replace function public.staff_update_testimonial_presentation(p_id uuid, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  t public.testimonials%rowtype;
  v_placements text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p->'placements', '[]'::jsonb))), '{}');
  v_mode text := coalesce(nullif(p->>'display_mode', ''), 'first_name');
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  select * into t from public.testimonials where id = p_id for update;
  if not found then raise exception 'proof.not_found'; end if;
  if public.proof_display_rank(v_mode) > public.proof_display_rank(t.author_display) then
    raise exception 'proof.display_not_allowed';
  end if;
  if t.status <> 'approved' and cardinality(v_placements) > 0 then raise exception 'proof.not_approved'; end if;
  update public.testimonials
     set placements = v_placements, display_mode = v_mode,
         service = nullif(p->>'service', ''), case_study_key = nullif(p->>'case_study_key', ''),
         show_company = coalesce((p->>'show_company')::boolean, true),
         featured = coalesce((p->>'featured')::boolean, false), sort = coalesce(nullif(p->>'sort', '')::int, 0)
   where id = p_id;
  perform public.log_audit('testimonial.presentation', 'testimonial', p_id::text,
    jsonb_build_object('placements', t.placements, 'display_mode', t.display_mode, 'service', t.service,
                       'case_study_key', t.case_study_key, 'show_company', t.show_company, 'featured', t.featured, 'sort', t.sort),
    p, null);
end $$;

-- Removes one media reference and returns the storage paths to delete (a video takes its poster).
create or replace function public.staff_remove_testimonial_media(p_id uuid, p_kind text, p_reason text) returns text[]
language plpgsql security definer set search_path = public as $$
declare
  t public.testimonials%rowtype;
  v_paths text[];
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  select * into t from public.testimonials where id = p_id for update;
  if not found then raise exception 'proof.not_found'; end if;
  v_paths := array_remove(case p_kind when 'video' then array[t.video_path, t.poster_path] when 'poster' then array[t.poster_path]
                                      when 'photo' then array[t.photo_path] when 'logo' then array[t.logo_path]
                                      else array[]::text[] end, null);
  if cardinality(v_paths) = 0 then return v_paths; end if;
  if p_kind = 'video' then
    update public.testimonials set video_path = null, video_mime = null, media_type = 'text', poster_path = null where id = p_id;
  elsif p_kind = 'poster' then update public.testimonials set poster_path = null where id = p_id;
  elsif p_kind = 'photo' then update public.testimonials set photo_path = null where id = p_id;
  else update public.testimonials set logo_path = null where id = p_id;
  end if;
  perform public.log_audit('testimonial.remove_media', 'testimonial', p_id::text,
    jsonb_build_object('kind', p_kind, 'paths', to_jsonb(v_paths)), null, nullif(btrim(p_reason), ''));
  return v_paths;
end $$;

-- -----------------------------------------------------------------------------
-- Proof events: copied from a real source row, never typed by hand
-- -----------------------------------------------------------------------------
create or replace function public.proof_event_source_valid(p_type text, p_source uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case p_type
    when 'commission_paid' then exists (select 1 from public.payouts where id = p_source and status = 'paid')
    when 'new_client' then exists (select 1 from public.sales where id = p_source and status = 'paid')
    when 'testimonial_published' then exists (select 1 from public.testimonials where id = p_source
                                                and status = 'approved' and consent_withdrawn_at is null)
    else false end
$$;

create or replace function public.staff_create_proof_event(p_type text, p_source uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_label text; v_value bigint; v_currency char(3); v_at timestamptz; v_table text;
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  if not public.proof_event_source_valid(p_type, p_source) then raise exception 'proof.source_invalid'; end if;
  if p_type = 'commission_paid' then
    select 'payouts', 'partner', amount_cents, currency, coalesce(paid_at, updated_at)
      into v_table, v_label, v_value, v_currency, v_at from public.payouts where id = p_source;
  elsif p_type = 'new_client' then
    select 'sales', coalesce(o.name, 'Studio ATS'), null, null, coalesce(s.paid_at, s.created_at)
      into v_table, v_label, v_value, v_currency, v_at
      from public.sales s left join public.offers o on o.id = s.offer_id where s.id = p_source;
  else
    select 'testimonials', testimonial_type::text, null, null, coalesce(reviewed_at, created_at)
      into v_table, v_label, v_value, v_currency, v_at from public.testimonials where id = p_source;
  end if;
  insert into public.social_proof_events (type, source_table, source_id, proof_type, anonymized_label, value_cents,
                                          currency, occurred_at, verified, created_by)
  values (p_type, v_table, p_source, 'real', v_label, v_value, v_currency, v_at, true, auth.uid())
  on conflict (type, source_id) do nothing
  returning id into v_id;
  if v_id is null then select id into v_id from public.social_proof_events where type = p_type and source_id = p_source; end if;
  perform public.log_audit('proof_event.create', 'social_proof_event', v_id::text, null,
    jsonb_build_object('type', p_type, 'source', p_source), null);
  return v_id;
end $$;

create or replace function public.staff_set_proof_event_published(p_id uuid, p_published boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  e public.social_proof_events%rowtype;
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  select * into e from public.social_proof_events where id = p_id for update;
  if not found then raise exception 'proof.not_found'; end if;
  if p_published and not public.proof_event_source_valid(e.type, e.source_id) then raise exception 'proof.source_invalid'; end if;
  update public.social_proof_events set published = p_published,
         published_at = case when p_published then now() else published_at end
   where id = p_id;
  perform public.log_audit(case when p_published then 'proof_event.publish' else 'proof_event.unpublish' end,
    'social_proof_event', p_id::text, null, null, null);
end $$;

-- -----------------------------------------------------------------------------
-- Public reads: whitelisted columns only
-- -----------------------------------------------------------------------------
create or replace function public.public_testimonials(p_placement text default null, p_type public.testimonial_type default null, p_limit int default 12)
returns table (
  id uuid, testimonial_type public.testimonial_type, display_name text, company_name text, profession text, activity text,
  rating smallint, content text, recommendation text, locale text, media_type public.testimonial_media,
  video_width int, video_height int, video_duration_ms int, has_poster boolean, has_photo boolean, has_logo boolean,
  service text, case_study_key text, verified boolean, featured boolean, published_on date
)
language sql stable security definer set search_path = public as $$
  select t.id, t.testimonial_type, public.proof_display_name(t.author_name, t.display_mode),
         case when t.show_company then t.company_name end, t.profession, t.activity,
         t.rating, t.content, t.recommendation, t.locale, t.media_type,
         t.video_width, t.video_height, t.video_duration_ms, t.poster_path is not null, t.photo_path is not null, t.logo_path is not null,
         t.service, t.case_study_key, t.verified, t.featured, coalesce(t.reviewed_at, t.created_at)::date
    from public.testimonials t
   where t.status = 'approved' and t.consent and t.consent_withdrawn_at is null
     and (p_placement is null or p_placement = any (t.placements))
     and (p_type is null or t.testimonial_type = p_type)
   order by t.featured desc, t.sort, coalesce(t.reviewed_at, t.created_at) desc
   limit greatest(1, least(coalesce(p_limit, 12), 50))
$$;

-- Storage path of one public medium (null unless the testimonial is publicly visible).
create or replace function public.public_testimonial_media(p_id uuid, p_kind text) returns table (path text, mime text)
language sql stable security definer set search_path = public as $$
  select case p_kind when 'video' then t.video_path when 'poster' then t.poster_path
                     when 'photo' then t.photo_path when 'logo' then t.logo_path end,
         case p_kind when 'video' then t.video_mime end
    from public.testimonials t
   where t.id = p_id and t.status = 'approved' and t.consent_withdrawn_at is null
$$;

-- Month precision only: an exact timestamp could identify a partner.
create or replace function public.public_proof_events(p_limit int default 6)
returns table (id uuid, type text, label text, value_cents bigint, currency char(3), occurred_month date, verified boolean)
language sql stable security definer set search_path = public as $$
  select e.id, e.type, e.anonymized_label, e.value_cents, e.currency, date_trunc('month', e.occurred_at)::date, e.verified
    from public.social_proof_events e
   where e.published and e.verified and e.proof_type = 'real'
     and public.proof_event_source_valid(e.type, e.source_id)
   order by e.occurred_at desc
   limit greatest(1, least(coalesce(p_limit, 6), 24))
$$;

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
revoke all on function public.proof_insert_testimonial(public.testimonial_type, uuid, uuid, uuid, uuid, text, text, jsonb),
  public.proof_check_media(text, text, text) from public, anon, authenticated;
revoke all on function public.submit_client_testimonial(text, jsonb), public.testimonial_invite_lookup(text)
  from public, anon, authenticated;
grant execute on function public.submit_client_testimonial(text, jsonb), public.testimonial_invite_lookup(text) to service_role;
revoke all on function public.submit_ambassador_testimonial(jsonb), public.withdraw_testimonial(uuid),
  public.staff_create_testimonial_invite(uuid, text, int, text, text), public.staff_revoke_testimonial_invite(uuid),
  public.staff_review_testimonial(uuid, public.testimonial_status, text), public.staff_update_testimonial_presentation(uuid, jsonb),
  public.staff_remove_testimonial_media(uuid, text, text), public.staff_create_proof_event(text, uuid),
  public.staff_set_proof_event_published(uuid, boolean) from public, anon;
grant execute on function public.submit_ambassador_testimonial(jsonb), public.withdraw_testimonial(uuid),
  public.staff_create_testimonial_invite(uuid, text, int, text, text), public.staff_revoke_testimonial_invite(uuid),
  public.staff_review_testimonial(uuid, public.testimonial_status, text), public.staff_update_testimonial_presentation(uuid, jsonb),
  public.staff_remove_testimonial_media(uuid, text, text), public.staff_create_proof_event(text, uuid),
  public.staff_set_proof_event_published(uuid, boolean) to authenticated;
grant execute on function public.public_testimonials(text, public.testimonial_type, int),
  public.public_testimonial_media(uuid, text), public.public_proof_events(int) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Storage: private bucket. Uploads only through signed URLs created server-side
-- after the author was checked; public reads through /api/proof-media (status
-- checked at every request, short signed URL).
-- -----------------------------------------------------------------------------
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('testimonial-media', 'testimonial-media', false, 52428800,
            array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;
  end if;
end $$;
