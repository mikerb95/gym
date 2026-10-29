import type { BiologicalSex } from "./body";
import { round } from "./strength";

export type Goal = "fat_loss" | "muscle_gain" | "recomposition" | "maintenance" | "performance";

export interface MacroTargets {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
}

export interface MacroInput {
  tdee: number;
  weightKg: number;
  sex: BiologicalSex;
  goal: Goal;
  /** Si hay un % de grasa fiable, la proteína se calcula sobre masa magra. */
  bodyFatPct?: number;
  ageYears: number;
  pregnant?: boolean;
}

// Mínimos de seguridad: nunca se recomienda menos sin supervisión profesional.
export const KCAL_FLOOR: Record<BiologicalSex, number> = { male: 1500, female: 1200 };

const GOAL_ADJUSTMENT: Record<Goal, number> = {
  fat_loss: -0.2,
  muscle_gain: 0.1,
  recomposition: -0.05,
  maintenance: 0,
  performance: 0.05,
};

export function macroTargets(input: MacroInput): MacroTargets {
  const { tdee, weightKg, sex, goal, bodyFatPct, ageYears, pregnant } = input;

  // Embarazo y menores: sin déficit calórico.
  const allowsDeficit = !pregnant && ageYears >= 18;
  const adjustment = allowsDeficit ? GOAL_ADJUSTMENT[goal] : Math.max(0, GOAL_ADJUSTMENT[goal]);
  const kcal = Math.max(KCAL_FLOOR[sex], round(tdee * (1 + adjustment)));

  const referenceMass = bodyFatPct !== undefined ? weightKg * (1 - bodyFatPct / 100) : weightKg;
  const proteinPerKg = bodyFatPct !== undefined ? 2.4 : goal === "fat_loss" ? 2.0 : 1.8;
  const proteinG = round(referenceMass * proteinPerKg);

  const fatG = round(Math.max(weightKg * 0.7, (kcal * 0.25) / 9));
  const carbsG = Math.max(0, round((kcal - proteinG * 4 - fatG * 9) / 4));
  const fiberG = round((kcal / 1000) * 14);

  return { kcal, proteinG, fatG, carbsG, fiberG };
}
