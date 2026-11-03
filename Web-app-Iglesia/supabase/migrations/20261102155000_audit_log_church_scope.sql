-- Un usuario solo puede aportar auditoría para iglesias donde tiene asignación.
drop policy if exists "Authenticated users append audit log" on public.audit_log;

create policy "Assigned users append audit log"
  on public.audit_log for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and public.has_role(
      church_id,
      array['super_admin', 'parroco', 'vicario', 'secretaria', 'tesorero', 'archivista', 'consulta']::public.app_role[]
    )
  );
