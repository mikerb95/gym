import { z } from "zod";
import type { LoadProposal } from "@gym/core";

/** Ejercicio del catálogo tal como lo necesita el registro. */
export type CatalogExercise = {
  id: string;
  name: string;
  aliases: string[];
  movementPattern: string;
  primaryMuscles: string[];
  equipment: string[];
  /** Cómo hacerlo y errores comunes. */
  cues: string[];
  commonMistakes: string[];
  tracksWeight: boolean;
  tracksDuration: boolean;
  tracksDistance: boolean;
};

export type SetType = "warmup" | "working";

export type LoggedSet = {
  id: string;
  /** Sin valor es una serie efectiva. Los calentamientos no cuentan para volumen ni récords. */
  type?: SetType;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  done: boolean;
  completedAt: string | null;
};

/** Lo que el programa pide para un ejercicio, y la propuesta de carga que el atleta decide. */
export type ExercisePlan = {
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
  durationS: number | null;
  sets: number;
  restSeconds: number | null;
  proposal: LoadProposal | null;
  proposalDecision?: "accepted" | "kept";
};

export type LoggedExercise = {
  key: string;
  exerciseId: string;
  identifiedBy?: "manual" | "camera";
  plan?: ExercisePlan;
  /** Propuesta de carga en una sesión libre, sin programa. */
  suggestion?: Pick<ExercisePlan, "proposal" | "proposalDecision">;
  sets: LoggedSet[];
};

export type ActiveWorkout = {
  id: string;
  startedAt: string;
  plannedSessionId?: string;
  exercises: LoggedExercise[];
};

/** Sesión del programa lista para empezar. */
export type PlannedWorkout = {
  id: string;
  name: string;
  exercises: { exerciseId: string; plan: ExercisePlan }[];
};

/** Última vez que el usuario hizo cada ejercicio: sus series completadas. */
export type LastPerformance = Record<
  string,
  { date: string; sets: { weightKg: number | null; reps: number | null; rir?: number | null; durationSeconds: number | null }[] }
>;

export const workoutPayloadSchema = z.object({
  id: z.uuid(),
  // Opcional: las sesiones ya en la bandeja de salida no lo traen.
  plannedSessionId: z.uuid().optional(),
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
        // Opcional: las sesiones ya en la bandeja de salida no lo traen.
        identifiedBy: z.enum(["manual", "camera"]).optional(),
        // Opcional por la misma razón.
        type: z.enum(["warmup", "working"]).optional(),
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
