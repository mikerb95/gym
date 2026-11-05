ALTER TABLE "invitations" DROP CONSTRAINT "invitations_accepted_by_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "body_measurements" DROP CONSTRAINT "body_measurements_measured_by_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "meal_plans" DROP CONSTRAINT "meal_plans_author_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "nutrition_targets" DROP CONSTRAINT "nutrition_targets_set_by_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "weekly_checkins" DROP CONSTRAINT "weekly_checkins_reviewed_by_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_payer_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_payee_coach_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_profiles_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_measured_by_profiles_id_fk" FOREIGN KEY ("measured_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_targets" ADD CONSTRAINT "nutrition_targets_set_by_profiles_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_checkins" ADD CONSTRAINT "weekly_checkins_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_id_profiles_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payee_coach_id_profiles_id_fk" FOREIGN KEY ("payee_coach_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;