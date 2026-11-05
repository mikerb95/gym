import { describe, expect, it } from "vitest";
import { EXERCISES } from "../../db/src/seed/exercises";
import { suggestAlternatives } from "./alternatives";

const catalog = EXERCISES.map((e) => ({ id: e.slug, movementPattern: e.movementPattern, primaryMuscles: e.primaryMuscles }));
const find = (slug: string) => catalog.find((e) => e.id === slug)!;

describe("alternativas cuando la máquina está ocupada", () => {
  it("propone ejercicios del mismo músculo principal, sin repetir el actual", () => {
    const options = suggestAlternatives(find("prensa-piernas"), catalog);
    expect(options).toHaveLength(3);
    for (const o of options) {
      expect(o.id).not.toBe("prensa-piernas");
      expect(o.primaryMuscles).toContain("quadriceps");
    }
  });

  it("prefiere el mismo patrón de movimiento", () => {
    const [first] = suggestAlternatives(find("jalon-pecho"), catalog);
    expect(first.movementPattern).toBe("pull_v");
  });

  it("no propone lo que ya está en la sesión", () => {
    const first = suggestAlternatives(find("jalon-pecho"), catalog)[0];
    const next = suggestAlternatives(find("jalon-pecho"), catalog, { exclude: [first.id] });
    expect(next.map((o) => o.id)).not.toContain(first.id);
  });

  it("entre opciones iguales prefiere lo que la persona ya hizo", () => {
    const options = suggestAlternatives(find("jalon-pecho"), catalog, { limit: 20 });
    const tied = options.filter((o) => o.movementPattern === "pull_v" && o.primaryMuscles.join() === options[0].primaryMuscles.join());
    const known = tied.at(-1)!;
    expect(suggestAlternatives(find("jalon-pecho"), catalog, { known: new Set([known.id]) })[0].id).toBe(known.id);
  });

  it("toda máquina del catálogo tiene al menos una alternativa", () => {
    const machines = EXERCISES.filter((e) => e.equipment.some((q) => ["machine", "cable", "smith_machine"].includes(q)));
    for (const m of machines) expect(suggestAlternatives(find(m.slug), catalog).length, m.slug).toBeGreaterThan(0);
  });
});
