alter type public.app_role add value if not exists 'owner';
alter type public.app_role add value if not exists 'developer';
alter type public.app_role add value if not exists 'senior_curator';

alter table public.profiles
  add column if not exists role public.app_role,
  add column if not exists referral_code text;

alter table public.profiles
  alter column role set default 'streamer';

create unique index if not exists profiles_referral_code_unique
  on public.profiles(referral_code)
  where referral_code is not null;

create or replace function public.generate_unique_referral_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  v_code text;
begin
  loop
    v_code := 'NOVA-' || upper(encode(gen_random_bytes(3), 'hex'));
    exit when not exists (
      select 1
      from public.profiles p
      where p.referral_code = v_code
    );
  end loop;

  return v_code;
end;
$$;

create or replace function public.resolve_user_app_role(p_user_id uuid)
returns public.app_role
language sql
stable
set search_path = public
as $$
  select ur.role
  from public.user_roles ur
  where ur.user_id = p_user_id
  order by case ur.role
    when 'owner' then 1
    when 'admin' then 2
    when 'developer' then 3
    when 'senior_curator' then 4
    when 'manager' then 5
    when 'curator' then 6
    when 'moderator' then 7
    when 'support' then 8
    when 'investor' then 9
    when 'streamer' then 10
    else 99
  end
  limit 1;
$$;

create or replace function public.ensure_profile_referral_code_and_role()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_resolved_role public.app_role;
begin
  if new.role is null then
    v_resolved_role := public.resolve_user_app_role(new.user_id);
    new.role := coalesce(v_resolved_role, 'streamer');
  end if;

  if new.referral_code is null or btrim(new.referral_code) = '' then
    new.referral_code := public.generate_unique_referral_code();
  else
    new.referral_code := upper(btrim(new.referral_code));
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_referral_code_and_role_biur on public.profiles;
create trigger profiles_referral_code_and_role_biur
before insert or update on public.profiles
for each row
execute function public.ensure_profile_referral_code_and_role();

update public.profiles p
set role = coalesce(public.resolve_user_app_role(p.user_id), 'streamer')
where p.role is null;

update public.profiles
set referral_code = public.generate_unique_referral_code()
where referral_code is null
   or btrim(referral_code) = '';

alter table public.profiles
  alter column role set not null;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
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

  v_role := public.resolve_user_app_role(v_user_id);

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

grant execute on function public.ensure_profile_access_data() to authenticated;
