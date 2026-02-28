do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'achievement_progress_type_t'
      and e.enumlabel = 'hidden_combo'
  ) then
    alter type public.achievement_progress_type_t add value 'hidden_combo';
  end if;
end $$;

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
    when 'hidden_combo' then return 'hidden_combo';
    when 'verified_by_admin' then return 'verified_by_admin';
    else return 'manual_only';
  end case;
end;
$$;

create or replace function public.compute_hidden_combo_progress(
  p_user_id uuid,
  p_rule jsonb,
  p_target numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target numeric := greatest(coalesce(p_target, 1), 1);
  v_required_streak integer := coalesce(nullif(p_rule->>'required_streak_days', '')::integer, 0);
  v_required_count integer := coalesce(nullif(p_rule->>'required_event_count', '')::integer, 0);
  v_required_first_minutes integer := coalesce(nullif(p_rule->>'first_minutes', '')::integer, 0);
  v_required_first_minutes_sum numeric := coalesce(nullif(p_rule->>'min_sum_in_first_minutes', '')::numeric, 0);
  v_required_hour integer := coalesce(nullif(p_rule->>'required_hour_utc', '')::integer, -1);
  v_required_gift_id text := nullif(p_rule->>'required_gift_id', '');
  v_min_session_minutes numeric := coalesce(nullif(p_rule->>'min_session_minutes', '')::numeric, 0);
  v_window_days integer := coalesce(nullif(p_rule->>'window_days', '')::integer, 0);
  v_from timestamptz;
  v_event_types text[];
  v_current_streak integer := 0;
  v_event_count integer := 0;
  v_sum_first_minutes numeric := 0;
  v_max_session_minutes numeric := 0;
  v_total_checks integer := 0;
  v_passed_checks integer := 0;
begin
  v_from := case when v_window_days > 0 then now() - make_interval(days => v_window_days) else null end;
  v_event_types := coalesce(array(select jsonb_array_elements_text(coalesce(p_rule->'event_types', '[]'::jsonb))), array[]::text[]);

  if v_required_streak > 0 then
    v_total_checks := v_total_checks + 1;

    with days as (
      select distinct date(coalesce(s.ended_at, s.started_at)) as day
      from public.stream_sessions s
      where s.user_id = p_user_id
        and (v_from is null or coalesce(s.ended_at, s.started_at) >= v_from)
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
    select coalesce(max(streak), 0) into v_current_streak
    from chains;

    if v_current_streak >= v_required_streak then
      v_passed_checks := v_passed_checks + 1;
    end if;
  end if;

  if v_required_count > 0 then
    v_total_checks := v_total_checks + 1;

    select coalesce(count(*), 0)
    into v_event_count
    from public.achievement_events e
    where e.user_id = p_user_id
      and (array_length(v_event_types, 1) is null or e.event_type = any(v_event_types))
      and (v_from is null or e.occurred_at >= v_from)
      and (v_required_gift_id is null or coalesce(e.payload->>'gift_id', e.payload->>'giftId') = v_required_gift_id)
      and (v_required_hour < 0 or extract(hour from e.occurred_at at time zone 'UTC')::integer = v_required_hour);

    if v_event_count >= v_required_count then
      v_passed_checks := v_passed_checks + 1;
    end if;
  end if;

  if v_required_first_minutes > 0 and v_required_first_minutes_sum > 0 then
    v_total_checks := v_total_checks + 1;

    select coalesce(sum(
      coalesce(e.numeric_value, nullif(e.payload->>'value', '')::numeric, 0)
    ), 0)
    into v_sum_first_minutes
    from public.achievement_events e
    where e.user_id = p_user_id
      and (array_length(v_event_types, 1) is null or e.event_type = any(v_event_types))
      and (v_from is null or e.occurred_at >= v_from)
      and coalesce(nullif(e.payload->>'minute_from_start', '')::integer, 9999) <= v_required_first_minutes;

    if v_sum_first_minutes >= v_required_first_minutes_sum then
      v_passed_checks := v_passed_checks + 1;
    end if;
  end if;

  if v_min_session_minutes > 0 then
    v_total_checks := v_total_checks + 1;

    select coalesce(max(greatest(0, extract(epoch from (s.ended_at - s.started_at))) / 60.0), 0)
    into v_max_session_minutes
    from public.stream_sessions s
    where s.user_id = p_user_id
      and s.ended_at is not null
      and (v_from is null or s.started_at >= v_from);

    if v_max_session_minutes >= v_min_session_minutes then
      v_passed_checks := v_passed_checks + 1;
    end if;
  end if;

  if v_total_checks = 0 then
    return 0;
  end if;

  if v_passed_checks = v_total_checks then
    return v_target;
  end if;

  return greatest(0, least(v_target, round((v_passed_checks::numeric / v_total_checks::numeric) * v_target, 4)));
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

    when 'hidden_combo' then
      v_value := public.compute_hidden_combo_progress(p_user_id, p_rule, p_target);

    when 'verified_by_admin' then
      v_value := 0;

    when 'manual_only' then
      v_value := 0;
  end case;

  return least(greatest(coalesce(v_value, 0), 0), greatest(p_target, 1));
end;
$$;

create or replace function public.build_achievement_unlock_snapshot(
  p_user_id uuid,
  p_achievement_id text,
  p_progress numeric,
  p_target numeric,
  p_rule jsonb default '{}'::jsonb,
  p_progress_type public.achievement_progress_type_t default 'manual_only'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_types text[];
  v_last_event record;
  v_last_session record;
begin
  v_event_types := coalesce(array(select jsonb_array_elements_text(coalesce(p_rule->'event_types', '[]'::jsonb))), array[]::text[]);

  select e.stream_id, e.occurred_at, e.event_type, e.numeric_value, e.payload
  into v_last_event
  from public.achievement_events e
  where e.user_id = p_user_id
    and (array_length(v_event_types, 1) is null or e.event_type = any(v_event_types))
  order by e.occurred_at desc
  limit 1;

  select s.id, s.started_at, s.ended_at,
         greatest(0, extract(epoch from (coalesce(s.ended_at, now()) - s.started_at)) / 60.0) as duration_minutes
  into v_last_session
  from public.stream_sessions s
  where s.user_id = p_user_id
  order by coalesce(s.ended_at, s.started_at) desc
  limit 1;

  return jsonb_strip_nulls(jsonb_build_object(
    'achievement_id', p_achievement_id,
    'progress_value', p_progress,
    'target_value', p_target,
    'progress_type', p_progress_type,
    'rule', coalesce(p_rule, '{}'::jsonb),
    'trigger', coalesce(v_last_event.event_type, 'computed_rule'),
    'stream_id', coalesce(v_last_event.stream_id, v_last_session.id),
    'event_at', v_last_event.occurred_at,
    'gift_id', coalesce(v_last_event.payload->>'gift_id', v_last_event.payload->>'giftId'),
    'numeric_value', v_last_event.numeric_value,
    'payload', v_last_event.payload,
    'session_started_at', v_last_session.started_at,
    'session_ended_at', v_last_session.ended_at,
    'duration_minutes', v_last_session.duration_minutes,
    'unlocked_at', now()
  ));
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
        public.build_achievement_unlock_snapshot(
          p_user_id,
          v_achievement_id,
          v_progress,
          v_target,
          coalesce(v_item->'rule', '{}'::jsonb),
          v_type
        )
      );
    end if;

    v_updated := v_updated + 1;
  end loop;

  return jsonb_build_object('ok', true, 'updated', v_updated);
end;
$$;

create or replace function public.get_achievement_public_stats(
  p_achievement_ids text[] default null
)
returns table(
  achievement_id text,
  unlock_count bigint,
  last_unlocked_at timestamptz,
  last_user_id uuid,
  last_user_name text
)
language sql
security definer
set search_path = public
stable
as $$
  with filtered as (
    select u.*
    from public.achievement_unlocks u
    where p_achievement_ids is null
      or array_length(p_achievement_ids, 1) is null
      or u.achievement_id = any(p_achievement_ids)
  ), last_unlock as (
    select distinct on (f.achievement_id)
      f.achievement_id,
      f.unlocked_at,
      f.user_id
    from filtered f
    order by f.achievement_id, f.unlocked_at desc
  ), counts as (
    select f.achievement_id, count(*) as unlock_count
    from filtered f
    group by f.achievement_id
  )
  select
    c.achievement_id,
    c.unlock_count,
    l.unlocked_at as last_unlocked_at,
    l.user_id as last_user_id,
    coalesce(p.display_name, p.username, 'Стример') as last_user_name
  from counts c
  left join last_unlock l on l.achievement_id = c.achievement_id
  left join public.profiles p on p.user_id = l.user_id;
$$;

grant execute on function public.compute_hidden_combo_progress(uuid, jsonb, numeric) to authenticated;
grant execute on function public.build_achievement_unlock_snapshot(uuid, text, numeric, numeric, jsonb, public.achievement_progress_type_t) to authenticated;
grant execute on function public.get_achievement_public_stats(text[]) to authenticated;