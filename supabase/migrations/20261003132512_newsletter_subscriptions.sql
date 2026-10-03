-- Public newsletter sign-ups are written by a server action with the service
-- role. Browsers never receive direct write access to this contact data.
create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  locale text not null default 'en',
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  source text not null default 'marketing',
  consent_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists newsletter_subscriptions_updated_at on public.newsletter_subscriptions;
create trigger newsletter_subscriptions_updated_at
  before update on public.newsletter_subscriptions
  for each row execute function public.set_updated_at();

alter table public.newsletter_subscriptions enable row level security;
revoke all on table public.newsletter_subscriptions from anon, authenticated;
grant select on table public.newsletter_subscriptions to authenticated;
grant all on table public.newsletter_subscriptions to service_role;

drop policy if exists newsletter_subscriptions_staff_read on public.newsletter_subscriptions;
create policy newsletter_subscriptions_staff_read
  on public.newsletter_subscriptions
  for select to authenticated
  using (public.is_staff());
