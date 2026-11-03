-- Regresión de Fase 5: Finanzas, intenciones sincronizadas, folios de recibo y consolidado de red.
-- Ejecutar sobre base de pruebas; todo se revierte al final.

begin;

-- Preparar iglesias de prueba
insert into public.churches (id, slug, name, sort_order)
values
  ('55a11111-1111-4111-8111-111111111111', 'test-fin-iglesia-a', 'Test Finanzas A', 910),
  ('55b22222-2222-4222-8222-222222222222', 'test-fin-iglesia-b', 'Test Finanzas B', 911)
on conflict (id) do nothing;

-- Preparar usuarios de prueba
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('55a10001-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'fin-admin@test.local', now(), now(), now()),
  ('55a10002-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'fin-tesorero-a@test.local', now(), now(), now()),
  ('55b10003-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'fin-tesorero-b@test.local', now(), now(), now()),
  ('55a10004-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'fin-archivista-a@test.local', now(), now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role)
values
  ('55a10001-1111-4111-8111-111111111111', 'fin-admin@test.local', 'Super Admin Fin', 'administrador'),
  ('55a10002-1111-4111-8111-111111111111', 'fin-tesorero-a@test.local', 'Tesorero A', 'tesorero'),
  ('55b10003-2222-4222-8222-222222222222', 'fin-tesorero-b@test.local', 'Tesorero B', 'tesorero'),
  ('55a10004-1111-4111-8111-111111111111', 'fin-archivista-a@test.local', 'Archivista A', 'secretario')
on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

insert into public.user_church_roles (user_id, church_id, role)
values
  ('55a10001-1111-4111-8111-111111111111', null, 'super_admin'),
  ('55a10002-1111-4111-8111-111111111111', '55a11111-1111-4111-8111-111111111111', 'tesorero'),
  ('55b10003-2222-4222-8222-222222222222', '55b22222-2222-4222-8222-222222222222', 'tesorero'),
  ('55a10004-1111-4111-8111-111111111111', '55a11111-1111-4111-8111-111111111111', 'archivista')
on conflict do nothing;

-- 1. Test sincronización 1:1 de intenciones de misa y folios automáticos
do $$
declare
  intent_id uuid := '55a00000-0000-0000-0000-000000000001';
  fe_count integer;
  fe_amount numeric;
  fe_folio text;
begin
  -- Inserción no pagada: NO genera movimiento
  insert into public.mass_intentions (id, church_id, mass_date, intention_type, honoree_name, stipend_mxn, paid)
  values (intent_id, '55a11111-1111-4111-8111-111111111111', current_date, 'difunto', 'Prueba Intencion 1', 150, false);

  select count(*) into fe_count from public.finance_entries where related_type = 'mass_intention' and related_id = intent_id;
  if fe_count <> 0 then
    raise exception 'Intención no pagada no debió generar movimiento financiero (obtenido: %)', fe_count;
  end if;

  -- Marcar pagada: DEBE generar exactamente 1 movimiento con folio REC-000001
  update public.mass_intentions set paid = true where id = intent_id;

  select count(*), max(amount_mxn), max(receipt_folio)
  into fe_count, fe_amount, fe_folio
  from public.finance_entries
  where related_type = 'mass_intention' and related_id = intent_id;

  if fe_count <> 1 or fe_amount <> 150 or fe_folio <> 'REC-000001' then
    raise exception 'Error al generar movimiento de intención: count=%, amount=%, folio=%', fe_count, fe_amount, fe_folio;
  end if;

  -- Actualizar monto: DEBE sincronizar amount_mxn
  update public.mass_intentions set stipend_mxn = 220 where id = intent_id;

  select amount_mxn into fe_amount
  from public.finance_entries
  where related_type = 'mass_intention' and related_id = intent_id;

  if fe_amount <> 220 then
    raise exception 'Error al sincronizar monto actualizado de intención: %', fe_amount;
  end if;

  -- Desmarcar pagada: DEBE eliminar el movimiento financiero
  update public.mass_intentions set paid = false where id = intent_id;

  select count(*) into fe_count from public.finance_entries where related_type = 'mass_intention' and related_id = intent_id;
  if fe_count <> 0 then
    raise exception 'Al desmarcar pagada no se eliminó el movimiento financiero.';
  end if;

  -- Eliminar intención
  delete from public.mass_intentions where id = intent_id;
end
$$;

-- 2. Test folios de recibo consecutivos por iglesia
do $$
declare
  f1 text;
  f2 text;
  f_b text;
begin
  insert into public.finance_entries (church_id, entry_date, direction, concept, amount_mxn)
  values ('55a11111-1111-4111-8111-111111111111', current_date, 'ingreso', 'colecta', 500)
  returning receipt_folio into f1;

  insert into public.finance_entries (church_id, entry_date, direction, concept, amount_mxn)
  values ('55a11111-1111-4111-8111-111111111111', current_date, 'ingreso', 'donativo', 300)
  returning receipt_folio into f2;

  -- Iglesia B debe empezar su propia numeración
  insert into public.finance_entries (church_id, entry_date, direction, concept, amount_mxn)
  values ('55b22222-2222-4222-8222-222222222222', current_date, 'ingreso', 'colecta', 1000)
  returning receipt_folio into f_b;

  if f1 <> 'REC-000001' or f2 <> 'REC-000002' then
    raise exception 'Folios consecutivos en Iglesia A fallaron: f1=%, f2=%', f1, f2;
  end if;

  if f_b <> 'REC-000001' then
    raise exception 'Folio consecutivo en Iglesia B debió ser REC-000001, obtenido: %', f_b;
  end if;
end
$$;

-- 3. Test de contratos de urnas y saldos
do $$
declare
  u_id uuid;
  c_id uuid;
  overpay_blocked boolean := false;
begin
  insert into public.urns (church_id, code, status)
  values ('55a11111-1111-4111-8111-111111111111', 'TEST-FIN-URN', 'disponible')
  returning id into u_id;

  insert into public.urn_contracts (church_id, urn_id, holder_name, agreed_price_mxn, start_date)
  values ('55a11111-1111-4111-8111-111111111111', u_id, 'Titular Urna Fin', 5000, current_date)
  returning id into c_id;

  -- Pago válido de 3000
  insert into public.finance_entries (church_id, entry_date, direction, concept, amount_mxn, related_type, related_id)
  values ('55a11111-1111-4111-8111-111111111111', current_date, 'ingreso', 'urna', 3000, 'urn_contract', c_id);

  -- Intento de pago que supera el saldo (quedan 2000, intenta pagar 2500)
  begin
    insert into public.finance_entries (church_id, entry_date, direction, concept, amount_mxn, related_type, related_id)
    values ('55a11111-1111-4111-8111-111111111111', current_date, 'ingreso', 'urna', 2500, 'urn_contract', c_id);
  exception
    when others then
      overpay_blocked := true;
  end;

  if not overpay_blocked then
    raise exception 'Se permitió registrar un pago de urna superior al saldo restante.';
  end if;
end
$$;

-- 4. Test RLS: tesorero Iglesia A solo ve y gestiona Iglesia A
set local role authenticated;
select set_config('request.jwt.claim.sub', '55a10002-1111-4111-8111-111111111111', true);

do $$
declare
  visible_rows integer;
  can_insert_b boolean := false;
begin
  -- Solo debe ver los movimientos de Iglesia A
  select count(*) into visible_rows from public.finance_entries;
  if visible_rows < 3 then
    raise exception 'Tesorero A no pudo ver sus movimientos de Iglesia A (vistos: %)', visible_rows;
  end if;

  select count(*) into visible_rows from public.finance_entries where church_id = '55b22222-2222-4222-8222-222222222222';
  if visible_rows <> 0 then
    raise exception 'Tesorero A pudo ver movimientos de Iglesia B!';
  end if;

  -- Tesorero A no puede insertar en Iglesia B
  begin
    insert into public.finance_entries (church_id, entry_date, direction, concept, amount_mxn)
    values ('55b22222-2222-4222-8222-222222222222', current_date, 'ingreso', 'donativo', 100);
    can_insert_b := true;
  exception
    when others then null;
  end;

  if can_insert_b then
    raise exception 'Tesorero A pudo insertar movimientos en Iglesia B!';
  end if;
end
$$;

-- 5. Test RLS: archivista no puede leer finance_entries
select set_config('request.jwt.claim.sub', '55a10004-1111-4111-8111-111111111111', true);

do $$
declare
  arch_rows integer;
begin
  select count(*) into arch_rows from public.finance_entries;
  if arch_rows <> 0 then
    raise exception 'Archivista pudo leer movimientos financieros (vistos: %)', arch_rows;
  end if;
end
$$;

-- 6. Test función de consolidado de red get_network_financial_summary()
-- No autorizado para archivista / tesorero
do $$
declare
  summary_rows integer;
begin
  select count(*) into summary_rows from public.get_network_financial_summary();
  if summary_rows <> 0 then
    raise exception 'Usuario no super_admin pudo ver filas del consolidado de red!';
  end if;
end
$$;

-- Autorizado para super_admin
select set_config('request.jwt.claim.sub', '55a10001-1111-4111-8111-111111111111', true);

do $$
declare
  summary_rows integer;
  row_a record;
begin
  select count(*) into summary_rows from public.get_network_financial_summary();
  if summary_rows = 0 then
    raise exception 'Super admin no pudo obtener el consolidado de red.';
  end if;

  select * into row_a from public.get_network_financial_summary() where church_id = '55a11111-1111-4111-8111-111111111111';
  -- En Iglesia A tenemos: 500 (colecta) + 300 (donativo) + 3000 (urna) = 3800 ingreso
  -- Saldo pendiente urna: 5000 - 3000 = 2000
  if row_a.total_income <> 3800 or row_a.pending_urn_balance <> 2000 then
    raise exception 'Consolidado financiero incorrecto para Iglesia A: total_income=%, pending_urn_balance=% (esperado 3800 y 2000)',
      row_a.total_income, row_a.pending_urn_balance;
  end if;
end
$$;

rollback;
