import { sql, type SQL } from "drizzle-orm";

type Executor = { execute: (query: SQL) => PromiseLike<unknown> };

/**
 * Todo lo que la descarga de datos entrega al titular (Ley 1581, art. 8). Cada
 * consulta corre con RLS como el propio usuario. Una prueba exige que toda
 * tabla ligada a un perfil esté aquí o en EXPORT_EXCLUDED: una tabla nueva no
 * puede quedar fuera por olvido.
 */
export const EXPORT_QUERIES: Record<string, string> = {
  profiles: "select * from profiles where id = auth.uid()",
  athlete_profiles: "select * from athlete_profiles where user_id = auth.uid()",
  consents: "select * from consents where user_id = auth.uid()",
  medical_screenings: "select * from medical_screenings where user_id = auth.uid()",
  audit_log: "select * from audit_log where subject_user_id = auth.uid()",
  coach_athlete_links: "select * from coach_athlete_links where athlete_id = auth.uid() or coach_id = auth.uid()",
  organization_members: "select * from organization_members where user_id = auth.uid()",
  invitations: "select * from invitations where coach_id = auth.uid()",
  body_weights: "select * from body_weights where user_id = auth.uid()",
  body_measurements: "select * from body_measurements where user_id = auth.uid()",
  body_compositions: "select * from body_compositions where user_id = auth.uid()",
  progress_photos: "select * from progress_photos where user_id = auth.uid()",
  injuries: "select * from injuries where user_id = auth.uid()",
  wearable_daily_metrics: "select * from wearable_daily_metrics where user_id = auth.uid()",
  exercises: "select * from exercises where owner_id = auth.uid()",
  user_gyms: "select * from user_gyms where user_id = auth.uid()",
  machine_reference_images: "select * from machine_reference_images where contributed_by = auth.uid()",
  programs: "select * from programs where athlete_id = auth.uid() or author_id = auth.uid()",
  planned_sessions:
    "select s.* from planned_sessions s join programs p on p.id = s.program_id where p.athlete_id = auth.uid() or p.author_id = auth.uid()",
  planned_exercises:
    "select e.* from planned_exercises e join planned_sessions s on s.id = e.session_id join programs p on p.id = s.program_id where p.athlete_id = auth.uid() or p.author_id = auth.uid()",
  workout_sessions: "select * from workout_sessions where user_id = auth.uid()",
  performed_sets:
    "select ps.* from performed_sets ps join workout_sessions w on w.id = ps.workout_session_id where w.user_id = auth.uid()",
  personal_records: "select * from personal_records where user_id = auth.uid()",
  foods: "select * from foods where owner_id = auth.uid()",
  recipes: "select * from recipes where owner_id = auth.uid()",
  meals: "select * from meals where user_id = auth.uid()",
  meal_items: "select i.* from meal_items i join meals m on m.id = i.meal_id where m.user_id = auth.uid()",
  nutrition_targets: "select * from nutrition_targets where user_id = auth.uid()",
  meal_plans: "select * from meal_plans where user_id = auth.uid()",
  intake_logs: "select * from intake_logs where user_id = auth.uid()",
  readiness_checks: "select * from readiness_checks where user_id = auth.uid()",
  weekly_checkins: "select * from weekly_checkins where user_id = auth.uid()",
  questionnaire_responses: "select * from questionnaire_responses where user_id = auth.uid()",
  cycle_logs: "select * from cycle_logs where user_id = auth.uid()",
  alerts: "select * from alerts where athlete_id = auth.uid()",
  ai_proposals: "select * from ai_proposals where athlete_id = auth.uid()",
  weekly_reports: "select * from weekly_reports where user_id = auth.uid()",
  coach_notes: "select * from coach_notes where coach_id = auth.uid()",
  conversation_members: "select * from conversation_members where user_id = auth.uid()",
  messages: "select * from messages where sender_id = auth.uid()",
  appointments: "select * from appointments where coach_id = auth.uid()",
  appointment_attendees: "select * from appointment_attendees where athlete_id = auth.uid()",
  checkin_templates: "select * from checkin_templates where coach_id = auth.uid()",
  plans: "select * from plans where coach_id = auth.uid()",
  subscriptions: "select * from subscriptions where payer_id = auth.uid()",
  payments: "select * from payments where payer_id = auth.uid() or payee_coach_id = auth.uid()",
  ai_usage: "select * from ai_usage where user_id = auth.uid()",
};

/** Tablas que no se descargan, con el motivo. */
export const EXPORT_EXCLUDED: Record<string, string> = {
  organizations: "datos de la organización, no del titular; la membresía sí se entrega",
  conversations: "solo agrupa mensajes; los mensajes propios y la membresía sí se entregan",
  food_portions: "catálogo de porciones por alimento",
  gyms: "catálogo",
  machine_classes: "catálogo",
  machine_class_exercises: "catálogo",
  machine_tags: "catálogo",
};

/** Lee todos los datos del usuario. Debe correr dentro de withRls. */
export async function exportUserData(tx: Executor) {
  const data: Record<string, unknown> = {};
  for (const [table, query] of Object.entries(EXPORT_QUERIES)) {
    data[table] = await tx.execute(sql.raw(query));
  }
  return data;
}

/** Tablas borradas al revocar la autorización de datos de salud, si el titular también pide suprimirlos. */
export const HEALTH_DATA_TABLES = [
  "body_weights",
  "body_measurements",
  "body_compositions",
  "injuries",
  "wearable_daily_metrics",
  "readiness_checks",
  "weekly_checkins",
  "questionnaire_responses",
  "cycle_logs",
  "medical_screenings",
] as const;

/** Suprime los datos de salud del usuario. Las fotos de progreso se suman cuando exista su almacenamiento. */
export async function deleteHealthData(tx: Executor, userId: string) {
  for (const table of HEALTH_DATA_TABLES) {
    await tx.execute(sql`delete from ${sql.identifier(table)} where user_id = ${userId}`);
  }
  await tx.execute(sql`update profiles set height_cm = null where id = ${userId}`);
  await tx.execute(sql`update athlete_profiles set pregnant = false, postpartum_until = null, cycle_tracking = false where user_id = ${userId}`);
}

/**
 * Borra la cuenta de verdad: el usuario de Supabase Auth, y por cascada el
 * perfil y sus datos. Corre con la conexión del servidor. Los mensajes se borran
 * aparte porque su cascada solo deja al remitente en blanco. Los pagos quedan
 * sin titular por obligación contable, y la auditoría guarda el hecho sin
 * identificar a la persona.
 */
export async function deleteUserAccount(tx: Executor, userId: string) {
  await tx.execute(sql`delete from messages where sender_id = ${userId}`);
  await tx.execute(sql`delete from auth.users where id = ${userId}`);
  await tx.execute(sql`insert into audit_log (action, resource) values ('account.deleted', 'profile')`);
}
