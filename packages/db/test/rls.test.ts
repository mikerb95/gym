import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const ATHLETE = "00000000-0000-0000-0000-00000000000a";
const COACH = "00000000-0000-0000-0000-00000000000c";
const STRANGER = "00000000-0000-0000-0000-00000000000f";

let db: PGlite;

async function as<T>(userId: string, sql: string): Promise<T[]> {
  await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${userId}', false);`);
  try {
    return (await db.query<T>(sql)).rows;
  } finally {
    await db.exec("RESET ROLE;");
  }
}

beforeAll(async () => {
  db = new PGlite({ extensions: { vector } });
  await db.exec(`
    CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
  `);
  const dir = join(import.meta.dirname, "..", "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    for (const sql of readFileSync(join(dir, file), "utf8").split("--> statement-breakpoint")) {
      if (sql.trim()) await db.exec(sql);
    }
  }
  await db.exec(`
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
    INSERT INTO profiles (id, full_name) VALUES
      ('${ATHLETE}', 'Atleta'), ('${COACH}', 'Entrenador'), ('${STRANGER}', 'Otro');
    INSERT INTO coach_athlete_links (coach_id, athlete_id, status, share_photos)
      VALUES ('${COACH}', '${ATHLETE}', 'active', false);
    INSERT INTO body_weights (user_id, measured_on, weight_kg) VALUES ('${ATHLETE}', '2026-10-01', 80);
    INSERT INTO progress_photos (user_id, taken_on, pose, storage_path)
      VALUES ('${ATHLETE}', '2026-10-01', 'front', 'a/front.jpg');
  `);
});

describe("seguridad por fila", () => {
  it("el atleta ve sus datos", async () => {
    expect(await as(ATHLETE, "SELECT * FROM body_weights")).toHaveLength(1);
  });

  it("un tercero no ve nada", async () => {
    expect(await as(STRANGER, "SELECT * FROM body_weights")).toHaveLength(0);
    expect(await as(STRANGER, "SELECT * FROM profiles WHERE id <> auth.uid()")).toHaveLength(0);
  });

  it("el entrenador ve el peso pero no las fotos si no se compartieron", async () => {
    expect(await as(COACH, "SELECT * FROM body_weights")).toHaveLength(1);
    expect(await as(COACH, "SELECT * FROM progress_photos")).toHaveLength(0);
  });

  it("el entrenador no puede escribir datos del atleta", async () => {
    await expect(
      as(COACH, `INSERT INTO body_weights (user_id, measured_on, weight_kg) VALUES ('${ATHLETE}', '2026-10-02', 70)`),
    ).rejects.toThrow();
  });

  it("el entrenador no puede cambiar los permisos del vínculo", async () => {
    await as(COACH, "UPDATE coach_athlete_links SET share_photos = true");
    const [link] = await as<{ share_photos: boolean }>(ATHLETE, "SELECT share_photos FROM coach_athlete_links");
    expect(link?.share_photos).toBe(false);
  });

  it("al terminar el vínculo el entrenador pierde todo acceso", async () => {
    await as(ATHLETE, "UPDATE coach_athlete_links SET status = 'ended'");
    expect(await as(COACH, "SELECT * FROM body_weights")).toHaveLength(0);
    expect(await as(COACH, `SELECT * FROM profiles WHERE id = '${ATHLETE}'`)).toHaveLength(0);
  });
});
