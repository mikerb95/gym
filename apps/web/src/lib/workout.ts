import { z } from "zod";

/** Ejercicio del catálogo tal como lo necesita el registro. */
export type CatalogExercise = {
  id: string;
  name: string;
  aliases: string[];
  primaryMuscles: string[];
  tracksWeight: boolean;
  tracksDuration: boolean;
  tracksDistance: boolean;
};

export type LoggedSet = {
  id: string;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  done: boolean;
  completedAt: string | null;
};

export type LoggedExercise = { key: string; exerciseId: string; sets: LoggedSet[] };

export type ActiveWorkout = {
  id: string;
  startedAt: string;
  exercises: LoggedExercise[];
};

/** Última vez que el usuario hizo cada ejercicio: sus series completadas. */
export type LastPerformance = Record<
  string,
  { date: string; sets: { weightKg: number | null; reps: number | null; durationSeconds: number | null }[] }
>;

export const workoutPayloadSchema = z.object({
  id: z.uuid(),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  sessionRpe: z.number().int().min(1).max(10).nullable(),
  enjoyment: z.number().int().min(1).max(5).nullable(),
  notes: z.string().trim().max(1000),
  sets: z
    .array(
      z.object({
        id: z.uuid(),
        exerciseId: z.uuid(),
        position: z.number().int().min(0),
        weightKg: z.number().min(0).max(1000).nullable(),
        reps: z.number().int().min(0).max(500).nullable(),
        rir: z.number().min(0).max(10).nullable(),
        durationSeconds: z.number().int().min(0).max(86400).nullable(),
        distanceMeters: z.number().min(0).max(500000).nullable(),
        completedAt: z.iso.datetime(),
      }),
    )
    .min(1, "Completa al menos una serie")
    .max(300),
});

export type WorkoutPayload = z.infer<typeof workoutPayloadSchema>;

/** Quita tildes y pasa a minúsculas para buscar "jalon" y encontrar "Jalón". */
export function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export const MUSCLE_LABELS: Record<string, string> = {
  quadriceps: "Cuádriceps",
  glutes: "Glúteos",
  hamstrings: "Isquiotibiales",
  adductors: "Aductores",
  calves: "Pantorrillas",
  lower_back: "Espalda baja",
  upper_back: "Espalda alta",
  lats: "Dorsales",
  traps: "Trapecio",
  chest: "Pecho",
  front_delts: "Hombro frontal",
  side_delts: "Hombro lateral",
  rear_delts: "Hombro posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebrazos",
  abs: "Abdomen",
  obliques: "Oblicuos",
  cardio: "Cardio",
};
