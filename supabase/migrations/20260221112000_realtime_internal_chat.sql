do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'chat_thread_kind_t'
      and n.nspname = 'public'
  ) then
    create type public.chat_thread_kind_t as enum ('direct', 'group', 'support');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'chat_member_role_t'
      and n.nspname = 'public'
  ) then
    create type public.chat_member_role_t as enum ('member', 'admin');
  end if;
end $$;

create table if not exists public.curator_streamer_assignments (
  id uuid primary key default gen_random_uuid(),
  curator_user_id uuid not null references public.profiles(user_id) on delete cascade,
  streamer_user_id uuid not null references public.profiles(user_id) on delete cascade,
  assigned_by uuid references public.profiles(user_id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(curator_user_id, streamer_user_id)
);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  kind public.chat_thread_kind_t not null default 'direct',
  title text,
  direct_key text,
  created_by uuid references public.profiles(user_id) on delete set null,
  last_message_text text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean not null default false,
  unique(direct_key)
);

create table if not exists public.chat_thread_members (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  member_role public.chat_member_role_t not null default 'member',
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  is_active boolean not null default true,
  unique(thread_id, user_id)
);

create table if not exists public.chat_messages_internal (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(user_id) on delete cascade,
  message_text text not null,
  metadata jsonb not null default '{}'::jsonb,
  excluded_user_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.chat_message_exclusions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages_internal(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(message_id, user_id)
);

create table if not exists public.chat_message_receipts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages_internal(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(user_id) on delete cascade,
  delivered_at timestamptz not null default now(),
  read_at timestamptz,
  unique(message_id, recipient_user_id)
);

create index if not exists idx_chat_threads_last_message_at on public.chat_threads(last_message_at desc nulls last);
create index if not exists idx_chat_thread_members_user on public.chat_thread_members(user_id, is_active);
create index if not exists idx_chat_messages_thread_created on public.chat_messages_internal(thread_id, created_at);
create index if not exists idx_chat_receipts_recipient_read on public.chat_message_receipts(recipient_user_id, read_at);
create index if not exists idx_curator_streamer_active on public.curator_streamer_assignments(curator_user_id, streamer_user_id, active);

create or replace function public.chat_is_support_role(p_user_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_user_id
      and ur.role = 'support'
  );
$$;

create or replace function public.chat_resolve_role(p_user_id uuid)
returns public.app_role
language plpgsql
stable
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  select ur.role
  into v_role
  from public.user_roles ur
  where ur.user_id = p_user_id
  order by case ur.role
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
  limit 1;

  return coalesce(v_role, 'streamer'::public.app_role);
end;
$$;

create or replace function public.chat_user_can_dm(p_sender uuid, p_target uuid)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  sender_role public.app_role;
  target_role public.app_role;
begin
  if p_sender is null or p_target is null or p_sender = p_target then
    return false;
  end if;

  if public.is_admin() then
    return true;
  end if;

  sender_role := public.chat_resolve_role(p_sender);
  target_role := public.chat_resolve_role(p_target);

  if sender_role = 'support' or target_role = 'support' then
    return true;
  end if;

  if sender_role = 'streamer' and target_role = 'streamer' then
    return true;
  end if;

  if (sender_role = 'curator' and target_role = 'streamer')
     or (sender_role = 'streamer' and target_role = 'curator') then
    return exists (
      select 1
      from public.curator_streamer_assignments csa
      where csa.active = true
        and (
          (csa.curator_user_id = p_sender and csa.streamer_user_id = p_target)
          or
          (csa.curator_user_id = p_target and csa.streamer_user_id = p_sender)
        )
    );
  end if;

  return true;
end;
$$;

create or replace function public.chat_touch_thread_last_message()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.chat_threads
  set
    last_message_at = new.created_at,
    last_message_text = new.message_text,
    updated_at = now()
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists trg_chat_touch_thread_last_message on public.chat_messages_internal;
create trigger trg_chat_touch_thread_last_message
after insert on public.chat_messages_internal
for each row execute function public.chat_touch_thread_last_message();

create or replace function public.chat_get_or_create_direct_thread(p_target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_thread_id uuid;
  v_direct_key text;
  v_u1 text;
  v_u2 text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if not public.chat_user_can_dm(v_uid, p_target_user_id) then
    raise exception 'direct_chat_not_allowed';
  end if;

  v_u1 := least(v_uid::text, p_target_user_id::text);
  v_u2 := greatest(v_uid::text, p_target_user_id::text);
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
    (v_thread_id, p_target_user_id, 'member', true)
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
    where ur.role in ('support', 'admin', 'owner')
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
  v_all_members uuid[];
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'group_title_required';
  end if;

  v_all_members := array(select distinct unnest(array_append(coalesce(p_member_ids, '{}'::uuid[]), v_uid)));

  insert into public.chat_threads(kind, title, created_by)
  values ('group', btrim(p_title), v_uid)
  returning id into v_thread_id;

  foreach v_member_id in array v_all_members loop
    insert into public.chat_thread_members(thread_id, user_id, member_role, is_active)
    values (
      v_thread_id,
      v_member_id,
      case when v_member_id = v_uid then 'admin'::public.chat_member_role_t else 'member'::public.chat_member_role_t end,
      true
    )
    on conflict (thread_id, user_id) do update set is_active = true;
  end loop;

  return v_thread_id;
end;
$$;

create or replace function public.chat_send_message(
  p_thread_id uuid,
  p_text text,
  p_excluded_user_ids uuid[] default '{}'::uuid[]
)
returns public.chat_messages_internal
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_thread public.chat_threads;
  v_message public.chat_messages_internal;
  v_target uuid;
  v_valid_excluded uuid[];
  v_other_user uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if p_text is null or btrim(p_text) = '' then
    raise exception 'empty_message';
  end if;

  select * into v_thread
  from public.chat_threads
  where id = p_thread_id;

  if v_thread.id is null then
    raise exception 'thread_not_found';
  end if;

  if not exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = p_thread_id
      and m.user_id = v_uid
      and m.is_active = true
  ) then
    raise exception 'access_denied';
  end if;

  if v_thread.kind = 'direct' then
    select m.user_id
    into v_other_user
    from public.chat_thread_members m
    where m.thread_id = p_thread_id
      and m.user_id <> v_uid
      and m.is_active = true
    limit 1;

    if v_other_user is not null and not public.chat_user_can_dm(v_uid, v_other_user) then
      raise exception 'direct_chat_not_allowed';
    end if;
  end if;

  v_valid_excluded := array(
    select distinct x
    from unnest(coalesce(p_excluded_user_ids, '{}'::uuid[])) as x
    where x <> v_uid
      and exists (
        select 1
        from public.chat_thread_members m
        where m.thread_id = p_thread_id
          and m.user_id = x
          and m.is_active = true
      )
  );

  insert into public.chat_messages_internal(thread_id, sender_user_id, message_text, excluded_user_ids)
  values (p_thread_id, v_uid, btrim(p_text), coalesce(v_valid_excluded, '{}'::uuid[]))
  returning * into v_message;

  insert into public.chat_message_exclusions(message_id, user_id)
  select v_message.id, excluded_uid
  from unnest(coalesce(v_valid_excluded, '{}'::uuid[])) as excluded_uid
  on conflict (message_id, user_id) do nothing;

  insert into public.chat_message_receipts(message_id, recipient_user_id, delivered_at)
  select v_message.id, m.user_id, now()
  from public.chat_thread_members m
  where m.thread_id = p_thread_id
    and m.user_id <> v_uid
    and m.is_active = true
    and not (m.user_id = any(coalesce(v_valid_excluded, '{}'::uuid[])))
  on conflict (message_id, recipient_user_id) do nothing;

  return v_message;
end;
$$;

create or replace function public.chat_mark_thread_read(p_thread_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_count integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  update public.chat_message_receipts r
  set read_at = now()
  from public.chat_messages_internal m
  where r.message_id = m.id
    and m.thread_id = p_thread_id
    and r.recipient_user_id = v_uid
    and r.read_at is null;

  get diagnostics v_count = row_count;

  update public.chat_thread_members
  set last_read_at = now()
  where thread_id = p_thread_id
    and user_id = v_uid;

  return v_count;
end;
$$;

create or replace function public.chat_get_unread_counts()
returns table(thread_id uuid, unread_count bigint)
language sql
security definer
set search_path = public
as $$
  select m.thread_id, count(*)::bigint as unread_count
  from public.chat_message_receipts r
  join public.chat_messages_internal m on m.id = r.message_id
  where r.recipient_user_id = auth.uid()
    and r.read_at is null
  group by m.thread_id;
$$;

grant execute on function public.chat_get_or_create_direct_thread(uuid) to authenticated;
grant execute on function public.chat_get_or_create_support_thread() to authenticated;
grant execute on function public.chat_create_group(text, uuid[]) to authenticated;
grant execute on function public.chat_send_message(uuid, text, uuid[]) to authenticated;
grant execute on function public.chat_mark_thread_read(uuid) to authenticated;
grant execute on function public.chat_get_unread_counts() to authenticated;

grant execute on function public.chat_user_can_dm(uuid, uuid) to authenticated;

alter table public.curator_streamer_assignments enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_thread_members enable row level security;
alter table public.chat_messages_internal enable row level security;
alter table public.chat_message_exclusions enable row level security;
alter table public.chat_message_receipts enable row level security;

drop policy if exists "curator_assignments_read" on public.curator_streamer_assignments;
create policy "curator_assignments_read"
on public.curator_streamer_assignments
for select
to authenticated
using (
  public.is_admin()
  or curator_user_id = auth.uid()
  or streamer_user_id = auth.uid()
);

drop policy if exists "curator_assignments_admin_write" on public.curator_streamer_assignments;
create policy "curator_assignments_admin_write"
on public.curator_streamer_assignments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "chat_threads_read" on public.chat_threads;
create policy "chat_threads_read"
on public.chat_threads
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = id
      and m.user_id = auth.uid()
      and m.is_active = true
  )
);

drop policy if exists "chat_threads_insert" on public.chat_threads;
create policy "chat_threads_insert"
on public.chat_threads
for insert
to authenticated
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "chat_threads_update" on public.chat_threads;
create policy "chat_threads_update"
on public.chat_threads
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = id
      and m.user_id = auth.uid()
      and m.member_role = 'admin'
      and m.is_active = true
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = id
      and m.user_id = auth.uid()
      and m.member_role = 'admin'
      and m.is_active = true
  )
);

drop policy if exists "chat_members_read" on public.chat_thread_members;
create policy "chat_members_read"
on public.chat_thread_members
for select
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1
    from public.chat_thread_members own
    where own.thread_id = thread_id
      and own.user_id = auth.uid()
      and own.is_active = true
  )
);

drop policy if exists "chat_members_insert_self_or_admin" on public.chat_thread_members;
create policy "chat_members_insert_self_or_admin"
on public.chat_thread_members
for insert
to authenticated
with check (public.is_admin() or user_id = auth.uid());

drop policy if exists "chat_members_update_self_or_admin" on public.chat_thread_members;
create policy "chat_members_update_self_or_admin"
on public.chat_thread_members
for update
to authenticated
using (public.is_admin() or user_id = auth.uid())
with check (public.is_admin() or user_id = auth.uid());

drop policy if exists "chat_messages_read" on public.chat_messages_internal;
create policy "chat_messages_read"
on public.chat_messages_internal
for select
to authenticated
using (
  public.is_admin()
  or (
    exists (
      select 1
      from public.chat_thread_members m
      where m.thread_id = thread_id
        and m.user_id = auth.uid()
        and m.is_active = true
    )
    and not exists (
      select 1
      from public.chat_message_exclusions e
      where e.message_id = id
        and e.user_id = auth.uid()
    )
  )
);

drop policy if exists "chat_messages_insert" on public.chat_messages_internal;
create policy "chat_messages_insert"
on public.chat_messages_internal
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = thread_id
      and m.user_id = auth.uid()
      and m.is_active = true
  )
);

drop policy if exists "chat_message_exclusions_read" on public.chat_message_exclusions;
create policy "chat_message_exclusions_read"
on public.chat_message_exclusions
for select
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1
    from public.chat_messages_internal m
    where m.id = message_id
      and m.sender_user_id = auth.uid()
  )
);

drop policy if exists "chat_message_exclusions_insert_owner" on public.chat_message_exclusions;
create policy "chat_message_exclusions_insert_owner"
on public.chat_message_exclusions
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.chat_messages_internal m
    where m.id = message_id
      and m.sender_user_id = auth.uid()
  )
);

drop policy if exists "chat_receipts_read" on public.chat_message_receipts;
create policy "chat_receipts_read"
on public.chat_message_receipts
for select
to authenticated
using (
  public.is_admin()
  or recipient_user_id = auth.uid()
  or exists (
    select 1
    from public.chat_messages_internal m
    where m.id = message_id
      and m.sender_user_id = auth.uid()
  )
);

drop policy if exists "chat_receipts_insert_message_owner" on public.chat_message_receipts;
create policy "chat_receipts_insert_message_owner"
on public.chat_message_receipts
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.chat_messages_internal m
    where m.id = message_id
      and m.sender_user_id = auth.uid()
  )
);

drop policy if exists "chat_receipts_update_recipient" on public.chat_message_receipts;
create policy "chat_receipts_update_recipient"
on public.chat_message_receipts
for update
to authenticated
using (public.is_admin() or recipient_user_id = auth.uid())
with check (public.is_admin() or recipient_user_id = auth.uid());

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.chat_threads;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.chat_thread_members;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.chat_messages_internal;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.chat_message_receipts;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
