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

// Memoria de respaldo por si el navegador bloquea localStorage (modo privado).
const memory = new Map<string, string>();
// Última lectura por clave, para devolver el mismo objeto si nada cambió
// (useSyncExternalStore lo exige).
const snapshots = new Map<string, { raw: string | null; value: unknown }>();
const listeners = new Set<() => void>();

function getRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
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
  } catch {
    if (raw === null) memory.delete(key);
    else memory.set(key, raw);
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
  getRestSeconds: () => read<number>(REST) ?? 90,
  setRestSeconds: (s: number) => write(REST, s),
};

/** "82,5" o "82.5" a número; vacío o inválido a null. */
export function parseDecimal(text: string): number | null {
  const n = Number(text.replace(",", ".").trim());
  return text.trim() === "" || Number.isNaN(n) ? null : n;
}
