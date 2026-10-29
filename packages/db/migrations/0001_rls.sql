-- Seguridad por fila (Supabase). Regla general: el dueño ve y edita lo suyo;
-- el entrenador solo lee lo que el atleta compartió con un vínculo activo.
-- El servidor con service_role omite RLS y debe aplicar las mismas reglas.

CREATE OR REPLACE FUNCTION public.coach_can_see(athlete uuid, category text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM coach_athlete_links l
    WHERE l.athlete_id = athlete
      AND l.coach_id = auth.uid()
      AND l.status = 'active'
      AND CASE category
        WHEN 'training' THEN l.share_training
        WHEN 'nutrition' THEN l.share_nutrition
        WHEN 'body' THEN l.share_body
        WHEN 'photos' THEN l.share_photos
        WHEN 'wellbeing' THEN l.share_wellbeing
        WHEN 'location' THEN l.share_location
        WHEN 'profile' THEN true
        ELSE false
      END
  );
$$;
--> statement-breakpoint

-- Tablas propias del usuario con columna user_id, agrupadas por categoría.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('body_weights', 'body'),
    ('body_measurements', 'body'),
    ('body_compositions', 'body'),
    ('progress_photos', 'photos'),
    ('injuries', 'training'),
    ('wearable_daily_metrics', 'wellbeing'),
    ('workout_sessions', 'training'),
    ('personal_records', 'training'),
    ('meals', 'nutrition'),
    ('intake_logs', 'nutrition'),
    ('nutrition_targets', 'nutrition'),
    ('meal_plans', 'nutrition'),
    ('readiness_checks', 'wellbeing'),
    ('weekly_checkins', 'wellbeing'),
    ('questionnaire_responses', 'wellbeing'),
    ('cycle_logs', 'wellbeing'),
    ('weekly_reports', 'training'),
    ('medical_screenings', 'profile'),
    ('user_gyms', 'location')
  ) AS t(tbl, category)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tbl);
    EXECUTE format(
      'CREATE POLICY owner_all ON %I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      r.tbl);
    EXECUTE format(
      'CREATE POLICY coach_read ON %I FOR SELECT TO authenticated USING (public.coach_can_see(user_id, %L))',
      r.tbl, r.category);
  END LOOP;
END $$;
--> statement-breakpoint

-- El entrenador puede responder check-ins y fijar objetivos de nutrición.
CREATE POLICY coach_review ON weekly_checkins FOR UPDATE TO authenticated
  USING (public.coach_can_see(user_id, 'wellbeing'));
--> statement-breakpoint
CREATE POLICY coach_write ON nutrition_targets FOR INSERT TO authenticated
  WITH CHECK (public.coach_can_see(user_id, 'nutrition') AND set_by = auth.uid());
--> statement-breakpoint
CREATE POLICY coach_write ON meal_plans FOR INSERT TO authenticated
  WITH CHECK (public.coach_can_see(user_id, 'nutrition') AND author_id = auth.uid());
--> statement-breakpoint

-- Hijos de tablas propias: heredan el acceso del padre.
ALTER TABLE performed_sets ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY via_session ON performed_sets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM workout_sessions s WHERE s.id = workout_session_id
    AND (s.user_id = auth.uid() OR public.coach_can_see(s.user_id, 'training'))))
  WITH CHECK (EXISTS (SELECT 1 FROM workout_sessions s WHERE s.id = workout_session_id AND s.user_id = auth.uid()));
--> statement-breakpoint
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY via_meal ON meal_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM meals m WHERE m.id = meal_id
    AND (m.user_id = auth.uid() OR public.coach_can_see(m.user_id, 'nutrition'))))
  WITH CHECK (EXISTS (SELECT 1 FROM meals m WHERE m.id = meal_id AND m.user_id = auth.uid()));
--> statement-breakpoint

-- Perfiles.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY self ON profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
--> statement-breakpoint
CREATE POLICY coach_read ON profiles FOR SELECT TO authenticated USING (public.coach_can_see(id, 'profile'));
--> statement-breakpoint
CREATE POLICY athlete_reads_coach ON profiles FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM coach_athlete_links l WHERE l.coach_id = profiles.id AND l.athlete_id = auth.uid() AND l.status <> 'ended'));
--> statement-breakpoint
ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY self ON athlete_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY coach_read ON athlete_profiles FOR SELECT TO authenticated USING (public.coach_can_see(user_id, 'profile'));
--> statement-breakpoint

-- Vínculos: los ven ambas partes; solo el atleta cambia permisos o termina el vínculo.
ALTER TABLE coach_athlete_links ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY parties_read ON coach_athlete_links FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR athlete_id = auth.uid());
--> statement-breakpoint
CREATE POLICY athlete_update ON coach_athlete_links FOR UPDATE TO authenticated
  USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());
--> statement-breakpoint

-- Consentimientos y auditoría: solo el propio usuario lee; se escriben desde el servidor.
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY self_read ON consents FOR SELECT TO authenticated USING (user_id = auth.uid());
--> statement-breakpoint
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY subject_read ON audit_log FOR SELECT TO authenticated USING (subject_user_id = auth.uid());
--> statement-breakpoint

-- Programas: atleta y autor.
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY parties ON programs FOR ALL TO authenticated
  USING (athlete_id = auth.uid() OR author_id = auth.uid() OR public.coach_can_see(athlete_id, 'training'))
  WITH CHECK (author_id = auth.uid() OR (athlete_id = auth.uid() AND origin = 'ai'));
--> statement-breakpoint

-- Notas del entrenador: privadas, el atleta no las ve.
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY author_only ON coach_notes FOR ALL TO authenticated
  USING (coach_id = auth.uid() AND public.coach_can_see(athlete_id, 'profile'))
  WITH CHECK (coach_id = auth.uid() AND public.coach_can_see(athlete_id, 'profile'));
--> statement-breakpoint

-- Propuestas de la IA: las ve el atleta y las decide quien aprueba.
ALTER TABLE ai_proposals ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY parties_read ON ai_proposals FOR SELECT TO authenticated
  USING (athlete_id = auth.uid() OR approver_id = auth.uid());
--> statement-breakpoint
CREATE POLICY approver_decides ON ai_proposals FOR UPDATE TO authenticated
  USING (approver_id = auth.uid()) WITH CHECK (approver_id = auth.uid());
--> statement-breakpoint

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY parties ON alerts FOR SELECT TO authenticated
  USING (athlete_id = auth.uid() OR (coach_id = auth.uid() AND public.coach_can_see(athlete_id, 'profile')));
--> statement-breakpoint
CREATE POLICY coach_resolves ON alerts FOR UPDATE TO authenticated USING (coach_id = auth.uid());
--> statement-breakpoint

-- Mensajería: solo miembros de la conversación.
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY members ON conversations FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM conversation_members m WHERE m.conversation_id = id AND m.user_id = auth.uid()));
--> statement-breakpoint
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY self ON conversation_members FOR SELECT TO authenticated USING (user_id = auth.uid());
--> statement-breakpoint
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY members_read ON messages FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM conversation_members m WHERE m.conversation_id = messages.conversation_id AND m.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY members_write ON messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND EXISTS (
  SELECT 1 FROM conversation_members m WHERE m.conversation_id = messages.conversation_id AND m.user_id = auth.uid()));
--> statement-breakpoint

-- Catálogos: lectura para todos los autenticados; escritura solo desde el servidor.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['machine_classes', 'machine_class_exercises', 'gyms', 'machine_tags', 'food_portions', 'plans']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY catalog_read ON %I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
END $$;
--> statement-breakpoint

-- Catálogos con entradas privadas de usuario.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['exercises', 'foods', 'recipes']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY read ON %I FOR SELECT TO authenticated USING (owner_id IS NULL OR owner_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY own_write ON %I FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())', t);
  END LOOP;
END $$;
--> statement-breakpoint

-- Solo servidor (sin políticas = sin acceso para clientes).
ALTER TABLE machine_reference_images ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY self_read ON subscriptions FOR SELECT TO authenticated USING (payer_id = auth.uid());
--> statement-breakpoint
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY parties_read ON payments FOR SELECT TO authenticated USING (payer_id = auth.uid() OR payee_coach_id = auth.uid());
--> statement-breakpoint

-- Programación (hijos de programs) y agenda.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['planned_sessions', 'planned_exercises', 'checkin_templates', 'appointments', 'appointment_attendees']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
--> statement-breakpoint
CREATE POLICY via_program ON planned_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM programs p WHERE p.id = program_id
    AND (p.athlete_id = auth.uid() OR p.author_id = auth.uid() OR public.coach_can_see(p.athlete_id, 'training'))))
  WITH CHECK (EXISTS (SELECT 1 FROM programs p WHERE p.id = program_id AND p.author_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY via_session ON planned_exercises FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM planned_sessions s JOIN programs p ON p.id = s.program_id WHERE s.id = session_id
    AND (p.athlete_id = auth.uid() OR p.author_id = auth.uid() OR public.coach_can_see(p.athlete_id, 'training'))))
  WITH CHECK (EXISTS (SELECT 1 FROM planned_sessions s JOIN programs p ON p.id = s.program_id WHERE s.id = session_id AND p.author_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY coach_own ON checkin_templates FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
--> statement-breakpoint
CREATE POLICY coach_own ON appointments FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
--> statement-breakpoint
CREATE POLICY athlete_sees_booked ON appointments FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM appointment_attendees a WHERE a.appointment_id = id AND a.athlete_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY parties ON appointment_attendees FOR SELECT TO authenticated USING (athlete_id = auth.uid() OR EXISTS (
  SELECT 1 FROM appointments ap WHERE ap.id = appointment_id AND ap.coach_id = auth.uid()));
