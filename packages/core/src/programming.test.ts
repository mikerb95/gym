import { describe, expect, it } from "vitest";
import { EXERCISES } from "../../db/src/seed/exercises";
import { generateProgram, loadIncrementKg, proposeLoad, type ProgramExercise, type ProgramInput } from "./programming";

// Se prueba contra el catálogo real: si un cambio en él deja un patrón sin opciones, salta aquí.
const catalog: (ProgramExercise & { slug: string })[] = EXERCISES.map((e) => ({
  id: e.slug,
  slug: e.slug,
  movementPattern: e.movementPattern,
  primaryMuscles: e.primaryMuscles,
  equipment: e.equipment,
  level: e.level ?? "beginner",
  tracksWeight: e.tracksWeight ?? true,
  tracksDuration: e.tracksDuration ?? false,
  tracksDistance: e.tracksDistance ?? false,
}));
const byId = new Map(catalog.map((e) => [e.id, e]));

const base: ProgramInput = {
  goal: "muscle_gain",
  experience: "intermediate",
  daysPerWeek: 3,
  sessionMinutes: 60,
  place: "gym",
  conservative: false,
  catalog,
};

describe("generación de programas", () => {
  it.each([1, 2, 3, 4, 5, 6])("%i días: cada sesión tiene al menos 3 ejercicios sin repetir", (daysPerWeek) => {
    const program = generateProgram({ ...base, daysPerWeek, experience: "advanced" });
    expect(program.sessions).toHaveLength(daysPerWeek * 4);
    for (const session of program.sessions) {
      expect(session.exercises.length).toBeGreaterThanOrEqual(3);
      expect(new Set(session.exercises.map((e) => e.exerciseId)).size).toBe(session.exercises.length);
    }
  });

  it("respeta el tiempo disponible en la semana de trabajo", () => {
    for (const sessionMinutes of [45, 60, 90]) {
      const { sessions } = generateProgram({ ...base, sessionMinutes });
      for (const s of sessions.filter((x) => x.week === 2)) expect(s.estimatedMinutes).toBeLessThanOrEqual(sessionMinutes);
    }
  });

  it("repite los mismos ejercicios toda la semana del bloque para poder progresar", () => {
    const { sessions } = generateProgram(base);
    const ids = (week: number) => sessions.filter((s) => s.week === week).flatMap((s) => s.exercises.map((e) => e.exerciseId));
    expect(ids(2)).toEqual(ids(1));
    expect(ids(4)).toEqual(ids(1));
  });

  it("la cuarta semana es de descarga: menos series y más lejos del fallo", () => {
    const { sessions } = generateProgram(base);
    const first = (week: number) => sessions.find((s) => s.week === week)!.exercises[0]!;
    expect(sessions.find((s) => s.week === 4)!.isDeload).toBe(true);
    expect(first(4).sets.length).toBeLessThan(first(2).sets.length);
    expect(first(4).sets[0]!.rir!).toBeGreaterThan(first(2).sets[0]!.rir!);
  });

  it("modo conservador: solo ejercicios básicos, lejos del fallo y sin cargas de pocas repeticiones", () => {
    const { sessions } = generateProgram({ ...base, goal: "performance", experience: "advanced", conservative: true, daysPerWeek: 6 });
    for (const session of sessions) {
      for (const e of session.exercises) {
        expect(byId.get(e.exerciseId)!.level).toBe("beginner");
        for (const s of e.sets) {
          if (s.rir !== undefined) expect(s.rir).toBeGreaterThanOrEqual(3);
          if (s.reps !== undefined) expect(s.reps).toBeGreaterThanOrEqual(8);
        }
      }
    }
    expect(new Set(sessions.map((s) => s.dayIndex)).size).toBe(4);
  });

  it("quien empieza no recibe más de 4 días, y se le explica", () => {
    const program = generateProgram({ ...base, experience: "beginner", daysPerWeek: 6 });
    expect(program.sessions).toHaveLength(16);
    expect(program.notes.length).toBe(1);
  });

  it("en casa solo usa lo que se puede hacer con mancuernas o el cuerpo", () => {
    const { sessions } = generateProgram({ ...base, place: "home", daysPerWeek: 4 });
    for (const e of sessions.flatMap((s) => s.exercises)) {
      const tools = byId.get(e.exerciseId)!.equipment;
      expect(tools.some((t) => ["dumbbell", "kettlebell", "bodyweight"].includes(t))).toBe(true);
      expect(tools.some((t) => ["rack", "pull_up_bar", "dip_bars", "ab_wheel"].includes(t))).toBe(false);
    }
  });

  it("nunca incluye cardio como ejercicio de fuerza", () => {
    const { sessions } = generateProgram({ ...base, daysPerWeek: 6, experience: "advanced" });
    for (const e of sessions.flatMap((s) => s.exercises)) expect(byId.get(e.exerciseId)!.movementPattern).not.toBe("cardio");
  });
});

describe("progresión de cargas", () => {
  const rule = { repsMin: 8, repsMax: 12, targetRir: 2, incrementKg: 2.5 };
  const sets = (weightKg: number, ...reps: number[]) => reps.map((r) => ({ weightKg, reps: r, rir: 2 }));

  it("sin historial con carga no propone nada", () => {
    expect(proposeLoad({ ...rule, last: [] })).toBeNull();
    expect(proposeLoad({ ...rule, last: [{ weightKg: null, reps: 10 }] })).toBeNull();
  });

  it("sube el peso solo si llegó al tope en todas las series", () => {
    expect(proposeLoad({ ...rule, last: sets(60, 12, 12, 12) })).toMatchObject({ action: "increase", weightKg: 62.5 });
    expect(proposeLoad({ ...rule, last: sets(60, 12, 12, 11) })).toMatchObject({ action: "keep", weightKg: 60 });
  });

  it("no sube si llegó al tope pero muy cerca del fallo", () => {
    const last = [12, 12, 12].map((reps) => ({ weightKg: 60, reps, rir: 0 }));
    expect(proposeLoad({ ...rule, last })).toMatchObject({ action: "keep", weightKg: 60 });
  });

  it("baja un poco si quedó lejos del mínimo", () => {
    expect(proposeLoad({ ...rule, last: sets(60, 8, 7, 5) })).toMatchObject({ action: "decrease", weightKg: 57 });
  });

  it("el salto nunca pasa del 10 % en cargas bajas", () => {
    expect(proposeLoad({ ...rule, incrementKg: 5, last: sets(10, 12, 12) })?.weightKg).toBe(11);
  });

  it("en descarga propone 10 % menos sin importar las repeticiones", () => {
    expect(proposeLoad({ ...rule, deload: true, last: sets(60, 12, 12) })).toMatchObject({ action: "deload", weightKg: 54 });
  });

  it("toma como referencia las series con el mayor peso", () => {
    const last = [{ weightKg: 40, reps: 8 }, ...sets(60, 12, 12)];
    expect(proposeLoad({ ...rule, last })).toMatchObject({ action: "increase", weightKg: 62.5 });
  });

  it("el salto depende del ejercicio", () => {
    expect(loadIncrementKg({ movementPattern: "squat", equipment: ["barbell"] })).toBe(5);
    expect(loadIncrementKg({ movementPattern: "push_h", equipment: ["dumbbell", "bench"] })).toBe(2);
    expect(loadIncrementKg({ movementPattern: "isolation", equipment: ["cable"] })).toBe(2.5);
  });
});
