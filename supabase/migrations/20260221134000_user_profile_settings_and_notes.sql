create table if not exists public.user_profile_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  timezone text,
  language text,
  show_diamonds boolean not null default true,
  show_stats boolean not null default true,
  profile_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_internal_notes (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references public.profiles(user_id) on delete cascade,
  author_user_id uuid not null references public.profiles(user_id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(subject_user_id, author_user_id)
);

create index if not exists idx_user_internal_notes_subject on public.user_internal_notes(subject_user_id, updated_at desc);

alter table public.user_profile_settings enable row level security;
alter table public.user_internal_notes enable row level security;

create or replace function public.set_updated_at_user_profile_settings()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profile_settings_updated_at on public.user_profile_settings;
create trigger trg_user_profile_settings_updated_at
before update on public.user_profile_settings
for each row execute function public.set_updated_at_user_profile_settings();

create or replace function public.set_updated_at_user_internal_notes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_internal_notes_updated_at on public.user_internal_notes;
create trigger trg_user_internal_notes_updated_at
before update on public.user_internal_notes
for each row execute function public.set_updated_at_user_internal_notes();

drop policy if exists "user_profile_settings_self_read" on public.user_profile_settings;
create policy "user_profile_settings_self_read"
on public.user_profile_settings
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_profile_settings_self_write" on public.user_profile_settings;
create policy "user_profile_settings_self_write"
on public.user_profile_settings
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_internal_notes_read" on public.user_internal_notes;
create policy "user_internal_notes_read"
on public.user_internal_notes
for select
to authenticated
using (
  public.is_admin()
  or author_user_id = auth.uid()
  or subject_user_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('support', 'curator', 'manager', 'senior_curator')
  )
);

drop policy if exists "user_internal_notes_write" on public.user_internal_notes;
create policy "user_internal_notes_write"
on public.user_internal_notes
for all
to authenticated
using (
  public.is_admin()
  or author_user_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('support', 'curator', 'manager', 'senior_curator')
  )
)
with check (
  public.is_admin()
  or author_user_id = auth.uid()
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('support', 'curator', 'manager', 'senior_curator')
  )
);
