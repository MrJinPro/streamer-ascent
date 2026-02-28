
create or replace function public.chat_sync_support_memberships(
  p_user_id uuid default auth.uid()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_role text;
  v_synced integer := 0;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if auth.uid() is distinct from v_uid and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  v_role := public.chat_resolve_role(v_uid)::text;
  if v_role not in ('support', 'admin', 'owner') then
    return 0;
  end if;

  perform public.chat_ensure_profile_exists(v_uid);

  with upserted as (
    insert into public.chat_thread_members(thread_id, user_id, member_role, is_active)
    select t.id, v_uid, 'member'::public.chat_member_role_t, true
    from public.chat_threads t
    where t.kind = 'support'
    on conflict (thread_id, user_id)
    do update set is_active = true
    returning 1
  )
  select count(*) into v_synced from upserted;

  return coalesce(v_synced, 0);
end;
$$;

grant execute on function public.chat_sync_support_memberships(uuid) to authenticated;