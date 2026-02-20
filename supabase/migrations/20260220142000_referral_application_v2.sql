do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'agency_referral_source_t' and n.nspname = 'public'
  ) then
    create type public.agency_referral_source_t as enum (
      'friend_streamer',
      'curator_manager',
      'social_media',
      'tiktok',
      'other'
    );
  end if;
end $$;

alter table public.agency_join_applications
  add column if not exists username text,
  add column if not exists age integer,
  add column if not exists heard_about public.agency_referral_source_t,
  add column if not exists inviter_referral_code text,
  add column if not exists assigned_referral_code text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(user_id) on delete set null;

update public.agency_join_applications
set
  username = coalesce(nullif(username, ''), split_part(email, '@', 1)),
  age = coalesce(age, 18),
  heard_about = coalesce(heard_about, 'tiktok'::public.agency_referral_source_t),
  inviter_referral_code = coalesce(nullif(inviter_referral_code, ''), 'NO-CODE'),
  telegram = coalesce(nullif(telegram, ''), '@unknown')
where username is null
   or age is null
   or heard_about is null
   or inviter_referral_code is null
   or telegram is null
   or telegram = '';

alter table public.agency_join_applications
  alter column username set not null,
  alter column age set not null,
  alter column heard_about set not null,
  alter column inviter_referral_code set not null,
  alter column telegram set not null;

alter table public.agency_join_applications
  drop constraint if exists agency_join_applications_age_check;

alter table public.agency_join_applications
  add constraint agency_join_applications_age_check check (age between 16 and 99);

create table if not exists public.referral_reward_settings (
  id integer primary key default 1,
  rewards_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_reward_settings_singleton check (id = 1)
);

insert into public.referral_reward_settings (id, rewards_enabled)
values (1, false)
on conflict (id) do nothing;

alter table public.referral_reward_settings enable row level security;

drop policy if exists "referral_reward_settings_admin_select" on public.referral_reward_settings;
create policy "referral_reward_settings_admin_select"
on public.referral_reward_settings
for select
to authenticated
using (public.is_admin());

drop policy if exists "referral_reward_settings_admin_update" on public.referral_reward_settings;
create policy "referral_reward_settings_admin_update"
on public.referral_reward_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.approve_agency_application(
  p_application_id uuid,
  p_max_uses integer default 5
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_code text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select email into v_email
  from public.agency_join_applications
  where id = p_application_id
    and status = 'pending'
  for update;

  if v_email is null then
    raise exception 'application_not_found_or_not_pending';
  end if;

  loop
    v_code := 'NOVA-' || upper(encode(gen_random_bytes(3), 'hex'));
    exit when not exists (select 1 from public.agency_referral_codes where code = v_code);
  end loop;

  insert into public.agency_referral_codes(code, max_uses, note, created_by)
  values (v_code, greatest(p_max_uses, 1), 'auto-generated on agency approval', auth.uid());

  update public.agency_join_applications
  set
    status = 'approved',
    assigned_referral_code = v_code,
    approved_at = now(),
    approved_by = auth.uid()
  where id = p_application_id;

  return v_code;
end;
$$;

create or replace function public.reject_agency_application(
  p_application_id uuid
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

  update public.agency_join_applications
  set status = 'rejected'
  where id = p_application_id
    and status = 'pending';

  return found;
end;
$$;

grant execute on function public.approve_agency_application(uuid, integer) to authenticated;
grant execute on function public.reject_agency_application(uuid) to authenticated;
