/** Respuesta de POST /api/maquinas/identificar. Se comparte con el cliente. */
export type MachineIdentification =
  | {
      ok: true;
      /** Texto leído en la foto del nombre, tal como aparece. */
      readName: string | null;
      /** Nombre genérico de lo que se ve en la foto. */
      machineName: string | null;
      confidence: "alta" | "media" | "baja";
      /** Ejercicios del catálogo, del más probable al menos probable. */
      exerciseIds: string[];
    }
  | { ok: false; reason: "invalid" | "limit" | "unavailable" };

/** Lado mayor de cada foto: la del nombre necesita más detalle para leerse. */
export const PHOTO_MAX_EDGE = { name: 1568, machine: 1024 } as const;
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
