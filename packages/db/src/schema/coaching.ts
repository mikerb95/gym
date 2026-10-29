import { boolean, date, index, integer, jsonb, pgEnum, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations, profiles, timestamps } from "./identity";
import { gyms } from "./training";

const owner = () =>
  uuid()
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" });

export const readinessChecks = pgTable(
  "readiness_checks",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    day: date().notNull(),
    answers: jsonb().notNull(),
    score: real().notNull(),
    adjustment: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index().on(t.userId, t.day)],
);

export const checkinTemplates = pgTable("checkin_templates", {
  id: uuid().primaryKey().defaultRandom(),
  coachId: owner(),
  name: text().notNull(),
  /** [{ id, kind: scale|text|number|photo|choice, label, options }] */
  questions: jsonb().notNull(),
  ...timestamps,
});

export const weeklyCheckins = pgTable(
  "weekly_checkins",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    weekStart: date().notNull(),
    templateId: uuid().references(() => checkinTemplates.id, { onDelete: "set null" }),
    answers: jsonb().notNull(),
    reviewedBy: uuid().references(() => profiles.id),
    reviewedAt: timestamp({ withTimezone: true }),
    coachReply: text(),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.weekStart)],
);

/** Cuestionarios validados (estrés, bienestar) aplicados periódicamente. */
export const questionnaireResponses = pgTable(
  "questionnaire_responses",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    instrument: text().notNull(),
    answers: jsonb().notNull(),
    score: real().notNull(),
    band: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index().on(t.userId, t.instrument)],
);

export const cycleLogs = pgTable(
  "cycle_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    day: date().notNull(),
    phase: text(),
    flow: text(),
    symptoms: text().array().default([]).notNull(),
  },
  (t) => [index().on(t.userId, t.day)],
);

export const alertSeverityEnum = pgEnum("alert_severity", ["info", "warning", "critical"]);

/** Alertas para el entrenador y banderas rojas de seguridad. */
export const alerts = pgTable(
  "alerts",
  {
    id: uuid().primaryKey().defaultRandom(),
    athleteId: owner(),
    coachId: uuid().references(() => profiles.id, { onDelete: "cascade" }),
    kind: text().notNull(),
    severity: alertSeverityEnum().notNull(),
    title: text().notNull(),
    detail: text(),
    suggestedAction: text(),
    draftMessage: text(),
    resolvedAt: timestamp({ withTimezone: true }),
    emergencyContactNotifiedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.coachId, t.resolvedAt), index().on(t.athleteId)],
);

export const proposalStatusEnum = pgEnum("proposal_status", ["pending", "accepted", "rejected", "expired"]);

/**
 * Cambios propuestos por la IA. Sin entrenador decide el atleta; con
 * entrenador decide el entrenador y el atleta sigue el plan original.
 */
export const aiProposals = pgTable(
  "ai_proposals",
  {
    id: uuid().primaryKey().defaultRandom(),
    athleteId: owner(),
    approverId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: text().notNull(),
    targetTable: text().notNull(),
    targetId: uuid(),
    before: jsonb(),
    after: jsonb().notNull(),
    reasons: text().array().notNull(),
    status: proposalStatusEnum().default("pending").notNull(),
    decidedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.approverId, t.status)],
);

export const weeklyReports = pgTable(
  "weekly_reports",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: owner(),
    weekStart: date().notNull(),
    metrics: jsonb().notNull(),
    summary: text().notNull(),
    actions: text().array().notNull(),
    approvedByCoach: boolean(),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.weekStart)],
);

export const conversations = pgTable("conversations", {
  id: uuid().primaryKey().defaultRandom(),
  /** direct | group | announcement | ai_coach */
  kind: text().notNull(),
  title: text(),
  organizationId: uuid().references(() => organizations.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const conversationMembers = pgTable(
  "conversation_members",
  {
    conversationId: uuid()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: owner(),
    lastReadAt: timestamp({ withTimezone: true }),
  },
  (t) => [index().on(t.userId), index().on(t.conversationId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid().primaryKey().defaultRandom(),
    conversationId: uuid()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid().references(() => profiles.id, { onDelete: "set null" }),
    body: text(),
    attachments: jsonb(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index().on(t.conversationId, t.createdAt)],
);

export const coachNotes = pgTable("coach_notes", {
  id: uuid().primaryKey().defaultRandom(),
  coachId: owner(),
  athleteId: uuid()
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  body: text().notNull(),
  ...timestamps,
});

/** Agenda: sesiones presenciales y clases grupales. */
export const appointments = pgTable(
  "appointments",
  {
    id: uuid().primaryKey().defaultRandom(),
    coachId: owner(),
    gymId: uuid().references(() => gyms.id, { onDelete: "set null" }),
    title: text().notNull(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    capacity: integer().default(1).notNull(),
    ...timestamps,
  },
  (t) => [index().on(t.coachId, t.startsAt)],
);

export const appointmentAttendees = pgTable("appointment_attendees", {
  id: uuid().primaryKey().defaultRandom(),
  appointmentId: uuid()
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  athleteId: owner(),
  status: text().default("booked").notNull(), // booked | attended | no_show | cancelled
});
