-- 20261102201500_phase_5_finance_enhancements.sql
-- Mejoras de robustez para Fase 5:
-- 1. Folios consecutivos basados en MAX para evitar colisiones si se borran registros
-- 2. Propagación de mass_schedule_id desde intenciones de misa hacia finance_entries
-- 3. Índices de rendimiento para agregaciones por concepto y horario

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

-- 2. Sincronización de intenciones incluyendo mass_schedule_id
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
    -- Si no está pagada o el estipendio es 0, remover ingreso previo si existía
    delete from public.finance_entries
    where related_type = 'mass_intention'
      and related_id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_mass_intention_finance_entry() from public;

-- 3. Índices de aceleración para consultas de balance y conceptos
create index if not exists finance_entries_concept_idx
  on public.finance_entries (church_id, direction, concept);

create index if not exists finance_entries_schedule_idx
  on public.finance_entries (church_id, mass_schedule_id);
