import "server-only";
import { headers } from "next/headers";

/** Prueba de quién y desde dónde autorizó o revocó (Decreto 1377 de 2013, art. 7). */
export async function requestEvidence(email: string | null) {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
    email,
  };
}
