-- Lo mínimo de Supabase que necesitan las migraciones para correr en PGlite durante las pruebas.
create role anon nologin;
create role authenticated nologin;

create schema auth;
create table auth.users (id uuid primary key);

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
