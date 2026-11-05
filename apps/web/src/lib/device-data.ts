"use client";

import { workoutStore } from "./workout-store";

/**
 * Quita lo que la app dejó en este dispositivo: sesión abierta, entrenamientos
 * sin subir y páginas guardadas para usar sin conexión. Evita que los datos
 * pasen a quien use después este teléfono, o que su entreno se suba a otra cuenta.
 */
export async function clearDeviceData() {
  workoutStore.clear();
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("shell-")).map((k) => caches.delete(k)));
  } catch {
    // Sin Cache API (navegador antiguo o modo privado) no hay nada que borrar.
  }
}
