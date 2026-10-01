-- =============================================================================
-- Studio ATS — Messaging (V1).
--
-- Who can talk to whom (mirrored in src/lib/messaging/policy.ts — keep in sync):
--   1. Staff (admin / super_admin) <-> anyone.
--   2. Sponsor <-> direct recruit (affiliates.sponsor_id): automatic.
--   3. Affiliate <-> affiliate: only with an ACCEPTED friendship.
--   4. A block cancels 2 and 3. Only approved affiliates use direct messages;
--      every affiliate, whatever their status, keeps their Support thread.
--   5. Each profile has one Support thread, shared by the whole staff team.
--   6. One Announcements channel: staff publish, approved affiliates read/react.
--
-- Every write goes through a SECURITY DEFINER function; clients only SELECT
-- (RLS). Staff cannot read a direct conversation they are not part of, except
-- through staff_open_report(), which is audited.
-- Media live in the private Storage bucket `chat-media` under
-- {conversation_id}/{sender_profile_id}/{file}; reads use short signed URLs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles (id) on delete cascade,
  addressee_id  uuid not null references public.profiles (id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  constraint friendships_not_self check (requester_id <> addressee_id)
);
create unique index friendships_pair_uidx on public.friendships
  (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id, status);
create index friendships_requester_idx on public.friendships (requester_id, status);

create table public.profile_blocks (
  blocker_id  uuid not null references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint profile_blocks_not_self check (blocker_id <> blocked_id)
);
create index profile_blocks_blocked_idx on public.profile_blocks (blocked_id);

create table public.conversations (
  id                  uuid primary key default gen_random_uuid(),
  kind                text not null check (kind in ('direct', 'support', 'announcements')),
  direct_key          text unique,                                         -- 'uuidA:uuidB' (sorted)
  subject_profile_id  uuid references public.profiles (id) on delete cascade, -- support: the member
  created_at          timestamptz not null default now(),
  last_message_at     timestamptz,
  constraint conversations_shape check (
    (kind = 'direct' and direct_key is not null and subject_profile_id is null)
    or (kind = 'support' and subject_profile_id is not null and direct_key is null)
    or (kind = 'announcements' and subject_profile_id is null and direct_key is null))
);
create unique index conversations_support_uidx on public.conversations (subject_profile_id) where kind = 'support';
create unique index conversations_announcements_uidx on public.conversations (kind) where kind = 'announcements';
create index conversations_last_message_idx on public.conversations (kind, last_message_at desc nulls last);

-- Direct: both participants. Support / announcements: rows are created lazily
-- (first read) to keep a per-person read marker; access is decided by role.
create table public.conversation_members (
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  last_read_at     timestamptz,
  muted            boolean not null default false,
  joined_at        timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);
create index conversation_members_profile_idx on public.conversation_members (profile_id);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid references public.profiles (id) on delete set null,
  kind             text not null check (kind in ('text', 'image', 'video', 'audio', 'file', 'system')),
  body             text check (char_length(body) <= 4000),
  attachment_path  text,
  attachment_mime  text,
  attachment_size  bigint check (attachment_size between 0 and 52428800),
  attachment_name  text check (char_length(attachment_name) <= 200),
  duration_ms      int check (duration_ms between 0 and 600000),
  width            int check (width between 0 and 20000),
  height           int check (height between 0 and 20000),
  reply_to         uuid references public.messages (id) on delete set null,
  client_id        uuid,
  created_at       timestamptz not null default clock_timestamp(),
  edited_at        timestamptz,
  deleted_at       timestamptz,
  constraint messages_media_has_file check (
    kind in ('text', 'system') or deleted_at is not null or attachment_path is not null)
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc);
create index messages_sender_idx on public.messages (sender_id, created_at desc);
create unique index messages_client_uidx on public.messages (sender_id, client_id) where client_id is not null;

create table public.message_reactions (
  message_id  uuid not null references public.messages (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  emoji       text not null check (emoji in ('👍', '❤️', '🔥', '🎉', '👏', '😂')),
  created_at  timestamptz not null default now(),
  primary key (message_id, profile_id, emoji)
);

create table public.message_reports (
  id           uuid primary key default gen_random_uuid(),
  message_id   uuid not null references public.messages (id) on delete cascade,
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  reason       text not null check (char_length(reason) between 1 and 1000),
  status       text not null default 'open' check (status in ('open', 'reviewing', 'dismissed', 'actioned')),
  reviewed_by  uuid references public.profiles (id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (message_id, reporter_id)
);
create index message_reports_status_idx on public.message_reports (status, created_at desc);

-- Moderation: a muted profile can still write to Support, nowhere else.
create table public.messaging_restrictions (
  profile_id   uuid primary key references public.profiles (id) on delete cascade,
  muted_until  timestamptz not null,
  reason       text,
  created_by   uuid references public.profiles (id),
  created_at   timestamptz not null default now()
);

insert into public.conversations (kind) values ('announcements');

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.msg_uuid_or_null(p text) returns uuid
language sql immutable as $$
  select case when p ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then p::uuid end
$$;

create or replace function public.msg_is_staff_profile(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('super_admin', 'admin') from public.profiles
                    where id = p and deleted_at is null), false)
$$;

create or replace function public.msg_is_approved_affiliate(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.affiliates a join public.profiles pr on pr.id = a.profile_id
                  where a.profile_id = p and a.status = 'approved'
                    and a.deleted_at is null and pr.deleted_at is null)
$$;

create or replace function public.msg_is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profile_blocks
                  where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a))
$$;

create or replace function public.msg_relationship(a uuid, b uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.affiliates x join public.affiliates y on y.id = x.sponsor_id
                  where x.profile_id = a and y.profile_id = b and x.deleted_at is null and y.deleted_at is null)
      then 'sponsor'      -- b is a's sponsor
    when exists (select 1 from public.affiliates x join public.affiliates y on y.id = x.sponsor_id
                  where x.profile_id = b and y.profile_id = a and x.deleted_at is null and y.deleted_at is null)
      then 'recruit'      -- b is a's recruit
    when exists (select 1 from public.friendships f where f.status = 'accepted'
                  and least(f.requester_id, f.addressee_id) = least(a, b)
                  and greatest(f.requester_id, f.addressee_id) = greatest(a, b))
      then 'friend'
    else null end
$$;

-- The single "may a talk to b" rule. Mirrored by canMessage() in TS.
create or replace function public.can_message(a uuid, b uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if a is null or b is null or a = b then return false; end if;
  if not exists (select 1 from public.profiles where id = a and deleted_at is null)
     or not exists (select 1 from public.profiles where id = b and deleted_at is null) then
    return false;
  end if;
  if public.msg_is_staff_profile(a) or public.msg_is_staff_profile(b) then return true; end if;
  if public.msg_is_blocked(a, b) then return false; end if;
  if not (public.msg_is_approved_affiliate(a) and public.msg_is_approved_affiliate(b)) then return false; end if;
  return public.msg_relationship(a, b) is not null;
end $$;

create or replace function public.msg_display_name(p uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(trim(display_name), ''), nullif(trim(full_name), ''))
    from public.profiles where id = p
$$;

create or replace function public.can_access_conversation(conv uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  c public.conversations;
  me uuid := auth.uid();
begin
  if me is null or conv is null then return false; end if;
  if not exists (select 1 from public.profiles where id = me and deleted_at is null) then return false; end if;
  select * into c from public.conversations where id = conv;
  if not found then return false; end if;
  if c.kind = 'direct' then
    return exists (select 1 from public.conversation_members where conversation_id = conv and profile_id = me);
  elsif c.kind = 'support' then
    return c.subject_profile_id = me or public.is_staff();
  else
    return public.is_staff() or public.msg_is_approved_affiliate(me);
  end if;
end $$;

create or replace function public.msg_other_member(conv uuid, me uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select profile_id from public.conversation_members
   where conversation_id = conv and profile_id <> me limit 1
$$;

-- -----------------------------------------------------------------------------
-- Conversations
-- -----------------------------------------------------------------------------
create or replace function public.open_direct_conversation(p_other uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  k text;
  conv uuid;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if not public.can_message(me, p_other) then raise exception 'messaging.not_allowed'; end if;
  k := least(me, p_other)::text || ':' || greatest(me, p_other)::text;
  select id into conv from public.conversations where direct_key = k;
  if conv is null then
    insert into public.conversations (kind, direct_key) values ('direct', k)
      on conflict (direct_key) do nothing returning id into conv;
    if conv is null then select id into conv from public.conversations where direct_key = k; end if;
  end if;
  insert into public.conversation_members (conversation_id, profile_id)
    values (conv, me), (conv, p_other) on conflict do nothing;
  return conv;
end $$;

create or replace function public.open_support_conversation(p_subject uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  subj uuid := coalesce(p_subject, auth.uid());
  conv uuid;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if subj <> me and not public.is_staff() then raise exception 'messaging.not_allowed'; end if;
  if not exists (select 1 from public.profiles where id = subj and deleted_at is null) then
    raise exception 'messaging.not_allowed';
  end if;
  select id into conv from public.conversations where kind = 'support' and subject_profile_id = subj;
  if conv is null then
    insert into public.conversations (kind, subject_profile_id) values ('support', subj)
      on conflict do nothing returning id into conv;
    if conv is null then
      select id into conv from public.conversations where kind = 'support' and subject_profile_id = subj;
    end if;
  end if;
  return conv;
end $$;

create or replace function public.announcements_conversation_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.conversations where kind = 'announcements' limit 1
$$;

create or replace function public.mark_conversation_read(p_conv uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_conversation(p_conv) then raise exception 'messaging.not_allowed'; end if;
  insert into public.conversation_members (conversation_id, profile_id, last_read_at)
    values (p_conv, auth.uid(), clock_timestamp())
  on conflict (conversation_id, profile_id) do update set last_read_at = excluded.last_read_at;
end $$;

-- -----------------------------------------------------------------------------
-- Messages
-- -----------------------------------------------------------------------------
-- Limits mirrored in src/lib/messaging/policy.ts (MESSAGE_LIMITS).
create or replace function public.msg_kind_accepts(p_kind text, p_mime text) returns boolean
language sql immutable as $$
  select case p_kind
    when 'image' then p_mime in ('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif')
    when 'video' then p_mime in ('video/mp4', 'video/webm', 'video/quicktime')
    when 'audio' then p_mime in ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav')
    when 'file'  then p_mime in ('application/pdf')
    else false end
$$;

create or replace function public.msg_max_size(p_kind text) returns bigint
language sql immutable as $$
  select case p_kind
    when 'image' then 10485760   -- 10 MB
    when 'audio' then 15728640   -- 15 MB (5 min)
    when 'video' then 52428800   -- 50 MB
    when 'file'  then 20971520   -- 20 MB
    else 0 end
$$;

create or replace function public.send_message(
  p_conv uuid, p_kind text, p_body text default null,
  p_attachment_path text default null, p_attachment_mime text default null,
  p_attachment_size bigint default null, p_attachment_name text default null,
  p_duration_ms int default null, p_width int default null, p_height int default null,
  p_reply_to uuid default null, p_client_id uuid default null
) returns public.messages
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  c public.conversations;
  other uuid;
  existing public.messages;
  obj_meta jsonb;
  v_body text := nullif(trim(coalesce(p_body, '')), '');
  m public.messages;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if p_client_id is not null then
    select * into existing from public.messages where sender_id = me and client_id = p_client_id;
    if found then return existing; end if;
  end if;
  if not public.can_access_conversation(p_conv) then raise exception 'messaging.not_allowed'; end if;
  select * into c from public.conversations where id = p_conv;

  if c.kind = 'announcements' and not public.is_staff() then raise exception 'messaging.not_allowed'; end if;
  if c.kind = 'direct' then
    other := public.msg_other_member(p_conv, me);
    if not public.can_message(me, other) then raise exception 'messaging.not_allowed'; end if;
  end if;
  if c.kind <> 'support' and exists (select 1 from public.messaging_restrictions
                                      where profile_id = me and muted_until > now()) then
    raise exception 'messaging.muted';
  end if;

  -- Rate limits: bursts and media volume.
  if (select count(*) from public.messages where sender_id = me and created_at > now() - interval '10 seconds') >= 20 then
    raise exception 'messaging.rate_limited';
  end if;

  if p_kind = 'text' then
    if v_body is null then raise exception 'messaging.empty'; end if;
    if p_attachment_path is not null then raise exception 'messaging.invalid_attachment'; end if;
  elsif p_kind in ('image', 'video', 'audio', 'file') then
    if p_attachment_path is null
       or p_attachment_path !~ ('^' || p_conv::text || '/' || me::text || '/[A-Za-z0-9_-]{1,80}\.[a-z0-9]{1,8}$') then
      raise exception 'messaging.invalid_attachment';
    end if;
    -- Trust the stored object over client claims when Storage is present.
    if to_regclass('storage.objects') is not null then
      execute 'select metadata from storage.objects where bucket_id = $1 and name = $2'
        into obj_meta using 'chat-media', p_attachment_path;
      if obj_meta is null then raise exception 'messaging.invalid_attachment'; end if;
      p_attachment_mime := coalesce(obj_meta ->> 'mimetype', p_attachment_mime);
      p_attachment_size := coalesce((obj_meta ->> 'size')::bigint, p_attachment_size);
    end if;
    p_attachment_mime := lower(split_part(coalesce(p_attachment_mime, ''), ';', 1));
    if not public.msg_kind_accepts(p_kind, p_attachment_mime) then raise exception 'messaging.invalid_attachment'; end if;
    if p_attachment_size is null or p_attachment_size > public.msg_max_size(p_kind) then
      raise exception 'messaging.too_large';
    end if;
    if p_kind = 'audio' and coalesce(p_duration_ms, 0) > 300000 then raise exception 'messaging.too_long'; end if;
    if p_kind = 'video' and coalesce(p_duration_ms, 0) > 180000 then raise exception 'messaging.too_long'; end if;
    if (select count(*) from public.messages where sender_id = me and kind in ('image', 'video', 'audio', 'file')
          and created_at > now() - interval '1 hour') >= 60 then
      raise exception 'messaging.rate_limited';
    end if;
  else
    raise exception 'messaging.invalid_kind';
  end if;

  if p_reply_to is not null and not exists (select 1 from public.messages where id = p_reply_to and conversation_id = p_conv) then
    raise exception 'messaging.invalid_reply';
  end if;

  insert into public.messages (conversation_id, sender_id, kind, body, attachment_path, attachment_mime,
                               attachment_size, attachment_name, duration_ms, width, height, reply_to, client_id)
  values (p_conv, me, p_kind, v_body,
          case when p_kind = 'text' then null else p_attachment_path end,
          case when p_kind = 'text' then null else p_attachment_mime end,
          case when p_kind = 'text' then null else p_attachment_size end,
          case when p_kind = 'text' then null else left(p_attachment_name, 200) end,
          p_duration_ms, p_width, p_height, p_reply_to, p_client_id)
  returning * into m;

  update public.conversations set last_message_at = m.created_at where id = p_conv;
  insert into public.conversation_members (conversation_id, profile_id, last_read_at)
    values (p_conv, me, m.created_at)
  on conflict (conversation_id, profile_id) do update set last_read_at = excluded.last_read_at;
  return m;
end $$;

create or replace function public.edit_message(p_message uuid, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare
  m public.messages;
  v_body text := nullif(trim(coalesce(p_body, '')), '');
begin
  select * into m from public.messages where id = p_message;
  if not found or m.sender_id is distinct from auth.uid() or m.deleted_at is not null then
    raise exception 'messaging.not_allowed';
  end if;
  if m.kind <> 'text' or v_body is null then raise exception 'messaging.empty'; end if;
  if m.created_at < now() - interval '15 minutes' then raise exception 'messaging.edit_window'; end if;
  update public.messages set body = v_body, edited_at = now() where id = p_message;
end $$;

-- Returns the storage path to purge (the caller removes the object).
create or replace function public.delete_message(p_message uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  m public.messages;
begin
  select * into m from public.messages where id = p_message;
  if not found or m.sender_id is distinct from auth.uid() then raise exception 'messaging.not_allowed'; end if;
  update public.messages
     set deleted_at = now(), body = null, attachment_path = null, attachment_mime = null,
         attachment_size = null, attachment_name = null
   where id = p_message and deleted_at is null;
  return m.attachment_path;
end $$;

create or replace function public.react_to_message(p_message uuid, p_emoji text) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  conv uuid;
begin
  select conversation_id into conv from public.messages where id = p_message and deleted_at is null;
  if conv is null or not public.can_access_conversation(conv) then raise exception 'messaging.not_allowed'; end if;
  delete from public.message_reactions where message_id = p_message and profile_id = auth.uid() and emoji = p_emoji;
  if found then return false; end if;
  insert into public.message_reactions (message_id, profile_id, emoji) values (p_message, auth.uid(), p_emoji);
  return true;
end $$;

-- -----------------------------------------------------------------------------
-- Friendships & blocks
-- -----------------------------------------------------------------------------
-- Returns 'sent' | 'accepted' | 'already' | 'not_found' | 'self' | 'not_allowed'.
create or replace function public.request_friend(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  target uuid;
  f public.friendships;
  v text := nullif(trim(p_code), '');
begin
  if me is null then raise exception 'Not signed in'; end if;
  if not public.msg_is_approved_affiliate(me) then return 'not_allowed'; end if;
  if v is null then return 'not_found'; end if;
  select a.profile_id into target from public.affiliates a
   where a.deleted_at is null and a.status = 'approved'
     and (upper(a.code) = upper(v) or lower(a.slug::text) = lower(v))
   limit 1;
  if target is null then return 'not_found'; end if;
  if target = me then return 'self'; end if;
  if (select count(*) from public.friendships where requester_id = me and created_at > now() - interval '1 day') >= 30 then
    raise exception 'messaging.rate_limited';
  end if;
  -- A block is never revealed: the request just looks sent.
  if public.msg_is_blocked(me, target) then return 'sent'; end if;

  select * into f from public.friendships
   where least(requester_id, addressee_id) = least(me, target)
     and greatest(requester_id, addressee_id) = greatest(me, target);
  if found then
    if f.status = 'accepted' then return 'already'; end if;
    if f.status = 'pending' and f.addressee_id = me then
      update public.friendships set status = 'accepted', responded_at = now() where id = f.id;
      return 'accepted';
    end if;
    update public.friendships set requester_id = me, addressee_id = target, status = 'pending',
                                   created_at = now(), responded_at = null where id = f.id;
    return 'sent';
  end if;
  insert into public.friendships (requester_id, addressee_id) values (me, target);
  return 'sent';
end $$;

create or replace function public.respond_friend(p_friendship uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.friendships
     set status = case when p_accept then 'accepted' else 'declined' end, responded_at = now()
   where id = p_friendship and addressee_id = auth.uid() and status = 'pending';
  if not found then raise exception 'messaging.not_allowed'; end if;
end $$;

create or replace function public.remove_friend(p_other uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.friendships
   where least(requester_id, addressee_id) = least(auth.uid(), p_other)
     and greatest(requester_id, addressee_id) = greatest(auth.uid(), p_other);
end $$;

create or replace function public.block_profile(p_other uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_other = auth.uid() or public.msg_is_staff_profile(p_other) then raise exception 'messaging.not_allowed'; end if;
  insert into public.profile_blocks (blocker_id, blocked_id) values (auth.uid(), p_other) on conflict do nothing;
  perform public.remove_friend(p_other);
end $$;

create or replace function public.unblock_profile(p_other uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.profile_blocks where blocker_id = auth.uid() and blocked_id = p_other
$$;

-- -----------------------------------------------------------------------------
-- Read models (names are only exposed to people who share a conversation)
-- -----------------------------------------------------------------------------
create or replace function public.my_conversations() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  my_created timestamptz;
begin
  if me is null then return '[]'::jsonb; end if;
  select created_at into my_created from public.profiles where id = me;
  return coalesce((
    select jsonb_agg(row_to_json(x)::jsonb order by x.pinned desc, x.last_message_at desc nulls last)
    from (
      select c.id, c.kind, c.last_message_at,
             (c.kind = 'announcements') as pinned,
             case when c.kind = 'direct' then public.msg_other_member(c.id, me) end as peer_id,
             case when c.kind = 'direct' then public.msg_display_name(public.msg_other_member(c.id, me)) end as peer_name,
             case when c.kind = 'direct' then public.msg_relationship(me, public.msg_other_member(c.id, me)) end as relationship,
             case when c.kind = 'direct' then public.can_message(me, public.msg_other_member(c.id, me)) else
               (c.kind = 'support' or public.is_staff()) end as can_send,
             (select jsonb_build_object('kind', m.kind, 'body', left(m.body, 140), 'senderId', m.sender_id,
                                        'deleted', m.deleted_at is not null, 'createdAt', m.created_at)
                from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message,
             (select count(*) from public.messages m
               where m.conversation_id = c.id and m.deleted_at is null and m.sender_id is distinct from me
                 and m.created_at > coalesce(cm.last_read_at, my_created)) as unread
        from public.conversations c
        left join public.conversation_members cm on cm.conversation_id = c.id and cm.profile_id = me
       where (c.kind = 'direct' and cm.profile_id is not null)
          or (c.kind = 'support' and c.subject_profile_id = me)
          or (c.kind = 'announcements' and (public.is_staff() or public.msg_is_approved_affiliate(me)))
    ) x), '[]'::jsonb);
end $$;

create or replace function public.my_unread_count() returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum((e ->> 'unread')::int), 0)::int from jsonb_array_elements(public.my_conversations()) e
$$;

create or replace function public.my_contacts() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null then return '{}'::jsonb; end if;
  return jsonb_build_object(
    'canUseDirect', public.msg_is_approved_affiliate(me) or public.is_staff(),
    'sponsor', (select jsonb_build_object('profileId', s.profile_id, 'name', public.msg_display_name(s.profile_id),
                                          'canMessage', public.can_message(me, s.profile_id))
                  from public.affiliates a join public.affiliates s on s.id = a.sponsor_id
                 where a.profile_id = me and a.deleted_at is null and s.deleted_at is null),
    'recruits', coalesce((select jsonb_agg(jsonb_build_object('profileId', r.profile_id, 'name', public.msg_display_name(r.profile_id),
                                          'canMessage', public.can_message(me, r.profile_id)) order by r.created_at desc)
                  from public.affiliates a join public.affiliates r on r.sponsor_id = a.id
                 where a.profile_id = me and a.deleted_at is null and r.deleted_at is null), '[]'::jsonb),
    'friends', coalesce((select jsonb_agg(jsonb_build_object('profileId', o.id, 'name', public.msg_display_name(o.id),
                                          'canMessage', public.can_message(me, o.id)) order by f.responded_at desc)
                  from public.friendships f
                  join public.profiles o on o.id = case when f.requester_id = me then f.addressee_id else f.requester_id end
                 where f.status = 'accepted' and me in (f.requester_id, f.addressee_id) and o.deleted_at is null), '[]'::jsonb),
    'incoming', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'profileId', f.requester_id,
                                          'name', public.msg_display_name(f.requester_id), 'createdAt', f.created_at) order by f.created_at desc)
                  from public.friendships f
                 where f.addressee_id = me and f.status = 'pending'
                   and not public.msg_is_blocked(me, f.requester_id)), '[]'::jsonb),
    'outgoing', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'profileId', f.addressee_id,
                                          'name', public.msg_display_name(f.addressee_id), 'createdAt', f.created_at) order by f.created_at desc)
                  from public.friendships f
                 where f.requester_id = me and f.status = 'pending'), '[]'::jsonb),
    'blocked', coalesce((select jsonb_agg(jsonb_build_object('profileId', b.blocked_id, 'name', public.msg_display_name(b.blocked_id)))
                  from public.profile_blocks b where b.blocker_id = me), '[]'::jsonb)
  );
end $$;

-- Display names for everyone who wrote in a conversation the caller can read.
create or replace function public.conversation_participants(p_conv uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_access_conversation(p_conv) then raise exception 'messaging.not_allowed'; end if;
  return coalesce((
    select jsonb_object_agg(p.id, jsonb_build_object('name', public.msg_display_name(p.id),
                                                     'staff', p.role in ('super_admin', 'admin')))
      from public.profiles p
     where p.id in (select sender_id from public.messages where conversation_id = p_conv
                    union select profile_id from public.conversation_members where conversation_id = p_conv
                    union select subject_profile_id from public.conversations where id = p_conv)
  ), '{}'::jsonb);
end $$;

-- Staff: shared Support inbox with each staff member's own read marker.
create or replace function public.staff_support_inbox() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  return coalesce((
    select jsonb_agg(row_to_json(x)::jsonb order by x.last_message_at desc nulls last)
    from (
      select c.id, c.subject_profile_id as subject_id, public.msg_display_name(c.subject_profile_id) as subject_name,
             (select a.status from public.affiliates a where a.profile_id = c.subject_profile_id) as subject_status,
             c.last_message_at,
             (select jsonb_build_object('kind', m.kind, 'body', left(m.body, 140), 'senderId', m.sender_id,
                                        'deleted', m.deleted_at is not null, 'createdAt', m.created_at)
                from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message,
             (select count(*) from public.messages m
               where m.conversation_id = c.id and m.deleted_at is null and m.sender_id = c.subject_profile_id
                 and m.created_at > coalesce(cm.last_read_at, '-infinity'::timestamptz)) as unread
        from public.conversations c
        left join public.conversation_members cm on cm.conversation_id = c.id and cm.profile_id = me
       where c.kind = 'support' and c.last_message_at is not null
    ) x), '[]'::jsonb);
end $$;

-- -----------------------------------------------------------------------------
-- Reports & moderation (audited)
-- -----------------------------------------------------------------------------
create or replace function public.report_message(p_message uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  m public.messages;
begin
  select * into m from public.messages where id = p_message;
  if not found or not public.can_access_conversation(m.conversation_id) or m.sender_id = auth.uid() then
    raise exception 'messaging.not_allowed';
  end if;
  insert into public.message_reports (message_id, reporter_id, reason)
    values (p_message, auth.uid(), left(trim(p_reason), 1000))
  on conflict (message_id, reporter_id) do nothing;
end $$;

create or replace function public.staff_list_reports() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', r.id, 'status', r.status, 'reason', r.reason, 'createdAt', r.created_at,
             'reporterName', public.msg_display_name(r.reporter_id),
             'senderId', m.sender_id, 'senderName', public.msg_display_name(m.sender_id),
             'conversationKind', c.kind, 'reviewedAt', r.reviewed_at) order by (r.status in ('open', 'reviewing')) desc, r.created_at desc)
      from public.message_reports r
      join public.messages m on m.id = r.message_id
      join public.conversations c on c.id = m.conversation_id
  ), '[]'::jsonb);
end $$;

-- Opens the context of a reported message (±20 messages). Audited.
create or replace function public.staff_open_report(p_report uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.message_reports;
  m public.messages;
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  select * into r from public.message_reports where id = p_report;
  if not found then raise exception 'Report not found'; end if;
  select * into m from public.messages where id = r.message_id;
  insert into public.audit_logs (actor_id, action, entity, entity_id, reason)
    values (auth.uid(), 'message_report.open', 'message_report', p_report::text, r.reason);
  update public.message_reports set status = 'reviewing' where id = p_report and status = 'open';
  return jsonb_build_object(
    'reportedId', m.id,
    'participants', coalesce((select jsonb_object_agg(p.id, jsonb_build_object('name', public.msg_display_name(p.id),
                                                     'staff', p.role in ('super_admin', 'admin')))
                       from public.profiles p where p.id in (select sender_id from public.messages where conversation_id = m.conversation_id)), '{}'::jsonb),
    'messages', coalesce((select jsonb_agg(row_to_json(x)::jsonb order by x.created_at) from (
        (select * from public.messages where conversation_id = m.conversation_id and created_at <= m.created_at
          order by created_at desc limit 21)
        union
        (select * from public.messages where conversation_id = m.conversation_id and created_at > m.created_at
          order by created_at asc limit 20)) x), '[]'::jsonb));
end $$;

-- p_action: 'dismiss' | 'delete_message' | 'mute_sender'. Returns the storage path to purge, if any.
create or replace function public.staff_moderate_report(p_report uuid, p_action text, p_reason text default null) returns text
language plpgsql security definer set search_path = public as $$
declare
  r public.message_reports;
  m public.messages;
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  select * into r from public.message_reports where id = p_report;
  if not found then raise exception 'Report not found'; end if;
  select * into m from public.messages where id = r.message_id;
  if p_action = 'dismiss' then
    update public.message_reports set status = 'dismissed', reviewed_by = auth.uid(), reviewed_at = now() where id = p_report;
  elsif p_action = 'delete_message' then
    update public.messages set deleted_at = now(), body = null, attachment_path = null, attachment_mime = null,
                               attachment_size = null, attachment_name = null
     where id = m.id and deleted_at is null;
    update public.message_reports set status = 'actioned', reviewed_by = auth.uid(), reviewed_at = now()
     where message_id = m.id and status in ('open', 'reviewing');
  elsif p_action = 'mute_sender' then
    if m.sender_id is null or public.msg_is_staff_profile(m.sender_id) then raise exception 'messaging.not_allowed'; end if;
    insert into public.messaging_restrictions (profile_id, muted_until, reason, created_by)
      values (m.sender_id, now() + interval '7 days', p_reason, auth.uid())
    on conflict (profile_id) do update set muted_until = excluded.muted_until, reason = excluded.reason,
                                           created_by = excluded.created_by, created_at = now();
    update public.message_reports set status = 'actioned', reviewed_by = auth.uid(), reviewed_at = now() where id = p_report;
  else
    raise exception 'Unknown action';
  end if;
  insert into public.audit_logs (actor_id, action, entity, entity_id, before, reason)
    values (auth.uid(), 'message_report.' || p_action, 'message_report', p_report::text,
            jsonb_build_object('message_id', m.id, 'sender_id', m.sender_id), p_reason);
  return case when p_action = 'delete_message' then m.attachment_path end;
end $$;

-- -----------------------------------------------------------------------------
-- Row Level Security — read-only for clients; writes go through the functions.
-- -----------------------------------------------------------------------------
alter table public.friendships enable row level security;
alter table public.profile_blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_reports enable row level security;
alter table public.messaging_restrictions enable row level security;

revoke all on public.friendships, public.profile_blocks, public.conversations, public.conversation_members,
              public.messages, public.message_reactions, public.message_reports, public.messaging_restrictions
  from anon, authenticated;
grant select on public.friendships, public.profile_blocks, public.conversations, public.conversation_members,
                public.messages, public.message_reactions, public.message_reports, public.messaging_restrictions
  to authenticated;

create policy friendships_party_read on public.friendships for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));
create policy profile_blocks_own_read on public.profile_blocks for select to authenticated
  using (blocker_id = auth.uid());
create policy conversations_read on public.conversations for select to authenticated
  using (public.can_access_conversation(id));
create policy conversation_members_read on public.conversation_members for select to authenticated
  using (profile_id = auth.uid()
         or exists (select 1 from public.conversations c where c.id = conversation_id and c.kind = 'direct'
                    and public.can_access_conversation(c.id)));
create policy messages_read on public.messages for select to authenticated
  using (public.can_access_conversation(conversation_id));
create policy message_reactions_read on public.message_reactions for select to authenticated
  using (exists (select 1 from public.messages m where m.id = message_id and public.can_access_conversation(m.conversation_id)));
create policy message_reports_read on public.message_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_staff());
create policy messaging_restrictions_read on public.messaging_restrictions for select to authenticated
  using (profile_id = auth.uid() or public.is_staff());

-- Internal helpers are not part of the API surface.
revoke execute on function
  public.msg_is_staff_profile(uuid), public.msg_is_approved_affiliate(uuid), public.msg_is_blocked(uuid, uuid),
  public.msg_relationship(uuid, uuid), public.msg_display_name(uuid), public.msg_other_member(uuid, uuid),
  public.msg_kind_accepts(text, text), public.msg_max_size(text)
  from anon, authenticated, public;

revoke execute on function
  public.can_message(uuid, uuid), public.can_access_conversation(uuid),
  public.open_direct_conversation(uuid), public.open_support_conversation(uuid),
  public.announcements_conversation_id(), public.mark_conversation_read(uuid),
  public.send_message(uuid, text, text, text, text, bigint, text, int, int, int, uuid, uuid),
  public.edit_message(uuid, text), public.delete_message(uuid), public.react_to_message(uuid, text),
  public.request_friend(text), public.respond_friend(uuid, boolean), public.remove_friend(uuid),
  public.block_profile(uuid), public.unblock_profile(uuid),
  public.my_conversations(), public.my_unread_count(), public.my_contacts(), public.conversation_participants(uuid),
  public.staff_support_inbox(), public.report_message(uuid, text), public.staff_list_reports(),
  public.staff_open_report(uuid), public.staff_moderate_report(uuid, text, text)
  from anon, public;
grant execute on function
  public.can_message(uuid, uuid), public.can_access_conversation(uuid),
  public.open_direct_conversation(uuid), public.open_support_conversation(uuid),
  public.announcements_conversation_id(), public.mark_conversation_read(uuid),
  public.send_message(uuid, text, text, text, text, bigint, text, int, int, int, uuid, uuid),
  public.edit_message(uuid, text), public.delete_message(uuid), public.react_to_message(uuid, text),
  public.request_friend(text), public.respond_friend(uuid, boolean), public.remove_friend(uuid),
  public.block_profile(uuid), public.unblock_profile(uuid),
  public.my_conversations(), public.my_unread_count(), public.my_contacts(), public.conversation_participants(uuid),
  public.staff_support_inbox(), public.report_message(uuid, text), public.staff_list_reports(),
  public.staff_open_report(uuid), public.staff_moderate_report(uuid, text, text)
  to authenticated;

-- -----------------------------------------------------------------------------
-- Realtime: new messages / reactions / read markers / friend requests.
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['messages', 'message_reactions', 'conversation_members', 'friendships'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Typing indicators: private broadcast channel "conv:{id}".
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute $p$
      create policy messaging_typing_read on realtime.messages for select to authenticated
        using (realtime.messages.extension = 'broadcast' and realtime.topic() like 'conv:%'
               and public.can_access_conversation(public.msg_uuid_or_null(substring(realtime.topic() from 6))))$p$;
    execute $p$
      create policy messaging_typing_write on realtime.messages for insert to authenticated
        with check (realtime.messages.extension = 'broadcast' and realtime.topic() like 'conv:%'
                    and public.can_access_conversation(public.msg_uuid_or_null(substring(realtime.topic() from 6))))$p$;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Storage: private bucket, {conversation}/{sender}/{file}.
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    execute $s$
      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('chat-media', 'chat-media', false, 52428800, array[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav',
        'application/pdf'])
      on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
                                     allowed_mime_types = excluded.allowed_mime_types$s$;
    execute $p$
      create policy chat_media_upload on storage.objects for insert to authenticated
        with check (bucket_id = 'chat-media'
                    and (storage.foldername(name))[2] = auth.uid()::text
                    and public.can_access_conversation(public.msg_uuid_or_null((storage.foldername(name))[1])))$p$;
    execute $p$
      create policy chat_media_read on storage.objects for select to authenticated
        using (bucket_id = 'chat-media'
               and public.can_access_conversation(public.msg_uuid_or_null((storage.foldername(name))[1])))$p$;
    execute $p$
      create policy chat_media_delete_own on storage.objects for delete to authenticated
        using (bucket_id = 'chat-media' and (storage.foldername(name))[2] = auth.uid()::text)$p$;
  end if;
end $$;
