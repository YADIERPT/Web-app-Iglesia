begin;

-- Preparar usuario de prueba
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values ('91111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'test-schedule@example.test', now(), now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role)
values ('91111111-1111-4111-8111-111111111111', 'test-schedule@example.test', 'Tester Horarios', 'secretario')
on conflict (id) do nothing;

do $$
declare
  test_church_id uuid;
  test_user_id uuid := '91111111-1111-4111-8111-111111111111'::uuid;
  test_schedule_id uuid;
  test_exception_id uuid;
  caught_error boolean := false;
begin
  -- Obtener la primera iglesia activa
  select id into test_church_id from public.churches order by sort_order limit 1;

  -- Crear un horario de misa para pruebas
  insert into public.mass_schedules (church_id, weekday, time, label, is_active)
  values (test_church_id, 0, '10:00:00', 'Misa dominical prueba', true)
  returning id into test_schedule_id;

  -- Crear una excepción de cancelación para el 2026-11-08
  insert into public.schedule_exceptions (mass_schedule_id, on_date, action, note)
  values (test_schedule_id, '2026-11-08', 'cancelar', 'Cancelada por restauración');

  -- Asignar rol al usuario de prueba para poder gestionar intenciones
  insert into public.user_church_roles (user_id, church_id, role)
  values (test_user_id, test_church_id, 'secretaria')
  on conflict do nothing;

  -- Configurar sesión autenticada
  perform set_config('request.jwt.claim.sub', test_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  -- 1. Intentar registrar una intención para la misa en la fecha cancelada -> DEBE FALLAR
  begin
    insert into public.mass_intentions (
      church_id, mass_schedule_id, mass_date, mass_time,
      intention_type, honoree_name, stipend_mxn, paid
    ) values (
      test_church_id, test_schedule_id, '2026-11-08', '10:00:00',
      'difunto', 'Prueba Misa Cancelada', 100, false
    );
  exception when others then
    if sqlerrm like '%La misa seleccionada está cancelada para esta fecha%' then
      caught_error := true;
    else
      raise;
    end if;
  end;

  if not caught_error then
    raise exception 'TEST FAILED: No se bloqueó la intención para una misa cancelada.';
  end if;

  -- 2. Registrar una intención para esa misma misa en una fecha NO cancelada (2026-11-15) -> DEBE FUNCIONAR
  insert into public.mass_intentions (
    church_id, mass_schedule_id, mass_date, mass_time,
    intention_type, honoree_name, stipend_mxn, paid
  ) values (
    test_church_id, test_schedule_id, '2026-11-15', '10:00:00',
    'difunto', 'Prueba Misa Válida', 100, false
  );

  -- 3. Probar fecha de fiesta en santos
  insert into public.saints (
    church_id, name, feast_day_month, feast_day_day, visibility, status
  ) values (
    test_church_id, 'San Juan Bautista Prueba', 6, 24, 'publico', 'publicado'
  );

  -- 4. Probar actualización de evento a 'cancelado' por usuario autorizado
  declare
    test_event_id uuid;
    event_visible_count integer;
  begin
    insert into public.events (
      church_id, title, date, time, place, description, responsible, type, status
    ) values (
      test_church_id, 'Bautizo Comunitario Prueba', current_date + interval '3 days', '11:00:00', 'Templo', '', 'Secretaria', 'religioso', 'programado'
    ) returning id into test_event_id;

    -- Actualizar a 'cancelado' (simulando PostgREST con RETURNING *)
    update public.events
    set status = 'cancelado'
    where id = test_event_id;

    -- Verificar que el usuario asignado puede leer el evento cancelado
    select count(*) into event_visible_count
    from public.events
    where id = test_event_id;

    if event_visible_count <> 1 then
      raise exception 'TEST FAILED: El usuario asignado no puede consultar el evento cancelado.';
    end if;
  end;

  raise notice 'TEST PASSED: Validación de misas canceladas, festividades y cancelación de eventos completada con éxito.';
end;
$$;

rollback;
