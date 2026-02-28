create table if not exists public.ai_coach_live_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stream_session_id uuid not null,
  donor_username text not null,
  alert_type text not null default 'high_value_viewer_present',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  prompt_text text not null,
  alert_text text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'generated', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  error_text text,
  is_read boolean not null default false,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, stream_session_id, donor_username, alert_type)
);

create index if not exists idx_ai_coach_live_alerts_user_status
  on public.ai_coach_live_alerts(user_id, status, created_at desc);

create index if not exists idx_ai_coach_live_alerts_user_read
  on public.ai_coach_live_alerts(user_id, is_read, created_at desc);

alter table public.ai_coach_live_alerts enable row level security;

drop policy if exists "ai_coach_live_alerts_select_own" on public.ai_coach_live_alerts;
create policy "ai_coach_live_alerts_select_own"
on public.ai_coach_live_alerts
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_coach_live_alerts_update_own" on public.ai_coach_live_alerts;
create policy "ai_coach_live_alerts_update_own"
on public.ai_coach_live_alerts
for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create or replace function public.ai_coach_live_alerts_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_ai_coach_live_alerts_touch_updated_at on public.ai_coach_live_alerts;
create trigger trg_ai_coach_live_alerts_touch_updated_at
before update on public.ai_coach_live_alerts
for each row execute function public.ai_coach_live_alerts_touch_updated_at();

create or replace function public.ai_queue_live_donor_alert(
  p_user_id uuid,
  p_stream_session_id uuid,
  p_streamer_tiktok_username text,
  p_donor_username text,
  p_source text default 'gift_event'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_streamer_total_coins bigint := 0;
  v_global_total_coins bigint := 0;
  v_support_days integer := 0;
  v_streamers_supported integer := 0;
  v_recent_alerts_5m integer := 0;
  v_recent_alerts_30m integer := 0;
  v_stream_alerts_total integer := 0;
  v_recent_same_donor_count integer := 0;
  v_last_seen timestamptz;
  v_priority text := 'medium';
  v_prompt text;
  v_id uuid;
  v_donor text := lower(trim(coalesce(p_donor_username, '')));
  v_streamer_username text := lower(trim(coalesce(p_streamer_tiktok_username, '')));
begin
  if p_user_id is null or p_stream_session_id is null or v_donor = '' then
    return null;
  end if;

  if not public.ai_user_is_promising(p_user_id) then
    return null;
  end if;

  select count(*)::integer
  into v_recent_alerts_5m
  from public.ai_coach_live_alerts a
  where a.user_id = p_user_id
    and a.created_at >= now() - interval '5 minutes';

  if v_recent_alerts_5m >= 2 then
    return null;
  end if;

  select count(*)::integer
  into v_recent_alerts_30m
  from public.ai_coach_live_alerts a
  where a.user_id = p_user_id
    and a.created_at >= now() - interval '30 minutes';

  if v_recent_alerts_30m >= 6 then
    return null;
  end if;

  select count(*)::integer
  into v_stream_alerts_total
  from public.ai_coach_live_alerts a
  where a.user_id = p_user_id
    and a.stream_session_id = p_stream_session_id;

  if v_stream_alerts_total >= 12 then
    return null;
  end if;

  select count(*)::integer
  into v_recent_same_donor_count
  from public.ai_coach_live_alerts a
  where a.user_id = p_user_id
    and lower(a.donor_username) = v_donor
    and a.created_at >= now() - interval '6 hours';

  if v_recent_same_donor_count > 0 then
    return null;
  end if;

  select
    coalesce(sum(coalesce(g.gift_coins, 0) * greatest(1, coalesce(g.gift_count, g.quantity, 1))), 0)::bigint,
    max(g.event_ts)
  into v_streamer_total_coins, v_last_seen
  from public.gift_events g
  where lower(coalesce(g.donor_username, '')) = v_donor
    and (
      g.streamer_id = p_user_id::text
      or (v_streamer_username <> '' and lower(coalesce(g.streamer_id, '')) = v_streamer_username)
    );

  select
    v_streamer_total_coins + coalesce(sum(coalesce(gt.gift_coins, 0) * greatest(1, coalesce(gt.gift_count, 1))), 0)::bigint,
    greatest(v_last_seen, max(gt.created_at))
  into v_streamer_total_coins, v_last_seen
  from public.gift_events_tt gt
  where lower(coalesce(gt.donor_username, '')) = v_donor
    and (v_streamer_username <> '' and lower(coalesce(gt.streamer_tiktok_username, '')) = v_streamer_username);

  select
    coalesce(sum(coalesce(g.gift_coins, 0) * greatest(1, coalesce(g.gift_count, g.quantity, 1))), 0)::bigint,
    coalesce(count(distinct date_trunc('day', g.event_ts)), 0)::integer,
    coalesce(count(distinct nullif(lower(coalesce(g.streamer_id, '')), '')), 0)::integer,
    max(g.event_ts)
  into v_global_total_coins, v_support_days, v_streamers_supported, v_last_seen
  from public.gift_events g
  where lower(coalesce(g.donor_username, '')) = v_donor;

  select
    v_global_total_coins + coalesce(sum(coalesce(gt.gift_coins, 0) * greatest(1, coalesce(gt.gift_count, 1))), 0)::bigint,
    greatest(v_support_days, coalesce(count(distinct gt.day), 0)::integer),
    greatest(v_streamers_supported, coalesce(count(distinct nullif(lower(coalesce(gt.streamer_tiktok_username, '')), '')), 0)::integer),
    greatest(v_last_seen, max(gt.created_at))
  into v_global_total_coins, v_support_days, v_streamers_supported, v_last_seen
  from public.gift_events_tt gt
  where lower(coalesce(gt.donor_username, '')) = v_donor;

  if v_streamer_total_coins < 1000 and v_global_total_coins < 3000 and v_support_days < 2 then
    return null;
  end if;

  if v_streamer_total_coins >= 5000 or v_global_total_coins >= 15000 then
    v_priority := 'high';
  end if;

  v_prompt := format(
    'Конфиденциальный live-сигнал для стримера: в эфире замечен зритель %s. История поддержки: этому стримеру=%s монет, глобально=%s монет, активных дней=%s, поддержанных стримеров=%s, последнее замеченное действие=%s. Дай очень краткий и практичный совет: 1) Как корректно войти в контакт без давления 2) Что сказать в эфире (2-3 фразы) 3) Что делать нельзя, чтобы не потерять доверие. Стиль: деликатно, по делу, без раскрытия чувствительных данных.',
    p_donor_username,
    v_streamer_total_coins,
    v_global_total_coins,
    v_support_days,
    v_streamers_supported,
    coalesce(v_last_seen::text, 'unknown')
  );

  insert into public.ai_coach_live_alerts (
    user_id,
    stream_session_id,
    donor_username,
    alert_type,
    priority,
    prompt_text,
    status,
    is_read,
    metadata
  ) values (
    p_user_id,
    p_stream_session_id,
    p_donor_username,
    'high_value_viewer_present',
    v_priority,
    v_prompt,
    'pending',
    false,
    jsonb_build_object(
      'source', p_source,
      'streamer_total_coins', v_streamer_total_coins,
      'global_total_coins', v_global_total_coins,
      'support_days', v_support_days,
      'streamers_supported', v_streamers_supported,
      'last_seen', v_last_seen
    )
  )
  on conflict (user_id, stream_session_id, donor_username, alert_type) do nothing
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.ai_queue_live_donor_alert(uuid, uuid, text, text, text) to authenticated;

create or replace function public.ai_queue_live_donor_alert_from_tt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
begin
  if nullif(trim(coalesce(new.donor_username, '')), '') is null then
    return new;
  end if;

  select s.id, s.user_id, s.tiktok_username
  into v_session
  from public.stream_sessions s
  where s.user_id is not null
    and s.ended_at is null
    and lower(coalesce(s.tiktok_username, '')) = lower(coalesce(new.streamer_tiktok_username, ''))
  order by s.started_at desc
  limit 1;

  if v_session.id is null then
    return new;
  end if;

  perform public.ai_queue_live_donor_alert(
    v_session.user_id,
    v_session.id,
    v_session.tiktok_username,
    new.donor_username,
    'gift_events_tt'
  );

  return new;
end;
$$;

drop trigger if exists trg_ai_queue_live_donor_alert_from_tt on public.gift_events_tt;
create trigger trg_ai_queue_live_donor_alert_from_tt
after insert on public.gift_events_tt
for each row execute function public.ai_queue_live_donor_alert_from_tt();

create or replace function public.ai_queue_live_donor_alert_from_gift_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_user_id uuid;
begin
  if nullif(trim(coalesce(new.donor_username, '')), '') is null then
    return new;
  end if;

  if coalesce(new.streamer_id, '') ~ '^[0-9a-fA-F-]{36}$' then
    v_user_id := new.streamer_id::uuid;
  end if;

  if v_user_id is null then
    return new;
  end if;

  select s.id, s.user_id, s.tiktok_username
  into v_session
  from public.stream_sessions s
  where s.user_id = v_user_id
    and s.ended_at is null
  order by s.started_at desc
  limit 1;

  if v_session.id is null then
    return new;
  end if;

  perform public.ai_queue_live_donor_alert(
    v_session.user_id,
    v_session.id,
    v_session.tiktok_username,
    new.donor_username,
    'gift_events'
  );

  return new;
end;
$$;

drop trigger if exists trg_ai_queue_live_donor_alert_from_gift_events on public.gift_events;
create trigger trg_ai_queue_live_donor_alert_from_gift_events
after insert on public.gift_events
for each row execute function public.ai_queue_live_donor_alert_from_gift_events();

create or replace function public.ai_claim_pending_live_alert(
  p_user_id uuid default auth.uid()
)
returns table(
  alert_id uuid,
  donor_username text,
  priority text,
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
    from public.ai_coach_live_alerts a
    where a.user_id = v_uid
      and a.status = 'pending'
      and a.alert_text is null
    order by a.created_at asc
    limit 1
    for update skip locked
  ), updated as (
    update public.ai_coach_live_alerts a
    set status = 'processing'
    where a.id in (select id from candidate)
    returning a.id, a.donor_username, a.priority, a.prompt_text, a.stream_session_id, a.created_at
  )
  select u.id, u.donor_username, u.priority, u.prompt_text, u.stream_session_id, u.created_at
  from updated u;
end;
$$;

grant execute on function public.ai_claim_pending_live_alert(uuid) to authenticated;

create or replace function public.ai_complete_live_alert(
  p_alert_id uuid,
  p_alert_text text default null,
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

  update public.ai_coach_live_alerts a
  set
    alert_text = case when p_failed then a.alert_text else p_alert_text end,
    status = case when p_failed then 'failed' else 'generated' end,
    error_text = case when p_failed then coalesce(p_error, 'generation_failed') else null end,
    generated_at = case when p_failed then a.generated_at else now() end,
    is_read = false,
    updated_at = now()
  where a.id = p_alert_id
    and (a.user_id = v_uid or public.is_admin());

  return found;
end;
$$;

grant execute on function public.ai_complete_live_alert(uuid, text, boolean, text) to authenticated;

create or replace function public.ai_list_live_alerts(
  p_user_id uuid default auth.uid(),
  p_only_unread boolean default false,
  p_limit integer default 20
)
returns table(
  id uuid,
  donor_username text,
  alert_type text,
  priority text,
  alert_text text,
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
    a.donor_username,
    a.alert_type,
    a.priority,
    a.alert_text,
    a.status,
    a.stream_session_id,
    a.is_read,
    a.generated_at,
    a.created_at
  from public.ai_coach_live_alerts a
  where a.user_id = coalesce(p_user_id, auth.uid())
    and a.status = 'generated'
    and (not p_only_unread or a.is_read = false)
  order by coalesce(a.generated_at, a.created_at) desc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

grant execute on function public.ai_list_live_alerts(uuid, boolean, integer) to authenticated;

create or replace function public.ai_mark_live_alert_read(
  p_alert_id uuid
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

  update public.ai_coach_live_alerts
  set is_read = true, updated_at = now()
  where id = p_alert_id
    and (user_id = v_uid or public.is_admin());

  return found;
end;
$$;

grant execute on function public.ai_mark_live_alert_read(uuid) to authenticated;

create or replace function public.ai_notifications_unread_count(
  p_user_id uuid default auth.uid()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_total integer := 0;
begin
  if v_uid is null then
    return 0;
  end if;

  if auth.uid() is distinct from v_uid and not public.is_admin() then
    return 0;
  end if;

  select
    coalesce((
      select count(*)::integer
      from public.ai_coach_auto_advices a
      where a.user_id = v_uid
        and a.status = 'generated'
        and a.is_read = false
    ), 0)
    + coalesce((
      select count(*)::integer
      from public.ai_coach_live_alerts l
      where l.user_id = v_uid
        and l.status = 'generated'
        and l.is_read = false
    ), 0)
  into v_total;

  return coalesce(v_total, 0);
end;
$$;

grant execute on function public.ai_notifications_unread_count(uuid) to authenticated;

create or replace function public.ai_notifications_feed(
  p_user_id uuid default auth.uid(),
  p_only_unread boolean default false,
  p_limit integer default 50
)
returns table(
  item_id uuid,
  item_kind text,
  title text,
  body text,
  priority text,
  is_read boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with uid as (
    select coalesce(p_user_id, auth.uid()) as user_id
  ), merged as (
    select
      a.id as item_id,
      'post_stream_advice'::text as item_kind,
      'AI Coach: разбор завершённого эфира'::text as title,
      coalesce(a.advice_text, 'Совет обрабатывается...') as body,
      'medium'::text as priority,
      a.is_read,
      coalesce(a.generated_at, a.created_at) as created_at
    from public.ai_coach_auto_advices a
    join uid on uid.user_id = a.user_id
    where a.status = 'generated'

    union all

    select
      l.id as item_id,
      'live_alert'::text as item_kind,
      format('AI Coach: в эфире замечен ценный зритель %s', l.donor_username) as title,
      coalesce(l.alert_text, 'Сигнал обрабатывается...') as body,
      l.priority,
      l.is_read,
      coalesce(l.generated_at, l.created_at) as created_at
    from public.ai_coach_live_alerts l
    join uid on uid.user_id = l.user_id
    where l.status = 'generated'
  )
  select
    m.item_id,
    m.item_kind,
    m.title,
    m.body,
    m.priority,
    m.is_read,
    m.created_at
  from merged m
  where (not p_only_unread or m.is_read = false)
  order by m.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

grant execute on function public.ai_notifications_feed(uuid, boolean, integer) to authenticated;

create or replace function public.ai_notifications_mark_read(
  p_item_kind text,
  p_item_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_item_kind = 'post_stream_advice' then
    return public.ai_mark_auto_advice_read(p_item_id);
  end if;

  if p_item_kind = 'live_alert' then
    return public.ai_mark_live_alert_read(p_item_id);
  end if;

  return false;
end;
$$;

grant execute on function public.ai_notifications_mark_read(text, uuid) to authenticated;
