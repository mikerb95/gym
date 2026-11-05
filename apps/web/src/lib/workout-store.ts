"use client";

import type { ActiveWorkout, WorkoutPayload } from "./workout";

/**
 * Persistencia local del entreno. La sesión activa vive en el teléfono hasta
 * que se guarda, así que cerrar la app, quedarse sin señal en el sótano del gym
 * o recargar no borra nada. Las sesiones terminadas sin conexión esperan en la
 * bandeja de salida hasta que se puedan subir.
 */
const ACTIVE = "sr:workout:active";
const OUTBOX = "sr:workout:outbox";
const REST = "sr:workout:rest";
const MACHINE_NOTES = "sr:machine:notes";
const REVIEW = "sr:workout:review";
const REST_ACTIVE = "sr:workout:rest-active";
const REST_BY_EXERCISE = "sr:workout:rest-by-exercise";

export type RestState = { endsAt: number; total: number; exerciseId?: string };
export type ReviewItem = { payload: WorkoutPayload; error: string };
// Siempre el mismo arreglo: useSyncExternalStore exige una lectura estable.
export const NO_REVIEW: ReviewItem[] = [];

// Memoria de respaldo por si localStorage falla: bloqueado en modo privado o sin
// espacio. Mientras una clave esté aquí, este valor manda sobre el del disco.
const memory = new Map<string, string | null>();
let writeFailed = false;
// Última lectura por clave, para devolver el mismo objeto si nada cambió
// (useSyncExternalStore lo exige).
const snapshots = new Map<string, { raw: string | null; value: unknown }>();
const listeners = new Set<() => void>();

function getRaw(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function read<T>(key: string): T | null {
  const raw = getRaw(key);
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T | null;
  let value: T | null = null;
  try {
    value = raw ? (JSON.parse(raw) as T) : null;
  } catch {
    value = null;
  }
  snapshots.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown) {
  const raw = value === null ? null : JSON.stringify(value);
  try {
    if (raw === null) localStorage.removeItem(key);
    else localStorage.setItem(key, raw);
    memory.delete(key);
    if (memory.size === 0) writeFailed = false;
  } catch {
    memory.set(key, raw);
    writeFailed = true;
  }
  for (const listener of listeners) listener();
}

/** Para useSyncExternalStore: avisa de cambios en esta pestaña y en otras. */
export function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export const workoutStore = {
  getActive: () => read<ActiveWorkout>(ACTIVE),
  setActive: (w: ActiveWorkout | null) => write(ACTIVE, w),
  getOutbox: () => read<WorkoutPayload[]>(OUTBOX) ?? [],
  enqueue(payload: WorkoutPayload) {
    const box = workoutStore.getOutbox().filter((p) => p.id !== payload.id);
    write(OUTBOX, [...box, payload]);
  },
  dequeue(id: string) {
    const box = workoutStore.getOutbox().filter((p) => p.id !== id);
    write(OUTBOX, box.length ? box : null);
  },
  /** Borra lo guardado en este dispositivo. Al salir o eliminar la cuenta, para que no pase a otra persona. */
  clear() {
    for (const key of [ACTIVE, OUTBOX, MACHINE_NOTES, REVIEW, REST_ACTIVE, REST_BY_EXERCISE]) write(key, null);
  },
  /** El teléfono no dejó guardar: lo último solo vive en memoria hasta que haya espacio. */
  getWriteFailed: () => writeFailed,
  /** Sesiones que el servidor rechazó. No se borran: la persona decide qué hacer con ellas. */
  getReview: () => read<ReviewItem[]>(REVIEW) ?? NO_REVIEW,
  moveToReview(payload: WorkoutPayload, error: string) {
    const items = workoutStore.getReview().filter((i) => i.payload.id !== payload.id);
    write(REVIEW, [...items, { payload, error }]);
    workoutStore.dequeue(payload.id);
  },
  retryReview(id: string) {
    const item = workoutStore.getReview().find((i) => i.payload.id === id);
    if (item) workoutStore.enqueue(item.payload);
    workoutStore.discardReview(id);
  },
  discardReview(id: string) {
    const items = workoutStore.getReview().filter((i) => i.payload.id !== id);
    write(REVIEW, items.length ? items : null);
  },
  /** El descanso en curso se guarda con hora absoluta: sobrevive a recargar o cerrar la app. */
  getRest: () => read<RestState>(REST_ACTIVE),
  setRest: (rest: RestState | null) => write(REST_ACTIVE, rest),
  /** Lo último que ajustó en cada ejercicio; si nunca lo ajustó, el descanso general. */
  getRestFor: (exerciseId: string) => read<Record<string, number>>(REST_BY_EXERCISE)?.[exerciseId] ?? workoutStore.getRestSeconds(),
  setRestFor(exerciseId: string, seconds: number) {
    write(REST_BY_EXERCISE, { ...read<Record<string, number>>(REST_BY_EXERCISE), [exerciseId]: seconds });
  },
  /** Mi ajuste por ejercicio: altura del asiento, número de placa. Vive solo en este teléfono. */
  getMachineNotes: () => read<Record<string, string>>(MACHINE_NOTES),
  setMachineNote(exerciseId: string, note: string) {
    const notes = { ...workoutStore.getMachineNotes() };
    if (note) notes[exerciseId] = note;
    else delete notes[exerciseId];
    write(MACHINE_NOTES, notes);
  },
  getRestSeconds: () => read<number>(REST) ?? 90,
};

/** "82,5" o "82.5" a número; vacío o inválido a null. */
export function parseDecimal(text: string): number | null {
  const n = Number(text.replace(",", ".").trim());
  return text.trim() === "" || Number.isNaN(n) ? null : n;
}
