-- Regresión RLS de Storage para documentos privados.
-- Ejecutar únicamente en una base local/de desarrollo.

begin;

insert into public.churches (id, slug, name, sort_order)
values
  ('44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'test-iglesia-a', 'Test Iglesia A', 900)
on conflict (id) do nothing;

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values ('61111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'storage-a@example.test', now(), now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role)
values ('61111111-1111-4111-8111-111111111111', 'storage-a@example.test', 'Storage archivista', 'secretario')
on conflict (id) do update set email = excluded.email, full_name = excluded.full_name;

insert into public.user_church_roles (user_id, church_id, role)
values ('61111111-1111-4111-8111-111111111111', '44c762a9-2982-4e51-8f8c-1ef9ddfe5490', 'archivista')
on conflict do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '61111111-1111-4111-8111-111111111111', true);

insert into storage.objects (bucket_id, name, owner, owner_id, metadata)
values (
  'church-documents',
  '44c762a9-2982-4e51-8f8c-1ef9ddfe5490/rls-a.pdf',
  '61111111-1111-4111-8111-111111111111',
  '61111111-1111-4111-8111-111111111111',
  '{"mimetype":"application/pdf","size":1}'::jsonb
);

do $$
declare
  succeeded boolean := false;
begin
  begin
    insert into storage.objects (bucket_id, name, owner, owner_id, metadata)
    values (
      'church-documents',
      '787bea5a-ad6e-4442-9051-28f47d7e06c0/rls-b.pdf',
      '61111111-1111-4111-8111-111111111111',
      '61111111-1111-4111-8111-111111111111',
      '{"mimetype":"application/pdf","size":1}'::jsonb
    );
    succeeded := true;
  exception
    when insufficient_privilege then null;
  end;
  if succeeded then
    raise exception 'El archivista A pudo subir un documento en la iglesia B.';
  end if;
end
$$;

rollback;
