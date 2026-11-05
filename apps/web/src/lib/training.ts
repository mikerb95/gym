import "server-only";
import { desc, eq, isNull, or, sql } from "drizzle-orm";
import { exercises, workoutSessions } from "@gym/db/schema";
import { asViewer } from "./auth";
import type { CatalogExercise, LastPerformance } from "./workout";

/** Catálogo global más los ejercicios propios del usuario. */
export function getCatalog(): Promise<CatalogExercise[]> {
  return asViewer((tx, viewer) =>
    tx
      .select({
        id: exercises.id,
        name: exercises.name,
        aliases: exercises.aliases,
        movementPattern: exercises.movementPattern,
        primaryMuscles: exercises.primaryMuscles,
        equipment: exercises.equipment,
        cues: exercises.cues,
        commonMistakes: exercises.commonMistakes,
        tracksWeight: exercises.tracksWeight,
        tracksDuration: exercises.tracksDuration,
        tracksDistance: exercises.tracksDistance,
      })
      .from(exercises)
      .where(or(isNull(exercises.ownerId), eq(exercises.ownerId, viewer.id)))
      .orderBy(exercises.name),
  );
}

/** Las series de la última sesión en que el usuario hizo cada ejercicio. */
export function getLastPerformance(): Promise<LastPerformance> {
  return asViewer(async (tx) => {
    const rows = await tx.execute<{
      exercise_id: string;
      started_at: string;
      sets: { weightKg: number | null; reps: number | null; rir: number | null; durationSeconds: number | null }[];
    }>(sql`
      select distinct on (ps.exercise_id)
        ps.exercise_id,
        ws.started_at,
        (select json_agg(json_build_object('weightKg', p.weight_kg, 'reps', p.reps, 'rir', p.rir, 'durationSeconds', p.duration_seconds) order by p.position)
           from performed_sets p
          where p.workout_session_id = ws.id and p.exercise_id = ps.exercise_id and p.type <> 'warmup') as sets
      from performed_sets ps
      join workout_sessions ws on ws.id = ps.workout_session_id
      -- RLS también deja ver a un entrenador las sesiones de sus atletas: aquí solo van las propias.
      where ws.user_id = auth.uid()
      order by ps.exercise_id, ws.started_at desc
    `);
    return Object.fromEntries(
      rows.map((r) => [r.exercise_id, { date: new Date(r.started_at).toISOString(), sets: r.sets ?? [] }]),
    );
  });
}

export type HistoryItem = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  sessionRpe: number | null;
  sets: number;
  volumeKg: number;
  exercises: string[];
};

/** Sesiones recientes con su resumen. */
export function getHistory(limit = 12): Promise<HistoryItem[]> {
  return asViewer(async (tx, viewer) => {
    const rows = await tx
      .select({
        id: workoutSessions.id,
        startedAt: workoutSessions.startedAt,
        endedAt: workoutSessions.endedAt,
        sessionRpe: workoutSessions.sessionRpe,
        sets: sql<number>`(select count(*)::int from performed_sets p where p.workout_session_id = ${workoutSessions.id} and p.type <> 'warmup')`,
        volumeKg: sql<number>`(select coalesce(sum(p.weight_kg * p.reps), 0)::float from performed_sets p where p.workout_session_id = ${workoutSessions.id} and p.type <> 'warmup')`,
        exercises: sql<string[]>`(select coalesce(array_agg(distinct e.name), '{}') from performed_sets p join exercises e on e.id = p.exercise_id where p.workout_session_id = ${workoutSessions.id})`,
      })
      .from(workoutSessions)
      // RLS también deja ver a un entrenador las sesiones de sus atletas: aquí solo van las propias.
      .where(eq(workoutSessions.userId, viewer.id))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(limit);
    return rows;
  });
}
