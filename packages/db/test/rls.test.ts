import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, migratedDb } from "./helpers";

const ATHLETE = "00000000-0000-0000-0000-00000000000a";
const COACH = "00000000-0000-0000-0000-00000000000c";
const STRANGER = "00000000-0000-0000-0000-00000000000f";

let db: PGlite;

const as = <T>(userId: string, sql: string) => asUser<T>(db, userId, sql);

beforeAll(async () => {
  db = await migratedDb();
  await db.exec(`
    INSERT INTO auth.users (id) VALUES ('${ATHLETE}'), ('${COACH}'), ('${STRANGER}');
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

  it("la agenda se puede leer: el atleta ve sus citas y un tercero no", async () => {
    await db.exec(`
      INSERT INTO appointments (id, coach_id, title, starts_at, ends_at)
        VALUES ('00000000-0000-0000-0000-0000000000a1', '${COACH}', 'Sesión', now(), now());
      INSERT INTO appointment_attendees (appointment_id, athlete_id)
        VALUES ('00000000-0000-0000-0000-0000000000a1', '${ATHLETE}');
    `);
    expect(await as(ATHLETE, "SELECT * FROM appointments")).toHaveLength(1);
    expect(await as(COACH, "SELECT * FROM appointment_attendees")).toHaveLength(1);
    expect(await as(STRANGER, "SELECT * FROM appointments")).toHaveLength(0);
    expect(await as(STRANGER, "SELECT * FROM appointment_attendees")).toHaveLength(0);
  });
});
