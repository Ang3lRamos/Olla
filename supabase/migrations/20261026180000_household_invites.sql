-- Varias personas por hogar. Se entra con un enlace de invitación de un solo uso que vence en
-- 7 días; invitar es de los planes pagos. El plan, el cupo del asistente y todos los datos del
-- hogar los comparten sus miembros (las metas de nutrición siguen siendo de cada persona).

create table public.household_invites (
  token uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
create index household_invites_household_id_idx on public.household_invites (household_id);

alter table public.household_invites enable row level security;
-- Los miembros ven las invitaciones vigentes de su hogar; crearlas, anularlas y aceptarlas va
-- por las funciones de abajo, que validan plan, cupo y vencimiento.
create policy "Miembros ven las invitaciones de su hogar" on public.household_invites
  for select to authenticated using (public.is_household_member(household_id));
revoke insert, update, delete, truncate, trigger, references on public.household_invites from authenticated;
revoke all on public.household_invites from anon;

-- Si sale el dueño y quedan otros, el más antiguo pasa a ser dueño: el hogar nunca queda sin
-- quien lo administre. Si no queda nadie, se borra como antes.
create or replace function public.delete_household_without_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.household_members where household_id = old.household_id) then
    delete from public.households where id = old.household_id;
  elsif not exists (
    select 1 from public.household_members where household_id = old.household_id and role = 'owner'
  ) then
    update public.household_members set role = 'owner'
    where (household_id, user_id) = (
      select household_id, user_id from public.household_members
      where household_id = old.household_id order by created_at, user_id limit 1
    );
  end if;
  return null;
end;
$$;

create function public.household_member_limit()
returns integer language sql immutable as $$ select 6 $$;

create function public.create_household_invite(target_household_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  new_token uuid;
begin
  if not public.is_household_member(target_household_id) then
    raise exception 'No perteneces a este hogar';
  end if;
  if (select plan from public.effective_plan(target_household_id)) = 'free' then
    raise exception 'Invitar personas es de los planes Básico y Pro';
  end if;
  if (select count(*) from public.household_members where household_id = target_household_id)
     >= public.household_member_limit() then
    raise exception 'El hogar ya tiene el máximo de personas';
  end if;

  delete from public.household_invites where household_id = target_household_id and expires_at <= now();
  insert into public.household_invites (household_id, created_by)
  values (target_household_id, (select auth.uid()))
  returning token into new_token;
  return new_token;
end;
$$;

create function public.revoke_household_invite(target_token uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.household_invites
  where token = target_token and public.is_household_member(household_id);
end;
$$;

-- Lo que ve quien abre el enlace antes de aceptar. Solo el nombre del hogar: quien tiene el
-- enlace ya fue invitado a él.
create function public.preview_household_invite(target_token uuid)
returns table (household_name text, members integer, expires_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select h.name, (select count(*)::integer from public.household_members m where m.household_id = h.id), i.expires_at
  from public.household_invites i
  join public.households h on h.id = i.household_id
  where i.token = target_token and i.expires_at > now();
$$;

create function public.accept_household_invite(target_token uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  invite public.household_invites;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Se requiere una sesión para unirse a un hogar';
  end if;
  select * into invite from public.household_invites
  where token = target_token and expires_at > now() for update;
  if not found then
    raise exception 'La invitación venció o ya se usó';
  end if;
  if exists (
    select 1 from public.household_members where household_id = invite.household_id and user_id = current_user_id
  ) then
    delete from public.household_invites where token = target_token;
    return invite.household_id;
  end if;
  if (select plan from public.effective_plan(invite.household_id)) = 'free' then
    raise exception 'El plan de ese hogar ya no permite invitar personas';
  end if;
  if (select count(*) from public.household_members where household_id = invite.household_id)
     >= public.household_member_limit() then
    raise exception 'El hogar ya tiene el máximo de personas';
  end if;

  -- Una persona vive en un solo hogar: sale del anterior (si quedaba solo, el disparador lo borra).
  delete from public.household_members where user_id = current_user_id;
  insert into public.household_members (household_id, user_id, role)
  values (invite.household_id, current_user_id, 'member');
  delete from public.household_invites where token = target_token;
  return invite.household_id;
end;
$$;

create function public.leave_household()
returns void
language sql security definer set search_path = ''
as $$
  delete from public.household_members where user_id = (select auth.uid());
$$;

create function public.remove_household_member(target_household_id uuid, target_user_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.household_members
    where household_id = target_household_id and user_id = (select auth.uid()) and role = 'owner'
  ) then
    raise exception 'Solo quien administra el hogar puede quitar personas';
  end if;
  if target_user_id = (select auth.uid()) then
    raise exception 'Para salir tú, usa Salir del hogar';
  end if;
  delete from public.household_members
  where household_id = target_household_id and user_id = target_user_id;
end;
$$;

-- Los correos viven en auth.users, que los usuarios no pueden leer: se exponen solo los de las
-- personas de tu mismo hogar.
create function public.list_household_members(target_household_id uuid)
returns table (user_id uuid, email text, role text, joined_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select m.user_id, u.email::text, m.role, m.created_at
  from public.household_members m
  join auth.users u on u.id = m.user_id
  where m.household_id = target_household_id and public.is_household_member(target_household_id)
  order by m.created_at, m.user_id;
$$;

revoke execute on function
  public.household_member_limit(),
  public.create_household_invite(uuid),
  public.revoke_household_invite(uuid),
  public.preview_household_invite(uuid),
  public.accept_household_invite(uuid),
  public.leave_household(),
  public.remove_household_member(uuid, uuid),
  public.list_household_members(uuid)
from public, anon;
grant execute on function
  public.create_household_invite(uuid),
  public.revoke_household_invite(uuid),
  public.preview_household_invite(uuid),
  public.accept_household_invite(uuid),
  public.leave_household(),
  public.remove_household_member(uuid, uuid),
  public.list_household_members(uuid)
to authenticated;
