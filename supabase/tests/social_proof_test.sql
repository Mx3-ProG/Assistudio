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

create or replace function pg_temp.fails(sql text, code text) returns boolean language plpgsql as $$
begin
  execute sql;
  return false;
exception when others then
  return sqlerrm like '%' || code || '%';
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000b0001', 'proof-admin@test.invalid', '{"full_name":"Proof Admin"}'),
  ('00000000-0000-0000-0000-0000000b0002', 'proof-partner@test.invalid', '{"full_name":"Camille Proof"}'),
  ('00000000-0000-0000-0000-0000000b0003', 'proof-pending@test.invalid', '{"full_name":"Pending Partner"}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000b0001';
update public.affiliates set status = 'approved' where profile_id = '00000000-0000-0000-0000-0000000b0002';
update public.affiliates set status = 'pending' where profile_id = '00000000-0000-0000-0000-0000000b0003';

insert into public.customers (email, company_name, contact_name) values
  ('proof-buyer@test.invalid', 'Atelier Rossi', 'Lucia Rossi'),
  ('proof-lead@test.invalid', 'No Sale SARL', 'Paul Nosale');
insert into public.sales (customer_id, offer_id, kind, status, gross_amount_cents, net_amount_cents, currency, paid_at, provider_payment_id)
select c.id, o.id, 'new', 'paid', 300000, 300000, 'EUR', now(), 'pi_proof_test'
  from public.customers c, public.offers o
 where c.email = 'proof-buyer@test.invalid' and o.stripe_lookup_key = 'assistudio_pro_yearly_eur';

-- ---------------------------------------------------------------- partner review
select pg_temp.act_as('00000000-0000-0000-0000-0000000b0002');
set local role authenticated;

select pg_temp.assert(pg_temp.fails($$select public.submit_ambassador_testimonial('{"author_name":"Camille Proof","content":"Studio m''a donné un vrai cadre pour vendre.","consent":false,"consent_version":"2026-10-05","consent_text":"J''autorise Studio ATS à utiliser cet avis."}')$$, 'proof.consent_required'),
  'no testimonial without consent');

select pg_temp.assert((select count(*) from public.submit_ambassador_testimonial(
  '{"author_name":"Camille Proof","author_display":"full","profession":"Consultante","rating":"5","content":"Studio m''a donné un vrai cadre pour vendre.","recommendation":"Lancez-vous.","consent":true,"consent_version":"2026-10-05","consent_text":"J''autorise Studio ATS à utiliser cet avis."}')) = 1,
  'an approved partner can give a review');

select pg_temp.assert(pg_temp.fails($$select public.submit_ambassador_testimonial('{"author_name":"Camille Proof","content":"Second review while pending.","consent":true,"consent_version":"2026-10-05","consent_text":"J''autorise Studio ATS à utiliser cet avis."}')$$, 'proof.already_pending'),
  'one review waiting for moderation at a time');

select pg_temp.assert(pg_temp.fails($$select public.submit_ambassador_testimonial('{"author_name":"Camille Proof","content":"A video stored in someone else''s folder.","video_path":"a/00000000-0000-0000-0000-0000000b0003/0123456789abcdef0123456789abcdef.mp4","consent":true,"consent_version":"2026-10-05","consent_text":"J''autorise Studio ATS à utiliser cet avis."}')$$, 'proof.'),
  'media outside the author''s folder are refused');

select pg_temp.assert(pg_temp.fails($$insert into public.testimonials (testimonial_type, author_name, content, consent, consent_at, consent_version, consent_text) values ('client', 'X Y', 'Direct insert attempt', true, now(), 'v', 'consent text here')$$, ''),
  'no direct insert from the API');
select pg_temp.assert((select count(*) from public.testimonials) = 1, 'the author reads their own review (RLS)');
select pg_temp.assert((select count(*) from public.testimonial_consents where action = 'granted') = 1, 'the consent is logged');

reset role;
select pg_temp.assert((select verified and verified_basis = 'approved_partner' and status = 'pending' from public.testimonials
                        where profile_id = '00000000-0000-0000-0000-0000000b0002'),
  'an approved partner''s review is verified and pending');

select pg_temp.act_as('00000000-0000-0000-0000-0000000b0003');
set local role authenticated;
select public.submit_ambassador_testimonial('{"author_name":"Pending Partner","author_display":"first_name","content":"Not yet approved but enthusiastic.","consent":true,"consent_version":"2026-10-05","consent_text":"J''autorise Studio ATS à utiliser cet avis."}');
select pg_temp.assert((select count(*) from public.testimonials) = 1, 'a partner never reads another partner''s review');
reset role;
select pg_temp.assert((select not verified from public.testimonials where profile_id = '00000000-0000-0000-0000-0000000b0003'),
  'a partner account not yet approved does not get the verified badge');

-- ---------------------------------------------------------------- nothing public before moderation
select pg_temp.act_as(null);
set local role anon;
select pg_temp.assert((select count(*) from public.public_testimonials(null, null, 12)) = 0, 'pending reviews are never public');
select pg_temp.assert(pg_temp.fails($$select * from public.testimonials$$, '') or (select count(*) from public.testimonials) = 0,
  'anonymous visitors cannot read the table');
reset role;

-- ---------------------------------------------------------------- moderation
select pg_temp.act_as('00000000-0000-0000-0000-0000000b0001');
set local role authenticated;
select pg_temp.assert(pg_temp.fails($$select public.staff_update_testimonial_presentation((select id from public.testimonials where profile_id = '00000000-0000-0000-0000-0000000b0002'), '{"placements":["home"]}')$$, 'proof.not_approved'),
  'placements require an approved review');
select public.staff_review_testimonial((select id from public.testimonials where profile_id = '00000000-0000-0000-0000-0000000b0002'), 'approved', null);
select public.staff_update_testimonial_presentation((select id from public.testimonials where profile_id = '00000000-0000-0000-0000-0000000b0002'),
  '{"placements":["home","ambassador"],"display_mode":"first_name","service":"support","featured":true}');
select pg_temp.assert(pg_temp.fails($$select public.staff_update_testimonial_presentation((select id from public.testimonials where profile_id = '00000000-0000-0000-0000-0000000b0003'), '{"display_mode":"full"}')$$, 'proof.display_not_allowed'),
  'staff cannot show more of the name than the author allowed');
select pg_temp.assert(pg_temp.fails($$select public.staff_review_testimonial((select id from public.testimonials where profile_id = '00000000-0000-0000-0000-0000000b0003'), 'rejected', '')$$, 'proof.reason_required'),
  'a rejection needs a reason');
reset role;

select pg_temp.assert(pg_temp.fails($$update public.testimonials set content = 'Changed meaning entirely' where profile_id = '00000000-0000-0000-0000-0000000b0002'$$, 'proof.immutable'),
  'the words of a review can never be edited, even with table access');
select pg_temp.assert(pg_temp.fails($$update public.testimonials set verified = false, verified_basis = null where profile_id = '00000000-0000-0000-0000-0000000b0002'$$, 'proof.immutable'),
  'the verified badge cannot be set or removed by hand');

select pg_temp.act_as(null);
set local role anon;
select pg_temp.assert((select count(*) from public.public_testimonials('home', null, 12)) = 1, 'an approved review shows where it is placed');
select pg_temp.assert((select count(*) from public.public_testimonials('offers', null, 12)) = 0, 'and only there');
select pg_temp.assert((select display_name = 'Camille' and verified from public.public_testimonials('home', null, 12)),
  'the public sees the display name chosen by staff within the author''s limit, and the badge');
select pg_temp.assert(not exists (select 1 from jsonb_object_keys((select to_jsonb(x) from public.public_testimonials('home', null, 1) x)) k
                                   where k in ('author_name', 'profile_id', 'customer_id', 'video_path', 'email', 'consent_text')),
  'the public function exposes no private column');
reset role;

-- ---------------------------------------------------------------- consent withdrawal
select pg_temp.act_as('00000000-0000-0000-0000-0000000b0002');
set local role authenticated;
select public.withdraw_testimonial((select id from public.testimonials where profile_id = '00000000-0000-0000-0000-0000000b0002'));
reset role;
select pg_temp.assert((select status = 'hidden' and placements = '{}' and consent_withdrawn_at is not null from public.testimonials
                        where profile_id = '00000000-0000-0000-0000-0000000b0002'),
  'withdrawing consent hides the review at once');
select pg_temp.assert((select count(*) from public.testimonial_consents where action = 'withdrawn') = 1, 'the withdrawal is logged');
select pg_temp.assert((select count(*) from public.public_testimonials(null, null, 12)) = 0, 'a withdrawn review is never public');
select pg_temp.act_as('00000000-0000-0000-0000-0000000b0001');
set local role authenticated;
select pg_temp.assert(pg_temp.fails($$select public.staff_review_testimonial((select id from public.testimonials where profile_id = '00000000-0000-0000-0000-0000000b0002'), 'approved', null)$$, 'proof.consent_withdrawn'),
  'staff cannot republish a review whose consent was withdrawn');
reset role;

-- ---------------------------------------------------------------- client invite
select pg_temp.act_as('00000000-0000-0000-0000-0000000b0001');
set local role authenticated;
select public.staff_create_testimonial_invite((select id from public.customers where email = 'proof-buyer@test.invalid'), repeat('a', 64), 30, 'fr', 'Site livré');
select public.staff_create_testimonial_invite((select id from public.customers where email = 'proof-lead@test.invalid'), repeat('b', 64), 30, 'fr', null);
reset role;

select pg_temp.assert(pg_temp.fails($$select * from public.testimonial_invite_lookup(repeat('a', 64))$$, '') is false
                      and (select state = 'open' and company_name = 'Atelier Rossi' from public.testimonial_invite_lookup(repeat('a', 64))),
  'an open invite shows the company, not the email');
select public.submit_client_testimonial(repeat('a', 64),
  '{"author_name":"Lucia Rossi","author_display":"full","company_name":"Atelier Rossi","activity":"Restauration","rating":"4","content":"Le site est clair et nos clients réservent seuls.","consent":true,"consent_version":"2026-10-05","consent_text":"J''autorise Studio ATS à utiliser cet avis."}');
select pg_temp.assert(pg_temp.fails($$select public.submit_client_testimonial(repeat('a', 64), '{"author_name":"Lucia Rossi","content":"Second use of the same link.","consent":true,"consent_version":"2026-10-05","consent_text":"J''autorise Studio ATS à utiliser cet avis."}')$$, 'proof.invite_invalid'),
  'an invite works only once');
select pg_temp.assert((select verified and verified_basis = 'paying_customer' from public.testimonials where testimonial_type = 'client'),
  'a customer with a paid sale is verified');
select public.submit_client_testimonial(repeat('b', 64),
  '{"author_name":"Paul Nosale","content":"No sale yet, still a review.","consent":true,"consent_version":"2026-10-05","consent_text":"J''autorise Studio ATS à utiliser cet avis."}');
select pg_temp.assert((select not verified from public.testimonials where author_name = 'Paul Nosale'),
  'a customer without a paid sale is not verified');
select pg_temp.act_as(null);
set local role anon;
select pg_temp.assert(pg_temp.fails($$select public.submit_client_testimonial(repeat('c', 64), '{}')$$, ''),
  'anonymous callers cannot use the client submission directly');
reset role;

-- ---------------------------------------------------------------- media removal
update public.testimonials set poster_path = null where false; -- no-op, keeps the guard honest
select pg_temp.assert(pg_temp.fails($$update public.testimonials set photo_path = 'c/other/0123456789abcdef0123456789abcdef.jpg' where testimonial_type = 'client' and author_name = 'Lucia Rossi'$$, 'proof.immutable'),
  'a medium cannot be swapped for another file');

-- ---------------------------------------------------------------- proof events
insert into public.payouts (affiliate_id, amount_cents, currency, status, scheduled_for, paid_at)
select id, 25000, 'EUR', 'paid', current_date, now() from public.affiliates where profile_id = '00000000-0000-0000-0000-0000000b0002';

select pg_temp.act_as('00000000-0000-0000-0000-0000000b0001');
set local role authenticated;
select public.staff_create_proof_event('commission_paid', (select id from public.payouts where amount_cents = 25000));
select pg_temp.assert(pg_temp.fails($$select public.staff_create_proof_event('commission_paid', gen_random_uuid())$$, 'proof.source_invalid'),
  'a proof event needs a real source');
select pg_temp.assert((select value_cents = 25000 and verified and not published and anonymized_label = 'partner'
                         from public.social_proof_events where type = 'commission_paid'),
  'the value is copied from the paid payout, unpublished by default, anonymised');
reset role;
select pg_temp.act_as(null);
set local role anon;
select pg_temp.assert((select count(*) from public.public_proof_events(6)) = 0, 'unpublished events are not public');
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000b0001');
set local role authenticated;
select public.staff_set_proof_event_published((select id from public.social_proof_events where type = 'commission_paid'), true);
reset role;
select pg_temp.act_as(null);
set local role anon;
select pg_temp.assert((select value_cents = 25000 and occurred_month = date_trunc('month', now())::date from public.public_proof_events(6)),
  'a published event shows its amount at month precision');
reset role;
update public.payouts set status = 'failed' where amount_cents = 25000;
select pg_temp.act_as(null);
set local role anon;
select pg_temp.assert((select count(*) from public.public_proof_events(6)) = 0, 'an event stops showing when its source is no longer valid');
reset role;
select pg_temp.assert(pg_temp.fails($$insert into public.social_proof_events (type, source_table, source_id, proof_type, anonymized_label, occurred_at, verified, published) values ('commission_paid', 'payouts', gen_random_uuid(), 'demo', 'Simulation', now(), true, true)$$, 'social_proof_events_publishable'),
  'a demo event can never be published');

-- ---------------------------------------------------------------- video removal
update public.testimonials set video_path = null where false;
insert into public.testimonials (testimonial_type, profile_id, affiliate_id, author_name, content, media_type, video_path, poster_path,
                                 consent, consent_at, consent_version, consent_text)
select 'ambassador', profile_id, id, 'Video Author', 'A review recorded on video.', 'video',
       'a/' || profile_id || '/0123456789abcdef0123456789abcdef.webm', 'a/' || profile_id || '/0123456789abcdef0123456789abcdee.webp',
       true, now(), '2026-10-05', 'J''autorise Studio ATS à utiliser cet avis.'
  from public.affiliates where profile_id = '00000000-0000-0000-0000-0000000b0003';
select pg_temp.act_as('00000000-0000-0000-0000-0000000b0001');
set local role authenticated;
select pg_temp.assert(cardinality(public.staff_remove_testimonial_media((select id from public.testimonials where author_name = 'Video Author'), 'video', 'Bad sound')) = 2,
  'removing a video returns the video and its poster for deletion');
reset role;
select pg_temp.assert((select media_type = 'text' and video_path is null and poster_path is null from public.testimonials where author_name = 'Video Author'),
  'the review falls back to text once its video is removed');

rollback;
