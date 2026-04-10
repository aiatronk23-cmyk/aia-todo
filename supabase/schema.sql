create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  completed boolean not null default false,
  focus_now boolean not null default false,
  due_date date,
  label text not null default 'General',
  importance text not null default 'Medium',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.tasks
add column if not exists focus_now boolean not null default false;

alter table public.tasks replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end $$;

alter table public.tasks enable row level security;

drop policy if exists "Allow anonymous read access" on public.tasks;
create policy "Allow anonymous read access"
on public.tasks
for select
to anon
using (true);

drop policy if exists "Allow anonymous insert access" on public.tasks;
create policy "Allow anonymous insert access"
on public.tasks
for insert
to anon
with check (true);

drop policy if exists "Allow anonymous update access" on public.tasks;
create policy "Allow anonymous update access"
on public.tasks
for update
to anon
using (true)
with check (true);

drop policy if exists "Allow anonymous delete access" on public.tasks;
create policy "Allow anonymous delete access"
on public.tasks
for delete
to anon
using (true);
