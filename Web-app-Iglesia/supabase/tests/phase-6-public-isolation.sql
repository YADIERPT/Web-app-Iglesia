-- Regresión de Fase 6: Aislamiento estricto del sitio público y rol anónimo.
-- Ejecutar sobre base de pruebas; todo se revierte al final.

begin;

insert into public.churches (id, slug, name, sort_order)
values ('66a11111-1111-4111-8111-111111111111', 'test-pub-iglesia', 'Test Pública', 920)
on conflict (id) do nothing;

-- 1. Crear registros públicos vs internos
insert into public.heritage_objects (id, church_id, name, visibility, status)
values
  ('66a10001-1111-4111-8111-111111111111', '66a11111-1111-4111-8111-111111111111', 'Cáliz Público', 'publico', 'publicado'),
  ('66a10002-1111-4111-8111-111111111111', '66a11111-1111-4111-8111-111111111111', 'Cáliz Interno', 'interno', 'borrador');

insert into public.saints (id, church_id, name, visibility, status)
values
  ('66a20001-1111-4111-8111-111111111111', '66a11111-1111-4111-8111-111111111111', 'San Juan Público', 'publico', 'publicado'),
  ('66a20002-1111-4111-8111-111111111111', '66a11111-1111-4111-8111-111111111111', 'San Juan Interno', 'interno', 'borrador');

insert into public.documents (id, church_id, title, file_path, visibility, status)
values
  ('66a30001-1111-4111-8111-111111111111', '66a11111-1111-4111-8111-111111111111', 'Acta Pública', 'doc-pub.pdf', 'publico', 'publicado'),
  ('66a30002-1111-4111-8111-111111111111', '66a11111-1111-4111-8111-111111111111', 'Acta Interna', 'doc-int.pdf', 'interno', 'borrador');

insert into public.finance_entries (church_id, entry_date, direction, concept, amount_mxn)
values ('66a11111-1111-4111-8111-111111111111', current_date, 'ingreso', 'colecta', 500);

insert into public.mass_intentions (church_id, mass_date, intention_type, honoree_name, stipend_mxn)
values ('66a11111-1111-4111-8111-111111111111', current_date, 'difunto', 'Difunto Confidencial', 100);

-- 2. Cambiar a rol anon (público sin autenticación)
set local role anon;

do $$
declare
  obj_count integer;
  saint_count integer;
  doc_count integer;
  fin_count integer;
  intent_count integer;
  audit_count integer;
  can_write boolean := false;
begin
  -- Solo 1 objeto público visible
  select count(*) into obj_count from public.heritage_objects
  where id in ('66a10001-1111-4111-8111-111111111111', '66a10002-1111-4111-8111-111111111111');
  if obj_count <> 1 then
    raise exception 'El rol anónimo vio % objetos; se esperaba exactamente 1.', obj_count;
  end if;

  -- Solo 1 santo público visible
  select count(*) into saint_count from public.saints
  where id in ('66a20001-1111-4111-8111-111111111111', '66a20002-1111-4111-8111-111111111111');
  if saint_count <> 1 then
    raise exception 'El rol anónimo vio % santos; se esperaba exactamente 1.', saint_count;
  end if;

  -- Solo 1 documento público visible
  select count(*) into doc_count from public.documents
  where id in ('66a30001-1111-4111-8111-111111111111', '66a30002-1111-4111-8111-111111111111');
  if doc_count <> 1 then
    raise exception 'El rol anónimo vio % documentos; se esperaba exactamente 1.', doc_count;
  end if;

  -- 0 registros de finanzas visibles
  select count(*) into fin_count from public.finance_entries;
  if fin_count <> 0 then
    raise exception 'El rol anónimo pudo leer movimientos financieros! (filas: %)', fin_count;
  end if;

  -- 0 intenciones visibles (los nombres de los difuntos nunca se publican)
  select count(*) into intent_count from public.mass_intentions;
  if intent_count <> 0 then
    raise exception 'El rol anónimo pudo leer intenciones de misa! (filas: %)', intent_count;
  end if;

  -- 0 auditorías visibles
  select count(*) into audit_count from public.audit_log;
  if audit_count <> 0 then
    raise exception 'El rol anónimo pudo leer la tabla de auditoría! (filas: %)', audit_count;
  end if;

  -- El rol anónimo NO puede escribir nada
  begin
    insert into public.heritage_objects (church_id, name, visibility, status)
    values ('66a11111-1111-4111-8111-111111111111', 'Ataque Anónimo', 'publico', 'publicado');
    can_write := true;
  exception
    when others then null;
  end;

  if can_write then
    raise exception 'El rol anónimo pudo insertar un registro de patrimonio!';
  end if;
end
$$;

rollback;
