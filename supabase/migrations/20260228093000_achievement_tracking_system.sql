do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'achievement_progress_type_t' and n.nspname = 'public'
  ) then
    create type public.achievement_progress_type_t as enum (
      'counter_total',
      'sum_total',
      'duration_total',
      'max_in_single_session',
      'sum_in_single_session',
      'streak_days',
      'time_window_sum',
      'time_window_count',
      'manual_only',
      'verified_by_admin'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'achievement_status_t' and n.nspname = 'public'
  ) then
    create type public.achievement_status_t as enum ('in_progress', 'unlocked', 'revoked');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'achievement_unlock_source_t' and n.nspname = 'public'
  ) then
    create type public.achievement_unlock_source_t as enum ('auto', 'manual', 'verified');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'achievement_claim_status_t' and n.nspname = 'public'
  ) then
    create type public.achievement_claim_status_t as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.achievement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  event_type text not null,
  stream_id uuid,
  occurred_at timestamptz not null default now(),
  numeric_value numeric,
  payload jsonb not null default '{}'::jsonb,
  source text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists idx_achievement_events_user_time on public.achievement_events(user_id, occurred_at desc);
create index if not exists idx_achievement_events_type on public.achievement_events(event_type);
create index if not exists idx_achievement_events_stream on public.achievement_events(stream_id);

create table if not exists public.achievement_progress (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  achievement_id text not null,
  progress_value numeric not null default 0,
  target_value numeric not null default 1,
  last_event_at timestamptz,
  status public.achievement_status_t not null default 'in_progress',
  unlocked_at timestamptz,
  progress_type public.achievement_progress_type_t not null default 'manual_only',
  grant_mode text not null default 'manual_only' check (grant_mode in ('auto', 'verified_by_admin', 'manual_only')),
  rule jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create index if not exists idx_achievement_progress_user on public.achievement_progress(user_id);
create index if not exists idx_achievement_progress_status on public.achievement_progress(status);

create table if not exists public.achievement_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  source public.achievement_unlock_source_t not null,
  admin_id uuid references public.profiles(user_id) on delete set null,
  note text,
  snapshot jsonb not null default '{}'::jsonb,
  unique (user_id, achievement_id, source, unlocked_at)
);

create table if not exists public.achievement_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  achievement_id text not null,
  snapshot jsonb not null default '{}'::jsonb,
  status public.achievement_claim_status_t not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(user_id) on delete set null,
  note text
);

create unique index if not exists idx_achievement_claims_pending_unique
  on public.achievement_claims(user_id, achievement_id)
  where status = 'pending';

create table if not exists public.user_achievement_pins (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  achievement_id text not null,
  position smallint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, achievement_id),
  unique (user_id, position),
  constraint user_achievement_pins_position_check check (position between 1 and 6)
);

create or replace function public.touch_achievement_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_achievement_progress_updated_at on public.achievement_progress;
create trigger trg_achievement_progress_updated_at
before update on public.achievement_progress
for each row execute function public.touch_achievement_progress_updated_at();

alter table public.achievement_events enable row level security;
alter table public.achievement_progress enable row level security;
alter table public.achievement_unlocks enable row level security;
alter table public.achievement_claims enable row level security;
alter table public.user_achievement_pins enable row level security;

drop policy if exists "achievement_events_self_select" on public.achievement_events;
create policy "achievement_events_self_select"
on public.achievement_events
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "achievement_events_admin_write" on public.achievement_events;
create policy "achievement_events_admin_write"
on public.achievement_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "achievement_progress_self_select" on public.achievement_progress;
create policy "achievement_progress_self_select"
on public.achievement_progress
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "achievement_progress_admin_write" on public.achievement_progress;
create policy "achievement_progress_admin_write"
on public.achievement_progress
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "achievement_unlocks_self_select" on public.achievement_unlocks;
create policy "achievement_unlocks_self_select"
on public.achievement_unlocks
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "achievement_unlocks_admin_write" on public.achievement_unlocks;
create policy "achievement_unlocks_admin_write"
on public.achievement_unlocks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "achievement_claims_self_select" on public.achievement_claims;
create policy "achievement_claims_self_select"
on public.achievement_claims
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "achievement_claims_admin_write" on public.achievement_claims;
create policy "achievement_claims_admin_write"
on public.achievement_claims
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "user_achievement_pins_self_rw" on public.user_achievement_pins;
create policy "user_achievement_pins_self_rw"
on public.user_achievement_pins
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create or replace function public.get_achievement_target_from_item(p_item jsonb)
returns numeric
language sql
immutable
as $$
  select greatest(
    coalesce(
      nullif(p_item->>'targetValue', '')::numeric,
      nullif(p_item->>'maxProgress', '')::numeric,
      nullif(p_item #>> '{tracking,target}', '')::numeric,
      1
    ),
    1
  );
$$;

create or replace function public.get_achievement_progress_type_from_item(p_item jsonb)
returns public.achievement_progress_type_t
language plpgsql
immutable
as $$
declare
  v_raw text;
begin
  v_raw := lower(coalesce(nullif(p_item->>'progressType', ''), nullif(p_item #>> '{tracking,metric}', 'manual_only')));

  case v_raw
    when 'counter_total' then return 'counter_total';
    when 'sum_total' then return 'sum_total';
    when 'duration_total' then return 'duration_total';
    when 'max_in_single_session' then return 'max_in_single_session';
    when 'sum_in_single_session' then return 'sum_in_single_session';
    when 'streak_days' then return 'streak_days';
    when 'time_window_sum' then return 'time_window_sum';
    when 'time_window_count' then return 'time_window_count';
    when 'verified_by_admin' then return 'verified_by_admin';
    else return 'manual_only';
  end case;
end;
$$;

create or replace function public.get_achievement_grant_mode_from_item(p_item jsonb)
returns text
language plpgsql
immutable
as $$
declare
  v_mode text;
  v_type text;
begin
  v_mode := lower(coalesce(nullif(p_item->>'grantMode', ''), ''));
  if v_mode in ('auto', 'verified_by_admin', 'manual_only') then
    return v_mode;
  end if;

  v_type := lower(coalesce(nullif(p_item->>'progressType', ''), 'manual_only'));
  if v_type = 'verified_by_admin' then
    return 'verified_by_admin';
  end if;
  if v_type = 'manual_only' then
    return 'manual_only';
  end if;
  return 'auto';
end;
$$;

create or replace function public.get_achievement_catalog_item(p_achievement_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_item jsonb;
begin
  select payload
  into v_payload
  from public.app_content
  where key = 'achievements'
  limit 1;

  if v_payload is null or jsonb_typeof(v_payload) <> 'array' then
    return null;
  end if;

  select item
  into v_item
  from jsonb_array_elements(v_payload) item
  where item->>'id' = p_achievement_id
  limit 1;

  return v_item;
end;
$$;

create or replace function public.compute_achievement_progress(
  p_user_id uuid,
  p_progress_type public.achievement_progress_type_t,
  p_rule jsonb,
  p_target numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value numeric := 0;
  v_event_types text[];
  v_window_days integer;
  v_from timestamptz;
  v_value_field text;
begin
  v_event_types := coalesce(array(select jsonb_array_elements_text(coalesce(p_rule->'event_types', '[]'::jsonb))), array[]::text[]);
  v_window_days := coalesce(nullif(p_rule->>'window_days', '')::integer, 0);
  v_from := case when v_window_days > 0 then now() - make_interval(days => v_window_days) else null end;
  v_value_field := nullif(p_rule->>'value_field', '');

  case p_progress_type
    when 'counter_total' then
      select coalesce(count(*), 0)::numeric into v_value
      from public.achievement_events e
      where e.user_id = p_user_id
        and (array_length(v_event_types, 1) is null or e.event_type = any(v_event_types));

    when 'sum_total' then
      select coalesce(sum(
        coalesce(
          case when v_value_field is not null then nullif(e.payload->>v_value_field, '')::numeric else null end,
          e.numeric_value,
          0
        )
      ), 0)
      into v_value
      from public.achievement_events e
      where e.user_id = p_user_id
        and (array_length(v_event_types, 1) is null or e.event_type = any(v_event_types));

      if v_value = 0 then
        select coalesce(ss.total_coins, 0) into v_value
        from public.streamer_stats ss
        where ss.streamer_id = p_user_id
        order by ss.updated_at desc
        limit 1;
      end if;

    when 'duration_total' then
      select coalesce(sum(greatest(0, extract(epoch from (s.ended_at - s.started_at))) / 3600.0), 0)
      into v_value
      from public.stream_sessions s
      where s.user_id = p_user_id
        and s.ended_at is not null;

    when 'max_in_single_session' then
      with session_values as (
        select
          coalesce(
            e.stream_id,
            ('00000000-0000-0000-0000-000000000000')::uuid
          ) as sid,
          sum(
            coalesce(
              case when v_value_field is not null then nullif(e.payload->>v_value_field, '')::numeric else null end,
              e.numeric_value,
              0
            )
          ) as total
        from public.achievement_events e
        where e.user_id = p_user_id
          and (array_length(v_event_types, 1) is null or e.event_type = any(v_event_types))
        group by 1
      )
      select coalesce(max(total), 0) into v_value
      from session_values;

      if v_value = 0 then
        select coalesce(max(greatest(0, extract(epoch from (s.ended_at - s.started_at))) / 3600.0), 0)
        into v_value
        from public.stream_sessions s
        where s.user_id = p_user_id
          and s.ended_at is not null;
      end if;

    when 'sum_in_single_session' then
      with session_values as (
        select
          coalesce(
            e.stream_id,
            ('00000000-0000-0000-0000-000000000000')::uuid
          ) as sid,
          sum(
            coalesce(
              case when v_value_field is not null then nullif(e.payload->>v_value_field, '')::numeric else null end,
              e.numeric_value,
              0
            )
          ) as total
        from public.achievement_events e
        where e.user_id = p_user_id
          and (array_length(v_event_types, 1) is null or e.event_type = any(v_event_types))
        group by 1
      )
      select coalesce(max(total), 0) into v_value
      from session_values;

    when 'streak_days' then
      with days as (
        select distinct date(coalesce(s.ended_at, s.started_at)) as day
        from public.stream_sessions s
        where s.user_id = p_user_id
      ), ordered as (
        select
          day,
          row_number() over (order by day desc) as rn
        from days
      ), grouped as (
        select
          day,
          rn,
          (day + (rn || ' day')::interval)::date as grp
        from ordered
      ), chains as (
        select grp, count(*) as streak
        from grouped
        group by grp
      )
      select coalesce(max(streak), 0)::numeric into v_value from chains;

    when 'time_window_sum' then
      select coalesce(sum(
        coalesce(
          case when v_value_field is not null then nullif(e.payload->>v_value_field, '')::numeric else null end,
          e.numeric_value,
          0
        )
      ), 0)
      into v_value
      from public.achievement_events e
      where e.user_id = p_user_id
        and (array_length(v_event_types, 1) is null or e.event_type = any(v_event_types))
        and (v_from is null or e.occurred_at >= v_from);

    when 'time_window_count' then
      select coalesce(count(*), 0)::numeric
      into v_value
      from public.achievement_events e
      where e.user_id = p_user_id
        and (array_length(v_event_types, 1) is null or e.event_type = any(v_event_types))
        and (v_from is null or e.occurred_at >= v_from);

    when 'verified_by_admin' then
      v_value := 0;

    when 'manual_only' then
      v_value := 0;
  end case;

  return least(greatest(coalesce(v_value, 0), 0), greatest(p_target, 1));
end;
$$;

create or replace function public.insert_achievement_unlock(
  p_user_id uuid,
  p_achievement_id text,
  p_source public.achievement_unlock_source_t,
  p_admin_id uuid default null,
  p_note text default null,
  p_snapshot jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.achievement_unlocks (
    user_id,
    achievement_id,
    source,
    admin_id,
    note,
    snapshot
  )
  values (
    p_user_id,
    p_achievement_id,
    p_source,
    p_admin_id,
    p_note,
    coalesce(p_snapshot, '{}'::jsonb)
  );
end;
$$;

create or replace function public.refresh_user_achievements(
  p_user_id uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_item jsonb;
  v_achievement_id text;
  v_target numeric;
  v_progress numeric;
  v_type public.achievement_progress_type_t;
  v_mode text;
  v_prev public.achievement_progress;
  v_candidate_unlocked boolean;
  v_final_unlocked boolean;
  v_updated int := 0;
begin
  if p_user_id is null then
    raise exception 'user_id_required';
  end if;

  if auth.uid() is distinct from p_user_id and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select payload
  into v_payload
  from public.app_content
  where key = 'achievements'
  limit 1;

  if v_payload is null or jsonb_typeof(v_payload) <> 'array' then
    return jsonb_build_object('ok', true, 'updated', 0);
  end if;

  for v_item in
    select value from jsonb_array_elements(v_payload)
  loop
    v_achievement_id := nullif(btrim(v_item->>'id'), '');
    if v_achievement_id is null then
      continue;
    end if;

    v_target := public.get_achievement_target_from_item(v_item);
    v_type := public.get_achievement_progress_type_from_item(v_item);
    v_mode := public.get_achievement_grant_mode_from_item(v_item);

    select *
    into v_prev
    from public.achievement_progress ap
    where ap.user_id = p_user_id
      and ap.achievement_id = v_achievement_id;

    if v_type = 'manual_only' then
      v_progress := coalesce(v_prev.progress_value, 0);
      v_candidate_unlocked := coalesce(v_prev.status = 'unlocked', false);
    else
      v_progress := public.compute_achievement_progress(p_user_id, v_type, coalesce(v_item->'rule', '{}'::jsonb), v_target);
      v_candidate_unlocked := v_progress >= v_target;
    end if;

    v_final_unlocked := v_candidate_unlocked and v_mode = 'auto';

    insert into public.achievement_progress (
      user_id,
      achievement_id,
      progress_value,
      target_value,
      last_event_at,
      status,
      unlocked_at,
      progress_type,
      grant_mode,
      rule
    )
    values (
      p_user_id,
      v_achievement_id,
      v_progress,
      v_target,
      now(),
      case when v_final_unlocked then 'unlocked'::public.achievement_status_t else 'in_progress'::public.achievement_status_t end,
      case when v_final_unlocked then now() else null end,
      v_type,
      v_mode,
      coalesce(v_item->'rule', '{}'::jsonb)
    )
    on conflict (user_id, achievement_id)
    do update set
      progress_value = case
        when achievement_progress.grant_mode = 'manual_only' then achievement_progress.progress_value
        else greatest(achievement_progress.progress_value, excluded.progress_value)
      end,
      target_value = excluded.target_value,
      last_event_at = excluded.last_event_at,
      status = case
        when achievement_progress.status = 'revoked' then 'revoked'::public.achievement_status_t
        when achievement_progress.status = 'unlocked' then 'unlocked'::public.achievement_status_t
        when excluded.status = 'unlocked' then 'unlocked'::public.achievement_status_t
        else 'in_progress'::public.achievement_status_t
      end,
      unlocked_at = case
        when achievement_progress.unlocked_at is not null then achievement_progress.unlocked_at
        when excluded.status = 'unlocked' then now()
        else null
      end,
      progress_type = excluded.progress_type,
      grant_mode = excluded.grant_mode,
      rule = excluded.rule,
      updated_at = now();

    if v_mode = 'verified_by_admin' and v_candidate_unlocked then
      insert into public.achievement_claims (
        user_id,
        achievement_id,
        snapshot,
        status
      )
      values (
        p_user_id,
        v_achievement_id,
        jsonb_build_object(
          'progress_value', v_progress,
          'target_value', v_target,
          'rule', coalesce(v_item->'rule', '{}'::jsonb)
        ),
        'pending'
      )
      on conflict do nothing;
    end if;

    if v_final_unlocked and (v_prev.user_id is null or v_prev.status <> 'unlocked') then
      perform public.insert_achievement_unlock(
        p_user_id,
        v_achievement_id,
        'auto',
        null,
        null,
        jsonb_build_object('progress_value', v_progress, 'target_value', v_target)
      );
    end if;

    v_updated := v_updated + 1;
  end loop;

  return jsonb_build_object('ok', true, 'updated', v_updated);
end;
$$;

create or replace function public.ingest_achievement_event(
  p_user_id uuid,
  p_event_type text,
  p_stream_id uuid default null,
  p_occurred_at timestamptz default now(),
  p_numeric_value numeric default null,
  p_payload jsonb default '{}'::jsonb,
  p_source text default 'system'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if p_user_id is null then
    raise exception 'user_id_required';
  end if;

  if auth.uid() is distinct from p_user_id and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  insert into public.achievement_events (
    user_id,
    event_type,
    stream_id,
    occurred_at,
    numeric_value,
    payload,
    source
  )
  values (
    p_user_id,
    p_event_type,
    p_stream_id,
    coalesce(p_occurred_at, now()),
    p_numeric_value,
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_source, 'system')
  );

  select public.refresh_user_achievements(p_user_id) into v_result;
  return coalesce(v_result, jsonb_build_object('ok', true));
end;
$$;

create or replace function public.grant_user_achievement(
  p_user_id uuid,
  p_achievement_id text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_target numeric;
  v_type public.achievement_progress_type_t;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  v_item := public.get_achievement_catalog_item(p_achievement_id);
  if v_item is null then
    raise exception 'achievement_not_found';
  end if;

  v_target := public.get_achievement_target_from_item(v_item);
  v_type := public.get_achievement_progress_type_from_item(v_item);

  insert into public.achievement_progress (
    user_id,
    achievement_id,
    progress_value,
    target_value,
    last_event_at,
    status,
    unlocked_at,
    progress_type,
    grant_mode,
    rule
  )
  values (
    p_user_id,
    p_achievement_id,
    v_target,
    v_target,
    now(),
    'unlocked',
    now(),
    v_type,
    'manual_only',
    coalesce(v_item->'rule', '{}'::jsonb)
  )
  on conflict (user_id, achievement_id)
  do update set
    progress_value = greatest(achievement_progress.progress_value, excluded.progress_value),
    target_value = excluded.target_value,
    status = 'unlocked',
    unlocked_at = coalesce(achievement_progress.unlocked_at, now()),
    progress_type = excluded.progress_type,
    grant_mode = 'manual_only',
    rule = excluded.rule,
    updated_at = now();

  perform public.insert_achievement_unlock(
    p_user_id,
    p_achievement_id,
    'manual',
    auth.uid(),
    p_note,
    jsonb_build_object('manual', true)
  );

  return true;
end;
$$;

create or replace function public.approve_achievement_claim(
  p_claim_id uuid,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.achievement_claims;
  v_item jsonb;
  v_target numeric;
  v_type public.achievement_progress_type_t;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select *
  into v_claim
  from public.achievement_claims
  where id = p_claim_id
    and status = 'pending'
  for update;

  if v_claim.id is null then
    raise exception 'claim_not_found';
  end if;

  v_item := public.get_achievement_catalog_item(v_claim.achievement_id);
  v_target := coalesce(public.get_achievement_target_from_item(v_item), 1);
  v_type := coalesce(public.get_achievement_progress_type_from_item(v_item), 'verified_by_admin');

  update public.achievement_claims
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      note = coalesce(p_note, note)
  where id = p_claim_id;

  insert into public.achievement_progress (
    user_id,
    achievement_id,
    progress_value,
    target_value,
    last_event_at,
    status,
    unlocked_at,
    progress_type,
    grant_mode,
    rule
  )
  values (
    v_claim.user_id,
    v_claim.achievement_id,
    v_target,
    v_target,
    now(),
    'unlocked',
    now(),
    v_type,
    'verified_by_admin',
    coalesce(v_item->'rule', '{}'::jsonb)
  )
  on conflict (user_id, achievement_id)
  do update set
    progress_value = greatest(achievement_progress.progress_value, excluded.progress_value),
    target_value = excluded.target_value,
    status = 'unlocked',
    unlocked_at = coalesce(achievement_progress.unlocked_at, now()),
    progress_type = excluded.progress_type,
    grant_mode = 'verified_by_admin',
    rule = excluded.rule,
    updated_at = now();

  perform public.insert_achievement_unlock(
    v_claim.user_id,
    v_claim.achievement_id,
    'verified',
    auth.uid(),
    p_note,
    v_claim.snapshot
  );

  return true;
end;
$$;

create or replace function public.reject_achievement_claim(
  p_claim_id uuid,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.achievement_claims
  set status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      note = coalesce(p_note, note)
  where id = p_claim_id
    and status = 'pending';

  return found;
end;
$$;

create or replace function public.revoke_user_achievement(
  p_user_id uuid,
  p_achievement_id text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.achievement_progress
  set status = 'revoked',
      updated_at = now()
  where user_id = p_user_id
    and achievement_id = p_achievement_id;

  insert into public.achievement_unlocks (
    user_id,
    achievement_id,
    source,
    admin_id,
    note,
    snapshot
  )
  values (
    p_user_id,
    p_achievement_id,
    'manual',
    auth.uid(),
    coalesce(p_note, 'revoked'),
    jsonb_build_object('revoked', true)
  );

  return found;
end;
$$;

create or replace function public.recompute_achievement_progress_all_users()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
  v_count int := 0;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  for v_user in
    select user_id from public.profiles
  loop
    perform public.refresh_user_achievements(v_user.user_id);
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'users_recomputed', v_count);
end;
$$;

grant execute on function public.get_achievement_catalog_item(text) to authenticated;
grant execute on function public.get_achievement_target_from_item(jsonb) to authenticated;
grant execute on function public.get_achievement_progress_type_from_item(jsonb) to authenticated;
grant execute on function public.get_achievement_grant_mode_from_item(jsonb) to authenticated;
grant execute on function public.compute_achievement_progress(uuid, public.achievement_progress_type_t, jsonb, numeric) to authenticated;
grant execute on function public.refresh_user_achievements(uuid) to authenticated;
grant execute on function public.ingest_achievement_event(uuid, text, uuid, timestamptz, numeric, jsonb, text) to authenticated;
grant execute on function public.grant_user_achievement(uuid, text, text) to authenticated;
grant execute on function public.approve_achievement_claim(uuid, text) to authenticated;
grant execute on function public.reject_achievement_claim(uuid, text) to authenticated;
grant execute on function public.revoke_user_achievement(uuid, text, text) to authenticated;
grant execute on function public.recompute_achievement_progress_all_users() to authenticated;
