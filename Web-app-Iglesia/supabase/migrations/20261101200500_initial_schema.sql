create extension if not exists pgcrypto with schema extensions;
grant usage on schema public to anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  role text not null default 'secretario'
    check (role in ('administrador', 'pastor', 'secretario', 'tesorero', 'coordinador')),
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  email text not null default '',
  join_date date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  time time not null,
  place text not null default '',
  description text not null default '',
  responsible text not null default '',
  type text not null check (type in ('religioso', 'administrativo')),
  status text not null default 'programado' check (status in ('programado', 'cancelado')),
  created_at timestamptz not null default now()
);

create table public.ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  coordinator_id uuid references public.members (id) on delete set null,
  tone text not null default 'lavender' check (tone in ('lavender', 'blush', 'sage', 'sky')),
  created_at timestamptz not null default now()
);

create table public.ministry_members (
  ministry_id uuid not null references public.ministries (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  primary key (ministry_id, member_id)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (event_id, date)
);

create table public.attendance_members (
  attendance_id uuid not null references public.attendance_records (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  primary key (attendance_id, member_id)
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  amount numeric(12, 2) not null check (amount > 0),
  concept text not null check (concept in ('Diezmo', 'Ofrenda', 'Misiones', 'Construcción', 'Otro')),
  method text not null check (method in ('Efectivo', 'Transferencia', 'Tarjeta')),
  member_id uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  date date not null default current_date,
  important boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.church_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null default '',
  tagline text not null default '',
  logo_url text,
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  mission text not null default '',
  vision text not null default '',
  updated_at timestamptz not null default now()
);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  time time not null,
  name text not null
);

insert into public.church_settings (id) values (1) on conflict (id) do nothing;

create index events_date_idx on public.events (date);
create index attendance_records_date_idx on public.attendance_records (date);
create index donations_date_idx on public.donations (date);
create index announcements_date_idx on public.announcements (date desc);
create index members_join_date_idx on public.members (join_date);

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles as p where p.id = (select auth.uid())
$$;

create or replace function public.has_any_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = any (allowed_roles), false)
$$;

create or replace function public.public_active_member_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.members where active
$$;

create or replace function public.public_ministry_counts()
returns table (ministry_id uuid, member_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, count(mm.member_id)::integer
  from public.ministries as m
  left join public.ministry_members as mm on mm.ministry_id = m.id
  group by m.id
$$;

create or replace function public.ministry_member_directory()
returns table (id uuid, name text, active boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.name, m.active
  from public.members as m
  where (select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador']))
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.has_any_role(text[]) from public;
revoke all on function public.public_ministry_counts() from public;
revoke all on function public.ministry_member_directory() from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.has_any_role(text[]) to authenticated;
grant execute on function public.public_active_member_count() to anon, authenticated;
grant execute on function public.public_ministry_counts() to anon, authenticated;
grant execute on function public.ministry_member_directory() to authenticated;

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.ministries enable row level security;
alter table public.ministry_members enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_members enable row level security;
alter table public.donations enable row level security;
alter table public.announcements enable row level security;
alter table public.church_settings enable row level security;
alter table public.schedules enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.ministries to authenticated;
grant select, insert, delete on public.ministry_members to authenticated;
grant select, insert, update, delete on public.attendance_records to authenticated;
grant select, insert, delete on public.attendance_members to authenticated;
grant select, insert, update, delete on public.donations to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
grant select, update on public.church_settings to authenticated;
grant select, insert, update, delete on public.schedules to authenticated;

grant select on public.events, public.ministries, public.announcements, public.church_settings, public.schedules to anon;
grant select on public.events, public.ministries, public.announcements, public.church_settings, public.schedules to authenticated;

create policy "Profiles are visible to their owner and administrators"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.has_any_role(array['administrador'])));
create policy "Administrators update profiles"
  on public.profiles for update to authenticated
  using ((select public.has_any_role(array['administrador'])))
  with check ((select public.has_any_role(array['administrador'])));

create policy "Authorized staff manage members"
  on public.members for all to authenticated
  using ((select public.has_any_role(array['administrador', 'pastor', 'secretario'])))
  with check ((select public.has_any_role(array['administrador', 'pastor', 'secretario'])));
create policy "Public can read active events"
  on public.events for select to anon, authenticated
  using (status = 'programado' and date >= current_date);
create policy "Authorized staff manage events"
  on public.events for all to authenticated
  using ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])))
  with check ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])));
create policy "Public can read ministries"
  on public.ministries for select to anon, authenticated using (true);
create policy "Authorized staff manage ministries"
  on public.ministries for all to authenticated
  using ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])))
  with check ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])));
create policy "Authorized staff manage ministry assignments"
  on public.ministry_members for all to authenticated
  using ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])))
  with check ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])));
create policy "Authorized staff manage attendance"
  on public.attendance_records for all to authenticated
  using ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])))
  with check ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])));
create policy "Authorized staff manage attendance participants"
  on public.attendance_members for all to authenticated
  using ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])))
  with check ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])));
create policy "Finance roles manage donations"
  on public.donations for all to authenticated
  using ((select public.has_any_role(array['administrador', 'pastor', 'tesorero'])))
  with check ((select public.has_any_role(array['administrador', 'pastor', 'tesorero'])));
create policy "Public can read announcements"
  on public.announcements for select to anon, authenticated using (true);
create policy "Authorized staff manage announcements"
  on public.announcements for all to authenticated
  using ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])))
  with check ((select public.has_any_role(array['administrador', 'pastor', 'secretario', 'coordinador'])));
create policy "Public can read church settings"
  on public.church_settings for select to anon, authenticated using (true);
create policy "Administrators update church settings"
  on public.church_settings for update to authenticated
  using ((select public.has_any_role(array['administrador'])))
  with check ((select public.has_any_role(array['administrador'])));
create policy "Public can read service schedules"
  on public.schedules for select to anon, authenticated using (true);
create policy "Administrators manage service schedules"
  on public.schedules for all to authenticated
  using ((select public.has_any_role(array['administrador'])))
  with check ((select public.has_any_role(array['administrador'])));

create or replace function public.save_ministry_record(
  ministry_id uuid,
  ministry_name text,
  ministry_description text,
  coordinator_uuid uuid,
  ministry_tone text,
  member_uuids uuid[]
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.ministries (id, name, description, coordinator_id, tone)
  values (ministry_id, ministry_name, ministry_description, coordinator_uuid, ministry_tone)
  on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      coordinator_id = excluded.coordinator_id,
      tone = excluded.tone;

  delete from public.ministry_members where ministry_members.ministry_id = save_ministry_record.ministry_id;
  insert into public.ministry_members (ministry_id, member_id)
  select save_ministry_record.ministry_id, member_id
  from unnest(coalesce(member_uuids, '{}'::uuid[])) as ids(member_id)
  on conflict do nothing;
end;
$$;

create or replace function public.save_attendance_record(
  attendance_id uuid,
  event_uuid uuid,
  attendance_date date,
  member_uuids uuid[]
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.attendance_records (id, event_id, date)
  values (attendance_id, event_uuid, attendance_date)
  on conflict (id) do update
  set event_id = excluded.event_id, date = excluded.date;

  delete from public.attendance_members where attendance_members.attendance_id = save_attendance_record.attendance_id;
  insert into public.attendance_members (attendance_id, member_id)
  select save_attendance_record.attendance_id, member_id
  from unnest(coalesce(member_uuids, '{}'::uuid[])) as ids(member_id)
  on conflict do nothing;
end;
$$;

create or replace function public.save_church_settings(settings jsonb, schedule_rows jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.church_settings
  set name = settings->>'name',
      tagline = settings->>'tagline',
      logo_url = settings->>'logo_url',
      address = settings->>'address',
      phone = settings->>'phone',
      email = settings->>'email',
      mission = settings->>'mission',
      vision = settings->>'vision',
      updated_at = now()
  where id = 1;

  delete from public.schedules;
  insert into public.schedules (id, day, time, name)
  select (schedule->>'id')::uuid,
         schedule->>'day',
         (schedule->>'time')::time,
         schedule->>'name'
  from jsonb_array_elements(coalesce(schedule_rows, '[]'::jsonb)) as schedules(schedule);
end;
$$;

revoke all on function public.save_ministry_record(uuid, text, text, uuid, text, uuid[]) from public;
revoke all on function public.save_attendance_record(uuid, uuid, date, uuid[]) from public;
revoke all on function public.save_church_settings(jsonb, jsonb) from public;
grant execute on function public.save_ministry_record(uuid, text, text, uuid, text, uuid[]) to authenticated;
grant execute on function public.save_attendance_record(uuid, uuid, date, uuid[]) to authenticated;
grant execute on function public.save_church_settings(jsonb, jsonb) to authenticated;
