create extension if not exists vector;

create table if not exists public.ai_modes (
  id text primary key,
  enabled boolean not null default true,
  provider text not null default 'openai',
  model text not null,
  temperature numeric(3,2) not null default 0.4,
  max_tokens integer not null default 1200,
  cost_limit_daily_usd numeric(10,4) not null default 5,
  rate_limit_per_minute integer not null default 20,
  key_alias text,
  system_prompt text not null,
  allowed_tools jsonb not null default '[]'::jsonb,
  data_requirements jsonb not null default '[]'::jsonb,
  style_guide text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_api_keys (
  id uuid primary key default gen_random_uuid(),
  alias text not null unique,
  provider text not null,
  secret_value text not null,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  mode_id text not null,
  provider text,
  model text,
  router_confidence numeric(4,3),
  router_reason text,
  prompt_text text not null,
  response_text text,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  cost_usd numeric(10,6),
  latency_ms integer,
  feedback smallint,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_chat_logs_user_created_at on public.ai_chat_logs (user_id, created_at desc);
create index if not exists idx_ai_chat_logs_mode_created_at on public.ai_chat_logs (mode_id, created_at desc);

create table if not exists public.policy_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  language text not null default 'ru',
  region text,
  source_url text,
  active boolean not null default true,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.policy_chunks (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.policy_docs(id) on delete cascade,
  chunk_index integer not null,
  language text not null default 'ru',
  region text,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (doc_id, chunk_index)
);

create index if not exists idx_policy_chunks_doc_id on public.policy_chunks (doc_id);

create table if not exists public.policy_qna (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  language text not null default 'ru',
  region text,
  source_chunk_ids uuid[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace view public.ai_api_keys_public as
select
  id,
  alias,
  provider,
  is_active,
  created_by,
  created_at,
  updated_at,
  case
    when length(secret_value) <= 8 then repeat('*', greatest(length(secret_value), 4))
    else left(secret_value, 4) || repeat('*', greatest(length(secret_value) - 8, 4)) || right(secret_value, 4)
  end as secret_masked
from public.ai_api_keys;

alter table public.ai_modes enable row level security;
alter table public.ai_api_keys enable row level security;
alter table public.ai_chat_logs enable row level security;
alter table public.policy_docs enable row level security;
alter table public.policy_chunks enable row level security;
alter table public.policy_qna enable row level security;

revoke all on table public.ai_api_keys from anon, authenticated;
revoke all on table public.ai_api_keys_public from anon, authenticated;
grant select on table public.ai_modes to authenticated;
grant select on table public.policy_docs to authenticated;
grant select on table public.policy_chunks to authenticated;
grant select on table public.policy_qna to authenticated;
grant select on table public.ai_chat_logs to authenticated;
grant select on table public.ai_api_keys_public to authenticated;

drop policy if exists "ai_modes_select_authenticated" on public.ai_modes;
create policy "ai_modes_select_authenticated"
on public.ai_modes
for select
using (auth.uid() is not null);

drop policy if exists "ai_chat_logs_select_own" on public.ai_chat_logs;
create policy "ai_chat_logs_select_own"
on public.ai_chat_logs
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_chat_logs_insert_own" on public.ai_chat_logs;
create policy "ai_chat_logs_insert_own"
on public.ai_chat_logs
for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "policy_docs_select_authenticated" on public.policy_docs;
create policy "policy_docs_select_authenticated"
on public.policy_docs
for select
using (auth.uid() is not null and active = true);

drop policy if exists "policy_chunks_select_authenticated" on public.policy_chunks;
create policy "policy_chunks_select_authenticated"
on public.policy_chunks
for select
using (
  auth.uid() is not null
  and exists (
    select 1 from public.policy_docs d where d.id = policy_chunks.doc_id and d.active = true
  )
);

drop policy if exists "policy_qna_select_authenticated" on public.policy_qna;
create policy "policy_qna_select_authenticated"
on public.policy_qna
for select
using (auth.uid() is not null and active = true);

create or replace function public.ai_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_ai_modes_touch_updated_at on public.ai_modes;
create trigger trg_ai_modes_touch_updated_at
before update on public.ai_modes
for each row execute function public.ai_touch_updated_at();

drop trigger if exists trg_ai_api_keys_touch_updated_at on public.ai_api_keys;
create trigger trg_ai_api_keys_touch_updated_at
before update on public.ai_api_keys
for each row execute function public.ai_touch_updated_at();

drop trigger if exists trg_policy_docs_touch_updated_at on public.policy_docs;
create trigger trg_policy_docs_touch_updated_at
before update on public.policy_docs
for each row execute function public.ai_touch_updated_at();

drop trigger if exists trg_policy_qna_touch_updated_at on public.policy_qna;
create trigger trg_policy_qna_touch_updated_at
before update on public.policy_qna
for each row execute function public.ai_touch_updated_at();

insert into public.ai_modes (
  id,
  enabled,
  provider,
  model,
  temperature,
  max_tokens,
  cost_limit_daily_usd,
  rate_limit_per_minute,
  key_alias,
  system_prompt,
  allowed_tools,
  data_requirements,
  style_guide
)
values
  (
    'progress_report',
    true,
    'openai',
    'gpt-4o-mini',
    0.3,
    1400,
    8,
    20,
    null,
    'Ты AI Coach NovaBoost. Режим: progress_report. Дай структурированный отчёт: Итог, Сильные стороны, Слабые, План, Быстрые задачи. Используй только переданные данные и не выдумывай факты.',
    '["summary", "planning"]'::jsonb,
    '["user_stats", "tasks", "stream_events"]'::jsonb,
    'Конкретно, по делу, без воды'
  ),
  (
    'live_plan',
    true,
    'openai',
    'gpt-4o-mini',
    0.6,
    1200,
    6,
    20,
    null,
    'Ты AI Coach NovaBoost. Режим: live_plan. Создай сценарий эфира с блоками, фразами, реакциями на подарки и пиками активности.',
    '["outline", "phrases"]'::jsonb,
    '["stream_events", "user_stats"]'::jsonb,
    'Практично, с таймингом и формулировками для эфира'
  ),
  (
    'live_review',
    true,
    'openai',
    'gpt-4o-mini',
    0.4,
    1300,
    6,
    20,
    null,
    'Ты AI Coach NovaBoost. Режим: live_review. Сделай разбор эфира: что сработало, что просело, какие действия исправят метрики в следующем эфире.',
    '["review", "action_items"]'::jsonb,
    '["stream_events", "user_stats"]'::jsonb,
    'Конструктивный разбор с приоритетами'
  ),
  (
    'daily_missions',
    true,
    'openai',
    'gpt-4o-mini',
    0.4,
    900,
    4,
    20,
    null,
    'Ты AI Coach NovaBoost. Режим: daily_missions. Верни строго: 3 обязательных, 2 дополнительных, 1 усиление. Пункты должны быть измеримыми и выполнимыми за сегодня.',
    '["missions"]'::jsonb,
    '["tasks", "user_stats"]'::jsonb,
    'Формат чек-листа и измеримые действия'
  ),
  (
    'content_factory',
    true,
    'openai',
    'gpt-4o-mini',
    0.7,
    1400,
    6,
    20,
    null,
    'Ты AI Coach NovaBoost. Режим: content_factory. Генерируй идеи, хуки, сценарии и тексты под TikTok Live.',
    '["ideas", "scripts"]'::jsonb,
    '["stream_events", "user_stats"]'::jsonb,
    'Креативно, но реалистично и под нишу стримера'
  ),
  (
    'tiktok_qa',
    true,
    'openai',
    'gpt-4o-mini',
    0.2,
    1000,
    5,
    25,
    null,
    'Ты AI Policy Helpdesk NovaBoost. Отвечай только по внутренней базе policy context. Если данных недостаточно, прямо скажи об этом и запроси уточнение. Всегда указывай источники.',
    '["policy_rag"]'::jsonb,
    '["policy_chunks"]'::jsonb,
    'Строго по правилам, с источниками'
  ),
  (
    'universal_chat',
    true,
    'openai',
    'gpt-4o-mini',
    0.5,
    1200,
    6,
    30,
    null,
    'Ты универсальный AI Coach NovaBoost. Уточняй намерение, если запрос неясен. Давай практичные рекомендации.',
    '["chat"]'::jsonb,
    '["user_stats", "tasks", "stream_events"]'::jsonb,
    'Дружелюбно и по делу'
  )
on conflict (id) do update set
  enabled = excluded.enabled,
  provider = excluded.provider,
  model = excluded.model,
  temperature = excluded.temperature,
  max_tokens = excluded.max_tokens,
  cost_limit_daily_usd = excluded.cost_limit_daily_usd,
  rate_limit_per_minute = excluded.rate_limit_per_minute,
  system_prompt = excluded.system_prompt,
  allowed_tools = excluded.allowed_tools,
  data_requirements = excluded.data_requirements,
  style_guide = excluded.style_guide,
  updated_at = now();

create or replace function public.ai_route_intent(
  p_text text,
  p_forced_mode text default null
)
returns table(
  mode_id text,
  confidence numeric,
  reason text,
  clarification_question text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_input text := lower(coalesce(p_text, ''));
begin
  if nullif(trim(coalesce(p_forced_mode, '')), '') is not null then
    return query
      select lower(trim(p_forced_mode)), 1.000::numeric, 'forced_mode'::text, null::text;
    return;
  end if;

  if v_input ~ '(правил|policy|бан|ограничени|нарушен|tiktok)' then
    return query select 'tiktok_qa', 0.93::numeric, 'policy_keywords', null::text;
    return;
  end if;

  if v_input ~ '(мисси|задач(и|а)|сегодняшн.*план|чеклист)' then
    return query select 'daily_missions', 0.90::numeric, 'daily_missions_keywords', null::text;
    return;
  end if;

  if v_input ~ '(разбор|review|прошл(ый|ого) эфир|что было на эфире|после эфира)' then
    return query select 'live_review', 0.88::numeric, 'live_review_keywords', null::text;
    return;
  end if;

  if v_input ~ '(сценарий|план эфира|структур.*эфир|блоки эфира)' then
    return query select 'live_plan', 0.90::numeric, 'live_plan_keywords', null::text;
    return;
  end if;

  if v_input ~ '(контент|иде(и|я)|хук|сценари|пост|текст)' then
    return query select 'content_factory', 0.86::numeric, 'content_factory_keywords', null::text;
    return;
  end if;

  if v_input ~ '(прогресс|отч[её]т|метрик|рост|падени|аналит)' then
    return query select 'progress_report', 0.91::numeric, 'progress_report_keywords', null::text;
    return;
  end if;

  return query
    select
      'universal_chat'::text,
      0.44::numeric,
      'low_confidence_fallback'::text,
      'Уточни, что нужно: анализ прогресса, план эфира, разбор, миссии, контент или TikTok-правила?'::text;
end;
$$;

grant execute on function public.ai_route_intent(text, text) to authenticated;

create or replace function public.ai_policy_retrieve(
  p_query text,
  p_language text default 'ru',
  p_region text default null,
  p_limit integer default 5
)
returns table(
  chunk_id uuid,
  doc_title text,
  excerpt text,
  source_url text,
  score numeric
)
language sql
security definer
set search_path = public
as $$
  select
    c.id as chunk_id,
    d.title as doc_title,
    c.content as excerpt,
    d.source_url,
    (
      case when lower(c.content) like '%' || lower(coalesce(p_query, '')) || '%' then 1.0 else 0.2 end
      + case when lower(d.title) like '%' || lower(coalesce(p_query, '')) || '%' then 0.3 else 0.0 end
    )::numeric as score
  from public.policy_chunks c
  join public.policy_docs d on d.id = c.doc_id
  where d.active = true
    and c.language = coalesce(nullif(p_language, ''), c.language)
    and (p_region is null or c.region is null or c.region = p_region)
  order by score desc, c.created_at desc
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$$;

grant execute on function public.ai_policy_retrieve(text, text, text, integer) to authenticated;

create or replace function public.ai_build_user_context(
  p_user_id uuid,
  p_mode_id text default 'universal_chat'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := coalesce(p_user_id, auth.uid());
  v_stats jsonb := '{}'::jsonb;
  v_tasks jsonb := '{}'::jsonb;
  v_events jsonb := '[]'::jsonb;
  v_profile jsonb := '{}'::jsonb;
begin
  if v_user_id is null then
    return jsonb_build_object('error', 'unauthenticated');
  end if;

  select jsonb_build_object(
      'user_id', p.user_id,
      'display_name', p.display_name,
      'username', p.username,
      'language', p.language,
      'country', p.country,
      'is_online', p.is_online
    )
  into v_profile
  from public.profiles p
  where p.user_id = v_user_id;

  select coalesce(ac.payload -> v_user_id::text, '{}'::jsonb)
  into v_stats
  from public.app_content ac
  where ac.key = 'userStats';

  with task_payload as (
    select coalesce(ac.payload, '[]'::jsonb) as payload
    from public.app_content ac
    where ac.key = 'tasks'
  ),
  task_items as (
    select value as item
    from task_payload,
    jsonb_array_elements(payload)
  ),
  progress as (
    select
      count(*)::int as total,
      count(*) filter (where utp.completed) ::int as completed
    from public.user_task_progress utp
    where utp.user_id = v_user_id
      and utp.season_key = to_char(now() at time zone 'utc', 'YYYY-MM')
  )
  select jsonb_build_object(
      'total', coalesce((select total from progress), 0),
      'completed', coalesce((select completed from progress), 0),
      'catalog_total', coalesce((select count(*) from task_items), 0)
    )
  into v_tasks;

  with events_payload as (
    select coalesce(ac.payload, '[]'::jsonb) as payload
    from public.app_content ac
    where ac.key = 'streamEvents'
  ),
  event_items as (
    select value as item
    from events_payload,
    jsonb_array_elements(payload)
    where coalesce(value->>'streamerId', '') = v_user_id::text
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', item->>'id',
        'type', item->>'type',
        'description', item->>'description',
        'timestamp', item->>'timestamp'
      )
      order by item->>'timestamp' desc
    ),
    '[]'::jsonb
  )
  into v_events
  from (
    select item
    from event_items
    order by item->>'timestamp' desc
    limit 40
  ) limited;

  return jsonb_build_object(
    'mode_id', p_mode_id,
    'profile', coalesce(v_profile, '{}'::jsonb),
    'stats', coalesce(v_stats, '{}'::jsonb),
    'tasks', coalesce(v_tasks, '{}'::jsonb),
    'recent_events', coalesce(v_events, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.ai_build_user_context(uuid, text) to authenticated;

create or replace function public.ai_save_feedback(
  p_log_id uuid,
  p_feedback smallint
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_feedback smallint := case when p_feedback >= 0 then 1 else -1 end;
begin
  update public.ai_chat_logs
  set feedback = v_feedback
  where id = p_log_id
    and (user_id = auth.uid() or public.is_admin());

  return found;
end;
$$;

grant execute on function public.ai_save_feedback(uuid, smallint) to authenticated;

create or replace function public.ai_modes_public()
returns table(
  id text,
  enabled boolean,
  provider text,
  model text,
  temperature numeric,
  max_tokens integer,
  cost_limit_daily_usd numeric,
  rate_limit_per_minute integer,
  system_prompt text,
  allowed_tools jsonb,
  data_requirements jsonb,
  style_guide text
)
language sql
security definer
set search_path = public
as $$
  select
    m.id,
    m.enabled,
    m.provider,
    m.model,
    m.temperature,
    m.max_tokens,
    m.cost_limit_daily_usd,
    m.rate_limit_per_minute,
    m.system_prompt,
    m.allowed_tools,
    m.data_requirements,
    m.style_guide
  from public.ai_modes m
  where m.enabled = true or public.is_admin();
$$;

grant execute on function public.ai_modes_public() to authenticated;
