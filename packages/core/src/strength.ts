// Estimaciones de fuerza. Las fórmulas pierden precisión por encima de ~12 reps,
// por eso se marca la estimación como poco fiable en ese rango.

export interface SetResult {
  weightKg: number;
  reps: number;
  /** Repeticiones en reserva reportadas. Si se omite se asume serie al fallo. */
  rir?: number;
}

export interface OneRepMaxEstimate {
  kg: number;
  reliable: boolean;
}

const MAX_RELIABLE_REPS = 12;

export function estimateOneRepMax({ weightKg, reps, rir = 0 }: SetResult): OneRepMaxEstimate {
  if (weightKg <= 0 || reps <= 0) return { kg: 0, reliable: false };

  const repsToFailure = reps + Math.max(0, rir);
  if (repsToFailure === 1) return { kg: weightKg, reliable: true };

  // Promedio de Epley y Brzycki: Epley sobrestima en reps bajas y Brzycki en altas.
  const epley = weightKg * (1 + repsToFailure / 30);
  const brzycki = repsToFailure < 37 ? (weightKg * 36) / (37 - repsToFailure) : epley;

  return {
    kg: round((epley + brzycki) / 2, 1),
    reliable: repsToFailure <= MAX_RELIABLE_REPS,
  };
}

/** Peso sugerido para un número de reps y RIR objetivo a partir de un 1RM. */
export function weightForReps(oneRepMaxKg: number, reps: number, rir = 0): number {
  const repsToFailure = reps + Math.max(0, rir);
  if (repsToFailure <= 1) return oneRepMaxKg;
  const epley = oneRepMaxKg / (1 + repsToFailure / 30);
  const brzycki = (oneRepMaxKg * (37 - repsToFailure)) / 36;
  return round((epley + brzycki) / 2, 1);
}

export interface PlateLoad {
  perSide: number[];
  achievedKg: number;
  remainderKg: number;
}

export const STANDARD_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export const STANDARD_PLATES_LB = [45, 35, 25, 10, 5, 2.5] as const;

/** Discos por lado para llegar a una carga, de mayor a menor. */
export function plateLoad(
  targetTotal: number,
  barWeight = 20,
  plates: readonly number[] = STANDARD_PLATES_KG,
): PlateLoad {
  let remainingPerSide = Math.max(0, (targetTotal - barWeight) / 2);
  const perSide: number[] = [];
  for (const plate of [...plates].sort((a, b) => b - a)) {
    while (remainingPerSide + 1e-9 >= plate) {
      perSide.push(plate);
      remainingPerSide -= plate;
    }
  }
  const achievedKg = round(barWeight + perSide.reduce((sum, p) => sum + p, 0) * 2, 2);
  return { perSide, achievedKg, remainderKg: round(targetTotal - achievedKg, 2) };
}

export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
