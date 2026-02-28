create table if not exists public.ai_coach_auto_advices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stream_session_id uuid not null,
  mode_id text not null default 'live_review',
  prompt_text text not null,
  advice_text text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'generated', 'failed')),
  error_text text,
  is_read boolean not null default false,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, stream_session_id, mode_id)
);

create index if not exists idx_ai_coach_auto_advices_user_status
  on public.ai_coach_auto_advices(user_id, status, created_at desc);

create index if not exists idx_ai_coach_auto_advices_user_read
  on public.ai_coach_auto_advices(user_id, is_read, created_at desc);

alter table public.ai_coach_auto_advices enable row level security;

drop policy if exists "ai_coach_auto_advices_select_own" on public.ai_coach_auto_advices;
create policy "ai_coach_auto_advices_select_own"
on public.ai_coach_auto_advices
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_coach_auto_advices_update_own" on public.ai_coach_auto_advices;
create policy "ai_coach_auto_advices_update_own"
on public.ai_coach_auto_advices
for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create or replace function public.ai_coach_auto_advices_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_ai_coach_auto_advices_touch_updated_at on public.ai_coach_auto_advices;
create trigger trg_ai_coach_auto_advices_touch_updated_at
before update on public.ai_coach_auto_advices
for each row execute function public.ai_coach_auto_advices_touch_updated_at();

create or replace function public.ai_user_is_promising(
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_streams_30d integer := 0;
  v_tasks_total integer := 0;
  v_tasks_completed integer := 0;
  v_completion_ratio numeric := 0;
  v_coins_30d bigint := 0;
begin
  if p_user_id is null then
    return false;
  end if;

  select count(*)::integer
  into v_streams_30d
  from public.stream_sessions s
  where s.user_id = p_user_id
    and s.started_at >= now() - interval '30 days';

  select
    count(*)::integer,
    count(*) filter (where utp.completed)::integer
  into v_tasks_total, v_tasks_completed
  from public.user_task_progress utp
  where utp.user_id = p_user_id
    and utp.season_key = to_char(now() at time zone 'utc', 'YYYY-MM');

  if v_tasks_total > 0 then
    v_completion_ratio := v_tasks_completed::numeric / v_tasks_total::numeric;
  end if;

  select coalesce(sum(coalesce(g.gift_coins, 0) * greatest(1, coalesce(g.gift_count, g.quantity, 1))), 0)::bigint
  into v_coins_30d
  from public.gift_events g
  where g.streamer_id = p_user_id::text
    and g.event_ts >= now() - interval '30 days';

  if v_streams_30d >= 4 then
    return true;
  end if;

  if v_coins_30d >= 5000 then
    return true;
  end if;

  if v_streams_30d >= 2 and v_tasks_completed >= 5 then
    return true;
  end if;

  if v_streams_30d >= 1 and v_completion_ratio >= 0.35 then
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.ai_user_is_promising(uuid) to authenticated;

create or replace function public.ai_queue_stream_end_advice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration_minutes integer := 0;
  v_total_gift_coins bigint := 0;
  v_total_gifts bigint := 0;
  v_unique_donors integer := 0;
  v_prompt text;
begin
  if new.user_id is null then
    return new;
  end if;

  if not public.ai_user_is_promising(new.user_id) then
    return new;
  end if;

  if new.ended_at is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.ended_at is not null and old.ended_at = new.ended_at then
    return new;
  end if;

  v_duration_minutes := greatest(
    0,
    floor(extract(epoch from (coalesce(new.ended_at, now()) - new.started_at)) / 60)
  )::integer;

  select
    coalesce(sum(coalesce(g.gift_coins, 0) * greatest(1, coalesce(g.gift_count, g.quantity, 1))), 0)::bigint,
    coalesce(sum(greatest(1, coalesce(g.gift_count, g.quantity, 1))), 0)::bigint,
    count(distinct nullif(g.donor_username, ''))::integer
  into v_total_gift_coins, v_total_gifts, v_unique_donors
  from public.gift_events g
  where g.streamer_id = new.user_id::text
    and g.event_ts >= new.started_at
    and g.event_ts <= coalesce(new.ended_at, now());

  v_prompt := format(
    'Стример завершил эфир. Дай персональный разбор и конкретные советы для следующего эфира. Данные: длительность=%s минут; всего подарков=%s; подарки в монетах=%s; уникальных доноров=%s; started_at=%s; ended_at=%s; tiktok_username=%s. Верни формат: 1) Что сработало 2) Что просело 3) План следующего эфира (5 шагов) 4) Быстрые задачи на сегодня (3 пункта).',
    v_duration_minutes,
    v_total_gifts,
    v_total_gift_coins,
    v_unique_donors,
    new.started_at,
    new.ended_at,
    coalesce(new.tiktok_username, 'unknown')
  );

  insert into public.ai_coach_auto_advices (
    user_id,
    stream_session_id,
    mode_id,
    prompt_text,
    status,
    is_read
  ) values (
    new.user_id,
    new.id,
    'live_review',
    v_prompt,
    'pending',
    false
  )
  on conflict (user_id, stream_session_id, mode_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_ai_queue_stream_end_advice on public.stream_sessions;
create trigger trg_ai_queue_stream_end_advice
after insert or update of ended_at, status on public.stream_sessions
for each row
when (new.ended_at is not null)
execute function public.ai_queue_stream_end_advice();

create or replace function public.ai_claim_pending_auto_advice(
  p_user_id uuid default auth.uid()
)
returns table(
  advice_id uuid,
  mode_id text,
  prompt_text text,
  stream_session_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if auth.uid() is distinct from v_uid and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
  with candidate as (
    select a.id
    from public.ai_coach_auto_advices a
    where a.user_id = v_uid
      and a.status = 'pending'
      and a.advice_text is null
    order by a.created_at asc
    limit 1
    for update skip locked
  ), updated as (
    update public.ai_coach_auto_advices a
    set status = 'processing'
    where a.id in (select id from candidate)
    returning a.id, a.mode_id, a.prompt_text, a.stream_session_id, a.created_at
  )
  select u.id, u.mode_id, u.prompt_text, u.stream_session_id, u.created_at
  from updated u;
end;
$$;

grant execute on function public.ai_claim_pending_auto_advice(uuid) to authenticated;

create or replace function public.ai_complete_auto_advice(
  p_advice_id uuid,
  p_advice_text text default null,
  p_failed boolean default false,
  p_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null and not public.is_admin() then
    raise exception 'unauthenticated';
  end if;

  update public.ai_coach_auto_advices a
  set
    advice_text = case when p_failed then a.advice_text else p_advice_text end,
    status = case when p_failed then 'failed' else 'generated' end,
    error_text = case when p_failed then coalesce(p_error, 'generation_failed') else null end,
    generated_at = case when p_failed then a.generated_at else now() end,
    is_read = false,
    updated_at = now()
  where a.id = p_advice_id
    and (a.user_id = v_uid or public.is_admin());

  return found;
end;
$$;

grant execute on function public.ai_complete_auto_advice(uuid, text, boolean, text) to authenticated;

create or replace function public.ai_list_auto_advices(
  p_user_id uuid default auth.uid(),
  p_only_unread boolean default false,
  p_limit integer default 20
)
returns table(
  id uuid,
  mode_id text,
  advice_text text,
  status text,
  stream_session_id uuid,
  is_read boolean,
  generated_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    a.id,
    a.mode_id,
    a.advice_text,
    a.status,
    a.stream_session_id,
    a.is_read,
    a.generated_at,
    a.created_at
  from public.ai_coach_auto_advices a
  where a.user_id = coalesce(p_user_id, auth.uid())
    and a.status = 'generated'
    and (not p_only_unread or a.is_read = false)
  order by coalesce(a.generated_at, a.created_at) desc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

grant execute on function public.ai_list_auto_advices(uuid, boolean, integer) to authenticated;

create or replace function public.ai_mark_auto_advice_read(
  p_advice_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null and not public.is_admin() then
    raise exception 'unauthenticated';
  end if;

  update public.ai_coach_auto_advices
  set is_read = true, updated_at = now()
  where id = p_advice_id
    and (user_id = v_uid or public.is_admin());

  return found;
end;
$$;

grant execute on function public.ai_mark_auto_advice_read(uuid) to authenticated;
