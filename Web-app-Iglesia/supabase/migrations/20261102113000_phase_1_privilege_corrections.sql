-- Correcciones incrementales de privilegios detectadas durante la validación estática.

grant select on public.schedule_exceptions to anon, authenticated;

