import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { organizations, profiles, timestamps } from "./identity";

export const exercises = pgTable(
  "exercises",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    aliases: text().array().default([]).notNull(),
    movementPattern: text().notNull(), // squat | hinge | push_h | push_v | pull_h | pull_v | lunge | carry | core | cardio
    primaryMuscles: text().array().notNull(),
    secondaryMuscles: text().array().default([]).notNull(),
    equipment: text().array().default([]).notNull(),
    level: text().default("beginner").notNull(),
    /** Animación 3D (glTF) y miniatura. */
    animationUrl: text(),
    thumbnailUrl: text(),
    cues: text().array().default([]).notNull(),
    commonMistakes: text().array().default([]).notNull(),
    contraindications: text().array().default([]).notNull(),
    tracksWeight: boolean().default(true).notNull(),
    tracksDistance: boolean().default(false).notNull(),
    tracksDuration: boolean().default(false).notNull(),
    /** Ejercicio privado creado por un entrenador o atleta. */
    ownerId: uuid().references(() => profiles.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index().on(t.movementPattern)],
);

/** Clases funcionales de la taxonomía de reconocimiento (docs/research). */
export const machineClasses = pgTable("machine_classes", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  family: text().notNull(),
  loadType: text(), // selectorized | plate_loaded | cable | free
  confusableWith: text().array().default([]).notNull(),
  ...timestamps,
});

export const machineClassExercises = pgTable(
  "machine_class_exercises",
  {
    machineClassId: uuid()
      .notNull()
      .references(() => machineClasses.id, { onDelete: "cascade" }),
    exerciseId: uuid()
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.machineClassId, t.exerciseId] })],
);

export const gyms = pgTable("gyms", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  address: text(),
  city: text(),
  googlePlaceId: text().unique(),
  lat: real(),
  lng: real(),
  organizationId: uuid().references(() => organizations.id, { onDelete: "set null" }),
  ...timestamps,
});

/** Galería de referencia: global (gymId nulo) o local de un gym (fotos confirmadas). */
export const machineReferenceImages = pgTable(
  "machine_reference_images",
  {
    id: uuid().primaryKey().defaultRandom(),
    machineClassId: uuid()
      .notNull()
      .references(() => machineClasses.id, { onDelete: "cascade" }),
    gymId: uuid().references(() => gyms.id, { onDelete: "cascade" }),
    storagePath: text().notNull(),
    embedding: vector({ dimensions: 384 }),
    /** dataset | user_confirmed | coach_verified */
    labelSource: text().notNull(),
    brand: text(),
    contributedBy: uuid().references(() => profiles.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index().on(t.machineClassId),
    index().on(t.gymId),
    index("machine_ref_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ],
);

/** Etiquetas QR/NFC pegadas en máquinas concretas: identificación determinista. */
export const machineTags = pgTable("machine_tags", {
  code: text().primaryKey(),
  gymId: uuid()
    .notNull()
    .references(() => gyms.id, { onDelete: "cascade" }),
  machineClassId: uuid()
    .notNull()
    .references(() => machineClasses.id),
  label: text(),
  ...timestamps,
});

export const userGyms = pgTable(
  "user_gyms",
  {
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    gymId: uuid()
      .notNull()
      .references(() => gyms.id, { onDelete: "cascade" }),
    isPrimary: boolean().default(false).notNull(),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.userId, t.gymId] })],
);

export const programs = pgTable(
  "programs",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text(),
    athleteId: uuid().references(() => profiles.id, { onDelete: "cascade" }),
    authorId: uuid().references(() => profiles.id, { onDelete: "set null" }),
    /** coach | ai | template */
    origin: text().notNull(),
    isTemplate: boolean().default(false).notNull(),
    startsOn: date(),
    weeks: integer().notNull(),
    status: text().default("draft").notNull(), // draft | active | completed | archived
    ...timestamps,
  },
  (t) => [index().on(t.athleteId, t.status)],
);

export const plannedSessions = pgTable(
  "planned_sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    programId: uuid()
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    week: integer().notNull(),
    dayIndex: integer().notNull(),
    name: text().notNull(),
    estimatedMinutes: integer(),
    ...timestamps,
  },
  (t) => [index().on(t.programId, t.week, t.dayIndex)],
);

export const setTypeEnum = pgEnum("set_type", [
  "warmup",
  "working",
  "top",
  "backoff",
  "drop",
  "rest_pause",
  "myo",
  "amrap",
  "timed",
]);

export const plannedExercises = pgTable(
  "planned_exercises",
  {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: uuid()
      .notNull()
      .references(() => plannedSessions.id, { onDelete: "cascade" }),
    exerciseId: uuid()
      .notNull()
      .references(() => exercises.id),
    position: integer().notNull(),
    /** Ejercicios con el mismo grupo forman superserie o circuito. */
    groupKey: text(),
    restSeconds: integer(),
    notes: text(),
    /** Series: [{ type, reps, repsMax, rir, rpe, pct1rm, weightKg, durationS, distanceM }] */
    sets: jsonb().notNull(),
    ...timestamps,
  },
  (t) => [index().on(t.sessionId, t.position)],
);

export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    plannedSessionId: uuid().references(() => plannedSessions.id, { onDelete: "set null" }),
    gymId: uuid().references(() => gyms.id, { onDelete: "set null" }),
    startedAt: timestamp({ withTimezone: true }).notNull(),
    endedAt: timestamp({ withTimezone: true }),
    readinessScore: real(),
    sessionRpe: real(),
    enjoyment: integer(),
    notes: text(),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.startedAt)],
);

export const performedSets = pgTable(
  "performed_sets",
  {
    id: uuid().primaryKey().defaultRandom(),
    workoutSessionId: uuid()
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: uuid()
      .notNull()
      .references(() => exercises.id),
    machineClassId: uuid().references(() => machineClasses.id),
    /** manual | camera | qr */
    identifiedBy: text(),
    position: integer().notNull(),
    type: setTypeEnum().default("working").notNull(),
    weightKg: real(),
    reps: integer(),
    rir: real(),
    rpe: real(),
    durationSeconds: integer(),
    distanceMeters: real(),
    completedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    videoPath: text(),
  },
  (t) => [index().on(t.workoutSessionId), index().on(t.exerciseId, t.completedAt)],
);

export const personalRecords = pgTable(
  "personal_records",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    exerciseId: uuid()
      .notNull()
      .references(() => exercises.id),
    /** e1rm | reps_at_weight | weight_at_reps | volume */
    kind: text().notNull(),
    value: real().notNull(),
    setId: uuid().references(() => performedSets.id, { onDelete: "set null" }),
    achievedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (t) => [index().on(t.userId, t.exerciseId)],
);
