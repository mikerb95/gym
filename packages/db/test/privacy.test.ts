import type { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { CoachAccessDenied, withCoachAccess, type Db } from "../src/index";
import * as schema from "../src/schema";
import { deleteHealthData, deleteUserAccount, EXPORT_EXCLUDED, EXPORT_QUERIES } from "../src/privacy";
import { asUser, migratedDb } from "./helpers";

const ATHLETE = "00000000-0000-0000-0000-00000000000a";
const COACH = "00000000-0000-0000-0000-00000000000c";

let db: PGlite;
const count = async (table: string) =>
  Number((await db.query<{ n: string }>(`SELECT count(*) AS n FROM ${table}`)).rows[0]?.n);

beforeAll(async () => {
  db = await migratedDb();
  await db.exec(`
    INSERT INTO auth.users (id) VALUES ('${ATHLETE}'), ('${COACH}');
    INSERT INTO profiles (id, full_name, height_cm) VALUES ('${ATHLETE}', 'Atleta', 170), ('${COACH}', 'Entrenador', 180);
    INSERT INTO coach_athlete_links (coach_id, athlete_id, status) VALUES ('${COACH}', '${ATHLETE}', 'active');
    INSERT INTO body_weights (user_id, measured_on, weight_kg) VALUES ('${ATHLETE}', '2026-10-01', 80);
    INSERT INTO body_measurements (user_id, measured_on, site, value_cm, measured_by) VALUES ('${ATHLETE}', '2026-10-01', 'waist', 80, '${COACH}');
    INSERT INTO consents (user_id, purpose, policy_version, granted) VALUES ('${ATHLETE}', 'service', 'v1', true);
    INSERT INTO conversations (kind) VALUES ('direct');
    INSERT INTO messages (conversation_id, sender_id, body)
      SELECT id, '${ATHLETE}', 'Hola' FROM conversations LIMIT 1;
    INSERT INTO payments (payer_id, payee_coach_id, amount_cop, provider, provider_ref, status)
      VALUES ('${ATHLETE}', '${COACH}', 50000, 'wompi', 'ref-1', 'paid');
  `);
});

describe("descarga de datos", () => {
  it("cubre toda tabla ligada a un perfil, directa o indirectamente", async () => {
    const { rows } = await db.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
    );
    const missing = rows
      .map((r) => r.table_name)
      .filter((t) => !(t in EXPORT_QUERIES) && !(t in EXPORT_EXCLUDED));
    expect(missing).toEqual([]);
  });

  it("todas las consultas corren con RLS y solo devuelven lo propio", async () => {
    for (const query of Object.values(EXPORT_QUERIES)) await asUser(db, ATHLETE, query);
    expect(await asUser(db, ATHLETE, EXPORT_QUERIES.body_weights!)).toHaveLength(1);
    expect(await asUser(db, COACH, EXPORT_QUERIES.body_weights!)).toHaveLength(0);
    expect(await asUser(db, ATHLETE, EXPORT_QUERIES.consents!)).toHaveLength(1);
  });
});

describe("acceso del entrenador", () => {
  const access = { athleteId: ATHLETE, category: "body", resource: "body_weights" } as const;
  const run = (userId: string, fn: Parameters<typeof withCoachAccess>[3]) =>
    withCoachAccess(drizzle(db, { schema, casing: "snake_case" }) as unknown as Db, { sub: userId }, access, fn);
  const reads = () => count(`audit_log WHERE action = 'coach.read' AND subject_user_id = '${ATHLETE}'`);

  it("cada lectura queda registrada", async () => {
    const before = await reads();
    await run(COACH, async () => undefined);
    expect(await reads()).toBe(before + 1);
    expect(await count(`audit_log WHERE action = 'coach.read' AND actor_id = '${COACH}'`)).toBe(before + 1);
  });

  it("sin permiso no hay lectura ni registro", async () => {
    const before = await reads();
    await expect(run(ATHLETE, async () => undefined)).rejects.toBeInstanceOf(CoachAccessDenied);
    await db.exec(`UPDATE coach_athlete_links SET share_body = false`);
    await expect(run(COACH, async () => undefined)).rejects.toBeInstanceOf(CoachAccessDenied);
    await db.exec(`UPDATE coach_athlete_links SET share_body = true`);
    expect(await reads()).toBe(before);
  });

  it("si la lectura falla, tampoco queda el registro", async () => {
    const before = await reads();
    await expect(run(COACH, () => Promise.reject(new Error("falló")))).rejects.toThrow("falló");
    expect(await reads()).toBe(before);
  });
});

describe("supresión", () => {
  it("borra los datos de salud sin tocar la cuenta", async () => {
    await deleteHealthData(drizzle(db, { casing: "snake_case" }), ATHLETE);
    expect(await count("body_weights")).toBe(0);
    expect(await count("body_measurements")).toBe(0);
    expect(await count("profiles")).toBe(2);
    const { rows } = await db.query<{ height_cm: number | null }>(`SELECT height_cm FROM profiles WHERE id = '${ATHLETE}'`);
    expect(rows[0]?.height_cm).toBeNull();
  });

  it("eliminar la cuenta borra usuario, perfil y mensajes, y conserva el pago sin titular", async () => {
    await db.exec(`INSERT INTO body_measurements (user_id, measured_on, site, value_cm, measured_by) VALUES ('${COACH}', '2026-10-02', 'waist', 90, '${ATHLETE}');`);
    await deleteUserAccount(drizzle(db, { casing: "snake_case" }), ATHLETE);

    expect(await count(`auth.users WHERE id = '${ATHLETE}'`)).toBe(0);
    expect(await count(`profiles WHERE id = '${ATHLETE}'`)).toBe(0);
    expect(await count(`consents WHERE user_id = '${ATHLETE}'`)).toBe(0);
    expect(await count("messages")).toBe(0);
    expect(await count("coach_athlete_links")).toBe(0);
    // Lo que otra persona registró sobrevive sin referencia a la cuenta borrada.
    expect(await count(`body_measurements WHERE user_id = '${COACH}' AND measured_by IS NULL`)).toBe(1);

    const [payment] = (await db.query<{ payer_id: string | null; payee_coach_id: string }>("SELECT payer_id, payee_coach_id FROM payments")).rows;
    expect(payment?.payer_id).toBeNull();
    expect(payment?.payee_coach_id).toBe(COACH);
    expect(await count("audit_log WHERE action = 'account.deleted' AND actor_id IS NULL AND subject_user_id IS NULL")).toBe(1);
  });

  it("un JWT vigente de una cuenta borrada no puede recrear el perfil", async () => {
    await expect(db.exec(`INSERT INTO profiles (id, full_name) VALUES ('${ATHLETE}', 'Atleta')`)).rejects.toThrow();
  });

  it("ninguna llave hacia profiles bloquea el borrado sin una regla explícita", async () => {
    const { rows } = await db.query<{ tbl: string }>(`
      SELECT conrelid::regclass::text AS tbl FROM pg_constraint
      WHERE contype = 'f' AND confrelid = 'profiles'::regclass AND confdeltype = 'a'`);
    expect(rows).toEqual([]);
  });
});
