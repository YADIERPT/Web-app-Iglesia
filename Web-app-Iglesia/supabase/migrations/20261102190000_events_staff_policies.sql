-- 20261102190000_events_staff_policies.sql
-- Permitir lectura interna de eventos para usuarios asignados (evita error RLS al cancelar o consultar eventos no activos)
-- y asegurar cobertura para vicario y eventos de red.

create policy "Assigned users read events"
  on public.events for select to authenticated
  using (
    church_id is null
    or public.has_role(
      church_id,
      array['super_admin', 'parroco', 'vicario', 'secretaria', 'tesorero', 'archivista', 'consulta']::public.app_role[]
    )
  );

drop policy if exists "Assigned users update events" on public.events;
create policy "Assigned users update events"
  on public.events for update to authenticated
  using (
    (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'vicario', 'secretaria']::public.app_role[]))
    or (church_id is null and public.has_role(null, array['super_admin']::public.app_role[]))
  )
  with check (
    (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'vicario', 'secretaria']::public.app_role[]))
    or (church_id is null and public.has_role(null, array['super_admin']::public.app_role[]))
  );

drop policy if exists "Assigned users insert events" on public.events;
create policy "Assigned users insert events"
  on public.events for insert to authenticated
  with check (
    (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'vicario', 'secretaria']::public.app_role[]))
    or (church_id is null and public.has_role(null, array['super_admin']::public.app_role[]))
  );

drop policy if exists "Assigned users delete events" on public.events;
create policy "Assigned users delete events"
  on public.events for delete to authenticated
  using (
    (church_id is not null and public.has_role(church_id, array['super_admin', 'parroco', 'vicario', 'secretaria']::public.app_role[]))
    or (church_id is null and public.has_role(null, array['super_admin']::public.app_role[]))
  );
