import { round } from "./strength";

export type BiologicalSex = "male" | "female";

export interface BodyBasics {
  sex: BiologicalSex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
}

/** Metabolismo basal por Mifflin-St Jeor. */
export function bmrMifflinStJeor({ sex, ageYears, heightCm, weightKg }: BodyBasics): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return round(sex === "male" ? base + 5 : base - 161);
}

/** Metabolismo basal por Katch-McArdle; solo útil con un % de grasa fiable. */
export function bmrKatchMcArdle(weightKg: number, bodyFatPct: number): number {
  const leanMassKg = weightKg * (1 - bodyFatPct / 100);
  return round(370 + 21.6 * leanMassKg);
}

export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  extreme: 1.9,
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_FACTORS;

export function estimateTdee(bmr: number, activity: ActivityLevel): number {
  return round(bmr * ACTIVITY_FACTORS[activity]);
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return round(weightKg / (m * m), 1);
}

export interface NavyMeasurements {
  sex: BiologicalSex;
  heightCm: number;
  neckCm: number;
  waistCm: number;
  /** Obligatoria para mujeres. */
  hipCm?: number;
}

/** % de grasa por la fórmula de la Marina de EE. UU. Margen típico de ±3-4 puntos. */
export function bodyFatNavy({ sex, heightCm, neckCm, waistCm, hipCm }: NavyMeasurements): number | null {
  if (sex === "male") {
    if (waistCm <= neckCm) return null;
    const pct = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
    return round(pct, 1);
  }
  if (hipCm === undefined || waistCm + hipCm <= neckCm) return null;
  const pct =
    495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450;
  return round(pct, 1);
}

export interface Skinfolds3Male {
  chestMm: number;
  abdomenMm: number;
  thighMm: number;
}

export interface Skinfolds3Female {
  tricepsMm: number;
  suprailiacMm: number;
  thighMm: number;
}

/** Jackson-Pollock de 3 pliegues + ecuación de Siri. */
export function bodyFatJacksonPollock3(
  sex: BiologicalSex,
  ageYears: number,
  folds: Skinfolds3Male | Skinfolds3Female,
): number {
  const values = Object.values(folds) as number[];
  const sum = values.reduce((a, b) => a + b, 0);
  const density =
    sex === "male"
      ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum ** 2 - 0.0002574 * ageYears
      : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum ** 2 - 0.0001392 * ageYears;
  return round(495 / density - 450, 1);
}
