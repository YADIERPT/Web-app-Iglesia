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
