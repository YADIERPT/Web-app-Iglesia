create policy "Assigned clergy update church profile"
  on public.churches for update to authenticated
  using (public.has_role(id, array['super_admin', 'parroco']::public.app_role[]))
  with check (public.has_role(id, array['super_admin', 'parroco']::public.app_role[]));
