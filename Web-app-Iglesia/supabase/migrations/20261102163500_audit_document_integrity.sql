-- Las auditorías de documentos deben referir a un documento de la misma iglesia.
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
    raise exception 'La auditoría no corresponde a un documento de la misma iglesia.';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_document_audit() from public;

drop trigger if exists validate_document_audit on public.audit_log;
create trigger validate_document_audit
  before insert or update on public.audit_log
  for each row execute function public.validate_document_audit();
