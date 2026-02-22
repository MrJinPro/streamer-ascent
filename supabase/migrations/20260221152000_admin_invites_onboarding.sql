alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_referral_code text,
  add column if not exists onboarding_source text;

update public.profiles
set onboarding_completed = true,
    onboarding_completed_at = coalesce(onboarding_completed_at, now())
where onboarding_completed = false;

create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invite_token text,
  referral_code text,
  role_slugs text[] not null default '{}'::text[],
  status text not null default 'pending' check (status in ('pending', 'sent', 'accepted', 'revoked', 'expired', 'provisioned')),
  invite_link text,
  expires_at timestamptz,
  accepted_at timestamptz,
  inviter_user_id uuid references public.profiles(user_id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_invites_invite_token_unique
  on public.admin_invites(invite_token)
  where invite_token is not null;

create index if not exists admin_invites_email_idx
  on public.admin_invites(lower(email), created_at desc);

create index if not exists admin_invites_status_idx
  on public.admin_invites(status, created_at desc);

create or replace function public.user_can_manage_users(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.has_permission(_user_id, 'users.create'), false)
    or coalesce(public.get_user_tier(_user_id), 'tier_0'::public.access_tier) in ('tier_3'::public.access_tier, 'tier_4'::public.access_tier);
$$;

alter table public.admin_invites enable row level security;

drop policy if exists "admin_invites_manage" on public.admin_invites;
create policy "admin_invites_manage"
on public.admin_invites
for all
to authenticated
using (public.user_can_manage_users(auth.uid()))
with check (public.user_can_manage_users(auth.uid()));

create or replace function public.set_updated_at_admin_invites()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_invites_updated_at on public.admin_invites;
create trigger trg_admin_invites_updated_at
before update on public.admin_invites
for each row execute function public.set_updated_at_admin_invites();
