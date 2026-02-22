-- Mobile app compatibility layer for ttboost.db schema
-- This migration prepares Postgres tables/columns expected by the mobile models.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text,
  tiktok_username text,
  email text,
  avatar_filename text,
  password_hash text,
  role text,
  is_banned boolean not null default false,
  banned_at timestamptz,
  banned_reason text,
  region text,
  last_login_at timestamptz,
  last_login_ip text,
  last_user_agent text,
  last_client_platform text,
  last_client_os text,
  last_device text,
  last_ws_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists is_banned boolean not null default false,
  add column if not exists banned_at timestamptz,
  add column if not exists banned_reason text,
  add column if not exists region text,
  add column if not exists last_login_at timestamptz,
  add column if not exists last_login_ip text,
  add column if not exists last_user_agent text,
  add column if not exists last_client_platform text,
  add column if not exists last_client_os text,
  add column if not exists last_device text,
  add column if not exists last_ws_at timestamptz;

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  voice_id text,
  tts_enabled boolean not null default true,
  gift_sounds_enabled boolean not null default true,
  auto_connect_live boolean not null default false,
  tts_volume integer not null default 100,
  gifts_volume integer not null default 100,
  chat_tts_mode text,
  chat_tts_prefixes text,
  chat_tts_min_diamonds integer not null default 0,
  silence_enabled boolean not null default false,
  silence_minutes integer not null default 0,
  unique(user_id)
);

alter table public.user_settings
  add column if not exists auto_connect_live boolean not null default false,
  add column if not exists chat_tts_min_diamonds integer not null default 0,
  add column if not exists chat_tts_mode text,
  add column if not exists chat_tts_prefixes text,
  add column if not exists silence_enabled boolean not null default false,
  add column if not exists silence_minutes integer not null default 0;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stream_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  tiktok_username text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'started'
);

create table if not exists public.license_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  plan text,
  status text,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  user_id uuid,
  max_devices integer not null default 1,
  devices_bound integer not null default 0
);

create table if not exists public.sound_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  filename text,
  url text,
  bytes bigint,
  duration_ms integer,
  kind text,
  created_at timestamptz not null default now()
);

create table if not exists public.store_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  platform text,
  product_id text,
  purchase_token text,
  transaction_id text,
  status text,
  expires_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.web_purchases (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  email text,
  plan text,
  ttl_days integer,
  amount numeric(12,2),
  currency text,
  license_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_tiktok_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  username text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists public.triggers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  event_type text,
  condition_key text,
  condition_value text,
  enabled boolean not null default true,
  priority integer not null default 0,
  action text,
  action_params jsonb,
  created_at timestamptz not null default now(),
  executed_count integer not null default 0,
  trigger_name text,
  combo_count integer not null default 0
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null,
  target_user_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  platform text,
  ip text,
  user_agent text,
  region text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text,
  title text,
  body text,
  link text,
  level text,
  type text,
  targeting text,
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default true,
  created_by_user_id uuid,
  audience text,
  audience_value text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_targets (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid,
  user_id uuid,
  read_at timestamptz not null default now()
);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  code_hash text,
  expires_at timestamptz,
  used_at timestamptz,
  attempts integer not null default 0,
  request_ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.push_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  platform text,
  token text,
  enabled boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tiktok_profile_cache (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  avatar_url text,
  display_name text,
  fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.streamer_stats (
  id uuid primary key default gen_random_uuid(),
  streamer_id text not null,
  total_coins bigint not null default 0,
  total_gifts bigint not null default 0,
  today_date date,
  today_coins bigint not null default 0,
  yesterday_date date,
  yesterday_coins bigint not null default 0,
  last_7d_anchor date,
  last_7d_coins bigint not null default 0,
  last_30d_anchor date,
  last_30d_coins bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.streamer_stats_tt (
  id uuid primary key default gen_random_uuid(),
  streamer_tiktok_username text not null,
  total_coins bigint not null default 0,
  total_gifts bigint not null default 0,
  today_date date,
  today_coins bigint not null default 0,
  yesterday_date date,
  yesterday_coins bigint not null default 0,
  last_7d_anchor date,
  last_7d_coins bigint not null default 0,
  last_30d_anchor date,
  last_30d_coins bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.donor_stats (
  id uuid primary key default gen_random_uuid(),
  streamer_id text not null,
  donor_username text not null,
  total_coins bigint not null default 0,
  total_gifts bigint not null default 0,
  today_date date,
  today_coins bigint not null default 0,
  yesterday_date date,
  yesterday_coins bigint not null default 0,
  last_7d_anchor date,
  last_7d_coins bigint not null default 0,
  last_30d_anchor date,
  last_30d_coins bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.donor_stats_tt (
  id uuid primary key default gen_random_uuid(),
  streamer_tiktok_username text not null,
  donor_username text not null,
  total_coins bigint not null default 0,
  total_gifts bigint not null default 0,
  today_date date,
  today_coins bigint not null default 0,
  yesterday_date date,
  yesterday_coins bigint not null default 0,
  last_7d_anchor date,
  last_7d_coins bigint not null default 0,
  last_30d_anchor date,
  last_30d_coins bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.gift_events_tt (
  id uuid primary key default gen_random_uuid(),
  streamer_tiktok_username text not null,
  donor_username text,
  gift_id text,
  gift_name text,
  gift_count integer not null default 1,
  gift_coins bigint not null default 0,
  day date,
  created_at timestamptz not null default now()
);

alter table public.gift_events
  add column if not exists streamer_id text,
  add column if not exists donor_username text,
  add column if not exists gift_id text,
  add column if not exists gift_name text,
  add column if not exists gift_count integer,
  add column if not exists gift_coins bigint,
  add column if not exists day date,
  add column if not exists created_at timestamptz;

create or replace function public.set_updated_at_mobile_compat()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_store_purchases_updated_at_mobile on public.store_purchases;
create trigger trg_store_purchases_updated_at_mobile
before update on public.store_purchases
for each row execute function public.set_updated_at_mobile_compat();

drop trigger if exists trg_push_device_tokens_updated_at_mobile on public.push_device_tokens;
create trigger trg_push_device_tokens_updated_at_mobile
before update on public.push_device_tokens
for each row execute function public.set_updated_at_mobile_compat();

drop trigger if exists trg_tiktok_profile_cache_updated_at_mobile on public.tiktok_profile_cache;
create trigger trg_tiktok_profile_cache_updated_at_mobile
before update on public.tiktok_profile_cache
for each row execute function public.set_updated_at_mobile_compat();

create index if not exists idx_mobile_users_email on public.users(email);
create index if not exists idx_mobile_users_username on public.users(username);
create index if not exists idx_mobile_user_sessions_user_id on public.user_sessions(user_id, created_at desc);
create index if not exists idx_mobile_notifications_created_at on public.notifications(created_at desc);
create index if not exists idx_mobile_notification_targets_user_id on public.notification_targets(user_id, created_at desc);
create index if not exists idx_mobile_notification_reads_user_id on public.notification_reads(user_id, read_at desc);
create index if not exists idx_mobile_push_device_tokens_user_id on public.push_device_tokens(user_id);
create index if not exists idx_mobile_streamer_stats_streamer_id on public.streamer_stats(streamer_id);
create index if not exists idx_mobile_streamer_stats_tt_username on public.streamer_stats_tt(streamer_tiktok_username);
create index if not exists idx_mobile_donor_stats_streamer_donor on public.donor_stats(streamer_id, donor_username);
create index if not exists idx_mobile_donor_stats_tt_streamer_donor on public.donor_stats_tt(streamer_tiktok_username, donor_username);
create index if not exists idx_mobile_gift_events_tt_streamer_day on public.gift_events_tt(streamer_tiktok_username, day);
