"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteHealthData, deleteUserAccount } from "@gym/db";
import { auditLog, consents } from "@gym/db/schema";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestEvidence } from "@/lib/evidence";
import { LEGAL } from "@/lib/legal";
import { CONSENTS } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const NO_SESSION: ActionResult = { ok: false, error: "Tu sesión terminó. Ingresa de nuevo." };

const consentChange = z.object({
  // service y guardian sostienen la cuenta: se retiran eliminándola.
  purpose: z.enum(["sensitive_health", "machine_photos_training", "marketing"]),
  granted: z.boolean(),
  deleteHealthData: z.boolean().default(false),
});

/** Autoriza o revoca una finalidad. La revocación conserva la fila original como evidencia. */
export async function changeConsent(input: unknown): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return NO_SESSION;
  const parsed = consentChange.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos no válidos" };
  const { purpose, granted } = parsed.data;
  const purgeHealth = purpose === "sensitive_health" && !granted && parsed.data.deleteHealthData;
  const evidence = await requestEvidence(viewer.email);
  const now = new Date();

  await db.transaction(async (tx) => {
    const active = and(eq(consents.userId, viewer.id), eq(consents.purpose, purpose), eq(consents.granted, true), isNull(consents.revokedAt));
    await tx
      .update(consents)
      .set({
        revokedAt: now,
        evidence: sql`coalesce(${consents.evidence}, '{}'::jsonb) || ${JSON.stringify({ revocation: { ...evidence, at: now.toISOString() } })}::jsonb`,
      })
      .where(active);
    if (granted) {
      await tx.insert(consents).values({
        userId: viewer.id,
        purpose,
        policyVersion: LEGAL.policyVersion,
        granted: true,
        grantedAt: now,
        evidence: { ...evidence, text: CONSENTS[purpose].text },
      });
    }
    if (purgeHealth) await deleteHealthData(tx, viewer.id);
    await tx.insert(auditLog).values({
      actorId: viewer.id,
      subjectUserId: viewer.id,
      action: granted ? "consent.granted" : "consent.revoked",
      resource: purpose,
      metadata: { policyVersion: LEGAL.policyVersion, healthDataDeleted: purgeHealth },
    });
  });

  revalidatePath("/perfil/privacidad");
  return { ok: true };
}

/** Deja constancia de que el usuario vio un cambio informativo de la política. */
export async function acknowledgePolicy(): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return NO_SESSION;
  await db.insert(auditLog).values({
    actorId: viewer.id,
    subjectUserId: viewer.id,
    action: "policy.acknowledged",
    resource: "policy",
    metadata: { version: LEGAL.policyVersion },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Nueva autorización tras un cambio que la exige. Renueva también la de salud si estaba vigente. */
export async function acceptPolicy(): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return NO_SESSION;
  const evidence = await requestEvidence(viewer.email);
  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ purpose: consents.purpose, granted: consents.granted, revokedAt: consents.revokedAt })
      .from(consents)
      .where(and(eq(consents.userId, viewer.id), eq(consents.purpose, "sensitive_health")))
      .orderBy(desc(consents.grantedAt))
      .limit(1);
    const renewHealth = rows[0]?.granted && !rows[0].revokedAt;
    const purposes = renewHealth ? (["service", "sensitive_health"] as const) : (["service"] as const);
    await tx.insert(consents).values(
      purposes.map((purpose) => ({
        userId: viewer.id,
        purpose,
        policyVersion: LEGAL.policyVersion,
        granted: true,
        evidence: { ...evidence, text: CONSENTS[purpose].text },
      })),
    );
    await tx.insert(auditLog).values({
      actorId: viewer.id,
      subjectUserId: viewer.id,
      action: "policy.accepted",
      resource: "policy",
      metadata: { version: LEGAL.policyVersion, purposes: [...purposes] },
    });
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

const CONFIRMATION = "ELIMINAR";

/** Elimina la cuenta en el acto. No hay vuelta atrás: la interfaz pide escribir la confirmación. */
export async function deleteAccount(input: unknown): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return NO_SESSION;
  const confirmation = z.string().safeParse(input);
  if (!confirmation.success || confirmation.data.trim().toUpperCase() !== CONFIRMATION) {
    return { ok: false, error: `Escribe ${CONFIRMATION} para confirmar.` };
  }

  try {
    await db.transaction((tx) => deleteUserAccount(tx, viewer.id));
  } catch (error) {
    // Una llave sin regla de borrado (por ejemplo, un plan con suscriptores) no debe dejar la solicitud sin rastro.
    console.error("No se pudo eliminar la cuenta", viewer.id, error);
    await db.insert(auditLog).values({
      actorId: viewer.id,
      subjectUserId: viewer.id,
      action: "account.deletion_failed",
      resource: "profile",
    });
    return {
      ok: false,
      error: `No pudimos eliminarla automáticamente. Escríbenos a ${LEGAL.email} y la eliminamos en máximo 30 días.`,
    };
  }

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return { ok: true };
}
