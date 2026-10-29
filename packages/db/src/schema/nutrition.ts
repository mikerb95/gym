import { date, index, integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles, timestamps } from "./identity";

export const foods = pgTable(
  "foods",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    brand: text(),
    barcode: text(),
    /** icbf | usda | off | curated | user */
    source: text().notNull(),
    sourceRef: text(),
    /** Valores por 100 g: kcal, proteinG, carbsG, fatG, fiberG, ... y micronutrientes. */
    per100g: jsonb().notNull(),
    verified: integer().default(0).notNull(),
    ownerId: uuid().references(() => profiles.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index().on(t.barcode), index().on(t.source)],
);

/** Porciones caseras: "1 arepa mediana", "1 taza", "1 cucharada". */
export const foodPortions = pgTable("food_portions", {
  id: uuid().primaryKey().defaultRandom(),
  foodId: uuid()
    .notNull()
    .references(() => foods.id, { onDelete: "cascade" }),
  label: text().notNull(),
  grams: real().notNull(),
});

export const recipes = pgTable("recipes", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  ownerId: uuid().references(() => profiles.id, { onDelete: "cascade" }),
  servings: real().default(1).notNull(),
  /** [{ foodId, grams }] */
  ingredients: jsonb().notNull(),
  instructions: text(),
  estimatedCostCop: integer(),
  ...timestamps,
});

export const meals = pgTable(
  "meals",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    eatenAt: timestamp({ withTimezone: true }).notNull(),
    slot: text(), // breakfast | lunch | dinner | snack
    /** photo | barcode | label_ocr | search | voice | saved | plan */
    loggedVia: text().notNull(),
    photoPath: text(),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.eatenAt)],
);

export const mealItems = pgTable(
  "meal_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    mealId: uuid()
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    foodId: uuid()
      .notNull()
      .references(() => foods.id),
    grams: real().notNull(),
    /** Confianza de la estimación por foto (0-1); nulo si lo pesó o buscó el usuario. */
    estimateConfidence: real(),
  },
  (t) => [index().on(t.mealId)],
);

export const nutritionTargets = pgTable(
  "nutrition_targets",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    effectiveFrom: date().notNull(),
    kcal: integer().notNull(),
    proteinG: integer().notNull(),
    carbsG: integer().notNull(),
    fatG: integer().notNull(),
    fiberG: integer(),
    /** Ventana de ayuno intermitente, p. ej. { start: "12:00", end: "20:00" }. */
    eatingWindow: jsonb(),
    setBy: uuid().references(() => profiles.id),
    ...timestamps,
  },
  (t) => [index().on(t.userId, t.effectiveFrom)],
);

export const mealPlans = pgTable("meal_plans", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  authorId: uuid().references(() => profiles.id),
  name: text().notNull(),
  startsOn: date().notNull(),
  /** [{ day, slot, recipeId | foodId, grams }] */
  days: jsonb().notNull(),
  shoppingList: jsonb(),
  estimatedWeeklyCostCop: integer(),
  ...timestamps,
});

export const intakeLogs = pgTable(
  "intake_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    /** water | supplement | caffeine | alcohol */
    kind: text().notNull(),
    name: text(),
    amount: real().notNull(),
    unit: text().notNull(),
    loggedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index().on(t.userId, t.loggedAt)],
);
