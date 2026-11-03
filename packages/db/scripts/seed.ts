// Carga o actualiza los catálogos globales. Es idempotente: se puede correr
// cada vez que cambie el catálogo.
import { sql } from "drizzle-orm";
import { createDb } from "../src/index";
import { exercises } from "../src/schema/training";
import { EXERCISES } from "../src/seed/exercises";

const db = createDb(process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL);

await db
  .insert(exercises)
  .values(
    EXERCISES.map((e) => ({
      slug: e.slug,
      name: e.name,
      aliases: e.aliases ?? [],
      movementPattern: e.movementPattern,
      primaryMuscles: e.primaryMuscles,
      secondaryMuscles: e.secondaryMuscles ?? [],
      equipment: e.equipment,
      level: e.level ?? "beginner",
      cues: e.cues ?? [],
      tracksWeight: e.tracksWeight ?? true,
      tracksDistance: e.tracksDistance ?? false,
      tracksDuration: e.tracksDuration ?? false,
    })),
  )
  .onConflictDoUpdate({
    target: exercises.slug,
    set: {
      name: sql`excluded.name`,
      aliases: sql`excluded.aliases`,
      movementPattern: sql`excluded.movement_pattern`,
      primaryMuscles: sql`excluded.primary_muscles`,
      secondaryMuscles: sql`excluded.secondary_muscles`,
      equipment: sql`excluded.equipment`,
      level: sql`excluded.level`,
      cues: sql`excluded.cues`,
      tracksWeight: sql`excluded.tracks_weight`,
      tracksDistance: sql`excluded.tracks_distance`,
      tracksDuration: sql`excluded.tracks_duration`,
      updatedAt: sql`now()`,
    },
  });

console.log(`Ejercicios: ${EXERCISES.length}`);
await db.$client.end();
