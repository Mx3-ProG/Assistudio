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

-- True when the statement raises an exception whose message contains p_like.
create or replace function pg_temp.fails(p_sql text, p_like text default '') returns boolean language plpgsql as $$
begin
  execute p_sql;
  return false;
exception when others then
  return sqlerrm like '%' || p_like || '%';
end $$;

-- Cast: sponsor S, recruit R (sponsored by S), stranger X, friend-to-be F,
-- pending affiliate P, admin A.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000c0001', 'msg-s@test.invalid', '{"full_name":"Sponsor S"}'),
  ('00000000-0000-0000-0000-0000000c0003', 'msg-x@test.invalid', '{"full_name":"Stranger X"}'),
  ('00000000-0000-0000-0000-0000000c0004', 'msg-f@test.invalid', '{"full_name":"Friend F"}'),
  ('00000000-0000-0000-0000-0000000c0005', 'msg-p@test.invalid', '{"full_name":"Pending P"}'),
  ('00000000-0000-0000-0000-0000000c0006', 'msg-a@test.invalid', '{"full_name":"Admin A"}');
update public.affiliates set status = 'approved', code = 'MSGSPO'
 where profile_id = '00000000-0000-0000-0000-0000000c0001';
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000c0002', 'msg-r@test.invalid', '{"full_name":"Recruit R","sponsor_code":"MSGSPO"}');
update public.affiliates set status = 'approved'
 where profile_id in ('00000000-0000-0000-0000-0000000c0002', '00000000-0000-0000-0000-0000000c0003');
update public.affiliates set status = 'approved', code = 'MSGFRI'
 where profile_id = '00000000-0000-0000-0000-0000000c0004';
update public.affiliates set status = 'pending' where profile_id = '00000000-0000-0000-0000-0000000c0005';
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000c0006';

set local role authenticated;

-- ---------------------------------------------------------------- who can talk
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0001');
select pg_temp.assert(public.can_message('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-0000000c0002'),
  'sponsor can message their recruit automatically');
select pg_temp.assert(public.can_message('00000000-0000-0000-0000-0000000c0002', '00000000-0000-0000-0000-0000000c0001'),
  'recruit can message their sponsor automatically');
select pg_temp.assert(not public.can_message('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-0000000c0003'),
  'two unrelated affiliates cannot message each other');
select pg_temp.assert(public.can_message('00000000-0000-0000-0000-0000000c0005', '00000000-0000-0000-0000-0000000c0006'),
  'anyone (even pending) can message an admin');
select pg_temp.assert(not public.can_message('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-0000000c0001'),
  'nobody messages themselves');

select pg_temp.assert(pg_temp.fails($$select public.open_direct_conversation('00000000-0000-0000-0000-0000000c0003')$$, 'messaging.not_allowed'),
  'opening a DM with a stranger is refused');

create temp table t_ids (k text primary key, v uuid);
grant all on t_ids to authenticated;
insert into t_ids select 'sr', public.open_direct_conversation('00000000-0000-0000-0000-0000000c0002');
select pg_temp.assert((select v from t_ids where k = 'sr') = public.open_direct_conversation('00000000-0000-0000-0000-0000000c0002'),
  'opening the same DM twice returns the same conversation');

-- ---------------------------------------------------------------- friendship
select pg_temp.assert(public.request_friend('NOPE99') = 'not_found', 'unknown code -> not_found');
select pg_temp.assert(public.request_friend('MSGSPO') = 'self', 'own code -> self');
select pg_temp.assert(public.request_friend('MSGFRI') = 'sent', 'friend request sent by code');
select pg_temp.assert(not public.can_message('00000000-0000-0000-0000-0000000c0001', '00000000-0000-0000-0000-0000000c0004'),
  'a pending friend request does not open messaging');

select pg_temp.act_as('00000000-0000-0000-0000-0000000c0003');
select pg_temp.assert(pg_temp.fails($$select public.respond_friend((select id from public.friendships limit 1), true)$$),
  'a third party cannot see or accept someone else''s request');

select pg_temp.act_as('00000000-0000-0000-0000-0000000c0004');
select public.respond_friend((select id from public.friendships
  where addressee_id = '00000000-0000-0000-0000-0000000c0004'), true);
select pg_temp.assert(public.can_message('00000000-0000-0000-0000-0000000c0004', '00000000-0000-0000-0000-0000000c0001'),
  'accepted friendship opens messaging');
insert into t_ids select 'sf', public.open_direct_conversation('00000000-0000-0000-0000-0000000c0001');
select public.send_message((select v from t_ids where k = 'sf'), 'text', 'hello friend');

select pg_temp.act_as('00000000-0000-0000-0000-0000000c0001');
select pg_temp.assert((select count(*) from public.messages where conversation_id = (select v from t_ids where k = 'sf')) = 1,
  'the friend reads the message');
select pg_temp.assert((select (e ->> 'unread')::int from jsonb_array_elements(public.my_conversations()) e
  where e ->> 'id' = (select v::text from t_ids where k = 'sf')) = 1, 'unread counter shows 1');
select public.mark_conversation_read((select v from t_ids where k = 'sf'));
select pg_temp.assert(public.my_unread_count() = 0, 'reading clears unread');

select public.remove_friend('00000000-0000-0000-0000-0000000c0004');
select pg_temp.assert(pg_temp.fails(format($$select public.send_message(%L, 'text', 'still there?')$$,
  (select v from t_ids where k = 'sf')), 'messaging.not_allowed'),
  'removing the friendship stops sending in the existing DM');

-- ---------------------------------------------------------------- blocks
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0002');
select public.block_profile('00000000-0000-0000-0000-0000000c0001');
select pg_temp.assert(not public.can_message('00000000-0000-0000-0000-0000000c0002', '00000000-0000-0000-0000-0000000c0001'),
  'a block cancels the automatic sponsor link');
select public.unblock_profile('00000000-0000-0000-0000-0000000c0001');
select pg_temp.assert(pg_temp.fails($$select public.block_profile('00000000-0000-0000-0000-0000000c0006')$$),
  'staff cannot be blocked');

-- ---------------------------------------------------------------- RLS
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0001');
select public.send_message((select v from t_ids where k = 'sr'), 'text', 'private between S and R');
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0003');
select pg_temp.assert((select count(*) from public.messages where conversation_id = (select v from t_ids where k = 'sr')) = 0,
  'an outsider cannot read a DM');
select pg_temp.assert(pg_temp.fails(format($$select public.send_message(%L, 'text', 'intrusion')$$,
  (select v from t_ids where k = 'sr')), 'messaging.not_allowed'), 'an outsider cannot post in a DM');
select pg_temp.assert(pg_temp.fails($$insert into public.messages (conversation_id, sender_id, kind, body)
  values ((select id from public.conversations limit 1), auth.uid(), 'text', 'x')$$),
  'clients cannot insert messages directly');

select pg_temp.act_as('00000000-0000-0000-0000-0000000c0006');
select pg_temp.assert((select count(*) from public.messages where conversation_id = (select v from t_ids where k = 'sr')) = 0,
  'staff cannot read a DM they are not part of');

-- ---------------------------------------------------------------- support
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0005');
insert into t_ids select 'sup', public.open_support_conversation();
select public.send_message((select v from t_ids where k = 'sup'), 'text', 'I need help with my application');
select pg_temp.assert(pg_temp.fails($$select public.open_support_conversation('00000000-0000-0000-0000-0000000c0001')$$),
  'an affiliate cannot open someone else''s support thread');
select pg_temp.assert(pg_temp.fails($$select public.open_direct_conversation('00000000-0000-0000-0000-0000000c0001')$$),
  'a pending affiliate has no direct messages');

select pg_temp.act_as('00000000-0000-0000-0000-0000000c0006');
select pg_temp.assert((select count(*) from public.messages where conversation_id = (select v from t_ids where k = 'sup')) = 1,
  'staff read the shared support thread');
select pg_temp.assert(jsonb_array_length(public.staff_support_inbox()) >= 1
  and (select (e ->> 'unread')::int from jsonb_array_elements(public.staff_support_inbox()) e
       where e ->> 'id' = (select v::text from t_ids where k = 'sup')) = 1, 'support inbox shows the unread thread');
select public.send_message((select v from t_ids where k = 'sup'), 'text', 'We are on it');
select pg_temp.assert(public.open_support_conversation('00000000-0000-0000-0000-0000000c0005') = (select v from t_ids where k = 'sup'),
  'staff open the same support thread for a member');

-- ---------------------------------------------------------------- announcements
select public.send_message(public.announcements_conversation_id(), 'text', 'New sales kit is live');
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0002');
select pg_temp.assert((select count(*) from public.messages where conversation_id = public.announcements_conversation_id()) = 1,
  'approved affiliates read announcements');
select pg_temp.assert(pg_temp.fails($$select public.send_message(public.announcements_conversation_id(), 'text', 'spam')$$, 'messaging.not_allowed'),
  'affiliates cannot post announcements');
select pg_temp.assert(public.react_to_message((select id from public.messages where conversation_id = public.announcements_conversation_id()), '🔥'),
  'affiliates can react to an announcement');
select pg_temp.assert(pg_temp.fails($$select public.react_to_message((select id from public.messages
  where conversation_id = public.announcements_conversation_id()), '💩')$$), 'emoji outside the whitelist is refused');
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0005');
select pg_temp.assert((select count(*) from public.messages where conversation_id = public.announcements_conversation_id()) = 0,
  'pending affiliates do not read announcements');

-- ---------------------------------------------------------------- attachments
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0001');
select pg_temp.assert(pg_temp.fails(format($$select public.send_message(%L, 'image', null, %L, 'image/png', 1000)$$,
  (select v from t_ids where k = 'sr'), (select v from t_ids where k = 'sr')::text || '/00000000-0000-0000-0000-0000000c0002/a.png'),
  'messaging.invalid_attachment'), 'uploading under someone else''s folder is refused');
select pg_temp.assert(pg_temp.fails(format($$select public.send_message(%L, 'image', null, %L, 'image/png', 1000)$$,
  (select v from t_ids where k = 'sr'), (select v from t_ids where k = 'sr')::text || '/00000000-0000-0000-0000-0000000c0001/../x.png'),
  'messaging.invalid_attachment'), 'path traversal is refused');
select pg_temp.assert(pg_temp.fails(format($$select public.send_message(%L, 'image', null, %L, 'application/x-msdownload', 1000)$$,
  (select v from t_ids where k = 'sr'), (select v from t_ids where k = 'sr')::text || '/00000000-0000-0000-0000-0000000c0001/a.png'),
  'messaging.invalid_attachment'), 'a MIME type that does not match the kind is refused');
select pg_temp.assert(pg_temp.fails(format($$select public.send_message(%L, 'image', null, %L, 'image/png', 999999999)$$,
  (select v from t_ids where k = 'sr'), (select v from t_ids where k = 'sr')::text || '/00000000-0000-0000-0000-0000000c0001/a.png'),
  'messaging.too_large'), 'oversized media is refused');
select pg_temp.assert((public.send_message((select v from t_ids where k = 'sr'), 'audio', null,
  (select v from t_ids where k = 'sr')::text || '/00000000-0000-0000-0000-0000000c0001/voice-1.webm',
  'audio/webm;codecs=opus', 48000, 'voice.webm', 4200)).kind = 'audio', 'a voice message is accepted');

-- ---------------------------------------------------------------- idempotence & limits
select pg_temp.assert((public.send_message((select v from t_ids where k = 'sr'), 'text', 'once',
    p_client_id => '00000000-0000-0000-0000-00000000aaaa')).id
  = (public.send_message((select v from t_ids where k = 'sr'), 'text', 'once',
    p_client_id => '00000000-0000-0000-0000-00000000aaaa')).id, 'client_id makes a resend idempotent');
select pg_temp.assert(pg_temp.fails($$select public.send_message((select v from t_ids where k = 'sr'), 'text', '   ')$$, 'messaging.empty'),
  'blank messages are refused');
select pg_temp.assert(pg_temp.fails($$select public.send_message((select v from t_ids where k = 'sr'), 'text', 'burst')
  from generate_series(1, 25)$$, 'messaging.rate_limited'), 'message bursts are rate limited');

-- ---------------------------------------------------------------- edit / delete
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0002');
select pg_temp.assert(pg_temp.fails($$select public.edit_message((select id from public.messages where body = 'private between S and R'), 'hacked')$$),
  'nobody edits someone else''s message');

-- ---------------------------------------------------------------- reports & audit
select public.report_message((select id from public.messages where body = 'private between S and R'), 'Spam');
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0006');
select pg_temp.assert(jsonb_array_length(public.staff_list_reports()) = 1, 'staff see the report');
select pg_temp.assert(jsonb_array_length(public.staff_open_report((select id from public.message_reports limit 1)) -> 'messages') >= 1,
  'staff open the reported context');
reset role;
select pg_temp.assert(exists (select 1 from public.audit_logs where action = 'message_report.open'),
  'opening a report is audited');
set local role authenticated;
select public.staff_moderate_report((select id from public.message_reports limit 1), 'mute_sender', 'spam');
select pg_temp.act_as('00000000-0000-0000-0000-0000000c0001');
select pg_temp.assert(pg_temp.fails($$select public.send_message((select v from t_ids where k = 'sr'), 'text', 'muted?')$$, 'messaging.muted'),
  'a muted member cannot post in direct messages');
insert into t_ids select 'sup-s', public.open_support_conversation();
select pg_temp.assert((public.send_message((select v from t_ids where k = 'sup-s'), 'text', 'why was I muted?')).id is not null,
  'a muted member can still write to Support');

rollback;
