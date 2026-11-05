"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { estimateOneRepMax } from "@gym/core";
import { exercises, performedSets, personalRecords, workoutSessions } from "@gym/db/schema";
import { asViewer } from "@/lib/auth";
import { workoutPayloadSchema } from "@/lib/workout";

export type SaveWorkoutResult =
  | { ok: true; records: { exercise: string; kg: number; previousKg: number }[] }
  | { ok: false; error: string };

/**
 * Guarda una sesión completa. Es idempotente: los ids los genera el cliente,
 * así que reintentar después de perder la conexión no duplica nada.
 */
export async function saveWorkout(input: unknown): Promise<SaveWorkoutResult> {
  const parsed = workoutPayloadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  const w = parsed.data;

  return asViewer(async (tx, viewer) => {
    const inserted = await tx
      .insert(workoutSessions)
      .values({
        id: w.id,
        userId: viewer.id,
        startedAt: new Date(w.startedAt),
        endedAt: new Date(w.endedAt),
        sessionRpe: w.sessionRpe,
        enjoyment: w.enjoyment,
        notes: w.notes || null,
      })
      .onConflictDoNothing()
      .returning({ id: workoutSessions.id });

    // Ya estaba guardada: era un reintento.
    if (inserted.length === 0) return { ok: true, records: [] };

    await tx
      .insert(performedSets)
      .values(
        w.sets.map((s) => ({
          id: s.id,
          workoutSessionId: w.id,
          exerciseId: s.exerciseId,
          identifiedBy: s.identifiedBy ?? "manual",
          position: s.position,
          weightKg: s.weightKg,
          reps: s.reps,
          rir: s.rir,
          durationSeconds: s.durationSeconds,
          distanceMeters: s.distanceMeters,
          completedAt: new Date(s.completedAt),
        })),
      )
      .onConflictDoNothing();

    // Récords de máximo estimado: la mejor serie confiable de cada ejercicio.
    const best = new Map<string, { kg: number; setId: string; at: string }>();
    for (const s of w.sets) {
      if (!s.weightKg || !s.reps) continue;
      const e1rm = estimateOneRepMax({ weightKg: s.weightKg, reps: s.reps, rir: s.rir ?? 0 });
      if (!e1rm.reliable) continue;
      const current = best.get(s.exerciseId);
      if (!current || e1rm.kg > current.kg) best.set(s.exerciseId, { kg: e1rm.kg, setId: s.id, at: s.completedAt });
    }
    if (best.size === 0) return { ok: true, records: [] };

    const ids = [...best.keys()];
    const previous = await tx
      .select({ exerciseId: personalRecords.exerciseId, kg: max(personalRecords.value) })
      .from(personalRecords)
      .where(and(eq(personalRecords.userId, viewer.id), eq(personalRecords.kind, "e1rm"), inArray(personalRecords.exerciseId, ids)))
      .groupBy(personalRecords.exerciseId);
    const previousBy = new Map(previous.map((p) => [p.exerciseId, p.kg ?? 0]));

    const improved = ids.filter((id) => best.get(id)!.kg > (previousBy.get(id) ?? 0) + 0.1);
    if (improved.length === 0) return { ok: true, records: [] };

    await tx.insert(personalRecords).values(
      improved.map((id) => {
        const b = best.get(id)!;
        return { userId: viewer.id, exerciseId: id, kind: "e1rm", value: b.kg, setId: b.setId, achievedAt: new Date(b.at) };
      }),
    );

    // Solo se celebra si ya había una marca anterior; la primera vez es la base.
    const announced = improved.filter((id) => previousBy.has(id));
    if (announced.length === 0) return { ok: true, records: [] };
    const names = await tx
      .select({ id: exercises.id, name: exercises.name })
      .from(exercises)
      .where(inArray(exercises.id, announced));
    const nameBy = new Map(names.map((n) => [n.id, n.name]));

    return {
      ok: true,
      records: announced.map((id) => ({
        exercise: nameBy.get(id) ?? "Ejercicio",
        kg: best.get(id)!.kg,
        previousKg: previousBy.get(id)!,
      })),
    };
  });
}
