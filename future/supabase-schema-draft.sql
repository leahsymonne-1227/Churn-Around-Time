-- Run this in the Supabase SQL editor. Each user's workspace is private by default.
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My workspace',
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'analyst', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  file_name text not null,
  storage_path text not null,
  file_type text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'analyzing', 'complete', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  upload_id uuid references public.uploads(id) on delete set null,
  results jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists uploads_workspace_created_idx on public.uploads(workspace_id, created_at desc);
create index if not exists analyses_workspace_created_idx on public.analyses(workspace_id, created_at desc);

-- New accounts start with an isolated personal workspace. Team invites can be added later.
create or replace function public.create_personal_workspace()
returns trigger language plpgsql security definer set search_path = '' as $$
declare new_workspace_id uuid;
begin
  insert into public.workspaces(name) values ('My workspace') returning id into new_workspace_id;
  insert into public.workspace_members(workspace_id, user_id, role) values (new_workspace_id, new.id, 'owner');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_workspace on auth.users;
create trigger on_auth_user_created_workspace after insert on auth.users
for each row execute procedure public.create_personal_workspace();

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace and m.user_id = (select auth.uid())
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.uploads enable row level security;
alter table public.analyses enable row level security;

create policy "members can read workspaces" on public.workspaces for select using (public.is_workspace_member(id));
create policy "members can read workspace memberships" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "members can read uploads" on public.uploads for select using (public.is_workspace_member(workspace_id));
create policy "members can add uploads" on public.uploads for insert with check (public.is_workspace_member(workspace_id) and uploaded_by = (select auth.uid()));
create policy "members can update uploads" on public.uploads for update using (public.is_workspace_member(workspace_id));
create policy "members can delete uploads" on public.uploads for delete using (public.is_workspace_member(workspace_id));
create policy "members can read analyses" on public.analyses for select using (public.is_workspace_member(workspace_id));
create policy "members can add analyses" on public.analyses for insert with check (public.is_workspace_member(workspace_id));
create policy "members can delete analyses" on public.analyses for delete using (public.is_workspace_member(workspace_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-uploads', 'customer-uploads', false, 26214400, array['text/csv','application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel'])
on conflict (id) do nothing;

create policy "workspace members can upload private files" on storage.objects for insert to authenticated
with check (bucket_id = 'customer-uploads' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
create policy "workspace members can view private files" on storage.objects for select to authenticated
using (bucket_id = 'customer-uploads' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
create policy "workspace members can delete private files" on storage.objects for delete to authenticated
using (bucket_id = 'customer-uploads' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
