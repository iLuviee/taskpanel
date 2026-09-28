-- Orbit cloud storage schema for Supabase Free.
-- Run this once in Supabase Dashboard > SQL Editor.

create table if not exists public.tasks (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    course text not null,
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
    deadline timestamptz not null,
    notes text not null default '',
    reference_url text not null default '',
    attachment jsonb not null default '{}'::jsonb,
    completed boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.schedules (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    subject text not null,
    day text not null check (day in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')),
    room text not null,
    start_time text not null,
    end_time text not null,
    lecturer text not null default '',
    created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
alter table public.schedules enable row level security;

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks" on public.tasks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own schedules" on public.schedules;
create policy "Users manage their own schedules" on public.schedules
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists schedules_user_id_idx on public.schedules(user_id);

alter table public.tasks add column if not exists attachment jsonb not null default '{}'::jsonb;
alter table public.tasks add column if not exists reference_url text not null default '';

insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', true)
on conflict (id) do update set public = true;

drop policy if exists "Users upload their own task files" on storage.objects;
create policy "Users upload their own task files" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'task-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users read their own task files" on storage.objects;
create policy "Users read their own task files" on storage.objects
    for select to authenticated
    using (bucket_id = 'task-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their own task files" on storage.objects;
create policy "Users delete their own task files" on storage.objects
    for delete to authenticated
    using (bucket_id = 'task-files' and (storage.foldername(name))[1] = auth.uid()::text);
