-- Bitácora de los avisos de Wompi: qué llegó, si la firma era válida y qué se hizo con él.
-- Sirve para auditar pagos y diagnosticar sin depender de los registros del hosting.
-- Solo la escribe y la lee el servidor (service_role): sin políticas para usuarios.
create table public.payment_events (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  event text,
  reference text,
  transaction_id text,
  status text,
  signature_valid boolean not null,
  outcome text not null
);
create index payment_events_reference_idx on public.payment_events (reference);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;
