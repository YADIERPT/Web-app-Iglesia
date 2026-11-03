-- Solicita o reinicia OCR junto con el estado del documento en una sola transacción.
create or replace function public.request_document_ocr(target_document_id uuid)
returns public.ocr_jobs
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_church_id uuid;
  job public.ocr_jobs;
begin
  select church_id
    into target_church_id
    from public.documents
    where id = target_document_id;

  if target_church_id is null or not public.has_role(
    target_church_id,
    array['super_admin', 'parroco', 'archivista']::public.app_role[]
  ) then
    raise exception 'No tienes permiso para solicitar OCR en este documento.';
  end if;

  insert into public.ocr_jobs (document_id, attempts, error, status, finished_at)
  values (target_document_id, 0, null, 'pendiente', null)
  on conflict (document_id) where status in ('pendiente', 'procesando')
  do update set attempts = 0, error = null, status = 'pendiente', finished_at = null
  returning * into job;

  update public.documents
  set ocr_status = 'pendiente'
  where id = target_document_id;

  return job;
end;
$$;

grant execute on function public.request_document_ocr(uuid) to authenticated;
