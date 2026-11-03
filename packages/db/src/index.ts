import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL no está definida");
  // prepare: false es necesario con el pooler de Supabase en modo transacción.
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema, casing: "snake_case" });
}

export type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Claims ya verificados del JWT de Supabase. Como mínimo, el `sub` del usuario. */
export type JwtClaims = { sub: string; role?: string; [claim: string]: unknown };

/**
 * Ejecuta `fn` como el usuario del JWT, con las políticas RLS activas. La
 * conexión del servidor es superusuario; dentro de la transacción baja a
 * `authenticated` y publica los claims para que `auth.uid()` los lea, igual
 * que hace la API de Supabase. Así RLS protege también lo que pasa por Drizzle.
 */
export function withRls<T>(db: Db, claims: JwtClaims, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`);
    await tx.execute(sql`set local role authenticated`);
    return fn(tx);
  });
}

export { schema };
