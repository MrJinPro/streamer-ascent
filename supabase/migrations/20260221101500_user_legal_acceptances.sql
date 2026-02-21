create table if not exists public.user_legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  document_type text not null check (document_type in ('agency_offer', 'terms', 'privacy')),
  document_version text not null default '2026-02-21',
  accepted boolean not null default true,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, document_type, document_version)
);

create index if not exists idx_user_legal_acceptances_user_doc
  on public.user_legal_acceptances(user_id, document_type, accepted_at desc);

alter table public.user_legal_acceptances enable row level security;

drop policy if exists "user_legal_acceptances_self_read" on public.user_legal_acceptances;
create policy "user_legal_acceptances_self_read"
on public.user_legal_acceptances
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_legal_acceptances_self_write" on public.user_legal_acceptances;
create policy "user_legal_acceptances_self_write"
on public.user_legal_acceptances
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_legal_acceptances_self_update" on public.user_legal_acceptances;
create policy "user_legal_acceptances_self_update"
on public.user_legal_acceptances
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create or replace function public.set_updated_at_user_legal_acceptances()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_legal_acceptances_updated_at on public.user_legal_acceptances;
create trigger trg_user_legal_acceptances_updated_at
before update on public.user_legal_acceptances
for each row execute function public.set_updated_at_user_legal_acceptances();
