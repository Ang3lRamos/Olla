-- Límite de peticiones por ventana fija (p. ej. 60 acciones por minuto por persona, o pocos
-- intentos de ingreso por IP). Solo el servidor cuenta: si un usuario pudiera llamarla, podría
-- gastarle el cupo a otro con su clave.
create table public.rate_limits (
  bucket text primary key,
  window_start timestamptz not null,
  hits integer not null
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create function public.hit_rate_limit(target_bucket text, max_hits integer, window_seconds integer)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  current_hits integer;
begin
  insert into public.rate_limits as r (bucket, window_start, hits)
  values (target_bucket, now(), 1)
  on conflict (bucket) do update
    set hits = case when r.window_start <= now() - make_interval(secs => window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start <= now() - make_interval(secs => window_seconds) then now() else r.window_start end
  returning hits into current_hits;

  -- Limpieza ocasional para que la tabla no crezca con claves que ya no se usan.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return current_hits <= max_hits;
end;
$$;
revoke execute on function public.hit_rate_limit from public, anon, authenticated;
grant execute on function public.hit_rate_limit to service_role;
