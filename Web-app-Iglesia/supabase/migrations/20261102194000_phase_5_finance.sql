-- 20261102194000_phase_5_finance.sql
-- Fase 5: Finanzas, intenciones sincronizadas, folios consecutivos y consolidado de red

-- 1. Sincronización 1:1 de intenciones de misa pagadas con finance_entries
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
    -- Si no está pagada o el estipendio es 0, remover ingreso previo si existía
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

-- 2. Asignación automática de folio de recibo consecutivo por iglesia
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

-- 3. Función consolidada de red para super_admin
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
