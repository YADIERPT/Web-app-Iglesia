drop policy if exists "Public can read schedule exceptions" on public.schedule_exceptions;

create policy "Public can read active church schedule exceptions"
  on public.schedule_exceptions for select to anon, authenticated
  using (
    exists (
      select 1
      from public.mass_schedules ms
      join public.churches c on c.id = ms.church_id
      where ms.id = mass_schedule_id
        and ms.is_active
        and c.is_active
    )
  );
