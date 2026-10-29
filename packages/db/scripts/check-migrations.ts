// Aplica las migraciones en un Postgres en memoria (PGlite) con un esquema
// auth mínimo que imita a Supabase, para detectar errores de SQL sin servidor.
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "..", "migrations");
const db = new PGlite({ extensions: { vector } });

await db.exec(`
  CREATE ROLE authenticated;
  CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
    AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
`);

for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  const statements = readFileSync(join(dir, file), "utf8").split("--> statement-breakpoint");
  for (const sql of statements) {
    if (!sql.trim()) continue;
    try {
      await db.exec(sql);
    } catch (error) {
      console.error(`Falló ${file}:\n${sql.trim().slice(0, 400)}\n`);
      throw error;
    }
  }
  console.log(`ok ${file}`);
}

const { rows } = await db.query<{ n: number }>(
  "SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity",
);
if (rows[0]!.n > 0) {
  const missing = await db.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity",
  );
  throw new Error(`Tablas sin RLS: ${missing.rows.map((r) => r.tablename).join(", ")}`);
}
console.log("Todas las tablas tienen RLS.");
