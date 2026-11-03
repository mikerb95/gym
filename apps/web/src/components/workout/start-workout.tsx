"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { buttonPrimary } from "@/components/ui";
import { subscribe, workoutStore } from "@/lib/workout-store";

/** Empieza una sesión o retoma la que quedó abierta en este teléfono. */
export function StartWorkout() {
  const workout = useSyncExternalStore(subscribe, workoutStore.getActive, () => null);
  const queued = useSyncExternalStore(subscribe, () => workoutStore.getOutbox().length, () => 0);
  const active = workout
    ? { sets: workout.exercises.flatMap((e) => e.sets.filter((s) => s.done)).length, startedAt: workout.startedAt }
    : null;

  const since = active
    ? new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" }).format(new Date(active.startedAt))
    : null;

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-7">
      {active ? (
        <>
          <p className="heading text-xl">Tienes una sesión abierta</p>
          <p className="mt-1 text-[15px] text-muted">
            Empezó a las {since}, con {active.sets} {active.sets === 1 ? "serie hecha" : "series hechas"}.
          </p>
        </>
      ) : (
        <>
          <p className="heading text-xl">Entrenamiento libre</p>
          <p className="mt-1 text-[15px] text-muted">
            Elige los ejercicios sobre la marcha. Te mostramos lo que hiciste la última vez en cada uno.
          </p>
        </>
      )}
      <Link href="/entrenar/sesion" className={`${buttonPrimary} mt-5 w-full sm:w-auto`}>
        <Play aria-hidden size={18} fill="currentColor" />
        {active ? "Continuar sesión" : "Empezar entrenamiento"}
      </Link>
      {queued ? (
        <p className="mt-4 rounded-xl bg-amber-tint px-4 py-3 text-[15px]">
          {queued === 1 ? "Un entrenamiento espera" : `${queued} entrenamientos esperan`} conexión para subirse. Se suben
          solos.
        </p>
      ) : null}
    </div>
  );
}
