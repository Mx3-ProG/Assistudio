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
create or replace function pg_temp.fails(p_sql text, p_like text default '') returns boolean language plpgsql as $$
begin execute p_sql; return false; exception when others then return sqlerrm like '%' || p_like || '%'; end $$;

insert into auth.users (id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000d001','dossier-one@test.invalid','{"full_name":"Affiliate One"}'),
 ('00000000-0000-0000-0000-00000000d002','dossier-two@test.invalid','{"full_name":"Affiliate Two"}'),
 ('00000000-0000-0000-0000-00000000d003','dossier-admin@test.invalid','{"full_name":"Dossier Admin"}');
update public.affiliates set status='approved' where profile_id in
 ('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-00000000d002');
update public.profiles set role='admin' where id='00000000-0000-0000-0000-00000000d003';

create temp table dossier_ids (k text primary key, v uuid);
insert into public.commercial_dossiers (affiliate_id,client_email,status,created_by,shared_with_affiliate_at)
select a.id,'client-one@test.invalid','affiliate_review','00000000-0000-0000-0000-00000000d001',now()
from public.affiliates a where a.profile_id='00000000-0000-0000-0000-00000000d001';
insert into dossier_ids select 'one',id from public.commercial_dossiers where client_email='client-one@test.invalid';
insert into public.commercial_dossiers (affiliate_id,client_email,status,created_by)
select a.id,'client-two@test.invalid','affiliate_review','00000000-0000-0000-0000-00000000d002'
from public.affiliates a where a.profile_id='00000000-0000-0000-0000-00000000d002';

insert into public.dossier_brief_revisions(dossier_id,revision,answers,submitted_at)
values ((select v from dossier_ids where k='one'),1,'{"project.name":"RLS project"}',now());
insert into public.dossier_brief_revisions(dossier_id,revision,answers)
select id,1,'{"project.name":"private draft"}' from public.commercial_dossiers where client_email='client-two@test.invalid';
update public.commercial_dossiers set current_revision=1 where id=(select v from dossier_ids where k='one');
insert into public.dossier_documents(dossier_id,kind,revision,storage_path,sha256,byte_size)
values ((select v from dossier_ids where k='one'),'brief',1,'test/r1/brief.pdf',repeat('a',64),100);
insert into public.dossier_acceptances(dossier_id,party,manifest_sha256,signer_name,signer_email,otp_verified)
values ((select v from dossier_ids where k='one'),'client',repeat('b',64),'Client','client-one@test.invalid',true);
insert into public.dossier_events(dossier_id,event,actor_type) values ((select v from dossier_ids where k='one'),'test','system');
insert into public.dossier_access_tokens(dossier_id,purpose,token_hash,expires_at)
values ((select v from dossier_ids where k='one'),'access',repeat('c',64),now()+interval '1 hour');

set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-00000000d001');
select pg_temp.assert((select count(*) from public.commercial_dossiers)=1,'affiliate sees only its dossier');
select pg_temp.assert((select count(*) from public.dossier_brief_revisions)=1,'affiliate sees its shared brief');
select pg_temp.assert((select count(*) from public.dossier_documents)=1,'affiliate sees its document metadata');
select pg_temp.assert((select count(*) from public.dossier_acceptances)=1,'affiliate sees its acceptance evidence');
select pg_temp.assert(pg_temp.fails('select * from public.dossier_access_tokens','permission denied'),'affiliate never sees token hashes');

select pg_temp.act_as('00000000-0000-0000-0000-00000000d002');
select pg_temp.assert((select count(*) from public.commercial_dossiers)=1,'another affiliate cannot see the first dossier');
select pg_temp.assert((select count(*) from public.dossier_brief_revisions)=0,'affiliate cannot read a client draft before sharing consent');
select pg_temp.assert((select count(*) from public.dossier_documents)=0,'another affiliate cannot see first dossier documents');

select pg_temp.act_as('00000000-0000-0000-0000-00000000d003');
select pg_temp.assert((select count(*) from public.commercial_dossiers)=2,'staff sees every dossier');
select pg_temp.assert((select count(*) from public.dossier_documents)=1,'staff sees evidence metadata');

reset role;
select pg_temp.assert(pg_temp.fails(format('update public.dossier_documents set byte_size=101 where dossier_id=%L',(select v from dossier_ids where k='one')),'immutable'),'documents are immutable');
select pg_temp.assert(pg_temp.fails(format('delete from public.dossier_acceptances where dossier_id=%L',(select v from dossier_ids where k='one')),'immutable'),'acceptances are immutable');
select pg_temp.assert(pg_temp.fails(format('update public.dossier_events set event=''changed'' where dossier_id=%L',(select v from dossier_ids where k='one')),'immutable'),'events are append-only');
do $$ declare is_private boolean; begin
  if to_regclass('storage.buckets') is not null then
    execute 'select not public from storage.buckets where id=''commercial-dossiers''' into is_private;
    perform pg_temp.assert(is_private,'contract bucket is private');
  else
    raise notice 'ok  Storage API is absent from the plain-Postgres harness; application access remains service-only';
  end if;
end $$;

-- Every language: the brief is published; translated terms exist but wait for legal review.
select pg_temp.assert((select count(distinct locale) from public.contract_templates where kind='brief' and status='published')=8,'project brief is published in all 8 locales');
select pg_temp.assert((select bool_and(status='draft' and jsonb_array_length(body->'clauses')=16 and (body->>'needs_legal_review')::boolean)
  from public.contract_templates where kind='quote_terms' and locale in ('de','es','pt','it','nl','ar')),'translated terms are complete but stay draft until legal review');
select pg_temp.assert((select count(*) from public.contract_templates where kind='quote_terms' and status='published' and locale in ('en','fr'))=2,'reviewed EN/FR terms stay published');

rollback;
