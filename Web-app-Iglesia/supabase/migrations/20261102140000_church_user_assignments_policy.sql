create policy "Church managers read assigned users"
  on public.user_church_roles for select to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco']::public.app_role[]));

create policy "Church managers manage assigned users"
  on public.user_church_roles for all to authenticated
  using (public.has_role(church_id, array['super_admin', 'parroco']::public.app_role[]))
  with check (public.has_role(church_id, array['super_admin', 'parroco']::public.app_role[]));

create policy "Church managers read assigned profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.has_any_role(array['administrador']))
    or exists (
      select 1
      from public.user_church_roles managed
      join public.user_church_roles target on target.church_id = managed.church_id
      where managed.user_id = (select auth.uid())
        and managed.role in ('super_admin', 'parroco')
        and target.user_id = profiles.id
    )
  );
