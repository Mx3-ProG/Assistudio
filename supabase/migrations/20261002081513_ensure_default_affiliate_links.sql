-- Every affiliate must leave provisioning with a usable tracking link.  The
-- trigger covers every creation path (Auth trigger, application fallback,
-- imports and staff-created accounts), while the backfill repairs existing
-- affiliates that predate this invariant.
create or replace function public.ensure_default_affiliate_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.affiliate_links (affiliate_id, name, is_default)
  values (new.id, 'Default', true)
  on conflict do nothing;
  return new;
end;
$$;

revoke execute on function public.ensure_default_affiliate_link() from public, anon, authenticated;

drop trigger if exists affiliates_ensure_default_link on public.affiliates;
create trigger affiliates_ensure_default_link
  after insert on public.affiliates
  for each row execute function public.ensure_default_affiliate_link();

insert into public.affiliate_links (affiliate_id, name, is_default)
select a.id, 'Default', true
  from public.affiliates a
 where a.deleted_at is null
   and not exists (
     select 1
       from public.affiliate_links l
      where l.affiliate_id = a.id
        and l.is_default
   )
on conflict do nothing;
