-- Regresión de visibilidad pública para contenido multi-iglesia.
-- Ejecutar únicamente en una base local/de desarrollo.

begin;

insert into public.churches (id, slug, name, sort_order)
values
  ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'test-iglesia-a', 'Test Iglesia A', 900)
on conflict (id) do nothing;

insert into public.service_prices (id, church_id, name, suggested_price, show_publicly, is_active)
values
  ('51111111-1111-4111-8111-111111111111', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'Servicio público RLS', 100, true, true),
  ('52222222-2222-4222-8222-222222222222', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'Servicio interno RLS', 200, false, true),
  ('53333333-3333-4333-8333-333333333333', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'Servicio inactivo RLS', 300, true, false);

set local role anon;

do $$
declare
  visible_rows integer;
begin
  select count(*) into visible_rows
  from public.service_prices
  where id in (
    '51111111-1111-4111-8111-111111111111',
    '52222222-2222-4222-8222-222222222222',
    '53333333-3333-4333-8333-333333333333'
  );
  if visible_rows <> 1 then
    raise exception 'Se expusieron % servicios; se esperaba exactamente 1.', visible_rows;
  end if;
end
$$;

rollback;
