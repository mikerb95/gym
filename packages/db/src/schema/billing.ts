import { index, integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations, profiles, timestamps } from "./identity";

/** Planes de la plataforma (atleta, entrenador, gym) y paquetes que vende un entrenador. */
export const plans = pgTable("plans", {
  id: uuid().primaryKey().defaultRandom(),
  /** platform_athlete | platform_coach | platform_gym | coach_package */
  kind: text().notNull(),
  coachId: uuid().references(() => profiles.id, { onDelete: "cascade" }),
  name: text().notNull(),
  priceCop: integer().notNull(),
  interval: text().default("month").notNull(),
  features: jsonb(),
  ...timestamps,
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    planId: uuid()
      .notNull()
      .references(() => plans.id),
    payerId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    organizationId: uuid().references(() => organizations.id, { onDelete: "cascade" }),
    /** wompi | mercadopago | play_billing */
    provider: text().notNull(),
    providerRef: text(),
    status: text().notNull(), // active | past_due | cancelled
    currentPeriodEnd: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.payerId, t.status)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    subscriptionId: uuid().references(() => subscriptions.id, { onDelete: "set null" }),
    payerId: uuid()
      .notNull()
      .references(() => profiles.id),
    payeeCoachId: uuid().references(() => profiles.id),
    amountCop: integer().notNull(),
    platformFeeCop: integer().default(0).notNull(),
    /** pse | nequi | card | daviplata */
    method: text(),
    provider: text().notNull(),
    providerRef: text().notNull(),
    status: text().notNull(),
    /** Factura electrónica DIAN (CUFE y PDF) del proveedor de facturación. */
    dianCufe: text(),
    invoiceUrl: text(),
    paidAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.payerId), index().on(t.payeeCoachId)],
);

/** Consumo de IA por usuario para aplicar topes por plan. */
export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().references(() => profiles.id, { onDelete: "set null" }),
    feature: text().notNull(),
    model: text().notNull(),
    inputTokens: integer().notNull(),
    outputTokens: integer().notNull(),
    costUsd: real().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index().on(t.userId, t.createdAt)],
);
