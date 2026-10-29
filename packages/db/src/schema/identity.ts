import {
  boolean,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const sexEnum = pgEnum("biological_sex", ["male", "female"]);
export const unitSystemEnum = pgEnum("unit_system", ["metric", "imperial"]);
export const goalEnum = pgEnum("goal", ["fat_loss", "muscle_gain", "recomposition", "maintenance", "performance"]);
export const experienceEnum = pgEnum("experience_level", ["beginner", "intermediate", "advanced"]);
export const tonePreferenceEnum = pgEnum("tone", ["close", "technical", "motivational"]);

/** Perfil 1:1 con auth.users de Supabase (mismo id). */
export const profiles = pgTable("profiles", {
  id: uuid().primaryKey(),
  fullName: text().notNull(),
  avatarUrl: text(),
  phone: text(),
  birthDate: date(),
  sex: sexEnum(),
  heightCm: real(),
  timezone: text().default("America/Bogota").notNull(),
  locale: text().default("es-CO").notNull(),
  bodyWeightUnit: unitSystemEnum().default("metric").notNull(),
  loadUnit: unitSystemEnum().default("metric").notNull(),
  isCoach: boolean().default(false).notNull(),
  onboardedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const athleteProfiles = pgTable("athlete_profiles", {
  userId: uuid()
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  primaryGoal: goalEnum(),
  secondaryGoal: goalEnum(),
  experience: experienceEnum(),
  trainingDaysPerWeek: real(),
  sessionMinutes: real(),
  disciplines: text().array().default([]).notNull(),
  trainingPlaces: text().array().default([]).notNull(),
  dietType: text(),
  allergies: text().array().default([]).notNull(),
  dislikedFoods: text().array().default([]).notNull(),
  nutritionMode: text().default("full").notNull(), // full | protein_kcal | habits
  pregnant: boolean().default(false).notNull(),
  postpartumUntil: date(),
  cycleTracking: boolean().default(false).notNull(),
  tone: tonePreferenceEnum().default("close").notNull(),
  emergencyContactName: text(),
  emergencyContactPhone: text(),
  /** Menores de edad: autorización del representante legal. */
  guardianName: text(),
  guardianConsentAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const organizations = pgTable("organizations", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  kind: text().notNull(), // coach | gym | team
  logoUrl: text(),
  brandColor: text(),
  nit: text(),
  ...timestamps,
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: text().notNull(), // owner | coach | staff
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.userId] })],
);

export const linkStatusEnum = pgEnum("coach_link_status", ["invited", "active", "paused", "ended"]);

/**
 * Vínculo entrenador-atleta. Los permisos son por categoría de dato y los
 * decide el atleta. Al terminar el vínculo el entrenador pierde todo acceso.
 */
export const coachAthleteLinks = pgTable(
  "coach_athlete_links",
  {
    id: uuid().primaryKey().defaultRandom(),
    coachId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    athleteId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    organizationId: uuid().references(() => organizations.id, { onDelete: "set null" }),
    status: linkStatusEnum().default("invited").notNull(),
    shareTraining: boolean().default(true).notNull(),
    shareNutrition: boolean().default(true).notNull(),
    shareBody: boolean().default(true).notNull(),
    sharePhotos: boolean().default(false).notNull(),
    shareWellbeing: boolean().default(true).notNull(),
    shareLocation: boolean().default(false).notNull(),
    startedAt: timestamp({ withTimezone: true }),
    endedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index().on(t.coachId, t.status),
    index().on(t.athleteId, t.status),
  ],
);

export const consents = pgTable(
  "consents",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    /** service | sensitive_health | coach_sharing | machine_photos_training | marketing | guardian */
    purpose: text().notNull(),
    policyVersion: text().notNull(),
    granted: boolean().notNull(),
    grantedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp({ withTimezone: true }),
    evidence: jsonb(), // ip, user agent, texto mostrado
  },
  (t) => [index().on(t.userId, t.purpose)],
);

export const medicalScreenings = pgTable("medical_screenings", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  kind: text().default("par_q_plus").notNull(),
  answers: jsonb().notNull(),
  requiresClearance: boolean().notNull(),
  clearanceProvidedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid().primaryKey().defaultRandom(),
    actorId: uuid().references(() => profiles.id, { onDelete: "set null" }),
    subjectUserId: uuid().references(() => profiles.id, { onDelete: "set null" }),
    action: text().notNull(),
    resource: text().notNull(),
    metadata: jsonb(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index().on(t.subjectUserId, t.createdAt)],
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid().primaryKey().defaultRandom(),
    coachId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    code: text().notNull(),
    email: text(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    acceptedBy: uuid().references(() => profiles.id),
    ...timestamps,
  },
  (t) => [uniqueIndex().on(t.code)],
);
