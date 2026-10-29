import { round } from "./strength";

/** Respuestas del check-in previo al entreno, todas en escala 1-5 (5 = mejor). */
export interface ReadinessAnswers {
  sleepQuality: number;
  sleepHours?: number;
  energy: number;
  /** 5 = sin dolor muscular. */
  soreness: number;
  /** 5 = sin estrés. */
  stress: number;
  mood: number;
}

export type SessionAdjustment = "as_planned" | "reduce_volume" | "reduce_intensity" | "recovery";

export interface ReadinessResult {
  /** 0 a 10. */
  score: number;
  adjustment: SessionAdjustment;
  reasons: string[];
}

const WEIGHTS = { sleepQuality: 0.25, energy: 0.25, soreness: 0.2, stress: 0.15, mood: 0.15 } as const;

export function readiness(answers: ReadinessAnswers): ReadinessResult {
  const reasons: string[] = [];
  let weighted = 0;
  for (const [key, weight] of Object.entries(WEIGHTS) as [keyof typeof WEIGHTS, number][]) {
    weighted += clamp(answers[key], 1, 5) * weight;
  }
  // De escala 1-5 a 0-10.
  let score = ((weighted - 1) / 4) * 10;

  if (answers.sleepHours !== undefined && answers.sleepHours < 6) {
    score -= answers.sleepHours < 5 ? 1.5 : 0.75;
    reasons.push(`Dormiste ${answers.sleepHours} h`);
  }
  if (answers.soreness <= 2) reasons.push("Dolor muscular alto");
  if (answers.energy <= 2) reasons.push("Energía baja");
  if (answers.stress <= 2) reasons.push("Estrés alto");

  score = round(clamp(score, 0, 10), 1);

  let adjustment: SessionAdjustment = "as_planned";
  if (score < 3) adjustment = "recovery";
  else if (score < 5) adjustment = answers.soreness <= 2 ? "reduce_volume" : "reduce_intensity";
  else if (score < 6.5 && answers.soreness <= 2) adjustment = "reduce_volume";

  return { score, adjustment, reasons };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
