-- =============================================================================
-- Commercial dossiers: client brief -> affiliate review -> admin quote ->
-- electronic acceptance -> Stripe payment.
--
-- Public clients never use the Data API. Their opaque access/session tokens are
-- verified by server-only code using the service role. Authenticated affiliates
-- and staff receive read access through RLS; all state changes are server-side.
-- =============================================================================

insert into public.settings(key,value,is_public,description) values
 ('studio.legal_identity','{"legalName":"","address":"","registration":"","representative":"","vatNumber":""}'::jsonb,false,'Required legal identity printed on contract documents')
on conflict (key) do nothing;

create table public.contract_templates (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('brief', 'quote_terms')),
  locale        text not null check (locale in ('en','fr','de','es','pt','it','nl','ar')),
  version       int not null check (version > 0),
  status        text not null default 'draft' check (status in ('draft','published','retired')),
  title         text not null,
  body          jsonb not null default '{}'::jsonb,
  legal_identity jsonb not null default '{}'::jsonb,
  created_by    uuid references public.profiles (id) on delete set null,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (kind, locale, version)
);
create unique index contract_templates_one_published
  on public.contract_templates (kind, locale) where status = 'published';
create trigger contract_templates_updated_at before update on public.contract_templates
  for each row execute function public.set_updated_at();

create table public.commercial_dossiers (
  id                    uuid primary key default gen_random_uuid(),
  public_ref            text not null unique default ('DOS-' || public.gen_code(8)),
  affiliate_id          uuid not null references public.affiliates (id) on delete restrict,
  prospect_id           uuid references public.prospects (id) on delete set null,
  lead_id               uuid references public.leads (id) on delete set null,
  client_email          citext not null,
  client_name           text,
  client_company        text,
  client_job_title      text,
  locale                text not null default 'fr' check (locale in ('en','fr','de','es','pt','it','nl','ar')),
  status                text not null default 'draft' check (status in (
                          'draft','awaiting_client','affiliate_review','admin_review',
                          'awaiting_client_acceptance','awaiting_studio_acceptance',
                          'awaiting_payment','active','changes_requested','declined','expired','cancelled')),
  current_revision      int not null default 0 check (current_revision >= 0),
  shared_with_affiliate_at timestamptz,
  recommended_tier      text check (recommended_tier in ('one','pro','premium')),
  affiliate_note        text,
  admin_scope           text,
  offer_id              uuid references public.offers (id),
  offer_snapshot        jsonb,
  template_id           uuid references public.contract_templates (id),
  valid_until           date,
  manifest_sha256       text check (manifest_sha256 is null or manifest_sha256 ~ '^[a-f0-9]{64}$'),
  checkout_session_id   uuid references public.checkout_sessions (id),
  stripe_checkout_session_id text,
  stripe_checkout_url   text,
  paid_at               timestamptz,
  created_by            uuid references public.profiles (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index commercial_dossiers_affiliate_idx on public.commercial_dossiers (affiliate_id, created_at desc) where deleted_at is null;
create index commercial_dossiers_status_idx on public.commercial_dossiers (status, updated_at desc) where deleted_at is null;
create index commercial_dossiers_email_idx on public.commercial_dossiers (client_email, created_at desc);
create trigger commercial_dossiers_updated_at before update on public.commercial_dossiers
  for each row execute function public.set_updated_at();

alter table public.checkout_sessions
  add column if not exists dossier_id uuid references public.commercial_dossiers (id) on delete set null;
create unique index checkout_sessions_dossier_open_idx on public.checkout_sessions (dossier_id)
  where dossier_id is not null and status in ('created','open','complete');

create table public.dossier_brief_revisions (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references public.commercial_dossiers (id) on delete cascade,
  revision      int not null check (revision > 0),
  answers       jsonb not null default '{}'::jsonb,
  submitted_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (dossier_id, revision)
);

create table public.dossier_documents (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references public.commercial_dossiers (id) on delete restrict,
  kind          text not null check (kind in ('brief','quote','proof','brief_fallback','quote_fallback')),
  revision      int not null check (revision > 0),
  storage_path  text not null unique,
  sha256        text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  byte_size     bigint not null check (byte_size > 0),
  created_at    timestamptz not null default now(),
  unique (dossier_id, kind, revision)
);

create table public.dossier_acceptances (
  id              uuid primary key default gen_random_uuid(),
  dossier_id      uuid not null references public.commercial_dossiers (id) on delete restrict,
  party           text not null check (party in ('client','studio')),
  manifest_sha256 text not null check (manifest_sha256 ~ '^[a-f0-9]{64}$'),
  signer_name     text not null,
  signer_email    citext not null,
  signer_title    text,
  signer_profile_id uuid references public.profiles (id) on delete set null,
  otp_verified    boolean not null default false,
  ip_hash         text,
  user_agent_hash text,
  accepted_at     timestamptz not null default now(),
  unique (dossier_id, party, manifest_sha256)
);

create table public.dossier_access_tokens (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references public.commercial_dossiers (id) on delete cascade,
  purpose       text not null check (purpose in ('access','session','otp')),
  token_hash    text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  otp_hash      text check (otp_hash is null or otp_hash ~ '^[a-f0-9]{64}$'),
  attempts      int not null default 0 check (attempts >= 0),
  max_attempts  int not null default 5 check (max_attempts between 1 and 20),
  expires_at    timestamptz not null,
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index dossier_access_tokens_lookup_idx on public.dossier_access_tokens (dossier_id, purpose, created_at desc);

create table public.dossier_events (
  id            bigint generated always as identity primary key,
  dossier_id    uuid not null references public.commercial_dossiers (id) on delete restrict,
  event         text not null,
  actor_type    text not null check (actor_type in ('client','affiliate','staff','system')),
  actor_id      uuid,
  payload       jsonb not null default '{}'::jsonb,
  occurred_at   timestamptz not null default now()
);
create index dossier_events_timeline_idx on public.dossier_events (dossier_id, occurred_at, id);

-- Sensitive accept/transition operations are single database transactions and
-- reject stale manifests, states and OTPs.
create or replace function public.dossier_accept_client(
  p_dossier uuid, p_manifest text, p_otp uuid, p_otp_hash text,
  p_name text, p_email text, p_title text, p_ip_hash text, p_user_agent_hash text
) returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.commercial_dossiers where id=p_dossier
    and status='awaiting_client_acceptance' and manifest_sha256=p_manifest
    and (valid_until is null or valid_until >= current_date)) then return false; end if;
  update public.dossier_access_tokens set used_at=now()
   where id=p_otp and dossier_id=p_dossier and purpose='otp' and otp_hash=p_otp_hash
     and used_at is null and expires_at > now() and attempts < max_attempts;
  if not found then return false; end if;
  insert into public.dossier_acceptances(dossier_id,party,manifest_sha256,signer_name,signer_email,signer_title,otp_verified,ip_hash,user_agent_hash)
  values(p_dossier,'client',p_manifest,p_name,p_email,p_title,true,p_ip_hash,p_user_agent_hash);
  update public.commercial_dossiers set status='awaiting_studio_acceptance',client_name=p_name,client_job_title=p_title
   where id=p_dossier and status='awaiting_client_acceptance' and manifest_sha256=p_manifest;
  return found;
end $$;

create or replace function public.dossier_countersign(
  p_dossier uuid, p_manifest text, p_profile uuid, p_name text, p_email text, p_title text
) returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.profiles where id=p_profile and role in ('admin','super_admin')) then return false; end if;
  if not exists (select 1 from public.commercial_dossiers where id=p_dossier
    and status='awaiting_studio_acceptance' and manifest_sha256=p_manifest) then return false; end if;
  insert into public.dossier_acceptances(dossier_id,party,manifest_sha256,signer_name,signer_email,signer_title,signer_profile_id,otp_verified)
  values(p_dossier,'studio',p_manifest,p_name,p_email,p_title,p_profile,false);
  update public.commercial_dossiers set status='awaiting_payment'
   where id=p_dossier and status='awaiting_studio_acceptance' and manifest_sha256=p_manifest;
  return found;
end $$;

create or replace function public.dossier_request_revision(p_dossier uuid, p_profile uuid)
returns int language plpgsql security definer set search_path=public as $$
declare next_revision int; begin
  if not exists (select 1 from public.profiles where id=p_profile and role in ('admin','super_admin')) then return null; end if;
  select current_revision+1 into next_revision from public.commercial_dossiers
   where id=p_dossier and status in ('admin_review','awaiting_client_acceptance','awaiting_studio_acceptance') for update;
  if next_revision is null then return null; end if;
  insert into public.dossier_brief_revisions(dossier_id,revision,answers)
  select p_dossier,next_revision,answers from public.dossier_brief_revisions
   where dossier_id=p_dossier order by revision desc limit 1;
  update public.commercial_dossiers set status='changes_requested',current_revision=next_revision,
   admin_scope=null,offer_id=null,offer_snapshot=null,template_id=null,valid_until=null,manifest_sha256=null
   where id=p_dossier;
  return next_revision;
end $$;

-- Direct transactional recipients are needed before a lead/customer row exists.
alter table public.email_events add column if not exists recipient_email citext;
alter table public.email_events drop constraint if exists email_events_has_recipient;
alter table public.email_events add constraint email_events_has_recipient check (
  recipient_profile_id is not null or recipient_customer_id is not null or recipient_lead_id is not null or recipient_email is not null);

create or replace function public.email_claim_batch(p_limit int default 20, p_ids uuid[] default null)
returns table (id uuid, template text, recipient_type text, to_email text, locale text, params jsonb,
               idempotency_key text, related_entity text, related_id text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  return query
  with picked as (
    select e.id from public.email_events e
     where (e.status = 'queued' or (e.status = 'failed' and e.attempts < 5
                                    and e.last_attempt_at < now() - make_interval(mins => 5 * e.attempts))
            or (e.status = 'sending' and e.last_attempt_at < now() - interval '15 minutes'))
       and (p_ids is null or e.id = any (p_ids))
     order by e.requested_at limit p_limit for update skip locked
  ), upd as (
    update public.email_events e set status = 'sending', attempts = e.attempts + 1, last_attempt_at = now()
      from picked where e.id = picked.id returning e.*
  )
  select u.id, u.template, u.recipient_type,
         coalesce(u.recipient_email::text, p.email::text, c.email::text, l.email::text),
         coalesce(u.params->>'locale', p.locale, c.locale, l.locale, 'en'),
         u.params, u.idempotency_key, u.related_entity, u.related_id
    from upd u
    left join public.profiles p on p.id = u.recipient_profile_id
    left join public.customers c on c.id = u.recipient_customer_id
    left join public.leads l on l.id = u.recipient_lead_id;
end $$;

-- Documents, acceptances and events are append-only evidence.
create or replace function public.guard_dossier_evidence() returns trigger
language plpgsql set search_path = public as $$
begin
  raise exception 'dossier evidence is immutable';
end $$;
create trigger dossier_documents_immutable before update or delete on public.dossier_documents
  for each row execute function public.guard_dossier_evidence();
create trigger dossier_acceptances_immutable before update or delete on public.dossier_acceptances
  for each row execute function public.guard_dossier_evidence();
create trigger dossier_events_immutable before update or delete on public.dossier_events
  for each row execute function public.guard_dossier_evidence();

-- Private storage. Objects are written/read by narrow service-role code only.
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('commercial-dossiers', 'commercial-dossiers', false, 20971520, array['application/pdf'])
    on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end $$;

-- RLS ------------------------------------------------------------------------
alter table public.contract_templates enable row level security;
alter table public.commercial_dossiers enable row level security;
alter table public.dossier_brief_revisions enable row level security;
alter table public.dossier_documents enable row level security;
alter table public.dossier_acceptances enable row level security;
alter table public.dossier_access_tokens enable row level security;
alter table public.dossier_events enable row level security;

create policy contract_templates_read on public.contract_templates for select to authenticated
  using (status = 'published' or public.is_staff());
create policy contract_templates_staff on public.contract_templates for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy commercial_dossiers_read on public.commercial_dossiers for select to authenticated
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());
create policy commercial_dossiers_affiliate_insert on public.commercial_dossiers for insert to authenticated
  with check (affiliate_id = public.current_affiliate_id() and created_by = auth.uid());

create policy dossier_revisions_read on public.dossier_brief_revisions for select to authenticated
  using (exists (select 1 from public.commercial_dossiers d where d.id = dossier_id
    and ((d.affiliate_id = public.current_affiliate_id() and d.shared_with_affiliate_at is not null) or public.is_staff())));
create policy dossier_documents_read on public.dossier_documents for select to authenticated
  using (exists (select 1 from public.commercial_dossiers d where d.id = dossier_id
    and (d.affiliate_id = public.current_affiliate_id() or public.is_staff())));
create policy dossier_acceptances_read on public.dossier_acceptances for select to authenticated
  using (exists (select 1 from public.commercial_dossiers d where d.id = dossier_id
    and (d.affiliate_id = public.current_affiliate_id() or public.is_staff())));
create policy dossier_events_read on public.dossier_events for select to authenticated
  using (exists (select 1 from public.commercial_dossiers d where d.id = dossier_id
    and (d.affiliate_id = public.current_affiliate_id() or public.is_staff())));

-- No policy is intentionally defined for dossier_access_tokens or storage.objects.
-- Public clients never talk to Supabase and authenticated users download through
-- an application route which re-checks dossier ownership before using service role.

revoke all on table public.contract_templates, public.commercial_dossiers,
  public.dossier_brief_revisions, public.dossier_documents, public.dossier_acceptances,
  public.dossier_access_tokens, public.dossier_events from anon, authenticated;
grant select on table public.contract_templates, public.commercial_dossiers,
  public.dossier_brief_revisions, public.dossier_documents, public.dossier_acceptances,
  public.dossier_events to authenticated;
grant insert on table public.commercial_dossiers to authenticated;
grant select, insert, update, delete on table public.contract_templates, public.commercial_dossiers,
  public.dossier_brief_revisions, public.dossier_documents, public.dossier_acceptances,
  public.dossier_access_tokens, public.dossier_events to service_role;
grant usage, select on sequence public.dossier_events_id_seq to service_role;
revoke all on function public.dossier_accept_client(uuid,text,uuid,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.dossier_countersign(uuid,text,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.dossier_accept_client(uuid,text,uuid,text,text,text,text,text,text) to service_role;
grant execute on function public.dossier_countersign(uuid,text,uuid,text,text,text) to service_role;
revoke all on function public.dossier_request_revision(uuid,uuid) from public, anon, authenticated;
grant execute on function public.dossier_request_revision(uuid,uuid) to service_role;

-- English and French are publishable now. Other locales are deliberately draft:
-- the UI supports them, but document locking fails until reviewed legal copy is
-- explicitly published for that locale.
insert into public.contract_templates (kind, locale, version, status, title, body, published_at)
values
  ('quote_terms','fr',1,'published','Conditions contractuelles Studio ATS',
   '{"clauses":["Champ d’application — Les présentes conditions couvrent les prestations de conception, design, développement, intégration, automatisation, hébergement, maintenance et accompagnement expressément retenues.","Formation du contrat — Le devis, ses conditions et le cahier des charges verrouillé forment l’accord. La commande devient ferme après la double acceptation électronique et la confirmation du premier paiement par Stripe.","Obligations du Client — Le Client définit ses besoins, valide le cahier des charges et fournit dans les délais convenus les contenus, accès et informations nécessaires. Il garantit disposer des droits sur les éléments transmis.","Obligations de Studio ATS — Studio ATS exécute les prestations convenues selon une obligation de moyens et informe le Client de leur avancement.","Prix et périmètre — Le prix et la périodicité sont ceux de l’offre active photographiée dans le présent devis. Toute prestation ou fonctionnalité hors périmètre nécessite un accord écrit et, le cas échéant, un devis complémentaire.","Paiement — Le paiement est réalisé selon le lien Stripe rattaché au dossier. Les échéanciers, acomptes et remises d’engagement non reproduits dans ce devis ne sont pas applicables.","Modification ou interruption — Les prestations déjà réalisées, engagées ou commandées auprès de tiers restent dues selon leur avancement lorsqu’une modification ou une interruption est demandée par le Client.","Propriété intellectuelle — Studio ATS conserve ses méthodes, savoir-faire, composants génériques et outils préexistants. Les droits expressément cédés sur les livrables spécifiques prennent effet après paiement complet.","Services de tiers — Les licences, API, noms de domaine et services externes non expressément inclus peuvent faire l’objet d’une facturation distincte et restent soumis aux conditions de leurs fournisseurs.","Validation et livraison — Le Client vérifie les maquettes, prototypes et versions de recette et formule ses demandes de correction dans les délais convenus. Toute validation écrite vaut acceptation des éléments concernés.","Maintenance — La maintenance incluse correspond strictement au périmètre de l’offre verrouillée. Les évolutions et nouvelles fonctionnalités peuvent faire l’objet d’une prestation complémentaire.","Responsabilité — Le Client reste responsable de ses contenus, de l’utilisation du service et des modifications effectuées par lui-même ou par un tiers hors du périmètre de Studio ATS.","Réclamations — Toute réclamation doit être formulée par écrit et décrire suffisamment le problème pour permettre son analyse et son traitement.","Confidentialité et références — Chaque partie protège les informations confidentielles reçues. Toute utilisation de la réalisation comme référence commerciale respecte l’opposition écrite du Client.","Données personnelles — Chaque partie respecte la réglementation applicable. Lorsque Studio ATS agit comme sous-traitant, les obligations nécessaires sont formalisées séparément.","Résiliation, cession et droit applicable — Les conséquences d’une résiliation tiennent compte des prestations exécutées et des sommes dues. Le contrat ne peut être cédé sans accord écrit préalable, sauf disposition légale contraire, et relève du droit français."]}'::jsonb, now()),
  ('quote_terms','en',1,'published','Studio ATS contractual terms',
   '{"clauses":["Scope — These terms cover only the design, development, integration, automation, hosting, maintenance and support services expressly selected.","Formation — The quote, its terms and the locked project brief form the agreement. The order becomes binding after dual electronic acceptance and Stripe confirms the first payment.","Customer obligations — The Customer defines its needs, approves the brief and supplies the required content, access and information on time, while warranting its rights to supplied materials.","Studio ATS obligations — Studio ATS performs the agreed services under a reasonable-efforts obligation and keeps the Customer informed of progress.","Price and scope — Price and billing interval are those of the active offer captured in this quote. Work outside scope requires written agreement and, where appropriate, an additional quote.","Payment — Payment uses the Stripe link attached to this dossier. Instalments, deposits and commitment discounts not reproduced in this quote do not apply.","Change or interruption — Work already performed, committed or ordered from third parties remains payable according to progress when the Customer requests a change or interruption.","Intellectual property — Studio ATS retains its methods, know-how, generic components and pre-existing tools. Rights expressly assigned in specific deliverables take effect after full payment.","Third-party services — Licences, APIs, domain names and external services not expressly included may be billed separately and remain subject to their providers terms.","Approval and delivery — The Customer reviews designs, prototypes and acceptance versions and submits correction requests within agreed periods. Written approval accepts the relevant elements.","Maintenance — Included maintenance is limited to the locked offer scope. Enhancements and new features may require an additional service.","Liability — The Customer remains responsible for its content, use of the service and changes made by itself or third parties outside Studio ATS scope.","Claims — Claims must be made in writing with enough detail for investigation and resolution.","Confidentiality and portfolio — Each party protects received confidential information. Any portfolio use respects the Customer written objection.","Personal data — Each party complies with applicable data-protection law. Where Studio ATS acts as processor, required obligations are documented separately.","Termination, assignment and law — Termination consequences reflect performed services and amounts due. Assignment requires prior written consent unless law provides otherwise. French law governs the agreement."]}'::jsonb, now()),
  ('brief','fr',1,'published','Cahier des charges Studio ATS','{"sections":12}'::jsonb,now()),
  ('brief','en',1,'published','Studio ATS project brief','{"sections":12}'::jsonb,now());

insert into public.contract_templates (kind, locale, version, status, title, body)
select k.kind, l.locale, 1, 'draft', k.title || ' - ' || upper(l.locale),
       jsonb_build_object('needs_legal_review', true)
from (values ('de'),('es'),('pt'),('it'),('nl'),('ar')) l(locale)
cross join (values ('quote_terms','Studio ATS terms'),('brief','Studio ATS brief')) k(kind,title)
on conflict (kind, locale, version) do nothing;
