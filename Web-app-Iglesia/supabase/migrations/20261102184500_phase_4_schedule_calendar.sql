-- 20261102184500_phase_4_schedule_calendar.sql
-- Fase 4: Horarios, excepciones y calendario

-- 1. Agregar columnas de festividad a santos
alter table public.saints
  add column if not exists feast_day_month integer check (feast_day_month between 1 and 12),
  add column if not exists feast_day_day integer check (feast_day_day between 1 and 31);

-- 2. Validación de disponibilidad de misa para intenciones
-- Criterio de aceptación: Una misa cancelada en una fecha no aparece como disponible para intenciones.
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
      raise exception 'El horario de misa seleccionado está inactivo.';
    end if;

    select exists (
      select 1
      from public.schedule_exceptions
      where mass_schedule_id = new.mass_schedule_id
        and on_date = new.mass_date
        and action = 'cancelar'
    ) into is_cancelled;

    if is_cancelled then
      raise exception 'La misa seleccionada está cancelada para esta fecha.';
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

-- 3. Índices para búsqueda de festividades y excepciones
create index if not exists saints_feast_day_idx on public.saints (church_id, feast_day_month, feast_day_day) where status = 'publicado';
create index if not exists schedule_exceptions_lookup_idx on public.schedule_exceptions (mass_schedule_id, on_date, action);
