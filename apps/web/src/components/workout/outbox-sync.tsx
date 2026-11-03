"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveWorkout } from "@/app/(app)/entrenar/actions";
import { workoutStore } from "@/lib/workout-store";

/** Sube los entrenos guardados sin conexión apenas vuelve internet. */
export function OutboxSync() {
  const router = useRouter();

  useEffect(() => {
    let running = false;
    async function flush() {
      if (running || !navigator.onLine) return;
      running = true;
      let uploaded = false;
      for (const payload of workoutStore.getOutbox()) {
        try {
          const result = await saveWorkout(payload);
          // Un rechazo por datos no válidos no se arregla reintentando.
          workoutStore.dequeue(payload.id);
          uploaded ||= result.ok;
        } catch {
          break; // Sigue sin conexión: se reintenta en el próximo evento.
        }
      }
      running = false;
      if (uploaded) router.refresh();
    }
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [router]);

  return null;
}
