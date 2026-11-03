-- Migration: 20261102213000_media_and_item_images.sql
-- Adds cover_path to heritage_objects and saints, creates media table, and configures church-media storage.

-- 1. Add cover_path column to heritage_objects and saints
alter table public.heritage_objects add column if not exists cover_path text;
alter table public.saints add column if not exists cover_path text;

-- 2. Create media table for church, object, saint, and event photos
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  owner_type text not null check (owner_type in ('church', 'object', 'saint', 'event')),
  owner_id uuid not null,
  file_path text not null,
  caption text,
  sort_order integer not null default 0,
  visibility text not null default 'publico' check (visibility in ('publico', 'interno')),
  created_at timestamptz not null default now()
);

-- Enable RLS on media
alter table public.media enable row level security;

-- 3. RLS policies on public.media
drop policy if exists "Public can view public media" on public.media;
create policy "Public can view public media"
  on public.media for select
  using (visibility = 'publico');

drop policy if exists "Assigned users can view church media records" on public.media;
create policy "Assigned users can view church media records"
  on public.media for select to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'archivista', 'consulta']::public.app_role[]));

drop policy if exists "Assigned users can insert church media records" on public.media;
create policy "Assigned users can insert church media records"
  on public.media for insert to authenticated
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[]));

drop policy if exists "Assigned users can update church media records" on public.media;
create policy "Assigned users can update church media records"
  on public.media for update to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[]));

drop policy if exists "Assigned users can delete church media records" on public.media;
create policy "Assigned users can delete church media records"
  on public.media for delete to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[]));

-- 4. Storage configuration for church-media bucket
insert into storage.buckets (id, name, public)
values ('church-media', 'church-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read church media" on storage.objects;
create policy "Public can read church media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'church-media');
