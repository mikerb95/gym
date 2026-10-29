import { describe, expect, it } from "vitest";
import {
  adaptiveTdee,
  bmrMifflinStJeor,
  bodyFatNavy,
  estimateOneRepMax,
  macroTargets,
  plateLoad,
  readiness,
  weightForReps,
  weightTrend,
  weeklyRate,
  type DatedValue,
} from "./index";

function dailySeries(days: number, valueAt: (day: number) => number, start = "2026-01-01"): DatedValue[] {
  const base = Date.parse(start);
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(base + i * 86_400_000).toISOString().slice(0, 10),
    value: valueAt(i),
  }));
}

describe("fuerza", () => {
  it("una repetición es el propio 1RM", () => {
    expect(estimateOneRepMax({ weightKg: 100, reps: 1 })).toEqual({ kg: 100, reliable: true });
  });

  it("promedia Epley y Brzycki", () => {
    expect(estimateOneRepMax({ weightKg: 100, reps: 5 }).kg).toBeCloseTo(114.6, 1);
  });

  it("suma las reps en reserva", () => {
    const withRir = estimateOneRepMax({ weightKg: 100, reps: 3, rir: 2 });
    expect(withRir.kg).toBe(estimateOneRepMax({ weightKg: 100, reps: 5 }).kg);
  });

  it("marca como poco fiable por encima de 12 reps", () => {
    expect(estimateOneRepMax({ weightKg: 40, reps: 20 }).reliable).toBe(false);
  });

  it("weightForReps es la inversa aproximada", () => {
    expect(weightForReps(114.6, 5)).toBeCloseTo(100, 0);
  });

  it("calcula discos por lado", () => {
    expect(plateLoad(100)).toEqual({ perSide: [25, 15], achievedKg: 100, remainderKg: 0 });
    expect(plateLoad(101).remainderKg).toBe(1);
  });
});

describe("cuerpo", () => {
  it("Mifflin-St Jeor", () => {
    expect(bmrMifflinStJeor({ sex: "male", ageYears: 30, heightCm: 180, weightKg: 80 })).toBe(1780);
    expect(bmrMifflinStJeor({ sex: "female", ageYears: 25, heightCm: 165, weightKg: 60 })).toBe(1345);
  });

  it("fórmula de la Marina en rangos plausibles", () => {
    const male = bodyFatNavy({ sex: "male", heightCm: 178, neckCm: 38, waistCm: 85 });
    expect(male).toBeGreaterThan(12);
    expect(male).toBeLessThan(20);
    expect(bodyFatNavy({ sex: "female", heightCm: 165, neckCm: 32, waistCm: 70 })).toBeNull();
  });
});

describe("tendencia de peso y TDEE adaptativo", () => {
  it("suaviza el ruido diario", () => {
    const noisy = dailySeries(30, (d) => 80 + (d % 2 === 0 ? 0.8 : -0.8));
    const last = weightTrend(noisy).at(-1)!;
    expect(Math.abs(last.trend - 80)).toBeLessThan(0.2);
  });

  it("detecta la pérdida semanal", () => {
    const losing = dailySeries(60, (d) => 90 - (0.5 / 7) * d);
    expect(weeklyRate(weightTrend(losing))).toBeCloseTo(-0.5, 1);
  });

  it("peso estable: el gasto es igual a lo que come", () => {
    const result = adaptiveTdee({
      weights: dailySeries(30, () => 75),
      intake: dailySeries(30, () => 2500),
    });
    expect(result?.tdee).toBe(2500);
    expect(result?.confidence).toBe("high");
  });

  it("perdiendo 0,5 kg por semana con 2000 kcal el gasto ronda 2550", () => {
    const result = adaptiveTdee({
      weights: dailySeries(60, (d) => 90 - (0.5 / 7) * d),
      intake: dailySeries(60, () => 2000),
    });
    expect(result!.tdee).toBeGreaterThan(2450);
    expect(result!.tdee).toBeLessThan(2650);
  });

  it("sin suficiente registro no da número", () => {
    expect(adaptiveTdee({ weights: dailySeries(30, () => 75), intake: dailySeries(5, () => 2500) })).toBeNull();
  });
});

describe("readiness", () => {
  it("todo bien: sesión como estaba planeada", () => {
    const r = readiness({ sleepQuality: 5, energy: 5, soreness: 5, stress: 5, mood: 5, sleepHours: 8 });
    expect(r.score).toBe(10);
    expect(r.adjustment).toBe("as_planned");
  });

  it("dormir poco y con dolor reduce la sesión y explica por qué", () => {
    const r = readiness({ sleepQuality: 2, energy: 2, soreness: 1, stress: 3, mood: 3, sleepHours: 4.5 });
    expect(["reduce_volume", "recovery"]).toContain(r.adjustment);
    expect(r.reasons).toContain("Dormiste 4.5 h");
  });
});

describe("macros", () => {
  it("respeta el mínimo de calorías", () => {
    const m = macroTargets({ tdee: 1400, weightKg: 50, sex: "female", goal: "fat_loss", ageYears: 30 });
    expect(m.kcal).toBe(1200);
  });

  it("sin déficit en embarazo ni en menores", () => {
    const pregnant = macroTargets({ tdee: 2200, weightKg: 65, sex: "female", goal: "fat_loss", ageYears: 30, pregnant: true });
    const minor = macroTargets({ tdee: 2400, weightKg: 60, sex: "male", goal: "fat_loss", ageYears: 16 });
    expect(pregnant.kcal).toBe(2200);
    expect(minor.kcal).toBe(2400);
  });

  it("las calorías de los macros cuadran", () => {
    const m = macroTargets({ tdee: 2600, weightKg: 80, sex: "male", goal: "muscle_gain", ageYears: 28 });
    expect(m.proteinG * 4 + m.carbsG * 4 + m.fatG * 9).toBeCloseTo(m.kcal, -1);
  });
});
