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
