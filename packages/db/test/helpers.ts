import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Postgres en memoria con las migraciones aplicadas y un esquema auth mínimo que imita a Supabase. */
export async function migratedDb() {
  const db = new PGlite({ extensions: { vector } });
  await db.exec(`
    CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
      )::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
  `);
  const dir = join(import.meta.dirname, "..", "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    for (const sql of readFileSync(join(dir, file), "utf8").split("--> statement-breakpoint")) {
      if (sql.trim()) await db.exec(sql);
    }
  }
  await db.exec("GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;");
  return db;
}

/** Ejecuta una consulta como un usuario autenticado, con RLS activa. */
export async function asUser<T>(db: PGlite, userId: string, sql: string): Promise<T[]> {
  await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${userId}', false);`);
  try {
    return (await db.query<T>(sql)).rows;
  } finally {
    await db.exec("RESET ROLE;");
  }
}
