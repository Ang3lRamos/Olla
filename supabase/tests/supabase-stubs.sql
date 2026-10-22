-- Lo mínimo de Supabase que necesitan las migraciones para correr en PGlite durante las pruebas.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (id uuid primary key);

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema public, auth to anon, authenticated, service_role;

-- Como en Supabase: lo que se crea en public queda disponible por defecto y las migraciones
-- restringen con RLS y revoke.
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
