-- Mantiene una sola tarea OCR activa por documento.
create unique index if not exists ocr_jobs_active_document_idx
  on public.ocr_jobs (document_id)
  where status in ('pendiente', 'procesando');
