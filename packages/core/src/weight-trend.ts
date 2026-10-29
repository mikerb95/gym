import { round } from "./strength";

export interface DatedValue {
  /** Fecha en formato YYYY-MM-DD, en la zona horaria del usuario. */
  date: string;
  value: number;
}

export interface TrendPoint extends DatedValue {
  trend: number;
}

const DAY_MS = 86_400_000;

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

/**
 * Media móvil exponencial ajustada por días faltantes, para que el ruido diario
 * del agua no se lea como cambio real. alpha=0.1 equivale a ~10 días de memoria.
 */
export function weightTrend(entries: DatedValue[], alpha = 0.1): TrendPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const points: TrendPoint[] = [];
  let previous: TrendPoint | undefined;

  for (const entry of sorted) {
    if (!previous) {
      previous = { ...entry, trend: entry.value };
    } else {
      const gap = Math.max(1, daysBetween(previous.date, entry.date));
      const effectiveAlpha = 1 - (1 - alpha) ** gap;
      previous = { ...entry, trend: previous.trend + effectiveAlpha * (entry.value - previous.trend) };
    }
    points.push({ ...previous, trend: round(previous.trend, 2) });
  }
  return points;
}

/** Cambio semanal de la tendencia en kg, por regresión lineal de los últimos `windowDays`. */
export function weeklyRate(trend: TrendPoint[], windowDays = 21): number | null {
  const last = trend.at(-1);
  if (!last) return null;
  const window = trend.filter((p) => daysBetween(p.date, last.date) <= windowDays);
  if (window.length < 2) return null;

  const xs = window.map((p) => daysBetween(window[0]!.date, p.date));
  const ys = window.map((p) => p.trend);
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - meanX) * (ys[i]! - meanY);
    den += (xs[i]! - meanX) ** 2;
  }
  if (den === 0) return null;
  return round((num / den) * 7, 2);
}

export const KCAL_PER_KG_BODY_MASS = 7700;

export interface AdaptiveTdeeInput {
  weights: DatedValue[];
  /** Calorías registradas por día. */
  intake: DatedValue[];
  windowDays?: number;
}

export interface AdaptiveTdeeResult {
  tdee: number;
  averageIntake: number;
  weeklyRateKg: number;
  /** Días con registro de comida dentro de la ventana. */
  loggedDays: number;
  confidence: "low" | "medium" | "high";
}

/**
 * Gasto real estimado: lo que comió menos lo que explica el cambio de peso.
 * Requiere al menos 10 días de registro para dar un número.
 */
export function adaptiveTdee({ weights, intake, windowDays = 21 }: AdaptiveTdeeInput): AdaptiveTdeeResult | null {
  const trend = weightTrend(weights);
  const last = trend.at(-1);
  if (!last) return null;

  const inWindow = intake.filter((d) => {
    const age = daysBetween(d.date, last.date);
    return age >= 0 && age < windowDays;
  });
  if (inWindow.length < 10) return null;

  const rate = weeklyRate(trend, windowDays);
  if (rate === null) return null;

  const averageIntake = inWindow.reduce((sum, d) => sum + d.value, 0) / inWindow.length;
  const dailyEnergyFromMass = (rate * KCAL_PER_KG_BODY_MASS) / 7;
  const coverage = inWindow.length / windowDays;

  return {
    tdee: round(averageIntake - dailyEnergyFromMass),
    averageIntake: round(averageIntake),
    weeklyRateKg: rate,
    loggedDays: inWindow.length,
    confidence: coverage >= 0.85 ? "high" : coverage >= 0.6 ? "medium" : "low",
  };
}
