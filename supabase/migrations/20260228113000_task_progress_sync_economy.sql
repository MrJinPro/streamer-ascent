do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'task_period_t' and n.nspname = 'public'
  ) then
    create type public.task_period_t as enum ('daily', 'weekly', 'monthly', 'seasonal');
  end if;
end $$;

create table if not exists public.user_task_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  task_id text not null,
  period public.task_period_t not null,
  period_key text not null,
  season_key text not null,
  progress integer not null default 0,
  max_progress integer not null default 1,
  completed boolean not null default false,
  completed_at timestamptz,
  xp_awarded integer not null default 0,
  first_event_at timestamptz not null default now(),
  last_event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, task_id, period, period_key, season_key),
  constraint user_task_progress_progress_check check (progress >= 0 and max_progress >= 1 and progress <= max_progress),
  constraint user_task_progress_completed_at_check check ((completed = false and completed_at is null) or completed = true)
);

create index if not exists idx_user_task_progress_user_season
  on public.user_task_progress(user_id, season_key, updated_at desc);

create index if not exists idx_user_task_progress_user_period
  on public.user_task_progress(user_id, period, period_key);

create or replace function public.touch_user_task_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_task_progress_updated_at on public.user_task_progress;
create trigger trg_user_task_progress_updated_at
before update on public.user_task_progress
for each row execute function public.touch_user_task_progress_updated_at();

alter table public.user_task_progress enable row level security;

drop policy if exists "user_task_progress_self_rw" on public.user_task_progress;
create policy "user_task_progress_self_rw"
on public.user_task_progress
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create or replace function public.get_task_period_key(
  p_period public.task_period_t,
  p_at timestamptz default now()
)
returns text
language plpgsql
immutable
as $$
declare
  v_at timestamptz := coalesce(p_at, now());
begin
  case p_period
    when 'daily' then
      return to_char(v_at at time zone 'UTC', 'YYYY-MM-DD');
    when 'weekly' then
      return to_char(date_trunc('week', v_at at time zone 'UTC'), 'IYYY-"W"IW');
    when 'monthly' then
      return to_char(date_trunc('month', v_at at time zone 'UTC'), 'YYYY-MM');
    when 'seasonal' then
      return to_char(date_trunc('month', v_at at time zone 'UTC'), 'YYYY-MM');
    else
      return to_char(v_at at time zone 'UTC', 'YYYY-MM-DD');
  end case;
end;
$$;

create or replace function public.get_task_season_key(
  p_at timestamptz default now()
)
returns text
language sql
immutable
as $$
  select to_char(date_trunc('month', coalesce(p_at, now()) at time zone 'UTC'), 'YYYY-MM');
$$;

create or replace function public.get_task_period_from_item(p_item jsonb)
returns public.task_period_t
language plpgsql
immutable
as $$
declare
  v_raw text;
  v_type text;
begin
  v_raw := lower(coalesce(nullif(p_item->>'resetPeriod', ''), ''));

  if v_raw in ('daily', 'weekly', 'monthly', 'seasonal') then
    return v_raw::public.task_period_t;
  end if;

  v_type := lower(coalesce(nullif(p_item->>'type', ''), ''));

  case v_type
    when 'daily' then return 'daily';
    when 'weekly' then return 'weekly';
    when 'challenge' then return 'monthly';
    else return 'weekly';
  end case;
end;
$$;

create or replace function public.compute_task_xp_gain(
  p_base_xp integer,
  p_completed_in_period integer,
  p_period public.task_period_t,
  p_difficulty integer default 3
)
returns integer
language plpgsql
immutable
as $$
declare
  v_cap integer;
  v_multiplier numeric := 1.0;
  v_difficulty_multiplier numeric;
  v_effective_base integer := greatest(0, coalesce(p_base_xp, 0));
begin
  v_cap := case p_period
    when 'daily' then 5
    when 'weekly' then 14
    when 'monthly' then 36
    when 'seasonal' then 60
    else 10
  end;

  if coalesce(p_completed_in_period, 0) >= v_cap then
    return 0;
  end if;

  if p_completed_in_period >= 9 then
    v_multiplier := 0.25;
  elsif p_completed_in_period >= 6 then
    v_multiplier := 0.45;
  elsif p_completed_in_period >= 3 then
    v_multiplier := 0.70;
  end if;

  v_difficulty_multiplier := case greatest(1, least(5, coalesce(p_difficulty, 3)))
    when 1 then 0.85
    when 2 then 0.95
    when 3 then 1.00
    when 4 then 1.10
    else 1.20
  end;

  return greatest(0, round(v_effective_base * v_multiplier * v_difficulty_multiplier)::integer);
end;
$$;

create or replace function public.claim_user_task_progress(
  p_task_id text,
  p_progress_increment integer default 1,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_payload jsonb;
  v_item jsonb;
  v_period public.task_period_t;
  v_period_key text;
  v_season_key text;
  v_current public.user_task_progress;
  v_new_progress integer;
  v_max_progress integer;
  v_base_xp integer;
  v_difficulty integer;
  v_completed_in_period integer := 0;
  v_xp_gain integer := 0;
  v_became_completed boolean := false;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if coalesce(nullif(trim(p_task_id), ''), '') = '' then
    raise exception 'task_id_required';
  end if;

  if coalesce(p_progress_increment, 0) <= 0 then
    return jsonb_build_object(
      'taskId', p_task_id,
      'progressIncrement', 0,
      'xpAwarded', 0,
      'completed', false,
      'reason', 'non_positive_increment'
    );
  end if;

  select payload into v_payload
  from public.app_content
  where key = 'tasks'
  limit 1;

  if v_payload is null or jsonb_typeof(v_payload) <> 'array' then
    raise exception 'tasks_catalog_not_found';
  end if;

  select item into v_item
  from jsonb_array_elements(v_payload) item
  where item->>'id' = p_task_id
  limit 1;

  if v_item is null then
    raise exception 'task_not_found';
  end if;

  v_period := public.get_task_period_from_item(v_item);
  v_period_key := public.get_task_period_key(v_period, p_occurred_at);
  v_season_key := public.get_task_season_key(p_occurred_at);
  v_max_progress := greatest(1, coalesce(nullif(v_item->>'maxProgress', '')::integer, 1));
  v_base_xp := greatest(0, coalesce(nullif(v_item->>'xpReward', '')::integer, 0));
  v_difficulty := greatest(1, least(5, coalesce(nullif(v_item->>'difficulty', '')::integer, 3)));

  select *
  into v_current
  from public.user_task_progress
  where user_id = v_uid
    and task_id = p_task_id
    and period = v_period
    and period_key = v_period_key
    and season_key = v_season_key
  for update;

  if v_current.id is null then
    insert into public.user_task_progress(
      user_id,
      task_id,
      period,
      period_key,
      season_key,
      progress,
      max_progress,
      completed,
      completed_at,
      xp_awarded,
      first_event_at,
      last_event_at
    )
    values (
      v_uid,
      p_task_id,
      v_period,
      v_period_key,
      v_season_key,
      0,
      v_max_progress,
      false,
      null,
      0,
      coalesce(p_occurred_at, now()),
      coalesce(p_occurred_at, now())
    )
    returning * into v_current;
  end if;

  v_new_progress := least(v_current.max_progress, greatest(v_current.progress, 0) + p_progress_increment);

  if v_current.completed = false and v_new_progress >= v_current.max_progress then
    v_became_completed := true;

    select coalesce(count(*), 0)
    into v_completed_in_period
    from public.user_task_progress p
    where p.user_id = v_uid
      and p.period = v_period
      and p.period_key = v_period_key
      and p.season_key = v_season_key
      and p.completed = true;

    v_xp_gain := public.compute_task_xp_gain(v_base_xp, v_completed_in_period, v_period, v_difficulty);
  end if;

  update public.user_task_progress
  set
    progress = v_new_progress,
    completed = v_current.completed or v_became_completed,
    completed_at = case when v_current.completed or v_became_completed then coalesce(v_current.completed_at, coalesce(p_occurred_at, now())) else null end,
    xp_awarded = v_current.xp_awarded + case when v_became_completed then v_xp_gain else 0 end,
    max_progress = greatest(1, coalesce(v_current.max_progress, v_max_progress)),
    last_event_at = coalesce(p_occurred_at, now())
  where id = v_current.id
  returning * into v_current;

  if v_became_completed and v_xp_gain > 0 then
    perform public.apply_xp_to_user_stats(v_uid, v_xp_gain);
  end if;

  return jsonb_build_object(
    'taskId', p_task_id,
    'period', v_current.period,
    'periodKey', v_current.period_key,
    'seasonKey', v_current.season_key,
    'progress', v_current.progress,
    'maxProgress', v_current.max_progress,
    'completed', v_current.completed,
    'xpAwarded', case when v_became_completed then v_xp_gain else 0 end
  );
end;
$$;

create or replace function public.sync_user_task_stats(
  p_user_id uuid default auth.uid(),
  p_season_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_target_season text := coalesce(nullif(p_season_key, ''), public.get_task_season_key(now()));
  v_completed integer := 0;
  v_season_xp integer := 0;
  v_payload jsonb;
  v_user_stats jsonb;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if auth.uid() is distinct from v_uid and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select coalesce(count(*), 0), coalesce(sum(xp_awarded), 0)
  into v_completed, v_season_xp
  from public.user_task_progress
  where user_id = v_uid
    and season_key = v_target_season
    and completed = true;

  insert into public.app_content(key, payload)
  values ('userStats', '{}'::jsonb)
  on conflict (key) do nothing;

  select payload
  into v_payload
  from public.app_content
  where key = 'userStats'
  for update;

  v_user_stats := coalesce(v_payload -> v_uid::text, '{}'::jsonb);
  v_user_stats := jsonb_build_object(
    'completedTasks', v_completed,
    'taskSeasonXp', v_season_xp,
    'taskSeasonKey', v_target_season,
    'taskSyncedAt', now()
  ) || v_user_stats;

  v_payload := jsonb_set(v_payload, array[v_uid::text], v_user_stats, true);

  update public.app_content
  set payload = v_payload
  where key = 'userStats';

  return jsonb_build_object(
    'userId', v_uid,
    'seasonKey', v_target_season,
    'completedTasks', v_completed,
    'taskSeasonXp', v_season_xp
  );
end;
$$;

grant execute on function public.get_task_period_key(public.task_period_t, timestamptz) to authenticated;
grant execute on function public.get_task_season_key(timestamptz) to authenticated;
grant execute on function public.get_task_period_from_item(jsonb) to authenticated;
grant execute on function public.compute_task_xp_gain(integer, integer, public.task_period_t, integer) to authenticated;
grant execute on function public.claim_user_task_progress(text, integer, timestamptz) to authenticated;
grant execute on function public.sync_user_task_stats(uuid, text) to authenticated;
