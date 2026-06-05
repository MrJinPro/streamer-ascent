create extension if not exists pgcrypto;

alter table public.agency_join_applications
  add column if not exists username text,
  add column if not exists age integer,
  add column if not exists heard_about text,
  add column if not exists inviter_referral_code text,
  add column if not exists password_hash text,
  add column if not exists accepted_terms_at timestamptz,
  add column if not exists accepted_privacy_at timestamptz,
  add column if not exists accepted_offer_at timestamptz,
  add column if not exists offer_version text,
  add column if not exists offer_published_at date,
  add column if not exists ip_address inet,
  add column if not exists user_agent text,
  add column if not exists signed_payload jsonb;

create index if not exists agency_join_applications_email_idx on public.agency_join_applications (email);

create or replace function public.hash_password(p_password text)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  select crypt(p_password, gen_salt('bf', 10));
$$;

revoke all on function public.hash_password(text) from public;
revoke all on function public.hash_password(text) from anon;
revoke all on function public.hash_password(text) from authenticated;
grant execute on function public.hash_password(text) to service_role;