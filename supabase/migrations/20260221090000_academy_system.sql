do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'academy_block_type_t'
      and n.nspname = 'public'
  ) then
    create type public.academy_block_type_t as enum (
      'video',
      'text',
      'image',
      'gallery',
      'checklist',
      'quiz',
      'cta',
      'reward',
      'task'
    );
  end if;
end $$;

create table if not exists public.academy_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  difficulty integer not null default 1 check (difficulty between 1 and 5),
  is_published boolean not null default false,
  order_index integer not null default 0,
  required_level integer not null default 1,
  tags text[] not null default '{}',
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  title text not null,
  summary text,
  order_index integer not null default 0,
  difficulty integer not null default 1 check (difficulty between 1 and 5),
  estimated_minutes integer not null default 15,
  required_video_percent integer not null default 70 check (required_video_percent between 1 and 100),
  xp_base integer not null default 50 check (xp_base >= 0),
  task_template jsonb not null default '{}'::jsonb,
  reward_meta jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  block_type public.academy_block_type_t not null,
  title text,
  content jsonb not null default '{}'::jsonb,
  required boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  title text not null,
  passing_score integer not null default 70 check (passing_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.academy_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  status text not null default 'started' check (status in ('started', 'completed')),
  watch_seconds integer not null default 0,
  video_seconds integer not null default 0,
  video_progress_percent integer not null default 0,
  task_completed boolean not null default false,
  quiz_score integer,
  xp_awarded integer not null default 0,
  last_xp_award_at timestamptz,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create table if not exists public.academy_rewards (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  reward_type text not null check (reward_type in ('xp', 'badge', 'feature_unlock', 'gift', 'trust')),
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  activity_date date not null,
  stream_minutes integer not null default 0,
  lessons_completed integer not null default 0,
  xp_earned integer not null default 0,
  engagement_score numeric(5,2) not null default 1.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, activity_date)
);

create table if not exists public.academy_generated_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  title text not null,
  verification_type text not null default 'stream_minutes' check (verification_type in ('stream_minutes', 'manual')),
  verification_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'verified', 'failed')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists idx_academy_lessons_course on public.academy_lessons(course_id, order_index);
create index if not exists idx_academy_blocks_lesson on public.academy_blocks(lesson_id, order_index);
create index if not exists idx_academy_progress_user on public.academy_progress(user_id, lesson_id);
create index if not exists idx_academy_activity_user_day on public.academy_user_activity(user_id, activity_date);

create or replace function public.set_updated_at_generic()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_academy_courses_updated_at on public.academy_courses;
create trigger trg_academy_courses_updated_at
before update on public.academy_courses
for each row execute function public.set_updated_at_generic();

drop trigger if exists trg_academy_lessons_updated_at on public.academy_lessons;
create trigger trg_academy_lessons_updated_at
before update on public.academy_lessons
for each row execute function public.set_updated_at_generic();

drop trigger if exists trg_academy_blocks_updated_at on public.academy_blocks;
create trigger trg_academy_blocks_updated_at
before update on public.academy_blocks
for each row execute function public.set_updated_at_generic();

drop trigger if exists trg_academy_progress_updated_at on public.academy_progress;
create trigger trg_academy_progress_updated_at
before update on public.academy_progress
for each row execute function public.set_updated_at_generic();

drop trigger if exists trg_academy_activity_updated_at on public.academy_user_activity;
create trigger trg_academy_activity_updated_at
before update on public.academy_user_activity
for each row execute function public.set_updated_at_generic();

alter table public.academy_courses enable row level security;
alter table public.academy_lessons enable row level security;
alter table public.academy_blocks enable row level security;
alter table public.academy_quizzes enable row level security;
alter table public.academy_progress enable row level security;
alter table public.academy_rewards enable row level security;
alter table public.academy_user_activity enable row level security;
alter table public.academy_generated_tasks enable row level security;

drop policy if exists "academy_courses_read" on public.academy_courses;
create policy "academy_courses_read"
on public.academy_courses
for select
to authenticated
using (is_published = true or public.is_admin());

drop policy if exists "academy_courses_admin_write" on public.academy_courses;
create policy "academy_courses_admin_write"
on public.academy_courses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "academy_lessons_read" on public.academy_lessons;
create policy "academy_lessons_read"
on public.academy_lessons
for select
to authenticated
using (
  is_published = true
  or public.is_admin()
  or exists (
    select 1
    from public.academy_courses c
    where c.id = course_id
      and c.is_published = true
  )
);

drop policy if exists "academy_lessons_admin_write" on public.academy_lessons;
create policy "academy_lessons_admin_write"
on public.academy_lessons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "academy_blocks_read" on public.academy_blocks;
create policy "academy_blocks_read"
on public.academy_blocks
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.academy_lessons l
    join public.academy_courses c on c.id = l.course_id
    where l.id = lesson_id
      and l.is_published = true
      and c.is_published = true
  )
);

drop policy if exists "academy_blocks_admin_write" on public.academy_blocks;
create policy "academy_blocks_admin_write"
on public.academy_blocks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "academy_quizzes_read" on public.academy_quizzes;
create policy "academy_quizzes_read"
on public.academy_quizzes
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.academy_lessons l
    join public.academy_courses c on c.id = l.course_id
    where l.id = lesson_id
      and l.is_published = true
      and c.is_published = true
  )
);

drop policy if exists "academy_quizzes_admin_write" on public.academy_quizzes;
create policy "academy_quizzes_admin_write"
on public.academy_quizzes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "academy_progress_self_read" on public.academy_progress;
create policy "academy_progress_self_read"
on public.academy_progress
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "academy_progress_self_write" on public.academy_progress;
create policy "academy_progress_self_write"
on public.academy_progress
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "academy_rewards_read" on public.academy_rewards;
create policy "academy_rewards_read"
on public.academy_rewards
for select
to authenticated
using (public.is_admin() or exists (
  select 1
  from public.academy_lessons l
  join public.academy_courses c on c.id = l.course_id
  where l.id = lesson_id and l.is_published = true and c.is_published = true
));

drop policy if exists "academy_rewards_admin_write" on public.academy_rewards;
create policy "academy_rewards_admin_write"
on public.academy_rewards
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "academy_activity_self_read" on public.academy_user_activity;
create policy "academy_activity_self_read"
on public.academy_user_activity
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "academy_activity_self_upsert" on public.academy_user_activity;
create policy "academy_activity_self_upsert"
on public.academy_user_activity
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "academy_generated_tasks_self_read" on public.academy_generated_tasks;
create policy "academy_generated_tasks_self_read"
on public.academy_generated_tasks
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "academy_generated_tasks_self_write" on public.academy_generated_tasks;
create policy "academy_generated_tasks_self_write"
on public.academy_generated_tasks
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create or replace function public.get_user_level_from_app_content(p_user_id uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce((payload -> p_user_id::text ->> 'level')::integer, 1)
  from public.app_content
  where key = 'userStats'
  limit 1;
$$;

create or replace function public.apply_xp_to_user_stats(
  p_user_id uuid,
  p_xp_gain integer
)
returns table(level integer, xp integer, xp_to_next integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_user_stats jsonb;
  v_level integer;
  v_xp integer;
  v_xp_to_next integer;
begin
  if p_xp_gain <= 0 then
    return query select 1, 0, 1000;
    return;
  end if;

  insert into public.app_content(key, payload)
  values ('userStats', '{}'::jsonb)
  on conflict (key) do nothing;

  select payload into v_payload
  from public.app_content
  where key = 'userStats'
  for update;

  v_user_stats := coalesce(v_payload -> p_user_id::text, '{}'::jsonb);
  v_level := coalesce((v_user_stats ->> 'level')::integer, 1);
  v_xp := coalesce((v_user_stats ->> 'xp')::integer, 0) + p_xp_gain;
  v_xp_to_next := coalesce((v_user_stats ->> 'xpToNextLevel')::integer, 1000);

  while v_xp >= v_xp_to_next loop
    v_xp := v_xp - v_xp_to_next;
    v_level := v_level + 1;
    v_xp_to_next := least(100000, round(v_xp_to_next * 1.15)::integer);
  end loop;

  v_user_stats := jsonb_build_object(
    'level', v_level,
    'xp', v_xp,
    'xpToNextLevel', v_xp_to_next
  ) || v_user_stats;

  v_payload := jsonb_set(v_payload, array[p_user_id::text], v_user_stats, true);

  update public.app_content
  set payload = v_payload
  where key = 'userStats';

  return query select v_level, v_xp, v_xp_to_next;
end;
$$;

create or replace function public.academy_mark_video_progress(
  p_lesson_id uuid,
  p_watch_seconds integer,
  p_video_seconds integer
)
returns public.academy_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_percent integer;
  v_row public.academy_progress;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  if p_video_seconds <= 0 then
    v_percent := 0;
  else
    v_percent := least(100, floor((greatest(p_watch_seconds, 0)::numeric / p_video_seconds::numeric) * 100)::integer);
  end if;

  insert into public.academy_progress (user_id, lesson_id, watch_seconds, video_seconds, video_progress_percent)
  values (auth.uid(), p_lesson_id, greatest(p_watch_seconds, 0), greatest(p_video_seconds, 0), v_percent)
  on conflict (user_id, lesson_id)
  do update set
    watch_seconds = greatest(public.academy_progress.watch_seconds, excluded.watch_seconds),
    video_seconds = greatest(public.academy_progress.video_seconds, excluded.video_seconds),
    video_progress_percent = greatest(public.academy_progress.video_progress_percent, excluded.video_progress_percent),
    updated_at = now();

  select * into v_row
  from public.academy_progress
  where user_id = auth.uid() and lesson_id = p_lesson_id;

  return v_row;
end;
$$;

create or replace function public.academy_confirm_task(
  p_lesson_id uuid,
  p_completed boolean default true
)
returns public.academy_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.academy_progress;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  insert into public.academy_progress (user_id, lesson_id, task_completed)
  values (auth.uid(), p_lesson_id, p_completed)
  on conflict (user_id, lesson_id)
  do update set
    task_completed = p_completed,
    updated_at = now();

  if p_completed then
    insert into public.academy_generated_tasks(
      user_id,
      lesson_id,
      title,
      verification_type,
      verification_payload,
      status
    )
    select
      auth.uid(),
      l.id,
      coalesce(l.task_template ->> 'title', 'Провести стрим не менее 60 минут'),
      coalesce(l.task_template ->> 'verification_type', 'stream_minutes'),
      coalesce(l.task_template, '{}'::jsonb),
      'pending'
    from public.academy_lessons l
    where l.id = p_lesson_id
      and not exists (
        select 1
        from public.academy_generated_tasks t
        where t.user_id = auth.uid()
          and t.lesson_id = p_lesson_id
      );
  end if;

  select * into v_row
  from public.academy_progress
  where user_id = auth.uid() and lesson_id = p_lesson_id;

  return v_row;
end;
$$;

create or replace function public.academy_calculate_xp(
  p_user_id uuid,
  p_lesson_id uuid
)
returns integer
language plpgsql
stable
set search_path = public
as $$
declare
  v_base integer;
  v_difficulty integer;
  v_user_level integer;
  v_stream_minutes integer;
  v_daily_xp integer;
  v_engagement numeric;
  v_level_multiplier numeric;
  v_xp integer;
  v_daily_cap integer := 1200;
begin
  select xp_base, difficulty
  into v_base, v_difficulty
  from public.academy_lessons
  where id = p_lesson_id;

  if v_base is null then
    return 0;
  end if;

  v_user_level := greatest(1, public.get_user_level_from_app_content(p_user_id));

  select coalesce(stream_minutes, 0), coalesce(xp_earned, 0), coalesce(engagement_score, 1.0)
  into v_stream_minutes, v_daily_xp, v_engagement
  from public.academy_user_activity
  where user_id = p_user_id
    and activity_date = current_date;

  if v_engagement is null then
    v_engagement := 1.0;
  end if;

  if v_stream_minutes < 30 then
    return 0;
  end if;

  v_level_multiplier := case
    when v_user_level < 10 then 1.10
    when v_user_level < 25 then 1.00
    when v_user_level < 50 then 0.92
    else 0.85
  end;

  v_xp := round(v_base * greatest(v_difficulty, 1) * greatest(v_engagement, 0.4) * v_level_multiplier)::integer;

  if v_daily_xp >= v_daily_cap then
    return 0;
  end if;

  if v_daily_xp > 700 then
    v_xp := round(v_xp * 0.50)::integer;
  elsif v_daily_xp > 400 then
    v_xp := round(v_xp * 0.70)::integer;
  end if;

  if v_daily_xp + v_xp > v_daily_cap then
    v_xp := greatest(0, v_daily_cap - v_daily_xp);
  end if;

  return greatest(v_xp, 0);
end;
$$;

create or replace function public.academy_award_xp(
  p_lesson_id uuid
)
returns table(granted_xp integer, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_required_percent integer;
  v_progress public.academy_progress;
  v_xp integer;
  v_now timestamptz := now();
  v_cooldown interval := interval '20 minutes';
begin
  v_uid := auth.uid();
  if v_uid is null then
    return query select 0, 'unauthenticated';
    return;
  end if;

  select required_video_percent
  into v_required_percent
  from public.academy_lessons
  where id = p_lesson_id;

  if v_required_percent is null then
    return query select 0, 'lesson_not_found';
    return;
  end if;

  select *
  into v_progress
  from public.academy_progress
  where user_id = v_uid
    and lesson_id = p_lesson_id
  for update;

  if v_progress.id is null then
    return query select 0, 'progress_not_found';
    return;
  end if;

  if coalesce(v_progress.last_xp_award_at, to_timestamp(0)) + v_cooldown > v_now then
    return query select 0, 'cooldown_active';
    return;
  end if;

  if v_progress.video_progress_percent < v_required_percent then
    return query select 0, 'video_requirement_not_met';
    return;
  end if;

  if v_progress.task_completed is distinct from true then
    return query select 0, 'task_not_completed';
    return;
  end if;

  v_xp := public.academy_calculate_xp(v_uid, p_lesson_id);

  if v_xp <= 0 then
    return query select 0, 'xp_cap_or_inactive';
    return;
  end if;

  perform public.apply_xp_to_user_stats(v_uid, v_xp);

  insert into public.academy_user_activity(user_id, activity_date, xp_earned, lessons_completed)
  values (v_uid, current_date, v_xp, 1)
  on conflict (user_id, activity_date)
  do update set
    xp_earned = public.academy_user_activity.xp_earned + excluded.xp_earned,
    lessons_completed = public.academy_user_activity.lessons_completed + excluded.lessons_completed,
    updated_at = now();

  update public.academy_progress
  set
    xp_awarded = xp_awarded + v_xp,
    status = 'completed',
    completed_at = coalesce(completed_at, now()),
    last_xp_award_at = now(),
    updated_at = now()
  where id = v_progress.id;

  return query select v_xp, 'ok';
end;
$$;

grant execute on function public.get_user_level_from_app_content(uuid) to authenticated;
grant execute on function public.apply_xp_to_user_stats(uuid, integer) to authenticated;
grant execute on function public.academy_mark_video_progress(uuid, integer, integer) to authenticated;
grant execute on function public.academy_confirm_task(uuid, boolean) to authenticated;
grant execute on function public.academy_calculate_xp(uuid, uuid) to authenticated;
grant execute on function public.academy_award_xp(uuid) to authenticated;
