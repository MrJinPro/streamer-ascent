create table if not exists public.app_content (
  key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_app_content_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_content_updated_at on public.app_content;
create trigger trg_app_content_updated_at
before update on public.app_content
for each row execute function public.touch_app_content_updated_at();

alter table public.app_content enable row level security;

drop policy if exists "app_content_select_all" on public.app_content;
create policy "app_content_select_all"
on public.app_content
for select
using (true);

drop policy if exists "app_content_write_all" on public.app_content;
create policy "app_content_write_all"
on public.app_content
for insert
with check (true);

drop policy if exists "app_content_update_all" on public.app_content;
create policy "app_content_update_all"
on public.app_content
for update
using (true)
with check (true);

grant select, insert, update on public.app_content to anon, authenticated;
