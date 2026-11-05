import "server-only";
import { cache } from "react";
import { and, desc, eq, ne } from "drizzle-orm";
import { isConsentActive, latestConsents, policyStatus, type PolicyStatus } from "@gym/core";
import { CoachAccessDenied, withCoachAccess, type CoachCategory, type Tx } from "@gym/db";
import { auditLog, consents, profiles } from "@gym/db/schema";
import { asViewer, getViewer } from "./auth";
import { db } from "./db";
import { LEGAL } from "./legal";
import type { ConsentPurpose } from "./onboarding";

/** Decisión vigente por finalidad del usuario actual. Se resuelve una vez por petición. */
export const getConsents = cache(async () => {
  const rows = await asViewer((tx, viewer) => tx.select().from(consents).where(eq(consents.userId, viewer.id)));
  return latestConsents(rows);
});

/**
 * Los módulos que traten datos sensibles u opcionales deben preguntar aquí
 * antes de guardarlos o usarlos: una autorización revocada surte efecto ya.
 */
export async function hasConsent(purpose: ConsentPurpose) {
  return isConsentActive((await getConsents()).get(purpose));
}

export const getPolicyStatus = cache(async (): Promise<PolicyStatus> => {
  const service = (await getConsents()).get("service");
  const acceptedVersion = isConsentActive(service) ? service!.policyVersion : null;
  const needsNoticeCheck = acceptedVersion !== null && acceptedVersion < LEGAL.policyVersion;
  const acknowledged = needsNoticeCheck
    ? await asViewer((tx, viewer) =>
        tx
          .select({ metadata: auditLog.metadata })
          .from(auditLog)
          .where(and(eq(auditLog.subjectUserId, viewer.id), eq(auditLog.action, "policy.acknowledged")))
          .orderBy(desc(auditLog.createdAt))
          .limit(1),
      )
    : [];
  return policyStatus({
    acceptedVersion,
    acknowledgedVersion: (acknowledged[0]?.metadata as { version?: string } | null)?.version ?? null,
    currentVersion: LEGAL.policyVersion,
    reauthorizationSince: LEGAL.reauthorizationSince,
  });
});

/** Quién más ha accedido a los datos del usuario, para mostrárselo. */
export function getAccessLog(limit = 20) {
  return asViewer((tx, viewer) =>
    tx
      .select({
        id: auditLog.id,
        resource: auditLog.resource,
        metadata: auditLog.metadata,
        createdAt: auditLog.createdAt,
        // RLS oculta el nombre de un entrenador cuyo vínculo terminó.
        actorName: profiles.fullName,
      })
      .from(auditLog)
      .leftJoin(profiles, eq(profiles.id, auditLog.actorId))
      .where(and(eq(auditLog.subjectUserId, viewer.id), eq(auditLog.action, "coach.read"), ne(auditLog.actorId, viewer.id)))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit),
  );
}

/**
 * Lectura de datos de un atleta por su entrenador: comprueba el permiso, la
 * registra en audit_log y aplica RLS. Todo el módulo de entrenador debe leer
 * datos de atletas por aquí, nunca con asViewer.
 */
export async function asCoachOf<T>(
  access: { athleteId: string; category: CoachCategory; resource: string },
  fn: (tx: Tx) => Promise<T>,
) {
  const viewer = await getViewer();
  if (!viewer) throw new CoachAccessDenied();
  return withCoachAccess(db, viewer.claims, access, fn);
}
