-- The outbox gives up on an email after 5 failed attempts. After a provider
-- outage (e.g. a suspended Resend account) those emails would never leave.
-- Staff can put them back in the queue once the provider works again
-- (Admin → Finance → "Retry failed emails"). Audited.

create or replace function public.staff_requeue_failed_emails() returns int
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  update public.email_events set status = 'queued', attempts = 0
   where status = 'failed';
  get diagnostics v_count = row_count;
  if v_count > 0 then
    insert into public.audit_logs (actor_id, action, entity, entity_id, after, reason)
      values (auth.uid(), 'email.requeue_failed', 'email_events', null,
              jsonb_build_object('count', v_count), 'Retry failed emails after a provider outage');
  end if;
  return v_count;
end $$;

revoke execute on function public.staff_requeue_failed_emails() from anon, public;
grant execute on function public.staff_requeue_failed_emails() to authenticated;
