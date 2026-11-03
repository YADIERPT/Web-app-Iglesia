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
      new.stipend_mxn, 'mass_intention', new.id, 'Generado desde intención de misa'
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
  ('jesus-tercera-orden', 'Iglesia de Jesús (Tercera Orden)', 1),
  ('la-candelaria', 'Iglesia de la Candelaria', 2),
  ('santa-lucia', 'Iglesia de Santa Lucía', 3),
  ('san-juan-de-dios', 'Iglesia de San Juan de Dios', 4),
  ('santa-ana', 'Iglesia de Santa Ana', 5),
  ('la-mejorada', 'Iglesia de La Mejorada', 6),
  ('san-cristobal', 'Iglesia de San Cristóbal', 7),
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
         when 'Miércoles' then 3
         when 'Jueves' then 4
         when 'Viernes' then 5
         when 'Sábado' then 6
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
