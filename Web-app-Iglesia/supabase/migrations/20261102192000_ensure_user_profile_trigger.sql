-- 20261102192000_ensure_user_profile_trigger.sql
-- Asegurar que todo usuario de auth.users cuente automáticamente con un perfil en public.profiles

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_role text;
  assigned_role text;
begin
  raw_role := coalesce(new.raw_user_meta_data->>'role', new.raw_app_meta_data->>'role', 'secretario');
  if raw_role in ('administrador', 'pastor', 'secretario', 'tesorero', 'coordinador') then
    assigned_role := raw_role;
  else
    assigned_role := 'secretario';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    assigned_role
  )
  on conflict (id) do update
  set email = coalesce(excluded.email, public.profiles.email),
      full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_new_auth_user();

-- Permitir a usuarios autenticados insertar o autorreparar su propio perfil si hiciera falta
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

-- Backfill para usuarios existentes sin perfil
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  'administrador'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
