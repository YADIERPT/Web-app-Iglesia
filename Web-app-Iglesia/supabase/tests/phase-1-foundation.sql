-- Regresión estructural de Fase 1.
-- Ejecutar después de `supabase db reset` en una base local o de desarrollo.

do $$
declare
  church_count integer;
  role_count integer;
  public_bucket boolean;
  private_bucket boolean;
  anon_can_read_exceptions boolean;
begin
  select count(*) into church_count from public.churches;
  if church_count <> 10 then
    raise exception 'Se esperaban 10 iglesias y se encontraron %.', church_count;
  end if;

  select count(*) into role_count
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typname = 'app_role';
  if role_count <> 1 then
    raise exception 'No existe exactamente un tipo public.app_role.';
  end if;

  select exists (
    select 1 from storage.buckets
    where id = 'church-public-documents' and public
  ) into public_bucket;
  if not public_bucket then
    raise exception 'Falta el bucket público de documentos.';
  end if;

  select exists (
    select 1 from storage.buckets
    where id = 'church-documents' and not public
  ) into private_bucket;
  if not private_bucket then
    raise exception 'El bucket privado de documentos no está configurado correctamente.';
  end if;

  select has_table_privilege('anon', 'public.schedule_exceptions', 'select')
  into anon_can_read_exceptions;
  if not anon_can_read_exceptions then
    raise exception 'Los visitantes no pueden consultar excepciones de horarios.';
  end if;

  if not exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'has_role'
  ) then
    raise exception 'Falta public.has_role.';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'mass_intention_paid_finance'
  ) then
    raise exception 'Falta el trigger de intención pagada.';
  end if;
end
$$;

-- Las filas públicas deben poder consultarse sin exponer finanzas.
select has_table_privilege('anon', 'public.documents', 'select') as anon_can_select_documents,
       has_table_privilege('anon', 'public.finance_entries', 'select') as anon_can_select_finance,
       has_table_privilege('anon', 'public.mass_intentions', 'select') as anon_can_select_intentions,
       has_table_privilege('anon', 'public.schedule_exceptions', 'select') as anon_can_select_schedule_exceptions;
