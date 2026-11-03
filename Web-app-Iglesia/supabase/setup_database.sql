-- =====================================================================
-- SETUP COMPLETO DE BASE DE DATOS: RED DE IGLESIAS DE MÉRIDA
-- Ejecutar este archivo completo en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/verdjdnyxclfjlmhpnbh/sql/new
-- =====================================================================

-- 1. REINICIO SEGURO DEL ESQUEMA PUBLIC
drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;

-- Limpieza de políticas previas en Storage
drop policy if exists "Public can read public church documents" on storage.objects;
drop policy if exists "Assigned users read church documents" on storage.objects;
drop policy if exists "Assigned archivists upload church documents" on storage.objects;
drop policy if exists "Assigned archivists update church documents" on storage.objects;
drop policy if exists "Assigned archivists delete church documents" on storage.objects;
drop policy if exists "Assigned users manage church media" on storage.objects;
drop policy if exists "Assigned archivists upload public church documents" on storage.objects;
drop policy if exists "Assigned archivists update public church documents" on storage.objects;
drop policy if exists "Assigned archivists delete public church documents" on storage.objects;
drop policy if exists "Public can read church media" on storage.objects;

-- =====================================================================
-- MIGRACION: 20261101200500_initial_schema.sql
-- =====================================================================

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
  concept text not null check (concept in ('Diezmo', 'Ofrenda', 'Misiones', 'ConstrucciÃ³n', 'Otro')),
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


-- =====================================================================
-- MIGRACION: 20261101213500_profiles_auth_compat.sql
-- =====================================================================

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.profiles
  alter column full_name drop not null;


-- =====================================================================
-- MIGRACION: 20261102110000_multi_church_foundation.sql
-- =====================================================================

create type public.app_role as enum (
  'super_admin',
  'parroco',
  'vicario',
  'secretaria',
  'tesorero',
  'archivista',
  'consulta'
);

create table public.churches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  patron_saint text,
  address text,
  cover_path text,
  logo_path text,
  accent_color text,
  history_summary text,
  history_full text,
  founded_year integer,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.network_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null default '',
  tagline text not null default '',
  updated_at timestamptz not null default now()
);

create table public.user_church_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  church_id uuid references public.churches (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

create table public.network_content (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  title text not null,
  body text not null default '',
  visibility text not null default 'interno' check (visibility in ('publico', 'interno')),
  status text not null default 'borrador' check (status in ('borrador', 'publicado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.heritage_objects (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  category text,
  quantity integer not null default 1 check (quantity > 0),
  description text,
  history text,
  visibility text not null default 'interno' check (visibility in ('publico', 'interno')),
  status text not null default 'borrador' check (status in ('borrador', 'publicado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saints (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  invocation text,
  kind text,
  description text,
  history text,
  visibility text not null default 'interno' check (visibility in ('publico', 'interno')),
  status text not null default 'borrador' check (status in ('borrador', 'publicado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  title text not null,
  doc_type text,
  period_start integer,
  period_end integer,
  author text,
  language text not null default 'es',
  description text,
  file_path text not null,
  file_size bigint,
  page_count integer,
  ocr_text text,
  ocr_status text not null default 'pendiente' check (ocr_status in ('pendiente', 'procesando', 'listo', 'error', 'no_aplica')),
  ocr_confidence numeric check (ocr_confidence between 0 and 100),
  ocr_processed_at timestamptz,
  visibility text not null default 'interno' check (visibility in ('publico', 'interno')),
  status text not null default 'borrador' check (status in ('borrador', 'publicado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mass_schedules (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  time time not null,
  label text not null default 'Misa',
  language text not null default 'es' check (language in ('es', 'maya')),
  presider text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  mass_schedule_id uuid not null references public.mass_schedules (id) on delete cascade,
  on_date date not null,
  action text not null check (action in ('cancelar', 'mover')),
  new_time time,
  note text,
  created_at timestamptz not null default now(),
  check (action <> 'mover' or new_time is not null),
  unique (mass_schedule_id, on_date)
);

create table public.service_prices (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  suggested_price numeric(12, 2) not null default 0 check (suggested_price >= 0),
  donation_suggested boolean not null default true,
  description text not null default '',
  show_publicly boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.finance_direction as enum ('ingreso', 'egreso');
create type public.finance_concept as enum (
  'colecta',
  'donativo',
  'estipendio_misa',
  'urna',
  'servicio',
  'otro_ingreso',
  'mantenimiento',
  'servicios_basicos',
  'nomina_honorarios',
  'insumos_liturgicos',
  'restauracion',
  'apoyo_social',
  'otro_egreso'
);

create table public.mass_intentions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  mass_schedule_id uuid references public.mass_schedules (id) on delete set null,
  mass_date date not null,
  mass_time time,
  intention_type text not null,
  honoree_name text not null,
  requested_by text,
  contact_phone text,
  stipend_mxn numeric(12, 2) not null default 0 check (stipend_mxn >= 0),
  paid boolean not null default false,
  is_mentioned_in_mass boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  entry_date date not null,
  direction public.finance_direction not null,
  concept public.finance_concept not null,
  amount_mxn numeric(12, 2) not null check (amount_mxn >= 0),
  supplier text,
  attachment_path text,
  method text,
  mass_schedule_id uuid references public.mass_schedules (id) on delete set null,
  related_type text,
  related_id uuid,
  donor_name text,
  receipt_folio text,
  notes text,
  created_at timestamptz not null default now(),
  check (
    (direction = 'ingreso' and concept in ('colecta', 'donativo', 'estipendio_misa', 'urna', 'servicio', 'otro_ingreso'))
    or
    (direction = 'egreso' and concept in ('mantenimiento', 'servicios_basicos', 'nomina_honorarios', 'insumos_liturgicos', 'restauracion', 'apoyo_social', 'otro_egreso'))
  )
);

create unique index finance_entries_intention_unique_idx
  on public.finance_entries (related_id)
  where related_type = 'mass_intention';

create table public.urns (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  code text not null,
  location text,
  status text not null default 'disponible' check (status in ('disponible', 'reservada', 'ocupada', 'mantenimiento')),
  price_mxn numeric(12, 2) check (price_mxn >= 0),
  created_at timestamptz not null default now(),
  unique (church_id, code)
);

create table public.urn_contracts (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  urn_id uuid not null references public.urns (id) on delete restrict,
  deceased_name text,
  holder_name text not null,
  holder_phone text,
  agreed_price_mxn numeric(12, 2) not null check (agreed_price_mxn >= 0),
  start_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  church_id uuid references public.churches (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ocr_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  attempts integer not null default 0 check (attempts >= 0),
  error text,
  status text not null default 'pendiente' check (status in ('pendiente', 'procesando', 'listo', 'error')),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create or replace function public.create_intention_finance_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.paid and new.stipend_mxn > 0 and (
    tg_op = 'INSERT'
    or (tg_op = 'UPDATE' and not old.paid)
  ) then
    insert into public.finance_entries (
      church_id, entry_date, direction, concept, amount_mxn,
      related_type, related_id, notes
    )
    values (
      new.church_id, new.mass_date, 'ingreso', 'estipendio_misa',
      new.stipend_mxn, 'mass_intention', new.id, 'Generado desde intenciÃ³n de misa'
    )
    on conflict (related_id) where related_type = 'mass_intention' do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.create_intention_finance_entry() from public;

create trigger mass_intention_paid_finance
  after insert or update of paid, stipend_mxn on public.mass_intentions
  for each row execute function public.create_intention_finance_entry();

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_church_id uuid;
begin
  changed_church_id := coalesce(
    case when tg_op = 'DELETE' then old.church_id else new.church_id end,
    null
  );
  insert into public.audit_log (
    actor_id, church_id, action, entity_type, entity_id, metadata
  )
  values (
    (select auth.uid()),
    changed_church_id,
    lower(tg_op),
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    jsonb_build_object(
      'table', tg_table_name,
      'operation', lower(tg_op)
    )
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.write_audit_log() from public;

create trigger heritage_objects_audit
  after insert or update or delete on public.heritage_objects
  for each row execute function public.write_audit_log();
create trigger saints_audit
  after insert or update or delete on public.saints
  for each row execute function public.write_audit_log();
create trigger documents_audit
  after insert or update or delete on public.documents
  for each row execute function public.write_audit_log();
create trigger finance_entries_audit
  after insert or update or delete on public.finance_entries
  for each row execute function public.write_audit_log();
create trigger mass_intentions_audit
  after insert or update or delete on public.mass_intentions
  for each row execute function public.write_audit_log();
create trigger urns_audit
  after insert or update or delete on public.urns
  for each row execute function public.write_audit_log();
create trigger urn_contracts_audit
  after insert or update or delete on public.urn_contracts
  for each row execute function public.write_audit_log();
create trigger service_prices_audit
  after insert or update or delete on public.service_prices
  for each row execute function public.write_audit_log();

alter table public.events add column if not exists church_id uuid references public.churches (id) on delete cascade;
alter table public.events add column if not exists kind text;
alter table public.announcements add column if not exists church_id uuid references public.churches (id) on delete cascade;

insert into public.network_settings (id, name, tagline)
select 1, coalesce(name, ''), coalesce(tagline, '')
from public.church_settings
where id = 1
on conflict (id) do nothing;

insert into public.churches (slug, name, sort_order)
values
  ('catedral-san-ildefonso', 'Catedral de San Ildefonso', 0),
  ('jesus-tercera-orden', 'Iglesia de JesÃºs (Tercera Orden)', 1),
  ('la-candelaria', 'Iglesia de la Candelaria', 2),
  ('santa-lucia', 'Iglesia de Santa LucÃ­a', 3),
  ('san-juan-de-dios', 'Iglesia de San Juan de Dios', 4),
  ('santa-ana', 'Iglesia de Santa Ana', 5),
  ('la-mejorada', 'Iglesia de La Mejorada', 6),
  ('san-cristobal', 'Iglesia de San CristÃ³bal', 7),
  ('santiago', 'Iglesia de Santiago', 8),
  ('santa-isabel', 'Ermita de Santa Isabel', 9)
on conflict (slug) do nothing;

update public.churches c
set address = nullif(s.address, ''),
    history_summary = nullif(s.mission, '')
from public.church_settings s
where c.slug = 'catedral-san-ildefonso'
  and s.id = 1;

insert into public.mass_schedules (church_id, weekday, time, label)
select c.id,
       case s.day
         when 'Domingo' then 0
         when 'Lunes' then 1
         when 'Martes' then 2
         when 'MiÃ©rcoles' then 3
         when 'Jueves' then 4
         when 'Viernes' then 5
         when 'SÃ¡bado' then 6
         else 0
       end,
       s.time,
       s.name
from public.schedules s
cross join (select id from public.churches order by sort_order, created_at limit 1) c;

insert into public.user_church_roles (user_id, church_id, role)
select p.id, null, 'super_admin'::public.app_role
from public.profiles p
where p.role = 'administrador'
on conflict do nothing;

update public.events
set kind = case when type = 'religioso' then 'religioso' else 'administrativo' end
where kind is null;

update public.events
set church_id = (select id from public.churches where slug = 'catedral-san-ildefonso')
where church_id is null;

update public.announcements
set church_id = (select id from public.churches where slug = 'catedral-san-ildefonso')
where church_id is null;

drop policy if exists "Authorized staff manage events" on public.events;
drop policy if exists "Authorized staff manage announcements" on public.announcements;

create index churches_sort_order_idx on public.churches (sort_order, name);
create index user_church_roles_church_idx on public.user_church_roles (church_id, role);
create unique index user_church_roles_unique_idx on public.user_church_roles (user_id, (coalesce(church_id, '00000000-0000-0000-0000-000000000000'::uuid)), role);
create index documents_church_status_idx on public.documents (church_id, status, visibility);
create index heritage_objects_church_status_idx on public.heritage_objects (church_id, status, visibility);
create index saints_church_status_idx on public.saints (church_id, status, visibility);
create index mass_schedules_church_weekday_idx on public.mass_schedules (church_id, weekday, time) where is_active;
create index schedule_exceptions_date_idx on public.schedule_exceptions (mass_schedule_id, on_date);
create index audit_log_church_created_idx on public.audit_log (church_id, created_at desc);
create index mass_intentions_church_date_idx on public.mass_intentions (church_id, mass_date, mass_time);
create index finance_entries_church_date_idx on public.finance_entries (church_id, entry_date desc);
create index urns_church_status_idx on public.urns (church_id, status);
create index urn_contracts_church_idx on public.urn_contracts (church_id);

create or replace function public.has_role(c uuid, roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_church_roles ucr
    where ucr.user_id = (select auth.uid())
      and (ucr.church_id = c or ucr.role = 'super_admin'::public.app_role)
      and ucr.role = any (roles)
  );
$$;

revoke all on function public.has_role(uuid, public.app_role[]) from public;
grant execute on function public.has_role(uuid, public.app_role[]) to authenticated;

create or replace function public.storage_church_id(path text)
returns uuid
language sql
immutable
returns null on null input
set search_path = ''
as $$
  select case
    when split_part(path, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then split_part(path, '/', 1)::uuid
    else null
  end;
$$;

revoke all on function public.storage_church_id(text) from public;
grant execute on function public.storage_church_id(text) to authenticated;

alter table public.churches enable row level security;
alter table public.network_settings enable row level security;
alter table public.user_church_roles enable row level security;
alter table public.network_content enable row level security;
alter table public.heritage_objects enable row level security;
alter table public.saints enable row level security;
alter table public.documents enable row level security;
alter table public.mass_schedules enable row level security;
alter table public.schedule_exceptions enable row level security;
alter table public.service_prices enable row level security;
alter table public.audit_log enable row level security;
alter table public.ocr_jobs enable row level security;
alter table public.mass_intentions enable row level security;
alter table public.finance_entries enable row level security;
alter table public.urns enable row level security;
alter table public.urn_contracts enable row level security;

grant select on public.churches, public.network_settings, public.network_content, public.heritage_objects, public.saints, public.documents, public.mass_schedules, public.service_prices to anon, authenticated;
grant select, insert, update, delete on public.user_church_roles, public.network_content, public.heritage_objects, public.saints, public.documents, public.mass_schedules, public.schedule_exceptions, public.service_prices to authenticated;
grant insert on public.audit_log to authenticated;
grant select, insert, update on public.ocr_jobs to authenticated;
grant select, insert, update, delete on public.mass_intentions, public.finance_entries, public.urns, public.urn_contracts to authenticated;

create policy "Public can read active churches"
  on public.churches for select to anon, authenticated using (is_active);
create policy "Super admins manage churches"
  on public.churches for all to authenticated
  using (public.has_role(null, array['super_admin']::public.app_role[]))
  with check (public.has_role(null, array['super_admin']::public.app_role[]));

create policy "Public can read network settings"
  on public.network_settings for select to anon, authenticated using (true);

create policy "Users can read their church roles"
  on public.user_church_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.has_role(null, array['super_admin']::public.app_role[]));
create policy "Super admins manage church roles"
  on public.user_church_roles for all to authenticated
  using (public.has_role(null, array['super_admin']::public.app_role[]))
  with check (public.has_role(null, array['super_admin']::public.app_role[]));

create policy "Public can read published network content"
  on public.network_content for select to anon, authenticated
  using (visibility = 'publico' and status = 'publicado');
create policy "Authorized users manage network content"
  on public.network_content for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]));

create policy "Public can read published heritage objects"
  on public.heritage_objects for select to anon, authenticated
  using (visibility = 'publico' and status = 'publicado');
create policy "Authorized users manage heritage objects"
  on public.heritage_objects for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[]));

create policy "Public can read published saints"
  on public.saints for select to anon, authenticated
  using (visibility = 'publico' and status = 'publicado');
create policy "Authorized users manage saints"
  on public.saints for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[]));

create policy "Public can read published documents"
  on public.documents for select to anon, authenticated
  using (visibility = 'publico' and status = 'publicado');
create policy "Archivists manage documents"
  on public.documents for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[]));

create policy "Public can read mass schedules"
  on public.mass_schedules for select to anon, authenticated using (is_active);
create policy "Authorized users manage mass schedules"
  on public.mass_schedules for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]));

create policy "Public can read schedule exceptions"
  on public.schedule_exceptions for select to anon, authenticated using (true);
create policy "Authorized users manage schedule exceptions"
  on public.schedule_exceptions for all to authenticated
  using (exists (select 1 from public.mass_schedules ms where ms.id = mass_schedule_id and public.has_role(ms.church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[])))
  with check (exists (select 1 from public.mass_schedules ms where ms.id = mass_schedule_id and public.has_role(ms.church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[])));

create policy "Public can read public service prices"
  on public.service_prices for select to anon, authenticated using (show_publicly and is_active);
create policy "Authorized users manage service prices"
  on public.service_prices for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]));

create policy "Users can read audit log for assigned churches"
  on public.audit_log for select to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'secretaria', 'archivista', 'tesorero']::public.app_role[]));
create policy "Authenticated users append audit log"
  on public.audit_log for insert to authenticated
  with check (actor_id = (select auth.uid()));

create policy "Authorized users manage OCR jobs"
  on public.ocr_jobs for all to authenticated
  using (exists (select 1 from public.documents d where d.id = document_id and public.has_role(d.church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[])))
  with check (exists (select 1 from public.documents d where d.id = document_id and public.has_role(d.church_id, array['super_admin', 'parroco', 'archivista']::public.app_role[])));

create policy "Assigned users manage mass intentions"
  on public.mass_intentions for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'secretaria', 'tesorero']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'secretaria', 'tesorero']::public.app_role[]));

create policy "Finance roles manage finance entries"
  on public.finance_entries for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'tesorero']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'tesorero']::public.app_role[]));

create policy "Finance roles manage urns"
  on public.urns for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'tesorero']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'tesorero']::public.app_role[]));

create policy "Finance roles manage urn contracts"
  on public.urn_contracts for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco', 'tesorero']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco', 'tesorero']::public.app_role[]));

create policy "Assigned users update events"
  on public.events for update to authenticated
  using (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]))
  with check (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]));
create policy "Assigned users insert events"
  on public.events for insert to authenticated
  with check (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]));
create policy "Assigned users delete events"
  on public.events for delete to authenticated
  using (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]));
create policy "Assigned users update announcements"
  on public.announcements for update to authenticated
  using (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]))
  with check (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]));
create policy "Assigned users insert announcements"
  on public.announcements for insert to authenticated
  with check (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]));
create policy "Assigned users delete announcements"
  on public.announcements for delete to authenticated
  using (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'secretaria']::public.app_role[]));

insert into storage.buckets (id, name, public)
values
  ('church-documents', 'church-documents', false),
  ('church-public-documents', 'church-public-documents', true),
  ('church-media', 'church-media', false)
on conflict (id) do nothing;

create policy "Public can read public church documents"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'church-public-documents');

create policy "Assigned users read church documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'church-documents' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]));
create policy "Assigned archivists upload church documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'church-documents' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]));
create policy "Assigned archivists update church documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'church-documents' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]))
  with check (bucket_id = 'church-documents' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]));
create policy "Assigned archivists delete church documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'church-documents' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]));

create policy "Assigned users manage church media"
  on storage.objects for all to authenticated
  using (bucket_id = 'church-media' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]))
  with check (bucket_id = 'church-media' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]));

create policy "Assigned archivists upload public church documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'church-public-documents' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]));
create policy "Assigned archivists update public church documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'church-public-documents' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]))
  with check (bucket_id = 'church-public-documents' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]));
create policy "Assigned archivists delete public church documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'church-public-documents' and public.has_role(public.storage_church_id(name), array['super_admin', 'parroco', 'archivista']::public.app_role[]));


-- =====================================================================
-- MIGRACION: 20261102113000_phase_1_privilege_corrections.sql
-- =====================================================================

-- Correcciones incrementales de privilegios detectadas durante la validaciÃ³n estÃ¡tica.

grant select on public.schedule_exceptions to anon, authenticated;



-- =====================================================================
-- MIGRACION: 20261102130000_church_profile_write_policy.sql
-- =====================================================================

create policy "Assigned clergy update church profile"
  on public.churches for update to authenticated
  using (public.has_role(id, array['super_admin', 'parroco']::public.app_role[]))
  with check (public.has_role(id, array['super_admin', 'parroco']::public.app_role[]));


-- =====================================================================
-- MIGRACION: 20261102140000_church_user_assignments_policy.sql
-- =====================================================================

create policy "Church managers read assigned users"
  on public.user_church_roles for select to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco']::public.app_role[]));

create policy "Church managers manage assigned users"
  on public.user_church_roles for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco']::public.app_role[]));

create policy "Church managers read assigned profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.has_any_role(array['administrador']))
    or exists (
      select 1
      from public.user_church_roles managed
      join public.user_church_roles target on target.church_id = managed.church_id
      where managed.user_id = (select auth.uid())
        and managed.role in ('super_admin', 'parroco')
        and target.user_id = profiles.id
    )
  );


-- =====================================================================
-- MIGRACION: 20261102143000_schedule_exception_public_scope.sql
-- =====================================================================

drop policy if exists "Public can read schedule exceptions" on public.schedule_exceptions;

create policy "Public can read active church schedule exceptions"
  on public.schedule_exceptions for select to anon, authenticated
  using (
    exists (
      select 1
      from public.mass_schedules ms
      join public.churches c on c.id = ms.church_id
      where ms.id = mass_schedule_id
        and ms.is_active
        and c.is_active
    )
  );


-- =====================================================================
-- MIGRACION: 20261102151500_ocr_job_uniqueness.sql
-- =====================================================================

-- Mantiene una sola tarea OCR activa por documento.
create unique index if not exists ocr_jobs_active_document_idx
  on public.ocr_jobs (document_id)
  where status in ('pendiente', 'procesando');


-- =====================================================================
-- MIGRACION: 20261102152000_urn_church_integrity.sql
-- =====================================================================

-- Impide asociar contratos con urnas de otra iglesia.
alter table public.urns
  add constraint urns_id_church_unique unique (id, church_id);

alter table public.urn_contracts
  add constraint urn_contracts_urn_same_church_fk
  foreign key (urn_id, church_id)
  references public.urns (id, church_id)
  on delete restrict;

create or replace function public.validate_urn_finance_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.related_type = 'urn_contract' then
    if new.direction <> 'ingreso' or new.concept <> 'urna' or new.related_id is null
      or not exists (
        select 1
        from public.urn_contracts
        where id = new.related_id
          and church_id = new.church_id
      ) then
      raise exception 'El pago de urna no corresponde a un contrato de la misma iglesia.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_urn_finance_entry() from public;

drop trigger if exists validate_urn_finance_entry on public.finance_entries;
create trigger validate_urn_finance_entry
  before insert or update on public.finance_entries
  for each row execute function public.validate_urn_finance_entry();


-- =====================================================================
-- MIGRACION: 20261102152500_protect_paid_urn_contracts.sql
-- =====================================================================

-- Conserva la trazabilidad financiera de los contratos de urnas.
create or replace function public.prevent_paid_urn_contract_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.finance_entries
    where related_type = 'urn_contract'
      and related_id = old.id
  ) then
    raise exception 'No se puede eliminar un contrato con pagos registrados.';
  end if;
  return old;
end;
$$;

revoke all on function public.prevent_paid_urn_contract_delete() from public;

drop trigger if exists protect_paid_urn_contract_delete on public.urn_contracts;
create trigger protect_paid_urn_contract_delete
  before delete on public.urn_contracts
  for each row execute function public.prevent_paid_urn_contract_delete();


-- =====================================================================
-- MIGRACION: 20261102153000_urn_payment_balance_guard.sql
-- =====================================================================

-- Impide que los pagos acumulados de un contrato superen su precio acordado.
create or replace function public.validate_urn_payment_balance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  contract_price numeric;
  paid_before numeric;
begin
  if new.related_type = 'urn_contract' then
    select agreed_price_mxn
      into contract_price
      from public.urn_contracts
      where id = new.related_id
        and church_id = new.church_id
      for update;

    if contract_price is null then
      raise exception 'El contrato de urna no existe en la iglesia indicada.';
    end if;

    select coalesce(sum(amount_mxn), 0)
      into paid_before
      from public.finance_entries
      where related_type = 'urn_contract'
        and related_id = new.related_id
        and id <> new.id;

    if paid_before + new.amount_mxn > contract_price then
      raise exception 'El pago supera el saldo pendiente del contrato de urna.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_urn_payment_balance() from public;

drop trigger if exists validate_urn_payment_balance on public.finance_entries;
create trigger validate_urn_payment_balance
  before insert or update on public.finance_entries
  for each row execute function public.validate_urn_payment_balance();


-- =====================================================================
-- MIGRACION: 20261102153500_sync_urn_contract_status.sql
-- =====================================================================

-- Mantiene el estado del inventario sincronizado con los contratos activos.
create or replace function public.sync_urn_contract_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    update public.urns
    set status = 'ocupada'
    where id = new.urn_id
      and church_id = new.church_id;

    if tg_op = 'UPDATE' and (
      old.urn_id is distinct from new.urn_id
      or old.church_id is distinct from new.church_id
    ) then
      update public.urns
      set status = 'disponible'
      where id = old.urn_id
        and church_id = old.church_id
        and not exists (
          select 1
          from public.urn_contracts
          where urn_id = old.urn_id
            and church_id = old.church_id
            and id <> new.id
        );
    end if;
  elsif tg_op = 'DELETE' then
    update public.urns
    set status = 'disponible'
    where id = old.urn_id
      and church_id = old.church_id
      and not exists (
        select 1
        from public.urn_contracts
        where urn_id = old.urn_id
          and church_id = old.church_id
      );
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function public.sync_urn_contract_status() from public;

drop trigger if exists sync_urn_contract_status on public.urn_contracts;
create trigger sync_urn_contract_status
  after insert or update or delete on public.urn_contracts
  for each row execute function public.sync_urn_contract_status();


-- =====================================================================
-- MIGRACION: 20261102154000_unique_urn_contract.sql
-- =====================================================================

-- Una urna solo puede tener un contrato activo porque el modelo no conserva contratos finalizados.
create unique index if not exists urn_contracts_one_active_idx
  on public.urn_contracts (urn_id);


-- =====================================================================
-- MIGRACION: 20261102154500_protect_contracted_urn_status.sql
-- =====================================================================

-- Una urna con contrato activo debe permanecer ocupada.
create or replace function public.validate_contracted_urn_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'ocupada'
    and exists (
      select 1
      from public.urn_contracts
      where urn_id = new.id
        and church_id = new.church_id
    ) then
    raise exception 'La urna tiene un contrato activo y debe permanecer ocupada.';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_contracted_urn_status() from public;

drop trigger if exists validate_contracted_urn_status on public.urns;
create trigger validate_contracted_urn_status
  before update of status on public.urns
  for each row execute function public.validate_contracted_urn_status();


-- =====================================================================
-- MIGRACION: 20261102155000_audit_log_church_scope.sql
-- =====================================================================

-- Un usuario solo puede aportar auditorÃ­a para iglesias donde tiene asignaciÃ³n.
drop policy if exists "Authenticated users append audit log" on public.audit_log;

create policy "Assigned users append audit log"
  on public.audit_log for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and public.has_role(
      church_id,
      array['super_admin', 'parroco', 'vicario', 'secretaria', 'tesorero', 'archivista', 'consulta']::public.app_role[]
    )
  );


-- =====================================================================
-- MIGRACION: 20261102163500_audit_document_integrity.sql
-- =====================================================================

-- Las auditorÃ­as de documentos deben referir a un documento de la misma iglesia.
create or replace function public.validate_document_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.entity_type = 'documents'
    and new.action = 'download'
    and (
      new.entity_id is null
      or not exists (
        select 1
        from public.documents
        where id = new.entity_id
          and church_id = new.church_id
      )
    ) then
    raise exception 'La auditorÃ­a no corresponde a un documento de la misma iglesia.';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_document_audit() from public;

drop trigger if exists validate_document_audit on public.audit_log;
create trigger validate_document_audit
  before insert or update on public.audit_log
  for each row execute function public.validate_document_audit();


-- =====================================================================
-- MIGRACION: 20261102165500_request_ocr_job.sql
-- =====================================================================

-- Solicita o reinicia OCR junto con el estado del documento en una sola transacciÃ³n.
create or replace function public.request_document_ocr(target_document_id uuid)
returns public.ocr_jobs
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_church_id uuid;
  job public.ocr_jobs;
begin
  select church_id
    into target_church_id
    from public.documents
    where id = target_document_id;

  if target_church_id is null or not public.has_role(
    target_church_id,
    array['super_admin', 'parroco', 'archivista']::public.app_role[]
  ) then
    raise exception 'No tienes permiso para solicitar OCR en este documento.';
  end if;

  insert into public.ocr_jobs (document_id, attempts, error, status, finished_at)
  values (target_document_id, 0, null, 'pendiente', null)
  on conflict (document_id) where status in ('pendiente', 'procesando')
  do update set attempts = 0, error = null, status = 'pendiente', finished_at = null
  returning * into job;

  update public.documents
  set ocr_status = 'pendiente'
  where id = target_document_id;

  return job;
end;
$$;

grant execute on function public.request_document_ocr(uuid) to authenticated;


-- =====================================================================
-- MIGRACION: 20261102170500_document_read_roles.sql
-- =====================================================================

-- Los roles de consulta pueden leer documentos internos, pero no modificarlos.
create policy "Assigned users read documents"
  on public.documents for select to authenticated
  using (
    public.has_role(
      church_id,
      array['super_admin', 'parroco', 'vicario', 'secretaria', 'tesorero', 'archivista', 'consulta']::public.app_role[]
    )
  );


-- =====================================================================
-- MIGRACION: 20261102184500_phase_4_schedule_calendar.sql
-- =====================================================================

-- 20261102184500_phase_4_schedule_calendar.sql
-- Fase 4: Horarios, excepciones y calendario

-- 1. Agregar columnas de festividad a santos
alter table public.saints
  add column if not exists feast_day_month integer check (feast_day_month between 1 and 12),
  add column if not exists feast_day_day integer check (feast_day_day between 1 and 31);

-- 2. ValidaciÃ³n de disponibilidad de misa para intenciones
-- Criterio de aceptaciÃ³n: Una misa cancelada en una fecha no aparece como disponible para intenciones.
create or replace function public.validate_mass_intention_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_cancelled boolean;
  schedule_church uuid;
  schedule_active boolean;
begin
  if new.mass_schedule_id is not null then
    select church_id, is_active into schedule_church, schedule_active
    from public.mass_schedules
    where id = new.mass_schedule_id;

    if schedule_church is null then
      raise exception 'El horario de misa seleccionado no existe.';
    end if;

    if schedule_church <> new.church_id then
      raise exception 'El horario de misa no pertenece a la misma iglesia.';
    end if;

    if not coalesce(schedule_active, true) then
      raise exception 'El horario de misa seleccionado estÃ¡ inactivo.';
    end if;

    select exists (
      select 1
      from public.schedule_exceptions
      where mass_schedule_id = new.mass_schedule_id
        and on_date = new.mass_date
        and action = 'cancelar'
    ) into is_cancelled;

    if is_cancelled then
      raise exception 'La misa seleccionada estÃ¡ cancelada para esta fecha.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists mass_intention_schedule_guard on public.mass_intentions;
create trigger mass_intention_schedule_guard
  before insert or update of mass_schedule_id, mass_date, church_id
  on public.mass_intentions
  for each row
  execute function public.validate_mass_intention_schedule();

-- 3. Ãndices para bÃºsqueda de festividades y excepciones
create index if not exists saints_feast_day_idx on public.saints (church_id, feast_day_month, feast_day_day) where status = 'publicado';
create index if not exists schedule_exceptions_lookup_idx on public.schedule_exceptions (mass_schedule_id, on_date, action);


-- =====================================================================
-- MIGRACION: 20261102190000_events_staff_policies.sql
-- =====================================================================

-- 20261102190000_events_staff_policies.sql
-- Permitir lectura interna de eventos para usuarios asignados (evita error RLS al cancelar o consultar eventos no activos)
-- y asegurar cobertura para vicario y eventos de red.

create policy "Assigned users read events"
  on public.events for select to authenticated
  using (
    church_id is null
    or public.has_role(
      church_id,
      array['super_admin', 'parroco', 'vicario', 'secretaria', 'tesorero', 'archivista', 'consulta']::public.app_role[]
    )
  );

drop policy if exists "Assigned users update events" on public.events;
create policy "Assigned users update events"
  on public.events for update to authenticated
  using (
    (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'vicario', 'secretaria']::public.app_role[]))
    or (church_id is null and public.has_role(null, array['super_admin']::public.app_role[]))
  )
  with check (
    (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'vicario', 'secretaria']::public.app_role[]))
    or (church_id is null and public.has_role(null, array['super_admin']::public.app_role[]))
  );

drop policy if exists "Assigned users insert events" on public.events;
create policy "Assigned users insert events"
  on public.events for insert to authenticated
  with check (
    (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'vicario', 'secretaria']::public.app_role[]))
    or (church_id is null and public.has_role(null, array['super_admin']::public.app_role[]))
  );

drop policy if exists "Assigned users delete events" on public.events;
create policy "Assigned users delete events"
  on public.events for delete to authenticated
  using (
    (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'vicario', 'secretaria']::public.app_role[]))
    or (church_id is null and public.has_role(null, array['super_admin']::public.app_role[]))
  );


-- =====================================================================
-- MIGRACION: 20261102192000_ensure_user_profile_trigger.sql
-- =====================================================================

-- 20261102192000_ensure_user_profile_trigger.sql
-- Asegurar que todo usuario de auth.users cuente automÃ¡ticamente con un perfil en public.profiles

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_role text;
  assigned_role text;
begin
  raw_role := coalesce(new.raw_user_meta_data->>'role', new.raw_app_meta_data->>'role', 'secretario');
  if raw_role in ('administrador', 'pastor', 'secretario', 'tesorero', 'coordinador') then
    assigned_role := raw_role;
  else
    assigned_role := 'secretario';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    assigned_role
  )
  on conflict (id) do update
  set email = coalesce(excluded.email, public.profiles.email),
      full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_new_auth_user();

-- Permitir a usuarios autenticados insertar o autorreparar su propio perfil si hiciera falta
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

-- Backfill para usuarios existentes sin perfil
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  'administrador'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;


-- =====================================================================
-- MIGRACION: 20261102194000_phase_5_finance.sql
-- =====================================================================

-- 20261102194000_phase_5_finance.sql
-- Fase 5: Finanzas, intenciones sincronizadas, folios consecutivos y consolidado de red

-- 1. SincronizaciÃ³n 1:1 de intenciones de misa pagadas con finance_entries
create or replace function public.sync_mass_intention_finance_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.finance_entries
    where related_type = 'mass_intention'
      and related_id = old.id;
    return old;
  end if;

  if new.paid and coalesce(new.stipend_mxn, 0) > 0 then
    insert into public.finance_entries (
      church_id, entry_date, direction, concept, amount_mxn,
      related_type, related_id, notes
    )
    values (
      new.church_id, new.mass_date, 'ingreso', 'estipendio_misa',
      new.stipend_mxn, 'mass_intention', new.id, 'Estipendio de misa: ' || new.honoree_name
    )
    on conflict (related_id) where related_type = 'mass_intention'
    do update set
      amount_mxn = excluded.amount_mxn,
      entry_date = excluded.entry_date,
      church_id = excluded.church_id,
      notes = excluded.notes;
  else
    -- Si no estÃ¡ pagada o el estipendio es 0, remover ingreso previo si existÃ­a
    delete from public.finance_entries
    where related_type = 'mass_intention'
      and related_id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_mass_intention_finance_entry() from public;

drop trigger if exists mass_intention_paid_finance on public.mass_intentions;
drop trigger if exists mass_intention_sync_finance on public.mass_intentions;
create trigger mass_intention_sync_finance
  after insert or update of paid, stipend_mxn, mass_date, church_id or delete
  on public.mass_intentions
  for each row execute function public.sync_mass_intention_finance_entry();

-- 2. AsignaciÃ³n automÃ¡tica de folio de recibo consecutivo por iglesia
create or replace function public.assign_receipt_folio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_seq integer;
begin
  if new.receipt_folio is null or trim(new.receipt_folio) = '' then
    select coalesce(count(*), 0) + 1
    into next_seq
    from public.finance_entries
    where church_id = new.church_id
      and receipt_folio is not null
      and receipt_folio ~ '^REC-[0-9]+$';

    new.receipt_folio := 'REC-' || to_char(next_seq, 'FM000000');
  end if;
  return new;
end;
$$;

revoke all on function public.assign_receipt_folio() from public;

drop trigger if exists assign_receipt_folio_trigger on public.finance_entries;
create trigger assign_receipt_folio_trigger
  before insert on public.finance_entries
  for each row execute function public.assign_receipt_folio();

-- 3. FunciÃ³n consolidada de red para super_admin
create or replace function public.get_network_financial_summary()
returns table (
  church_id uuid,
  church_name text,
  church_slug text,
  total_income numeric,
  total_expenses numeric,
  net_balance numeric,
  pending_urn_balance numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id as church_id,
    c.name as church_name,
    c.slug as church_slug,
    coalesce(sum(case when fe.direction = 'ingreso' then fe.amount_mxn else 0 end), 0) as total_income,
    coalesce(sum(case when fe.direction = 'egreso' then fe.amount_mxn else 0 end), 0) as total_expenses,
    coalesce(sum(case when fe.direction = 'ingreso' then fe.amount_mxn when fe.direction = 'egreso' then -fe.amount_mxn else 0 end), 0) as net_balance,
    coalesce((
      select sum(uc.agreed_price_mxn - coalesce(paid.total_paid, 0))
      from public.urn_contracts uc
      left join (
        select related_id, sum(amount_mxn) as total_paid
        from public.finance_entries
        where related_type = 'urn_contract'
        group by related_id
      ) paid on paid.related_id = uc.id
      where uc.church_id = c.id
    ), 0) as pending_urn_balance
  from public.churches c
  left join public.finance_entries fe on fe.church_id = c.id
  where public.has_role(null, array['super_admin']::public.app_role[])
  group by c.id, c.name, c.slug, c.sort_order
  order by c.sort_order;
$$;

grant execute on function public.get_network_financial_summary() to authenticated;


-- =====================================================================
-- MIGRACION: 20261102201500_phase_5_finance_enhancements.sql
-- =====================================================================

-- 20261102201500_phase_5_finance_enhancements.sql
-- Mejoras de robustez para Fase 5:
-- 1. Folios consecutivos basados en MAX para evitar colisiones si se borran registros
-- 2. PropagaciÃ³n de mass_schedule_id desde intenciones de misa hacia finance_entries
-- 3. Ãndices de rendimiento para agregaciones por concepto y horario

-- 1. Folio consecutivo robusto
create or replace function public.assign_receipt_folio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_seq integer;
begin
  if new.receipt_folio is null or trim(new.receipt_folio) = '' then
    select coalesce(max(nullif(regexp_replace(receipt_folio, '^REC-0*', ''), '')::integer), 0) + 1
    into next_seq
    from public.finance_entries
    where church_id = new.church_id
      and receipt_folio is not null
      and receipt_folio ~ '^REC-[0-9]+$';

    new.receipt_folio := 'REC-' || to_char(next_seq, 'FM000000');
  end if;
  return new;
end;
$$;

revoke all on function public.assign_receipt_folio() from public;

-- 2. SincronizaciÃ³n de intenciones incluyendo mass_schedule_id
create or replace function public.sync_mass_intention_finance_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.finance_entries
    where related_type = 'mass_intention'
      and related_id = old.id;
    return old;
  end if;

  if new.paid and coalesce(new.stipend_mxn, 0) > 0 then
    insert into public.finance_entries (
      church_id, entry_date, direction, concept, amount_mxn,
      mass_schedule_id, related_type, related_id, notes
    )
    values (
      new.church_id, new.mass_date, 'ingreso', 'estipendio_misa',
      new.stipend_mxn, new.mass_schedule_id, 'mass_intention', new.id,
      'Estipendio de misa: ' || new.honoree_name
    )
    on conflict (related_id) where related_type = 'mass_intention'
    do update set
      amount_mxn = excluded.amount_mxn,
      entry_date = excluded.entry_date,
      church_id = excluded.church_id,
      mass_schedule_id = excluded.mass_schedule_id,
      notes = excluded.notes;
  else
    -- Si no estÃ¡ pagada o el estipendio es 0, remover ingreso previo si existÃ­a
    delete from public.finance_entries
    where related_type = 'mass_intention'
      and related_id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_mass_intention_finance_entry() from public;

-- 3. Ãndices de aceleraciÃ³n para consultas de balance y conceptos
create index if not exists finance_entries_concept_idx
  on public.finance_entries (church_id, direction, concept);

create index if not exists finance_entries_schedule_idx
  on public.finance_entries (church_id, mass_schedule_id);


-- =====================================================================
-- MIGRACION: 20261102213000_media_and_item_images.sql
-- =====================================================================

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


-- =====================================================================
-- MIGRACION: 20261102213500_seed_churches_cover_images.sql
-- =====================================================================

-- Migration: 20261102213500_seed_churches_cover_images.sql
-- Assigns representative church images to public.churches by slug.

update public.churches set cover_path = '/images/churches/catedral-san-ildefonso.png' where slug = 'catedral-san-ildefonso';
update public.churches set cover_path = '/images/churches/jesus-tercera-orden.jpg' where slug = 'jesus-tercera-orden';
update public.churches set cover_path = '/images/churches/la-candelaria.jpg' where slug = 'la-candelaria';
update public.churches set cover_path = '/images/churches/santa-lucia.jpg' where slug = 'santa-lucia';
update public.churches set cover_path = '/images/churches/san-juan-de-dios.jpg' where slug = 'san-juan-de-dios';
update public.churches set cover_path = '/images/churches/santa-ana.jpg' where slug = 'santa-ana';
update public.churches set cover_path = '/images/churches/la-mejorada.jpg' where slug = 'la-mejorada';
update public.churches set cover_path = '/images/churches/san-cristobal.jpg' where slug = 'san-cristobal';
update public.churches set cover_path = '/images/churches/santiago.jpg' where slug = 'santiago';
update public.churches set cover_path = '/images/churches/santa-isabel.jpg' where slug = 'santa-isabel';


-- =====================================================================
-- SEED DE USUARIOS DE PRUEBA Y ROLES (PLAN.md §7.0)
-- =====================================================================
-- supabase/seed.sql
-- Usuarios de prueba por rol para entorno local/desarrollo (PLAN.md Â§7.0 / Fase 1)

do $$
declare
  v_cathedral_id uuid;
begin
  select id into v_cathedral_id from public.churches where slug = 'catedral-san-ildefonso';

  -- 1. Administrador (super_admin de red)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c058',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrador General","role":"administrador"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c058', 'admin@iglesia.local', 'Administrador General', 'administrador')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  insert into public.user_church_roles (user_id, church_id, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c058', null, 'super_admin'::public.app_role)
  on conflict do nothing;

  -- 2. PÃ¡rroco
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c051',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'parroco@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Pbro. PÃ¡rroco Catedral","role":"pastor"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c051', 'parroco@iglesia.local', 'Pbro. PÃ¡rroco Catedral', 'pastor')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c051', v_cathedral_id, 'parroco'::public.app_role)
    on conflict do nothing;
  end if;

  -- 3. Vicario
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c052',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'vicario@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Vicario Parroquial","role":"pastor"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c052', 'vicario@iglesia.local', 'Vicario Parroquial', 'pastor')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c052', v_cathedral_id, 'vicario'::public.app_role)
    on conflict do nothing;
  end if;

  -- 4. Secretaria
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c053',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'secretaria@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"SecretarÃ­a Parroquial","role":"secretario"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c053', 'secretaria@iglesia.local', 'SecretarÃ­a Parroquial', 'secretario')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c053', v_cathedral_id, 'secretaria'::public.app_role)
    on conflict do nothing;
  end if;

  -- 5. Tesorero
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c054',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'tesorero@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Tesorero Parroquial","role":"tesorero"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c054', 'tesorero@iglesia.local', 'Tesorero Parroquial', 'tesorero')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c054', v_cathedral_id, 'tesorero'::public.app_role)
    on conflict do nothing;
  end if;

  -- 6. Archivista
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c055',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'archivista@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Archivista HistÃ³rico","role":"secretario"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c055', 'archivista@iglesia.local', 'Archivista HistÃ³rico', 'secretario')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c055', v_cathedral_id, 'archivista'::public.app_role)
    on conflict do nothing;
  end if;

  -- 7. Consulta
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c056',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'consulta@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Usuario Solo Lectura","role":"secretario"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c056', 'consulta@iglesia.local', 'Usuario Solo Lectura', 'secretario')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c056', v_cathedral_id, 'consulta'::public.app_role)
    on conflict do nothing;
  end if;

  -- Asegurar que los tokens de auth no sean NULL (requerido por GoTrue)
  update auth.users
  set confirmation_token = coalesce(confirmation_token, ''),
      recovery_token = coalesce(recovery_token, ''),
      email_change_token_new = coalesce(email_change_token_new, ''),
      email_change = coalesce(email_change, ''),
      reauthentication_token = coalesce(reauthentication_token, '');

  -- Sincronizar identidades para permitir inicio de sesiÃ³n con contraseÃ±a
  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  select
    u.id::text,
    u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email',
    now(),
    now()
  from auth.users u
  on conflict (provider_id, provider) do nothing;
end;
$$;

