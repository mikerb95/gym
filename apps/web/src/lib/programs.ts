import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { loadIncrementKg, proposeLoad, type PrescribedSet, type ProgramExercise } from "@gym/core";
import { exercises, plannedExercises, plannedSessions, programs, workoutSessions } from "@gym/db/schema";
import { asViewer } from "./auth";
import { getLastPerformance } from "./training";
import type { ExercisePlan, LastPerformance, PlannedWorkout } from "./workout";

/** Catálogo con lo que necesita el generador de programas. */
export function getProgramCatalog(): Promise<ProgramExercise[]> {
  return asViewer((tx, viewer) =>
    tx
      .select({
        id: exercises.id,
        movementPattern: exercises.movementPattern,
        primaryMuscles: exercises.primaryMuscles,
        equipment: exercises.equipment,
        level: exercises.level,
        tracksWeight: exercises.tracksWeight,
        tracksDuration: exercises.tracksDuration,
        tracksDistance: exercises.tracksDistance,
      })
      .from(exercises)
      .where(or(isNull(exercises.ownerId), eq(exercises.ownerId, viewer.id)))
      .orderBy(exercises.name),
  );
}

export type SessionSummary = {
  id: string;
  week: number;
  name: string;
  estimatedMinutes: number | null;
  exercises: string[];
  done: boolean;
};

export type ProgramOverview = {
  id: string;
  name: string;
  description: string | null;
  weeks: number;
  sessions: SessionSummary[];
  /** La primera sesión sin hacer. Va en orden, sin fechas: faltar un día no rompe el programa. */
  next: SessionSummary | null;
};

export function getProgramOverview(): Promise<ProgramOverview | null> {
  return asViewer(async (tx, viewer) => {
    const [program] = await tx
      .select()
      .from(programs)
      .where(and(eq(programs.athleteId, viewer.id), eq(programs.status, "active")))
      .orderBy(desc(programs.createdAt))
      .limit(1);
    if (!program) return null;

    const sessions = await tx
      .select()
      .from(plannedSessions)
      .where(eq(plannedSessions.programId, program.id))
      .orderBy(asc(plannedSessions.week), asc(plannedSessions.dayIndex));
    const ids = sessions.map((s) => s.id);
    if (ids.length === 0) return { ...program, sessions: [], next: null };

    const [items, done] = await Promise.all([
      tx
        .select({ sessionId: plannedExercises.sessionId, name: exercises.name })
        .from(plannedExercises)
        .innerJoin(exercises, eq(exercises.id, plannedExercises.exerciseId))
        .where(inArray(plannedExercises.sessionId, ids))
        .orderBy(asc(plannedExercises.position)),
      tx
        .select({ id: workoutSessions.plannedSessionId })
        .from(workoutSessions)
        .where(and(eq(workoutSessions.userId, viewer.id), isNotNull(workoutSessions.plannedSessionId), inArray(workoutSessions.plannedSessionId, ids))),
    ]);
    const doneIds = new Set(done.map((d) => d.id));
    const summaries: SessionSummary[] = sessions.map((s) => ({
      id: s.id,
      week: s.week,
      name: s.name,
      estimatedMinutes: s.estimatedMinutes,
      exercises: items.filter((i) => i.sessionId === s.id).map((i) => i.name),
      done: doneIds.has(s.id),
    }));
    return {
      id: program.id,
      name: program.name,
      description: program.description,
      weeks: program.weeks,
      sessions: summaries,
      next: summaries.find((s) => !s.done) ?? null,
    };
  });
}

function planFor(
  sets: PrescribedSet[],
  restSeconds: number | null,
  exercise: { id: string; movementPattern: string; equipment: string[] },
  last: LastPerformance,
  deload: boolean,
): ExercisePlan {
  const first = sets[0];
  const repsMin = first?.reps ?? null;
  const repsMax = first?.repsMax ?? repsMin;
  const rir = first?.rir ?? null;
  const history = last[exercise.id]?.sets ?? [];
  return {
    repsMin,
    repsMax,
    rir,
    durationS: first?.durationS ?? null,
    sets: sets.length,
    restSeconds,
    proposal:
      repsMin !== null && repsMax !== null
        ? proposeLoad({
            last: history,
            repsMin,
            repsMax,
            targetRir: rir ?? 2,
            incrementKg: loadIncrementKg(exercise),
            deload,
          })
        : null,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Sesión del programa con su propuesta de carga según lo último que hizo el atleta. */
export async function getPlannedWorkout(id: string): Promise<PlannedWorkout | null> {
  if (!UUID.test(id)) return null;
  const last = await getLastPerformance();
  return asViewer(async (tx, viewer) => {
    const [session] = await tx
      .select({ id: plannedSessions.id, name: plannedSessions.name })
      .from(plannedSessions)
      .innerJoin(programs, eq(programs.id, plannedSessions.programId))
      .where(and(eq(plannedSessions.id, id), eq(programs.athleteId, viewer.id)));
    if (!session) return null;
    const rows = await tx
      .select({
        exerciseId: plannedExercises.exerciseId,
        sets: plannedExercises.sets,
        restSeconds: plannedExercises.restSeconds,
        movementPattern: exercises.movementPattern,
        equipment: exercises.equipment,
      })
      .from(plannedExercises)
      .innerJoin(exercises, eq(exercises.id, plannedExercises.exerciseId))
      .where(eq(plannedExercises.sessionId, id))
      .orderBy(asc(plannedExercises.position));
    const deload = session.name.endsWith("(descarga)");
    return {
      id: session.id,
      name: session.name,
      exercises: rows.map((r) => ({
        exerciseId: r.exerciseId,
        plan: planFor(
          r.sets as PrescribedSet[],
          r.restSeconds,
          { id: r.exerciseId, movementPattern: r.movementPattern, equipment: r.equipment },
          last,
          deload,
        ),
      })),
    };
  });
}
