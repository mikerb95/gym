-- Custom SQL migration file, put your code below! ---- Cada perfil pertenece a un usuario de Supabase Auth. Al borrar el usuario se
-- borra el perfil, y un JWT todavía vigente de una cuenta eliminada no puede
-- volver a crear el perfil desde otro dispositivo.
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_auth_users_fk FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
--> statement-breakpoint

-- Lectura propia de tablas que hasta ahora solo veía el servidor, para que la
-- descarga de datos (Ley 1581, art. 8) pase también por RLS.
CREATE POLICY self_read ON organization_members FOR SELECT TO authenticated USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY coach_read ON invitations FOR SELECT TO authenticated USING (coach_id = auth.uid());
--> statement-breakpoint
CREATE POLICY self_read ON ai_usage FOR SELECT TO authenticated USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY contributor_read ON machine_reference_images FOR SELECT TO authenticated USING (contributed_by = auth.uid());
--> statement-breakpoint

-- Agenda: las políticas de appointments y appointment_attendees se consultaban
-- entre sí (recursión infinita), y "a.appointment_id = id" comparaba contra el id
-- del asistente. Las funciones SECURITY DEFINER rompen el ciclo.
CREATE OR REPLACE FUNCTION public.is_booked_on(appointment uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM appointment_attendees a WHERE a.appointment_id = appointment AND a.athlete_id = auth.uid());
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.owns_appointment(appointment uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM appointments ap WHERE ap.id = appointment AND ap.coach_id = auth.uid());
$$;
--> statement-breakpoint
DROP POLICY athlete_sees_booked ON appointments;
--> statement-breakpoint
CREATE POLICY athlete_sees_booked ON appointments FOR SELECT TO authenticated USING (public.is_booked_on(id));
--> statement-breakpoint
DROP POLICY parties ON appointment_attendees;
--> statement-breakpoint
CREATE POLICY parties ON appointment_attendees FOR SELECT TO authenticated
  USING (athlete_id = auth.uid() OR public.owns_appointment(appointment_id));
