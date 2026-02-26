-- Backfill legacy app_role from roles.slug and harden chat member resolution

create or replace function public.safe_app_role_from_text(p_role text)
returns public.app_role
language plpgsql
stable
set search_path = public
as $$
declare
  v_role text := lower(btrim(coalesce(p_role, '')));
  v_fallback text;
  v_out public.app_role;
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
      and t.typname = 'app_role'
      and e.enumlabel = v_role
  ) then
    execute format('select %L::public.app_role', v_role) into v_out;
    return v_out;
  end if;

  select e.enumlabel
  into v_fallback
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  join pg_enum e on e.enumtypid = t.oid
  where n.nspname = 'public'
    and t.typname = 'app_role'
    and e.enumlabel = 'streamer'
  limit 1;

  if v_fallback is null then
    select e.enumlabel
    into v_fallback
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
      and t.typname = 'app_role'
    order by e.enumsortorder
    limit 1;
  end if;

  execute format('select %L::public.app_role', coalesce(v_fallback, 'streamer')) into v_out;
  return v_out;
end;
$$;

create or replace function public.map_role_slug_to_app_role(p_slug text)
returns public.app_role
language plpgsql
stable
set search_path = public
as $$
declare
  v_slug text := lower(btrim(coalesce(p_slug, '')));
begin
  return case v_slug
    when 'system_owner' then public.safe_app_role_from_text('owner')
    when 'owner' then public.safe_app_role_from_text('owner')
    when 'architect' then public.safe_app_role_from_text('admin')
    when 'admin' then public.safe_app_role_from_text('admin')
    when 'engineer' then public.safe_app_role_from_text('developer')
    when 'developer' then public.safe_app_role_from_text('developer')
    when 'head_mentor' then public.safe_app_role_from_text('senior_curator')
    when 'senior_curator' then public.safe_app_role_from_text('senior_curator')
    when 'agency_manager' then public.safe_app_role_from_text('manager')
    when 'manager' then public.safe_app_role_from_text('manager')
    when 'mentor' then public.safe_app_role_from_text('curator')
    when 'curator' then public.safe_app_role_from_text('curator')
    when 'moderator' then public.safe_app_role_from_text('moderator')
    when 'support' then public.safe_app_role_from_text('support')
    when 'investor_viewer' then public.safe_app_role_from_text('investor')
    when 'investor_pro' then public.safe_app_role_from_text('investor')
    when 'board' then public.safe_app_role_from_text('investor')
    when 'investor' then public.safe_app_role_from_text('investor')
    else public.safe_app_role_from_text('streamer')
  end;
end;
$$;

update public.user_roles ur
set role = public.map_role_slug_to_app_role(r.slug)
from public.roles r
where ur.role_id = r.id
  and ur.role is distinct from public.map_role_slug_to_app_role(r.slug);

create or replace function public.chat_is_support_role(p_user_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    left join public.roles r on r.id = ur.role_id
    where ur.user_id = p_user_id
      and (
        ur.role = 'support'
        or lower(coalesce(r.slug, '')) = 'support'
      )
  );
$$;

create or replace function public.chat_resolve_role(p_user_id uuid)
returns public.app_role
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select coalesce(
        case
          when ur.role_id is not null then public.map_role_slug_to_app_role(r.slug)
          else ur.role
        end,
        public.safe_app_role_from_text('streamer')
      )
      from public.user_roles ur
      left join public.roles r on r.id = ur.role_id
      where ur.user_id = p_user_id
      order by case coalesce(
        case
          when ur.role_id is not null then public.map_role_slug_to_app_role(r.slug)
          else ur.role
        end,
        public.safe_app_role_from_text('streamer')
      )::text
        when 'owner' then 1
        when 'admin' then 2
        when 'developer' then 3
        when 'senior_curator' then 4
        when 'manager' then 5
        when 'curator' then 6
        when 'moderator' then 7
        when 'support' then 8
        when 'investor' then 9
        else 10
      end
      limit 1
    ),
    public.safe_app_role_from_text('streamer')
  );
$$;

create or replace function public.chat_resolve_member_user_id(p_input_user_id uuid)
returns uuid
language plpgsql
stable
set search_path = public
as $$
declare
  v_resolved uuid;
begin
  if p_input_user_id is null then
    return null;
  end if;

  if exists (select 1 from public.profiles p where p.user_id = p_input_user_id) then
    return p_input_user_id;
  end if;

  select u.supabase_uid
  into v_resolved
  from public.users u
  where u.id = p_input_user_id
     or u.supabase_uid = p_input_user_id
  limit 1;

  if v_resolved is not null and exists (select 1 from public.profiles p where p.user_id = v_resolved) then
    return v_resolved;
  end if;

  return null;
end;
$$;

create or replace function public.chat_ensure_profile_exists(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.profiles (user_id, email, display_name)
  select
    au.id,
    lower(au.email),
    coalesce(
      nullif(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(au.raw_user_meta_data ->> 'name'), ''),
      split_part(coalesce(au.email, ''), '@', 1),
      'Пользователь'
    )
  from auth.users au
  where au.id = p_user_id
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.chat_get_or_create_direct_thread(p_target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_target_user_id uuid;
  v_thread_id uuid;
  v_direct_key text;
  v_u1 text;
  v_u2 text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public.chat_ensure_profile_exists(v_uid);

  v_target_user_id := public.chat_resolve_member_user_id(p_target_user_id);
  if v_target_user_id is null then
    raise exception 'target_user_not_found';
  end if;

  perform public.chat_ensure_profile_exists(v_target_user_id);

  if not exists (select 1 from public.profiles p where p.user_id = v_uid) then
    raise exception 'sender_profile_not_found';
  end if;

  if not exists (select 1 from public.profiles p where p.user_id = v_target_user_id) then
    raise exception 'target_profile_not_found';
  end if;

  if v_uid = v_target_user_id then
    raise exception 'direct_chat_not_allowed';
  end if;

  if not public.chat_user_can_dm(v_uid, v_target_user_id) then
    raise exception 'direct_chat_not_allowed';
  end if;

  v_u1 := least(v_uid::text, v_target_user_id::text);
  v_u2 := greatest(v_uid::text, v_target_user_id::text);
  v_direct_key := v_u1 || ':' || v_u2;

  insert into public.chat_threads(kind, direct_key, created_by)
  values ('direct', v_direct_key, v_uid)
  on conflict (direct_key) do update set updated_at = now()
  returning id into v_thread_id;

  if v_thread_id is null then
    select id into v_thread_id
    from public.chat_threads
    where direct_key = v_direct_key
    limit 1;
  end if;

  insert into public.chat_thread_members(thread_id, user_id, member_role, is_active)
  values
    (v_thread_id, v_uid, 'member', true),
    (v_thread_id, v_target_user_id, 'member', true)
  on conflict (thread_id, user_id)
  do update set is_active = true;

  return v_thread_id;
end;
$$;

create or replace function public.chat_get_or_create_support_thread()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_thread_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public.chat_ensure_profile_exists(v_uid);

  select t.id
  into v_thread_id
  from public.chat_threads t
  join public.chat_thread_members m on m.thread_id = t.id
  where t.kind = 'support'
    and m.user_id = v_uid
    and m.is_active = true
  order by t.created_at desc
  limit 1;

  if v_thread_id is null then
    insert into public.chat_threads(kind, title, created_by)
    values ('support', 'Техподдержка NovaBoost', v_uid)
    returning id into v_thread_id;

    insert into public.chat_thread_members(thread_id, user_id, member_role, is_active)
    values (v_thread_id, v_uid, 'member', true)
    on conflict (thread_id, user_id) do update set is_active = true;

    insert into public.chat_thread_members(thread_id, user_id, member_role, is_active)
    select v_thread_id, ur.user_id, 'member'::public.chat_member_role_t, true
    from public.user_roles ur
    left join public.roles r on r.id = ur.role_id
    join public.profiles p on p.user_id = ur.user_id
    where public.map_role_slug_to_app_role(coalesce(r.slug, ur.role::text))::text in ('support', 'admin', 'owner')
    on conflict (thread_id, user_id) do update set is_active = true;
  end if;

  return v_thread_id;
end;
$$;

create or replace function public.chat_create_group(p_title text, p_member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_thread_id uuid;
  v_member_id uuid;
  v_resolved_member uuid;
  v_all_members uuid[];
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'group_title_required';
  end if;

  perform public.chat_ensure_profile_exists(v_uid);

  v_all_members := array(select distinct unnest(array_append(coalesce(p_member_ids, '{}'::uuid[]), v_uid)));

  insert into public.chat_threads(kind, title, created_by)
  values ('group', btrim(p_title), v_uid)
  returning id into v_thread_id;

  foreach v_member_id in array v_all_members loop
    v_resolved_member := public.chat_resolve_member_user_id(v_member_id);

    if v_resolved_member is null then
      continue;
    end if;

    perform public.chat_ensure_profile_exists(v_resolved_member);

    if not exists (select 1 from public.profiles p where p.user_id = v_resolved_member) then
      continue;
    end if;

    insert into public.chat_thread_members(thread_id, user_id, member_role, is_active)
    values (
      v_thread_id,
      v_resolved_member,
      case when v_resolved_member = v_uid then 'admin'::public.chat_member_role_t else 'member'::public.chat_member_role_t end,
      true
    )
    on conflict (thread_id, user_id) do update set is_active = true;
  end loop;

  return v_thread_id;
end;
$$;

grant execute on function public.chat_get_or_create_direct_thread(uuid) to authenticated;
grant execute on function public.chat_ensure_profile_exists(uuid) to authenticated;
grant execute on function public.chat_get_or_create_support_thread() to authenticated;
grant execute on function public.chat_create_group(text, uuid[]) to authenticated;
