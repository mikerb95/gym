import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withRls, type JwtClaims, type Tx } from "@gym/db";
import { profiles } from "@gym/db/schema";
import { db } from "./db";
import { createClient } from "./supabase/server";

export type Viewer = {
  id: string;
  email: string | null;
  claims: JwtClaims;
  profile: { fullName: string; onboardedAt: Date | null; isCoach: boolean } | null;
};

/** Usuario de la petición, con el JWT verificado. Se resuelve una vez por petición. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return null;

  const claims = data.claims as JwtClaims;
  const [profile] = await withRls(db, claims, (tx) =>
    tx
      .select({ fullName: profiles.fullName, onboardedAt: profiles.onboardedAt, isCoach: profiles.isCoach })
      .from(profiles)
      .where(eq(profiles.id, claims.sub)),
  );

  return {
    id: claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    claims,
    profile: profile ?? null,
  };
});

/** Exige sesión y perfil completo. Para páginas y acciones de la app. */
export async function requireAthlete(): Promise<Viewer & { profile: NonNullable<Viewer["profile"]> }> {
  const viewer = await getViewer();
  if (!viewer) redirect("/ingresar");
  if (!viewer.profile?.onboardedAt) redirect("/bienvenida");
  return viewer as Viewer & { profile: NonNullable<Viewer["profile"]> };
}

/** Ejecuta consultas como el usuario actual, con RLS. */
export async function asViewer<T>(fn: (tx: Tx, viewer: Viewer) => Promise<T>): Promise<T> {
  const viewer = await getViewer();
  if (!viewer) redirect("/ingresar");
  return withRls(db, viewer.claims, (tx) => fn(tx, viewer));
}
