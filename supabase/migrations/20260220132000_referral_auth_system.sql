create table if not exists public.agency_referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  is_active boolean not null default true,
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  note text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.agency_referral_usages (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.agency_referral_codes(id) on delete cascade,
  user_id uuid,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agency_join_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  tiktok_username text not null,
  telegram text,
  stream_experience text,
  motivation text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_agency_referral_codes_code on public.agency_referral_codes(code);
create index if not exists idx_agency_join_applications_status on public.agency_join_applications(status);

alter table public.agency_referral_codes enable row level security;
alter table public.agency_referral_usages enable row level security;
alter table public.agency_join_applications enable row level security;

drop policy if exists "agency_referral_codes_admin_select" on public.agency_referral_codes;
create policy "agency_referral_codes_admin_select"
on public.agency_referral_codes
for select
to authenticated
using (public.is_admin());

drop policy if exists "agency_referral_codes_admin_write" on public.agency_referral_codes;
create policy "agency_referral_codes_admin_write"
on public.agency_referral_codes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "agency_referral_usages_admin_select" on public.agency_referral_usages;
create policy "agency_referral_usages_admin_select"
on public.agency_referral_usages
for select
to authenticated
using (public.is_admin());

drop policy if exists "agency_join_applications_insert_public" on public.agency_join_applications;
create policy "agency_join_applications_insert_public"
on public.agency_join_applications
for insert
to anon, authenticated
with check (true);

drop policy if exists "agency_join_applications_admin_select" on public.agency_join_applications;
create policy "agency_join_applications_admin_select"
on public.agency_join_applications
for select
to authenticated
using (public.is_admin());

drop policy if exists "agency_join_applications_admin_update" on public.agency_join_applications;
create policy "agency_join_applications_admin_update"
on public.agency_join_applications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.referral_code_is_valid(p_code text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.agency_referral_codes arc
    where upper(arc.code) = upper(trim(p_code))
      and arc.is_active = true
      and arc.used_count < arc.max_uses
      and (arc.expires_at is null or arc.expires_at > now())
  );
$$;

create or replace function public.consume_referral_code(
  p_code text,
  p_user_id uuid,
  p_email text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code_id uuid;
begin
  select arc.id
  into v_code_id
  from public.agency_referral_codes arc
  where upper(arc.code) = upper(trim(p_code))
    and arc.is_active = true
    and arc.used_count < arc.max_uses
    and (arc.expires_at is null or arc.expires_at > now())
  for update;

  if v_code_id is null then
    return false;
  end if;

  update public.agency_referral_codes
  set used_count = used_count + 1
  where id = v_code_id;

  insert into public.agency_referral_usages(code_id, user_id, email)
  values (v_code_id, p_user_id, p_email);

  return true;
end;
$$;

grant execute on function public.referral_code_is_valid(text) to anon, authenticated;
grant execute on function public.consume_referral_code(text, uuid, text) to anon, authenticated;
