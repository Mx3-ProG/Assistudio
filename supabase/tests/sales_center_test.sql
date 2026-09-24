-- =============================================================================
-- V0.3 Sales Center: content versioning, immutability, RLS isolation, affiliate
-- pages, lead → CRM consent rule, performance read model.
-- Runs inside a transaction and rolls back (local / staging only).
-- =============================================================================
begin;

create or replace function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

create or replace function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.sub', coalesce(uid::text, ''), true);
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
end $$;

-- Returns true when the statement raises (any error).
create or replace function pg_temp.fails(stmt text) returns boolean language plpgsql as $$
begin
  execute stmt;
  return false;
exception when others then
  return true;
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'alice3@test.invalid', '{"full_name":"Alice Seller"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'bob3@test.invalid',   '{"full_name":"Bob Seller"}'),
  ('00000000-0000-0000-0000-0000000000d1', 'admin3@test.invalid', '{"full_name":"Ada Admin"}');
update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-0000000000d1';
update public.affiliates set status = 'approved'
 where profile_id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1');

-- ---------------------------------------------------------------- content lifecycle (staff)
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
set local role authenticated;

select pg_temp.assert(pg_temp.fails($$insert into public.sales_content (kind, key, title, status) values ('objection', 'obj-direct', 'x', 'active')$$),
  'content cannot be inserted directly as active');

insert into public.sales_content (kind, key, locale, title, body, tags)
values ('objection', 'obj-social', 'fr', 'J''ai déjà les réseaux sociaux', '{"objection":"J''ai déjà Instagram","short":"…"}', '{instagram,réseaux sociaux}');
select pg_temp.assert((select status from public.sales_content where key = 'obj-social') = 'draft', 'new content starts as draft');

select public.staff_publish_sales_content((select id from public.sales_content where key = 'obj-social'), 'first publication');
select pg_temp.assert((select status from public.sales_content where key = 'obj-social' and version = 1) = 'active', 'publish → active');
select pg_temp.assert((select count(*) from public.audit_logs where action = 'sales_content.publish') = 1, 'publication is audit-logged');

select pg_temp.assert(pg_temp.fails($$update public.sales_content set body = '{"objection":"edited"}' where key = 'obj-social' and version = 1$$),
  'published content is immutable');
select pg_temp.assert(pg_temp.fails($$update public.sales_content set status = 'archived' where key = 'obj-social'$$),
  'status cannot be changed outside the staff functions');

select public.staff_new_sales_content_version((select id from public.sales_content where key = 'obj-social' and version = 1));
select pg_temp.assert((select status from public.sales_content where key = 'obj-social' and version = 2) = 'draft', 'new version is a draft copy');
update public.sales_content set title = 'Réseaux sociaux — v2' where key = 'obj-social' and version = 2;
select public.staff_publish_sales_content((select id from public.sales_content where key = 'obj-social' and version = 2), 'v2');
select pg_temp.assert((select status from public.sales_content where key = 'obj-social' and version = 1) = 'archived', 'publishing v2 archives v1');
select pg_temp.assert((select count(*) from public.sales_content where key = 'obj-social' and status = 'active') = 1, 'exactly one active version');

-- rollback = publish the archived version
select public.staff_publish_sales_content((select id from public.sales_content where key = 'obj-social' and version = 1), 'rollback');
select pg_temp.assert((select version from public.sales_content where key = 'obj-social' and status = 'active') = 1, 'rollback re-activates v1');

insert into public.sales_content (kind, key, title) values ('page_template', 'test-template', 'Test template');
select public.staff_publish_sales_content((select id from public.sales_content where key = 'test-template'));
insert into public.sales_content (kind, key, title) values ('objection', 'obj-draft-only', 'Draft only');

-- ---------------------------------------------------------------- affiliate reads
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select pg_temp.assert((select count(*) from public.sales_content where key = 'obj-draft-only') = 0, 'affiliates never see drafts');
select pg_temp.assert((select count(*) from public.sales_content where key = 'obj-social') = 1, 'affiliates see only the active version');
select pg_temp.assert(pg_temp.fails($$insert into public.sales_content (kind, key, title) values ('message', 'hack', 'x')$$),
  'affiliates cannot create official content');
select pg_temp.assert(pg_temp.fails($$select public.staff_publish_sales_content((select id from public.sales_content limit 1))$$),
  'affiliates cannot publish');

-- ---------------------------------------------------------------- affiliate sales page
insert into public.private_sales_pages (affiliate_id, path_key, template_key, cta_mode, view_count, show_advisor, advisor)
values (public.current_affiliate_id(), 'artisan', 'test-template', 'lead', 999, true, '{"name":"Alice"}');
select pg_temp.assert((select view_count from public.private_sales_pages where path_key = 'artisan') = 0, 'affiliates cannot forge view counters');
select pg_temp.assert(pg_temp.fails($$insert into public.private_sales_pages (affiliate_id, path_key, template_key) values (public.current_affiliate_id(), 'x', 'no-such-template')$$),
  'pages only use published templates');
select pg_temp.assert(pg_temp.fails($$insert into public.private_sales_pages (affiliate_id, path_key, indexable) values (public.current_affiliate_id(), 'seo', true)$$),
  'indexing is off unless STUDIO allows it');
select pg_temp.assert(pg_temp.fails($$update public.private_sales_pages set cta_mode = 'free' where path_key = 'artisan'$$),
  'unknown CTA modes are rejected');
insert into public.affiliate_favorites (affiliate_id, content_kind, content_key) values (public.current_affiliate_id(), 'objection', 'obj-social');

-- ---------------------------------------------------------------- isolation (Bob)
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
set local role authenticated;
select pg_temp.assert((select count(*) from public.private_sales_pages where path_key = 'artisan') = 0, 'Bob cannot see Alice''s pages');
select pg_temp.assert((select count(*) from public.affiliate_favorites) = 0, 'Bob cannot see Alice''s favorites');
insert into public.affiliate_links (affiliate_id, name) values (public.current_affiliate_id(), 'Bob link');
reset role;
select pg_temp.assert(pg_temp.fails(format(
  $$update public.affiliate_links set private_page_id = %L where name = 'Bob link'$$,
  (select id from public.private_sales_pages where path_key = 'artisan'))),
  'a link cannot point to another affiliate''s page');
select set_config('test.alice', (select a.id::text from public.affiliates a where a.profile_id = '00000000-0000-0000-0000-0000000000a1'), true);
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
set local role authenticated;
select pg_temp.assert(pg_temp.fails(format($$select * from public.affiliate_performance(%L)$$, current_setting('test.alice'))),
  'Bob cannot read Alice''s performance');

-- ---------------------------------------------------------------- leads from the page
reset role;
select pg_temp.act_as(null);
insert into public.visitors (id) values ('11111111-1111-1111-1111-111111111111');
insert into public.clicks (affiliate_id, private_page_id, visitor_id)
select p.affiliate_id, p.id, '11111111-1111-1111-1111-111111111111' from public.private_sales_pages p where p.path_key = 'artisan';
insert into public.sales_events (event, affiliate_id, private_page_id, visitor_id)
select 'cta_click', p.affiliate_id, p.id, '11111111-1111-1111-1111-111111111111' from public.private_sales_pages p where p.path_key = 'artisan';

insert into public.leads (affiliate_id, private_page_id, full_name, email, consent_at, request_type)
select p.affiliate_id, p.id, 'No Share', 'noshare@client.invalid', now(), 'info' from public.private_sales_pages p where p.path_key = 'artisan';
insert into public.leads (affiliate_id, private_page_id, full_name, email, phone, consent_at, advisor_consent_at, request_type)
select p.affiliate_id, p.id, 'Paul Plombier', 'paul@client.invalid', '+33600000000', now(), now(), 'call'
  from public.private_sales_pages p where p.path_key = 'artisan';

select pg_temp.assert((select count(*) from public.prospects where email = 'noshare@client.invalid') = 0,
  'without advisor consent the lead does NOT reach the affiliate CRM');
select pg_temp.assert((select count(*) from public.prospects where email = 'paul@client.invalid' and source = 'sales_page' and lead_id is not null) = 1,
  'with advisor consent the lead becomes a prospect in the affiliate CRM');
select pg_temp.assert((select count(*) from public.email_events where template = 'lead.confirmation') >= 2,
  'every lead gets the V0.2 confirmation email');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select pg_temp.assert((select visitors from public.affiliate_performance() where dimension = 'page') = 1, 'page funnel: unique visitors');
select pg_temp.assert((select cta_clicks from public.affiliate_performance() where dimension = 'page') = 1, 'page funnel: CTA clicks');
select pg_temp.assert((select leads from public.affiliate_performance() where dimension = 'page') = 2, 'page funnel: leads');
select pg_temp.assert((select sales from public.affiliate_performance() where dimension = 'total') = 0, 'no sale without a confirmed payment');
select pg_temp.assert((select count(*) from public.prospects where stage = 'new') = 1, 'Alice sees the shared prospect');
update public.prospects set stage = 'qualified' where email = 'paul@client.invalid';
select pg_temp.assert((select stage from public.prospects where email = 'paul@client.invalid') = 'qualified', 'new CRM stage "qualified"');

reset role;
select pg_temp.act_as(null);
set local role anon;
select pg_temp.assert((select count(*) from public.sales_content) = 0, 'anonymous visitors read no sales content');
select pg_temp.assert(pg_temp.fails($$select * from public.affiliate_performance()$$), 'anonymous cannot call the performance read model');

reset role;
rollback;
