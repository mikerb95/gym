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
  /**
   * Quien aceptó una versión anterior a esta debe autorizar de nuevo para seguir.
   * Súbela a la nueva versión solo si el cambio lo exige (finalidades nuevas o
   * cambios sustanciales, Decreto 1377 de 2013, art. 5). Si no, basta el aviso.
   */
  reauthorizationSince: "2026-11-01",
  updatedOn: "1 de noviembre de 2026",
};
