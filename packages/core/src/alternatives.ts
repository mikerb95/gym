// Qué hacer cuando la máquina está ocupada: otro ejercicio para el mismo músculo.

export type AlternativeExercise = {
  id: string;
  movementPattern: string;
  primaryMuscles: readonly string[];
};

/**
 * Exige el músculo principal, y prefiere el mismo patrón de movimiento, los demás
 * músculos en común y lo que la persona ya conoce. No propone lo que ya está en la
 * sesión. Con el catálogo solo no se sabe qué hay en cada gym: la persona elige.
 */
export function suggestAlternatives<T extends AlternativeExercise>(
  exercise: AlternativeExercise,
  catalog: readonly T[],
  options: { exclude?: readonly string[]; known?: ReadonlySet<string>; limit?: number } = {},
): T[] {
  const main = exercise.primaryMuscles[0];
  if (!main) return [];
  const excluded = new Set([exercise.id, ...(options.exclude ?? [])]);
  const score = (e: T) =>
    (e.movementPattern === exercise.movementPattern ? 4 : 0) +
    e.primaryMuscles.filter((m) => exercise.primaryMuscles.includes(m)).length * 2 +
    (options.known?.has(e.id) ? 1 : 0);

  return catalog
    .filter((e) => !excluded.has(e.id) && e.primaryMuscles.includes(main))
    .map((e) => ({ e, s: score(e) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, options.limit ?? 3)
    .map(({ e }) => e);
}
