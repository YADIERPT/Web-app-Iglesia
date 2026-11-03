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
