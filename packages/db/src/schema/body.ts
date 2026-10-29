import { date, index, integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles, timestamps } from "./identity";

const owner = () =>
  uuid()
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" });

export const bodyWeights = pgTable(
  "body_weights",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    measuredOn: date().notNull(),
    weightKg: real().notNull(),
    source: text().default("manual").notNull(), // manual | scale_ocr | health_connect
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.measuredOn)],
);

/** Una fila por sitio medido: cuello, cintura, cadera, brazo_relajado, etc. */
export const bodyMeasurements = pgTable(
  "body_measurements",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    measuredOn: date().notNull(),
    site: text().notNull(),
    valueCm: real().notNull(),
    measuredBy: uuid().references(() => profiles.id),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.site, t.measuredOn)],
);

export const bodyCompositions = pgTable(
  "body_compositions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    measuredOn: date().notNull(),
    /** navy | skinfold_jp3 | skinfold_jp7 | bia | inbody | dexa */
    method: text().notNull(),
    bodyFatPct: real(),
    leanMassKg: real(),
    skeletalMuscleKg: real(),
    visceralFatLevel: real(),
    /** Margen de error típico del método, en puntos de % de grasa. */
    errorMarginPct: real(),
    raw: jsonb(),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.measuredOn)],
);

export const progressPhotos = pgTable(
  "progress_photos",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    takenOn: date().notNull(),
    pose: text().notNull(), // front | side | back
    /** Ruta en el bucket privado; nunca una URL pública. */
    storagePath: text().notNull(),
    poseKeypoints: jsonb(),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.takenOn)],
);

export const injuries = pgTable(
  "injuries",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    bodyRegion: text().notNull(),
    side: text(), // left | right | both
    intensity: integer().notNull(), // 0-10
    painfulMovements: text().array().default([]).notNull(),
    notes: text(),
    startedOn: date(),
    resolvedOn: date(),
    ...timestamps,
  },
  (t) => [index().on(t.userId)],
);

export const wearableDailyMetrics = pgTable(
  "wearable_daily_metrics",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    day: date().notNull(),
    source: text().notNull(),
    steps: integer(),
    restingHr: real(),
    hrvMs: real(),
    sleepMinutes: integer(),
    activeKcal: real(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index().on(t.userId, t.day)],
);
