export type ConsentRecord = {
  purpose: string;
  policyVersion: string;
  granted: boolean;
  grantedAt: Date;
  revokedAt: Date | null;
};

/** La decisión vigente por finalidad es la más reciente; las anteriores quedan como evidencia. */
export function latestConsents<T extends ConsentRecord>(records: readonly T[]): Map<string, T> {
  const latest = new Map<string, T>();
  for (const record of records) {
    const current = latest.get(record.purpose);
    if (!current || record.grantedAt.getTime() >= current.grantedAt.getTime()) latest.set(record.purpose, record);
  }
  return latest;
}

export const isConsentActive = (record: ConsentRecord | undefined) =>
  Boolean(record?.granted && !record.revokedAt);

export type PolicyStatus = "current" | "notice" | "reauthorize";

/**
 * Qué debe pasar con un usuario según la versión de la política que aceptó.
 * Las versiones son fechas AAAA-MM-DD, así que se comparan como texto.
 * - reauthorize: aceptó antes de un cambio que exige nueva autorización.
 * - notice: hay un cambio informativo que aún no ha visto.
 */
export function policyStatus(input: {
  acceptedVersion: string | null;
  acknowledgedVersion: string | null;
  currentVersion: string;
  reauthorizationSince: string;
}): PolicyStatus {
  const { acceptedVersion, acknowledgedVersion, currentVersion, reauthorizationSince } = input;
  if (!acceptedVersion || acceptedVersion < reauthorizationSince) return "reauthorize";
  const seen = acknowledgedVersion && acknowledgedVersion > acceptedVersion ? acknowledgedVersion : acceptedVersion;
  return seen < currentVersion ? "notice" : "current";
}
