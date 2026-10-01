-- V0.4 ambassador copilot: new sales_content kinds + seeded copilot content.
begin;

create or replace function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

create or replace function pg_temp.fails(sql text) returns boolean language plpgsql as $$
begin execute sql; return false; exception when others then return true; end $$;

select pg_temp.assert(not pg_temp.fails($$insert into public.sales_content (kind, key, locale, title, body)
  values ('case_study', 'test-case', 'en', 'Test', '{"type":"demo"}')$$), 'case_study is an allowed kind');
select pg_temp.assert(not pg_temp.fails($$insert into public.sales_content (kind, key, locale, title, body)
  values ('sequence', 'test-seq', 'en', 'Test', '{"steps":[]}')$$), 'sequence is an allowed kind');
select pg_temp.assert(pg_temp.fails($$insert into public.sales_content (kind, key, locale, title, body)
  values ('testimonial', 'x', 'en', 'Test', '{}')$$), 'unknown kinds are still rejected');

select pg_temp.assert((select count(*) from public.sales_content where kind = 'pitch' and status = 'active') >= 2, 'the pitch is seeded and published (en + fr)');
select pg_temp.assert((select count(*) from public.sales_content where kind = 'case_study' and status = 'active') >= 30, 'case studies are seeded');
select pg_temp.assert((select status from public.sales_content where kind = 'case_study' and key = 'mcrenov' and locale = 'fr') = 'draft',
  'a reference awaiting confirmation is seeded as a draft (invisible to ambassadors)');
select pg_temp.assert((select count(*) from public.sales_content where kind = 'sequence' and stage in ('follow_up', 'proposal')) = 4,
  'two follow-up sequences, two locales');
select pg_temp.assert(exists (select 1 from public.markets where slug = 'hospitality' and content->'fr'->'keywords' ? 'hôtel'),
  'new sectors carry their search synonyms');
select pg_temp.assert((select content->'en'->>'offer' from public.markets where slug = 'artisans') = 'pro',
  'existing sectors get a recommended offer');

rollback;
