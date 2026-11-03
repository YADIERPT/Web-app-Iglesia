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
