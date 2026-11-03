/**
 * Datos del responsable del tratamiento (Ley 1581 de 2012, art. 17). Los
 * campos pendientes se completan al constituir la empresa; mientras tanto se
 * muestran como pendientes, nunca con datos inventados.
 */
export const LEGAL = {
  controller: "Steadyrep",
  nit: null as string | null,
  address: null as string | null,
  city: "Colombia",
  email: "privacidad@steadyrep.app",
  /** Sube cada vez que cambie el texto de la política o de los términos. */
  policyVersion: "2026-11-01",
  updatedOn: "1 de noviembre de 2026",
};
