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
