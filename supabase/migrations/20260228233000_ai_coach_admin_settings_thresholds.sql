create table if not exists public.ai_coach_settings (
  key text primary key,
  value_json jsonb not null,
  description text,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.ai_coach_settings enable row level security;

revoke all on table public.ai_coach_settings from anon;
grant select on table public.ai_coach_settings to authenticated;

drop policy if exists "ai_coach_settings_select_authenticated" on public.ai_coach_settings;
create policy "ai_coach_settings_select_authenticated"
on public.ai_coach_settings
for select
using (auth.uid() is not null);

insert into public.ai_coach_settings (key, value_json, description)
values
  ('promising.min_streams_30d', '4'::jsonb, 'Минимум эфиров за 30 дней для перспективного стримера'),
  ('promising.min_coins_30d', '5000'::jsonb, 'Минимум монет за 30 дней для перспективного стримера'),
  ('promising.min_completed_tasks', '5'::jsonb, 'Минимум завершённых задач текущего месяца'),
  ('promising.min_completion_ratio', '0.35'::jsonb, 'Минимальная доля выполненных задач текущего месяца'),
  ('promising.min_streams_with_tasks', '2'::jsonb, 'Минимум эфиров при проверке completed_tasks'),
  ('promising.min_streams_with_ratio', '1'::jsonb, 'Минимум эфиров при проверке completion_ratio'),
  ('alerts.min_streamer_coins', '1000'::jsonb, 'Минимальный вклад донатера для этого стримера'),
  ('alerts.min_global_coins', '3000'::jsonb, 'Минимальный глобальный вклад донатера'),
  ('alerts.min_support_days', '2'::jsonb, 'Минимум дней активности донатера'),
  ('alerts.high_priority_streamer_coins', '5000'::jsonb, 'Порог высокого приоритета по вкладу для стримера'),
  ('alerts.high_priority_global_coins', '15000'::jsonb, 'Порог высокого приоритета по глобальному вкладу'),
  ('alerts.max_per_5m', '2'::jsonb, 'Максимум live-алертов за 5 минут'),
  ('alerts.max_per_30m', '6'::jsonb, 'Максимум live-алертов за 30 минут'),
  ('alerts.max_per_stream', '12'::jsonb, 'Максимум live-алертов за эфир'),
  ('alerts.same_donor_cooldown_hours', '6'::jsonb, 'Кулдаун повторного алерта по тому же донатеру (часы)')
on conflict (key) do update set
  value_json = excluded.value_json,
  description = excluded.description,
  updated_at = now();

create or replace function public.ai_coach_settings_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_ai_coach_settings_touch_updated_at on public.ai_coach_settings;
create trigger trg_ai_coach_settings_touch_updated_at
before update on public.ai_coach_settings
for each row execute function public.ai_coach_settings_touch_updated_at();

create or replace function public.ai_coach_setting_number(
  p_key text,
  p_default numeric
)
returns numeric
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_text text;
  v_value numeric;
begin
  select value_json::text
  into v_text
  from public.ai_coach_settings
  where key = p_key;

  if v_text is null then
    return p_default;
  end if;

  begin
    v_value := trim(both '"' from v_text)::numeric;
  exception when others then
    return p_default;
  end;

  return coalesce(v_value, p_default);
end;
$$;

grant execute on function public.ai_coach_setting_number(text, numeric) to authenticated;

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

  v_min_streams_30d integer := greatest(0, public.ai_coach_setting_number('promising.min_streams_30d', 4)::integer);
  v_min_coins_30d bigint := greatest(0, public.ai_coach_setting_number('promising.min_coins_30d', 5000)::bigint);
  v_min_completed_tasks integer := greatest(0, public.ai_coach_setting_number('promising.min_completed_tasks', 5)::integer);
  v_min_completion_ratio numeric := greatest(0, public.ai_coach_setting_number('promising.min_completion_ratio', 0.35));
  v_min_streams_with_tasks integer := greatest(0, public.ai_coach_setting_number('promising.min_streams_with_tasks', 2)::integer);
  v_min_streams_with_ratio integer := greatest(0, public.ai_coach_setting_number('promising.min_streams_with_ratio', 1)::integer);
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

  if v_streams_30d >= v_min_streams_30d then
    return true;
  end if;

  if v_coins_30d >= v_min_coins_30d then
    return true;
  end if;

  if v_streams_30d >= v_min_streams_with_tasks and v_tasks_completed >= v_min_completed_tasks then
    return true;
  end if;

  if v_streams_30d >= v_min_streams_with_ratio and v_completion_ratio >= v_min_completion_ratio then
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.ai_user_is_promising(uuid) to authenticated;

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

  v_min_streamer_coins bigint := greatest(0, public.ai_coach_setting_number('alerts.min_streamer_coins', 1000)::bigint);
  v_min_global_coins bigint := greatest(0, public.ai_coach_setting_number('alerts.min_global_coins', 3000)::bigint);
  v_min_support_days integer := greatest(0, public.ai_coach_setting_number('alerts.min_support_days', 2)::integer);
  v_high_priority_streamer_coins bigint := greatest(0, public.ai_coach_setting_number('alerts.high_priority_streamer_coins', 5000)::bigint);
  v_high_priority_global_coins bigint := greatest(0, public.ai_coach_setting_number('alerts.high_priority_global_coins', 15000)::bigint);
  v_max_per_5m integer := greatest(1, public.ai_coach_setting_number('alerts.max_per_5m', 2)::integer);
  v_max_per_30m integer := greatest(1, public.ai_coach_setting_number('alerts.max_per_30m', 6)::integer);
  v_max_per_stream integer := greatest(1, public.ai_coach_setting_number('alerts.max_per_stream', 12)::integer);
  v_same_donor_cooldown_hours integer := greatest(1, public.ai_coach_setting_number('alerts.same_donor_cooldown_hours', 6)::integer);
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

  if v_recent_alerts_5m >= v_max_per_5m then
    return null;
  end if;

  select count(*)::integer
  into v_recent_alerts_30m
  from public.ai_coach_live_alerts a
  where a.user_id = p_user_id
    and a.created_at >= now() - interval '30 minutes';

  if v_recent_alerts_30m >= v_max_per_30m then
    return null;
  end if;

  select count(*)::integer
  into v_stream_alerts_total
  from public.ai_coach_live_alerts a
  where a.user_id = p_user_id
    and a.stream_session_id = p_stream_session_id;

  if v_stream_alerts_total >= v_max_per_stream then
    return null;
  end if;

  select count(*)::integer
  into v_recent_same_donor_count
  from public.ai_coach_live_alerts a
  where a.user_id = p_user_id
    and lower(a.donor_username) = v_donor
    and a.created_at >= now() - make_interval(hours => v_same_donor_cooldown_hours);

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

  if v_streamer_total_coins < v_min_streamer_coins and v_global_total_coins < v_min_global_coins and v_support_days < v_min_support_days then
    return null;
  end if;

  if v_streamer_total_coins >= v_high_priority_streamer_coins or v_global_total_coins >= v_high_priority_global_coins then
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
