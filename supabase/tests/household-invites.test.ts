import type { PGlite, Transaction } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createTestDatabase, createUser } from "./test-database";

const ANA = "00000000-0000-0000-0000-0000000000a2";
const BETO = "00000000-0000-0000-0000-0000000000b2";
const CAMI = "00000000-0000-0000-0000-0000000000c2";

let db: PGlite;
let anaHome: string;
let betoHome: string;

const createHousehold = (tx: Transaction, name: string) =>
  tx
    .query<{ id: string }>("select public.create_household($1, 2::smallint, null, '{}'::jsonb) as id", [name])
    .then((result) => result.rows[0]!.id);
const invite = (userId: string, householdId: string) =>
  asUser(db, userId, (tx) =>
    tx
      .query<{ token: string }>("select public.create_household_invite($1) as token", [householdId])
      .then((result) => result.rows[0]!.token),
  );
const accept = (userId: string, token: string) =>
  asUser(db, userId, (tx) => tx.query("select public.accept_household_invite($1)", [token]));
const membersOf = async (householdId: string) =>
  (
    await db.query<{ user_id: string; role: string }>(
      "select user_id, role from public.household_members where household_id = $1 order by created_at",
      [householdId],
    )
  ).rows;
const setPlan = (householdId: string, plan: string) =>
  db.query(
    `insert into public.household_entitlements (household_id, plan, ai_daily_limit, expires_at)
     values ($1, $2, 5, now() + interval '30 days')
     on conflict (household_id) do update set plan = excluded.plan`,
    [householdId, plan],
  );

beforeAll(async () => {
  db = await createTestDatabase();
  for (const id of [ANA, BETO, CAMI]) await createUser(db, id);
  anaHome = await asUser(db, ANA, (tx) => createHousehold(tx, "Casa de Ana"));
  betoHome = await asUser(db, BETO, (tx) => createHousehold(tx, "Casa de Beto"));
});

describe("invitaciones", () => {
  it("en el plan Gratis no se puede invitar", async () => {
    await expect(invite(ANA, anaHome)).rejects.toThrow("planes Básico y Pro");
  });

  it("nadie invita a un hogar ajeno", async () => {
    await setPlan(anaHome, "basic");
    await expect(invite(BETO, anaHome)).rejects.toThrow("No perteneces a este hogar");
  });

  it("quien tiene el enlace ve solo el nombre del hogar", async () => {
    const token = await invite(ANA, anaHome);
    const { rows } = await asUser(db, CAMI, (tx) =>
      tx.query("select household_name, members from public.preview_household_invite($1)", [token]),
    );
    expect(rows).toEqual([{ household_name: "Casa de Ana", members: 1 }]);
  });

  it("al aceptar, sale de su hogar anterior (que se borra si quedaba solo) y el enlace no sirve dos veces", async () => {
    const token = await invite(ANA, anaHome);
    await accept(BETO, token);
    expect((await membersOf(anaHome)).map((member) => member.user_id)).toEqual([ANA, BETO]);
    expect((await db.query("select id from public.households where id = $1", [betoHome])).rows).toHaveLength(
      0,
    );
    await expect(accept(CAMI, token)).rejects.toThrow("venció o ya se usó");
  });

  it("un enlace vencido no sirve", async () => {
    const token = await invite(ANA, anaHome);
    await db.query(
      "update public.household_invites set expires_at = now() - interval '1 minute' where token = $1",
      [token],
    );
    await expect(accept(CAMI, token)).rejects.toThrow("venció o ya se usó");
  });

  it("solo el dueño quita personas, y si el dueño sale el más antiguo queda a cargo", async () => {
    await expect(
      asUser(db, BETO, (tx) => tx.query("select public.remove_household_member($1, $2)", [anaHome, ANA])),
    ).rejects.toThrow("Solo quien administra");
    await asUser(db, ANA, (tx) => tx.query("select public.leave_household()"));
    expect(await membersOf(anaHome)).toEqual([{ user_id: BETO, role: "owner" }]);
  });

  it("los miembros ven los correos de su hogar y nada más", async () => {
    const { rows } = await asUser(db, CAMI, (tx) =>
      tx.query("select user_id from public.list_household_members($1)", [anaHome]),
    );
    expect(rows).toEqual([]);
  });
});
