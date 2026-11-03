-- Los roles de consulta pueden leer documentos internos, pero no modificarlos.
create policy "Assigned users read documents"
  on public.documents for select to authenticated
  using (
    public.has_role(
      church_id,
      array['super_admin', 'parroco', 'vicario', 'secretaria', 'tesorero', 'archivista', 'consulta']::public.app_role[]
    )
  );
