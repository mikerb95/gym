import { eq, sql } from "drizzle-orm";
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

/** Categorías de datos que un atleta comparte con su entrenador. */
export type CoachCategory = "training" | "nutrition" | "body" | "photos" | "wellbeing" | "location" | "profile";

export class CoachAccessDenied extends Error {
  constructor() {
    super("El atleta no comparte estos datos con este entrenador");
    this.name = "CoachAccessDenied";
  }
}

/**
 * Único camino para que un entrenador lea datos de un atleta. Dentro de una
 * misma transacción comprueba el permiso, deja el acceso en audit_log y baja a
 * RLS: no hay lectura sin registro ni registro de una lectura negada.
 */
export function withCoachAccess<T>(
  db: Db,
  claims: JwtClaims,
  access: { athleteId: string; category: CoachCategory; resource: string },
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`);
    const [row] = await tx
      .select({ allowed: sql<boolean>`public.coach_can_see(${schema.profiles.id}, ${access.category})` })
      .from(schema.profiles)
      .where(eq(schema.profiles.id, access.athleteId));
    if (!row?.allowed) throw new CoachAccessDenied();
    await tx.insert(schema.auditLog).values({
      actorId: claims.sub,
      subjectUserId: access.athleteId,
      action: "coach.read",
      resource: access.resource,
      metadata: { category: access.category },
    });
    await tx.execute(sql`set local role authenticated`);
    return fn(tx);
  });
}

export * from "./privacy";
export { schema };
