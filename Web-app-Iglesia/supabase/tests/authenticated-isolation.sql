-- Regresión RLS autenticada para dos iglesias locales/de desarrollo.
-- Ejecutar únicamente sobre una base de pruebas; todo se revierte al final.

begin;

insert into public.churches (id, slug, name, sort_order)
values
  ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'test-iglesia-a', 'Test Iglesia A', 900),
  ('787bea5a-ad6e-4442-9051-28f47d7e06c0', 'test-iglesia-b', 'Test Iglesia B', 901)
on conflict (id) do nothing;

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'rls-a@example.test', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'rls-b@example.test', now(), now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role)
values
  ('11111111-1111-4111-8111-111111111111', 'rls-a@example.test', 'RLS Iglesia A', 'secretario'),
  ('22222222-2222-4222-8222-222222222222', 'rls-b@example.test', 'RLS Iglesia B', 'secretario')
on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

insert into public.user_church_roles (user_id, church_id, role)
values
  ('11111111-1111-4111-8111-111111111111', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'archivista'),
  ('11111111-1111-4111-8111-111111111111', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'secretaria'),
  ('11111111-1111-4111-8111-111111111111', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'tesorero'),
  ('22222222-2222-4222-8222-222222222222', '787bea5a-ad6e-4442-9051-28f47d7e06c0', 'archivista')
on conflict do nothing;

insert into public.heritage_objects (id, church_id, name, visibility, status)
values
  ('31111111-1111-4111-8111-111111111111', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'RLS patrimonio A', 'interno', 'borrador'),
  ('32222222-2222-4222-8222-222222222222', '787bea5a-ad6e-4442-9051-28f47d7e06c0', 'RLS patrimonio B', 'interno', 'borrador');

insert into public.documents (id, church_id, title, file_path, visibility, status)
values
  ('41111111-1111-4111-8111-111111111111', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'RLS documento A', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490/test-a.pdf', 'interno', 'borrador'),
  ('42222222-2222-4222-8222-222222222222', '787bea5a-ad6e-4442-9051-28f47d7e06c0', 'RLS documento B', '787bea5a-ad6e-4442-9051-28f47d7e06c0/test-b.pdf', 'interno', 'borrador');

insert into public.ocr_jobs (document_id, status)
values ('41111111-1111-4111-8111-111111111111', 'pendiente');

do $$
declare
  intention_id uuid;
  finance_rows integer;
begin
  insert into public.mass_intentions (church_id, mass_date, intention_type, honoree_name, stipend_mxn, paid)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', current_date, 'difunto', 'Intención RLS A', 100, true)
  returning id into intention_id;
  select count(*) into finance_rows
  from public.finance_entries
  where related_type = 'mass_intention' and related_id = intention_id;
  if finance_rows <> 1 then
    raise exception 'El trigger de intención pagada generó % movimientos; se esperaba 1.', finance_rows;
  end if;
end
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select public.request_document_ocr('41111111-1111-4111-8111-111111111111');

do $$
declare
  visible_rows integer;
begin
  select count(*) into visible_rows
  from public.heritage_objects
  where id in ('31111111-1111-4111-8111-111111111111', '32222222-2222-4222-8222-222222222222');
  if visible_rows <> 1 then
    raise exception 'El usuario A puede leer % registros; se esperaba exactamente 1.', visible_rows;
  end if;
end
$$;

do $$
declare
  succeeded boolean := false;
begin
  insert into public.audit_log (
    actor_id, church_id, action, entity_type, entity_id, metadata
  )
  values (
    '11111111-1111-4111-8111-111111111111',
    '44c762a9-2982-4e51-8f8c-1ef9ddfe5490',
    'download',
    'documents',
    '41111111-1111-4111-8111-111111111111',
    '{"test":true}'::jsonb
  );

  begin
    insert into public.audit_log (
      actor_id, church_id, action, entity_type, entity_id, metadata
    )
    values (
      '11111111-1111-4111-8111-111111111111',
      '787bea5a-ad6e-4442-9051-28f47d7e06c0',
      'download',
      'documents',
      '42222222-2222-4222-8222-222222222222',
      '{"test":true}'::jsonb
    );
    succeeded := true;
  exception
    when insufficient_privilege then null;
  end;
  if succeeded then
    raise exception 'El usuario A pudo auditar una descarga en la iglesia B.';
  end if;
end
$$;

do $$
declare
  succeeded boolean := false;
begin
  begin
    insert into public.mass_intentions (church_id, mass_date, intention_type, honoree_name, stipend_mxn, paid)
    values ('787bea5a-ad6e-4442-9051-28f47d7e06c0', current_date, 'difunto', 'No autorizado', 10, false);
    succeeded := true;
  exception
    when insufficient_privilege then null;
  end;
  if succeeded then
    raise exception 'El usuario A pudo insertar una intención en la iglesia B.';
  end if;
end
$$;

do $$
declare
  visible_rows integer;
begin
  select count(*) into visible_rows
  from public.documents
  where id in ('41111111-1111-4111-8111-111111111111', '42222222-2222-4222-8222-222222222222');
  if visible_rows <> 1 then
    raise exception 'El usuario A puede leer % documentos internos; se esperaba exactamente 1.', visible_rows;
  end if;
end
$$;

do $$
declare
  succeeded boolean := false;
begin
  begin
    insert into public.finance_entries (church_id, entry_date, direction, concept, amount_mxn)
    values ('787bea5a-ad6e-4442-9051-28f47d7e06c0', current_date, 'ingreso', 'colecta', 50);
    succeeded := true;
  exception
    when insufficient_privilege then null;
  end;
  if succeeded then
    raise exception 'El usuario A pudo insertar finanzas en la iglesia B.';
  end if;
end
$$;

do $$
declare
  succeeded boolean := false;
begin
  begin
    insert into public.urns (church_id, code, status)
    values ('787bea5a-ad6e-4442-9051-28f47d7e06c0', 'RLS-B', 'disponible');
    succeeded := true;
  exception
    when insufficient_privilege then null;
  end;
  if succeeded then
    raise exception 'El usuario A pudo insertar una urna en la iglesia B.';
  end if;
end
$$;

do $$
declare
  succeeded boolean := false;
begin
  begin
    insert into public.audit_log (
      actor_id, church_id, action, entity_type, entity_id, metadata
    )
    values (
      '11111111-1111-4111-8111-111111111111',
      '44c762a9-2982-4e51-8f8c-1ef9ddfe5490',
      'download',
      'documents',
      '42222222-2222-4222-8222-222222222222',
      '{"test":true}'::jsonb
    );
    succeeded := true;
  exception
    when others then null;
  end;
  if succeeded then
    raise exception 'Se pudo auditar un documento de otra iglesia.';
  end if;
end
$$;

do $$
declare
  urn_a uuid;
  contract_a uuid;
  succeeded boolean := false;
begin
  insert into public.urns (church_id, code, status)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'RLS-URN-A', 'disponible')
  returning id into urn_a;

  insert into public.urn_contracts (church_id, urn_id, holder_name, agreed_price_mxn, start_date)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', urn_a, 'Titular RLS A', 100, current_date)
  returning id into contract_a;

  begin
    insert into public.finance_entries (
      church_id, entry_date, direction, concept, amount_mxn, related_type, related_id
    )
    values (
      '787bea5a-ad6e-4442-9051-28f47d7e06c0', current_date, 'ingreso', 'urna', 10, 'urn_contract', contract_a
    );
    succeeded := true;
  exception
    when others then null;
  end;
  if succeeded then
    raise exception 'Se pudo registrar un pago de urna entre iglesias.';
  end if;
end
$$;

do $$
declare
  urn_paid uuid;
  contract_paid uuid;
  succeeded boolean := false;
begin
  insert into public.urns (church_id, code, status)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'RLS-URN-PAID', 'ocupada')
  returning id into urn_paid;

  insert into public.urn_contracts (church_id, urn_id, holder_name, agreed_price_mxn, start_date)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', urn_paid, 'Titular pagado', 100, current_date)
  returning id into contract_paid;

  insert into public.finance_entries (
    church_id, entry_date, direction, concept, amount_mxn, related_type, related_id
  )
  values (
    '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', current_date, 'ingreso', 'urna', 10, 'urn_contract', contract_paid
  );

  begin
    delete from public.urn_contracts where id = contract_paid;
    succeeded := true;
  exception
    when others then null;
  end;
  if succeeded then
    raise exception 'Se pudo eliminar un contrato con pagos registrados.';
  end if;
end
$$;

do $$
declare
  urn_balance uuid;
  contract_balance uuid;
  succeeded boolean := false;
begin
  insert into public.urns (church_id, code, status)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'RLS-URN-BALANCE', 'ocupada')
  returning id into urn_balance;

  insert into public.urn_contracts (church_id, urn_id, holder_name, agreed_price_mxn, start_date)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', urn_balance, 'Titular balance', 100, current_date)
  returning id into contract_balance;

  insert into public.finance_entries (
    church_id, entry_date, direction, concept, amount_mxn, related_type, related_id
  )
  values (
    '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', current_date, 'ingreso', 'urna', 80, 'urn_contract', contract_balance
  );

  begin
    insert into public.finance_entries (
      church_id, entry_date, direction, concept, amount_mxn, related_type, related_id
    )
    values (
      '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', current_date, 'ingreso', 'urna', 21, 'urn_contract', contract_balance
    );
    succeeded := true;
  exception
    when others then null;
  end;
  if succeeded then
    raise exception 'Se pudo registrar un pago superior al saldo pendiente.';
  end if;
end
$$;

do $$
declare
  urn_status uuid;
  contract_status uuid;
  current_status text;
begin
  insert into public.urns (church_id, code, status)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'RLS-URN-STATUS', 'disponible')
  returning id into urn_status;

  insert into public.urn_contracts (church_id, urn_id, holder_name, agreed_price_mxn, start_date)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', urn_status, 'Titular status', 100, current_date)
  returning id into contract_status;

  select status into current_status from public.urns where id = urn_status;
  if current_status <> 'ocupada' then
    raise exception 'La urna no se marcó como ocupada al crear el contrato.';
  end if;

  delete from public.urn_contracts where id = contract_status;
  select status into current_status from public.urns where id = urn_status;
  if current_status <> 'disponible' then
    raise exception 'La urna no volvió a disponible al eliminar el contrato.';
  end if;
end
$$;

do $$
declare
  urn_unique uuid;
  succeeded boolean := false;
begin
  insert into public.urns (church_id, code, status)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'RLS-URN-UNIQUE', 'disponible')
  returning id into urn_unique;

  insert into public.urn_contracts (church_id, urn_id, holder_name, agreed_price_mxn, start_date)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', urn_unique, 'Titular único A', 100, current_date);

  begin
    insert into public.urn_contracts (church_id, urn_id, holder_name, agreed_price_mxn, start_date)
    values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', urn_unique, 'Titular único B', 100, current_date);
    succeeded := true;
  exception
    when unique_violation then null;
  end;
  if succeeded then
    raise exception 'Se pudieron crear dos contratos para la misma urna.';
  end if;
end
$$;

do $$
declare
  urn_locked uuid;
  succeeded boolean := false;
begin
  insert into public.urns (church_id, code, status)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'RLS-URN-LOCKED', 'disponible')
  returning id into urn_locked;

  insert into public.urn_contracts (church_id, urn_id, holder_name, agreed_price_mxn, start_date)
  values ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', urn_locked, 'Titular bloqueado', 100, current_date);

  begin
    update public.urns set status = 'disponible' where id = urn_locked;
    succeeded := true;
  exception
    when others then null;
  end;
  if succeeded then
    raise exception 'Se pudo liberar manualmente una urna con contrato activo.';
  end if;
end
$$;

rollback;
