-- Tablero — esquema e incremento SaaS.
-- Puedes ejecutarlo de nuevo en Supabase → SQL Editor.
-- No borra tareas: solo asegura columnas, índices, trigger y RLS.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'todo',
  priority text not null default 'media',
  due_date timestamptz,
  tags text[] not null default '{}',
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length check (char_length(btrim(title)) between 1 and 120),
  constraint tasks_status_valid check (status in ('todo', 'prog', 'done')),
  constraint tasks_priority_valid check (priority in ('alta', 'media', 'baja'))
);

alter table public.tasks
  add column if not exists due_date timestamptz,
  add column if not exists tags text[] not null default '{}',
  add column if not exists checklist jsonb not null default '[]'::jsonb;

update public.tasks set tags = '{}' where tags is null;
update public.tasks set checklist = '[]'::jsonb where checklist is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_checklist_is_array'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_checklist_is_array
      check (jsonb_typeof(checklist) = 'array');
  end if;
end $$;

comment on table public.tasks is
  'Pendientes privados. status: todo | prog | done. priority: alta | media | baja. checklist: [{id,text,done}].';

create index if not exists tasks_user_status_idx
  on public.tasks (user_id, status);

create index if not exists tasks_user_due_idx
  on public.tasks (user_id, due_date);

alter table public.tasks replica identity full;

create or replace function public.handle_task_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.created_at := now();
    if new.user_id is null then
      raise exception 'Not authenticated';
    end if;
  elsif tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;

  new.title := btrim(new.title);
  new.description := coalesce(new.description, '');
  new.priority := coalesce(new.priority, 'media');
  new.status := coalesce(new.status, 'todo');
  new.updated_at := now();

  select coalesce(
    array_agg(distinct btrim(tag)) filter (where btrim(tag) <> ''),
    '{}'::text[]
  )
    into new.tags
  from unnest(coalesce(new.tags, '{}'::text[])) as tag;

  if new.checklist is null or jsonb_typeof(new.checklist) <> 'array' then
    new.checklist := '[]'::jsonb;
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_handle_write on public.tasks;

create trigger tasks_handle_write
  before insert or update on public.tasks
  for each row
  execute function public.handle_task_write();

alter table public.tasks enable row level security;

drop policy if exists tasks_select_own on public.tasks;
drop policy if exists tasks_insert_own on public.tasks;
drop policy if exists tasks_update_own on public.tasks;
drop policy if exists tasks_delete_own on public.tasks;

create policy tasks_select_own
  on public.tasks
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy tasks_insert_own
  on public.tasks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy tasks_update_own
  on public.tasks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy tasks_delete_own
  on public.tasks
  for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.tasks from public;
revoke all on table public.tasks from anon;
grant select, insert, update, delete on table public.tasks to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'tasks'
     ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end $$;
