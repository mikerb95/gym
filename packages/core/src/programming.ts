// Generación de un bloque de entrenamiento y progresión de cargas, con reglas
// deterministas. Son el punto de partida sin IA y el límite de seguridad de
// cualquier plan: nada de aquí decide sin que el atleta lo vea.

export type ProgramGoal = "fat_loss" | "muscle_gain" | "recomposition" | "maintenance" | "performance";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type TrainingPlace = "gym" | "home";

export type ProgramExercise = {
  id: string;
  movementPattern: string;
  primaryMuscles: string[];
  equipment: string[];
  level: string;
  tracksWeight: boolean;
  tracksDuration: boolean;
  tracksDistance: boolean;
};

export type PrescribedSet = {
  type: "working";
  reps?: number;
  repsMax?: number;
  rir?: number;
  durationS?: number;
};

export type PlannedExerciseDraft = {
  exerciseId: string;
  position: number;
  restSeconds: number;
  sets: PrescribedSet[];
};

export type PlannedSessionDraft = {
  week: number;
  dayIndex: number;
  name: string;
  estimatedMinutes: number;
  isDeload: boolean;
  exercises: PlannedExerciseDraft[];
};

export type ProgramDraft = { weeks: number; sessions: PlannedSessionDraft[]; notes: string[] };

export type ProgramInput = {
  goal: ProgramGoal;
  experience: ExperienceLevel;
  daysPerWeek: number;
  sessionMinutes: number;
  place: TrainingPlace;
  /** Menor de edad, PAR-Q+ con algún sí, o embarazo: cargas suaves y sin acercarse al fallo. */
  conservative: boolean;
  catalog: readonly ProgramExercise[];
};

type Slot = { pattern?: string; muscle?: string; fallback?: string[] };

const compound = (pattern: string, ...fallback: string[]): Slot => ({ pattern, fallback });
const isolation = (muscle: string): Slot => ({ muscle });
const core: Slot = { pattern: "core" };

const SQUAT = compound("squat", "lunge");
const HINGE = compound("hinge");
const LUNGE = compound("lunge", "squat");
const PUSH_H = compound("push_h");
const PUSH_V = compound("push_v", "push_h");
const PULL_H = compound("pull_h");
const PULL_V = compound("pull_v", "pull_h");

// En orden de prioridad: si el tiempo no alcanza, se recorta desde el final.
const DAYS: Record<string, { name: string; slots: Slot[] }> = {
  fullA: { name: "Cuerpo completo A", slots: [SQUAT, PUSH_H, PULL_V, HINGE, isolation("side_delts"), core, isolation("biceps")] },
  fullB: { name: "Cuerpo completo B", slots: [HINGE, PUSH_V, PULL_H, LUNGE, isolation("triceps"), core, isolation("calves")] },
  fullC: { name: "Cuerpo completo C", slots: [LUNGE, PUSH_H, PULL_H, HINGE, isolation("rear_delts"), core, isolation("biceps")] },
  upperA: { name: "Tren superior A", slots: [PUSH_H, PULL_H, PUSH_V, PULL_V, isolation("biceps"), isolation("triceps"), isolation("side_delts")] },
  lowerA: { name: "Tren inferior A", slots: [SQUAT, HINGE, LUNGE, isolation("hamstrings"), isolation("calves"), core] },
  upperB: { name: "Tren superior B", slots: [PULL_V, PUSH_V, PULL_H, PUSH_H, isolation("side_delts"), isolation("biceps"), isolation("triceps")] },
  lowerB: { name: "Tren inferior B", slots: [HINGE, SQUAT, isolation("quadriceps"), isolation("glutes"), isolation("calves"), core] },
  push: { name: "Empuje", slots: [PUSH_H, PUSH_V, PUSH_H, isolation("side_delts"), isolation("triceps"), isolation("chest")] },
  pull: { name: "Tirón", slots: [PULL_V, PULL_H, PULL_H, isolation("rear_delts"), isolation("biceps"), isolation("biceps")] },
  legs: { name: "Pierna", slots: [SQUAT, HINGE, LUNGE, isolation("hamstrings"), isolation("calves"), core] },
};

const SPLITS: Record<number, { days: string[]; weekdays: number[] }> = {
  1: { days: ["fullA"], weekdays: [0] },
  2: { days: ["fullA", "fullB"], weekdays: [0, 3] },
  3: { days: ["fullA", "fullB", "fullC"], weekdays: [0, 2, 4] },
  4: { days: ["upperA", "lowerA", "upperB", "lowerB"], weekdays: [0, 1, 3, 4] },
  5: { days: ["push", "pull", "legs", "upperB", "lowerB"], weekdays: [0, 1, 2, 4, 5] },
  6: { days: ["push", "pull", "legs", "push", "pull", "legs"], weekdays: [0, 1, 2, 3, 4, 5] },
};

type Scheme = { sets: number; repsMin: number; repsMax: number; rir: number; rest: number };

function schemeFor(input: ProgramInput, isCompound: boolean): Scheme {
  const volume = input.experience === "advanced" ? 4 : input.experience === "intermediate" ? 3 : 2;
  let scheme: Scheme;
  switch (input.goal) {
    case "performance":
      scheme = isCompound
        ? { sets: volume + 1, repsMin: 4, repsMax: 6, rir: 2, rest: 180 }
        : { sets: volume, repsMin: 8, repsMax: 12, rir: 2, rest: 90 };
      break;
    case "fat_loss":
      scheme = { sets: volume, repsMin: 10, repsMax: 15, rir: 2, rest: isCompound ? 90 : 60 };
      break;
    case "maintenance":
      scheme = { sets: Math.max(2, volume - 1), repsMin: 8, repsMax: 12, rir: 3, rest: isCompound ? 120 : 75 };
      break;
    default:
      scheme = { sets: isCompound ? volume + 1 : volume, repsMin: 8, repsMax: 12, rir: 2, rest: isCompound ? 120 : 75 };
  }
  if (input.experience === "beginner") scheme.rir = Math.max(scheme.rir, 3);
  if (input.conservative) {
    scheme.rir = Math.max(scheme.rir, 3);
    scheme.repsMin = Math.max(scheme.repsMin, 8);
    scheme.repsMax = Math.max(scheme.repsMax, 12);
    scheme.sets = Math.min(scheme.sets, 3);
  }
  return scheme;
}

const HOME_TOOLS = ["dumbbell", "kettlebell", "bodyweight"];
// Sin ellas el ejercicio no se puede hacer: no son una alternativa dentro de la lista.
const FIXED_STATIONS = ["dip_bars", "pull_up_bar", "ab_wheel", "rack"];

function isAvailable(e: ProgramExercise, input: ProgramInput) {
  if (e.movementPattern === "cardio" || e.movementPattern === "carry" || e.tracksDistance) return false;
  const beginnerOnly = input.conservative || input.experience === "beginner";
  if (beginnerOnly && e.level !== "beginner") return false;
  if (input.experience === "intermediate" && e.level === "advanced") return false;
  if (input.place === "gym") return true;
  return e.equipment.some((t) => HOME_TOOLS.includes(t)) && !e.equipment.some((t) => FIXED_STATIONS.includes(t));
}

/** Menor es mejor. Quien empieza aprende mejor en máquina; con experiencia se prefiere la barra. */
function toolPenalty(e: ProgramExercise, input: ProgramInput) {
  const tools = e.equipment;
  const startsEasy = input.conservative || input.experience === "beginner";
  if (startsEasy) {
    if (tools.includes("machine") || tools.includes("cable")) return 0;
    if (tools.includes("dumbbell")) return 1;
    if (tools.includes("barbell")) return 3;
    return 2;
  }
  if (tools.includes("barbell")) return 0;
  if (tools.includes("dumbbell")) return 1;
  if (tools.includes("smith_machine")) return 2;
  return 1;
}

function pick(slot: Slot, pool: readonly ProgramExercise[], used: Map<string, number>, excluded: Set<string>, input: ProgramInput) {
  const patterns = slot.pattern ? [slot.pattern, ...(slot.fallback ?? [])] : [];
  const groups = slot.muscle
    ? [pool.filter((e) => e.movementPattern === "isolation" && e.primaryMuscles.includes(slot.muscle!))]
    : patterns.map((p) => pool.filter((e) => e.movementPattern === p));
  for (const group of groups) {
    const options = group.filter((e) => !excluded.has(e.id));
    if (options.length === 0) continue;
    return [...options].sort(
      (a, b) => (used.get(a.id) ?? 0) * 10 + toolPenalty(a, input) - ((used.get(b.id) ?? 0) * 10 + toolPenalty(b, input)),
    )[0]!;
  }
  return null;
}

const WARMUP_MINUTES = 5;
const SECONDS_PER_SET = 45;
const MIN_EXERCISES = 3;
export const PROGRAM_WEEKS = 4;
const DELOAD_WEEK = PROGRAM_WEEKS;

/** Bloque de 4 semanas: una de adaptación, dos de trabajo y una de descarga. */
export function generateProgram(input: ProgramInput): ProgramDraft {
  const notes: string[] = [];
  const maxDays = input.experience === "beginner" || input.conservative ? 4 : 6;
  const days = Math.max(1, Math.min(maxDays, Math.round(input.daysPerWeek)));
  if (days < input.daysPerWeek) {
    notes.push(`Armamos ${days} días por semana y no ${input.daysPerWeek}: el descanso también hace parte del progreso.`);
  }

  const pool = input.catalog.filter((e) => isAvailable(e, input));
  const split = SPLITS[days]!;
  const used = new Map<string, number>();
  const sessions: PlannedSessionDraft[] = [];

  const weekly = split.days.map((key, i) => {
    const day = DAYS[key]!;
    const inDay = new Set<string>();
    const chosen: { exercise: ProgramExercise; scheme: Scheme; isCompound: boolean }[] = [];
    let seconds = WARMUP_MINUTES * 60;
    for (const slot of day.slots) {
      const exercise = pick(slot, pool, used, inDay, input);
      if (!exercise) continue;
      const isCompound = Boolean(slot.pattern && slot.pattern !== "core");
      const scheme = schemeFor(input, isCompound);
      const cost = scheme.sets * (scheme.rest + SECONDS_PER_SET);
      if (chosen.length >= MIN_EXERCISES && seconds + cost > input.sessionMinutes * 60) break;
      seconds += cost;
      inDay.add(exercise.id);
      used.set(exercise.id, (used.get(exercise.id) ?? 0) + 1);
      chosen.push({ exercise, scheme, isCompound });
    }
    return { name: day.name, weekday: split.weekdays[i]!, chosen };
  });

  for (let week = 1; week <= PROGRAM_WEEKS; week++) {
    const isDeload = week === DELOAD_WEEK;
    for (const day of weekly) {
      const exercises = day.chosen.map(({ exercise, scheme }, position) => {
        const sets = isDeload ? Math.max(1, Math.ceil(scheme.sets * 0.6)) : scheme.sets;
        const rir = scheme.rir + (isDeload ? 2 : week === 1 ? 1 : 0);
        const prescribed: PrescribedSet = exercise.tracksDuration && !exercise.tracksWeight
          ? { type: "working", durationS: 30 }
          : { type: "working", reps: scheme.repsMin, repsMax: scheme.repsMax, rir };
        return {
          exerciseId: exercise.id,
          position,
          restSeconds: scheme.rest,
          sets: Array.from({ length: sets }, () => ({ ...prescribed })),
        };
      });
      const seconds = exercises.reduce((sum, e) => sum + e.sets.length * (e.restSeconds + SECONDS_PER_SET), WARMUP_MINUTES * 60);
      sessions.push({
        week,
        dayIndex: day.weekday,
        name: isDeload ? `${day.name} (descarga)` : day.name,
        estimatedMinutes: Math.round(seconds / 60),
        isDeload,
        exercises,
      });
    }
  }
  return { weeks: PROGRAM_WEEKS, sessions, notes };
}

export type LoadProposal = {
  action: "increase" | "keep" | "decrease" | "deload";
  weightKg: number;
  reason: string;
};

export type LoadHistorySet = { weightKg: number | null; reps: number | null; rir?: number | null };

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

/** Salto de carga típico según el ejercicio. El dato real lo ajusta el atleta a lo que tenga disponible. */
export function loadIncrementKg(e: Pick<ProgramExercise, "movementPattern" | "equipment">) {
  if (e.equipment.includes("dumbbell")) return 2;
  if (e.movementPattern === "isolation") return 2.5;
  if (["squat", "hinge", "lunge"].includes(e.movementPattern)) return 5;
  return 2.5;
}

/**
 * Doble progresión: primero más repeticiones y, al llegar al tope del rango en
 * todas las series, más carga. Es una propuesta: el atleta la acepta o sigue con
 * lo que venía. Sin historial con carga no propone nada.
 */
export function proposeLoad(input: {
  last: readonly LoadHistorySet[];
  repsMin: number;
  repsMax: number;
  targetRir: number;
  incrementKg: number;
  deload?: boolean;
}): LoadProposal | null {
  const sets = input.last.filter((s) => s.weightKg && s.reps) as { weightKg: number; reps: number; rir?: number | null }[];
  if (sets.length === 0) return null;
  const weightKg = Math.max(...sets.map((s) => s.weightKg));
  const working = sets.filter((s) => s.weightKg === weightKg);
  const fewest = Math.min(...working.map((s) => s.reps));

  if (input.deload) {
    return {
      action: "deload",
      weightKg: roundTo(weightKg * 0.9, 0.5),
      reason: "Semana de descarga: menos peso para que el cuerpo asimile el trabajo.",
    };
  }

  const rirs = working.flatMap((s) => (s.rir === null || s.rir === undefined ? [] : [s.rir]));
  const closeToFailure = rirs.some((r) => r < input.targetRir - 1);
  if (fewest >= input.repsMax && !closeToFailure) {
    // Nunca más del 10 %: en cargas bajas un salto fijo sería demasiado.
    const step = Math.min(input.incrementKg, Math.max(0.5, roundTo(weightKg * 0.1, 0.5)));
    return {
      action: "increase",
      weightKg: weightKg + step,
      reason: `Llegaste a ${input.repsMax} repeticiones en todas las series. Sube el peso y vuelve a ${input.repsMin}.`,
    };
  }
  if (fewest < input.repsMin - 2) {
    return {
      action: "decrease",
      weightKg: roundTo(weightKg * 0.95, 0.5),
      reason: `Te quedaste lejos de ${input.repsMin} repeticiones. Con un poco menos de peso sigues progresando.`,
    };
  }
  return {
    action: "keep",
    weightKg,
    reason: closeToFailure && fewest >= input.repsMax
      ? "Llegaste al tope, pero muy cerca del fallo. Consolida este peso antes de subir."
      : `Mantén el peso y busca sumar repeticiones hasta llegar a ${input.repsMax}.`,
  };
}
