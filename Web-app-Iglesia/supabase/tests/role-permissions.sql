-- Regresión de lectura interna y edición por rol.
begin;

insert into public.churches (id, slug, name, sort_order)
values
  ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'test-iglesia-a', 'Test Iglesia A', 900)
on conflict (id) do nothing;

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values ('71111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'role-consulta@example.test', now(), now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role)
values ('71111111-1111-4111-8111-111111111111', 'role-consulta@example.test', 'Rol consulta', 'secretario')
on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

insert into public.user_church_roles (user_id, church_id, role)
values ('71111111-1111-4111-8111-111111111111', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'consulta')
on conflict do nothing;

insert into public.documents (id, church_id, title, file_path, visibility, status)
values ('71111111-1111-4111-8111-111111111111', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'Documento rol consulta', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490/consulta.pdf', 'interno', 'borrador');

set local role authenticated;
select set_config('request.jwt.claim.sub', '71111111-1111-4111-8111-111111111111', true);

do $$
declare
  visible_rows integer;
begin
  select count(*) into visible_rows
  from public.documents
  where id = '71111111-1111-4111-8111-111111111111';
  if visible_rows <> 1 then
    raise exception 'El rol consulta no puede leer su documento interno.';
  end if;
end
$$;

do $$
declare
  affected integer;
begin
  update public.documents
  set title = 'No autorizado'
  where id = '71111111-1111-4111-8111-111111111111';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'El rol consulta pudo editar documentos.';
  end if;
end
$$;

rollback;
