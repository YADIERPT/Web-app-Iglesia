-- supabase/seed.sql
-- Usuarios de prueba por rol para entorno local/desarrollo (PLAN.md §7.0 / Fase 1)

do $$
declare
  v_cathedral_id uuid;
begin
  select id into v_cathedral_id from public.churches where slug = 'catedral-san-ildefonso';

  -- 1. Administrador (super_admin de red)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c058',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrador General","role":"administrador"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c058', 'admin@iglesia.local', 'Administrador General', 'administrador')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  insert into public.user_church_roles (user_id, church_id, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c058', null, 'super_admin'::public.app_role)
  on conflict do nothing;

  -- 2. Párroco
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c051',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'parroco@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Pbro. Párroco Catedral","role":"pastor"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c051', 'parroco@iglesia.local', 'Pbro. Párroco Catedral', 'pastor')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c051', v_cathedral_id, 'parroco'::public.app_role)
    on conflict do nothing;
  end if;

  -- 3. Vicario
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c052',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'vicario@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Vicario Parroquial","role":"pastor"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c052', 'vicario@iglesia.local', 'Vicario Parroquial', 'pastor')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c052', v_cathedral_id, 'vicario'::public.app_role)
    on conflict do nothing;
  end if;

  -- 4. Secretaria
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c053',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'secretaria@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Secretaría Parroquial","role":"secretario"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c053', 'secretaria@iglesia.local', 'Secretaría Parroquial', 'secretario')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c053', v_cathedral_id, 'secretaria'::public.app_role)
    on conflict do nothing;
  end if;

  -- 5. Tesorero
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c054',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'tesorero@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Tesorero Parroquial","role":"tesorero"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c054', 'tesorero@iglesia.local', 'Tesorero Parroquial', 'tesorero')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c054', v_cathedral_id, 'tesorero'::public.app_role)
    on conflict do nothing;
  end if;

  -- 6. Archivista
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c055',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'archivista@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Archivista Histórico","role":"secretario"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c055', 'archivista@iglesia.local', 'Archivista Histórico', 'secretario')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c055', v_cathedral_id, 'archivista'::public.app_role)
    on conflict do nothing;
  end if;

  -- 7. Consulta
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '02747bb3-d95e-437c-9ce7-499de544c056',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'consulta@iglesia.local', crypt('IglesiaLocal2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Usuario Solo Lectura","role":"secretario"}',
    now(), now()
  ) on conflict (id) do update set encrypted_password = crypt('IglesiaLocal2026!', gen_salt('bf'));

  insert into public.profiles (id, email, full_name, role)
  values ('02747bb3-d95e-437c-9ce7-499de544c056', 'consulta@iglesia.local', 'Usuario Solo Lectura', 'secretario')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

  if v_cathedral_id is not null then
    insert into public.user_church_roles (user_id, church_id, role)
    values ('02747bb3-d95e-437c-9ce7-499de544c056', v_cathedral_id, 'consulta'::public.app_role)
    on conflict do nothing;
  end if;

  -- Asegurar que los tokens de auth no sean NULL (requerido por GoTrue)
  update auth.users
  set confirmation_token = coalesce(confirmation_token, ''),
      recovery_token = coalesce(recovery_token, ''),
      email_change_token_new = coalesce(email_change_token_new, ''),
      email_change = coalesce(email_change, ''),
      reauthentication_token = coalesce(reauthentication_token, '');

  -- Sincronizar identidades para permitir inicio de sesión con contraseña
  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  select
    u.id::text,
    u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email',
    now(),
    now()
  from auth.users u
  on conflict (provider_id, provider) do nothing;
end;
$$;
