create table if not exists public.global_super_admins (
  email text primary key,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

alter table public.global_super_admins enable row level security;

insert into public.global_super_admins (email, is_active, note)
values ('dev@mrjin.pro', true, 'Primary cross-app super admin')
on conflict (email) do update
set is_active = excluded.is_active,
    note = excluded.note;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users au
    join public.global_super_admins gsa
      on lower(gsa.email) = lower(au.email)
    where au.id = auth.uid()
      and gsa.is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.is_super_admin()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('owner', 'admin')
  );
$$;

create or replace function public.ensure_profile_access_data()
returns table(role public.app_role, referral_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role public.app_role;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'unauthenticated';
  end if;

  if public.is_super_admin() then
    v_role := 'owner';
  else
    v_role := public.resolve_user_app_role(v_user_id);
  end if;

  insert into public.profiles(user_id, role)
  values (v_user_id, coalesce(v_role, 'streamer'))
  on conflict (user_id) do nothing;

  update public.profiles p
  set role = coalesce(v_role, p.role, 'streamer')
  where p.user_id = v_user_id
    and (p.role is distinct from coalesce(v_role, p.role, 'streamer'));

  update public.profiles p
  set referral_code = public.generate_unique_referral_code()
  where p.user_id = v_user_id
    and (p.referral_code is null or btrim(p.referral_code) = '');

  return query
  select p.role, p.referral_code
  from public.profiles p
  where p.user_id = v_user_id
  limit 1;
end;
$$;

grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.ensure_profile_access_data() to authenticated;
