"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateProgram } from "@gym/core";
import { athleteProfiles, medicalScreenings, plannedExercises, plannedSessions, profiles, programs } from "@gym/db/schema";
import { asViewer } from "@/lib/auth";
import { ageOn, GOALS } from "@/lib/onboarding";
import { hasConsent } from "@/lib/privacy";
import { getProgramCatalog } from "@/lib/programs";

const programRequest = z.object({
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(20).max(180),
  place: z.enum(["gym", "home"]),
});

export type CreateProgramResult = { ok: true } | { ok: false; error: string };

/** Arma un bloque nuevo con reglas fijas. El anterior queda archivado, con su historial. */
export async function createProgram(input: unknown): Promise<CreateProgramResult> {
  const parsed = programRequest.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos." };
  const request = parsed.data;

  // Los datos de salud solo cuentan si su autorización sigue vigente.
  const [healthAllowed, catalog] = await Promise.all([hasConsent("sensitive_health"), getProgramCatalog()]);

  return asViewer(async (tx, viewer) => {
    const [row] = await tx
      .select({ birthDate: profiles.birthDate, goal: athleteProfiles.primaryGoal, experience: athleteProfiles.experience, pregnant: athleteProfiles.pregnant })
      .from(profiles)
      .leftJoin(athleteProfiles, eq(athleteProfiles.userId, profiles.id))
      .where(eq(profiles.id, viewer.id));
    if (!row) return { ok: false, error: "No encontramos tu perfil." };

    const [screening] = healthAllowed
      ? await tx
          .select({ requiresClearance: medicalScreenings.requiresClearance })
          .from(medicalScreenings)
          .where(eq(medicalScreenings.userId, viewer.id))
          .orderBy(desc(medicalScreenings.createdAt))
          .limit(1)
      : [];
    const needsClearance = Boolean(screening?.requiresClearance);
    const pregnant = healthAllowed && Boolean(row.pregnant);
    const minor = row.birthDate ? ageOn(row.birthDate) < 18 : false;

    const goal = row.goal ?? "recomposition";
    const draft = generateProgram({
      goal,
      experience: row.experience ?? "beginner",
      daysPerWeek: request.daysPerWeek,
      sessionMinutes: request.sessionMinutes,
      place: request.place,
      conservative: minor || needsClearance || pregnant,
      catalog,
    });

    const notes = [...draft.notes];
    if (needsClearance) notes.push("Por tus respuestas al PAR-Q+ va con cargas suaves y lejos del fallo. Te recomendamos una valoración médica antes de subir la intensidad.");
    if (pregnant) notes.push("Va con cargas suaves por tu embarazo. Confirma con tu médico antes de empezar y ajusta cualquier ejercicio que te incomode.");
    if (minor) notes.push("Va con cargas moderadas y prioriza aprender bien la técnica.");

    await tx
      .update(programs)
      .set({ status: "archived" })
      .where(and(eq(programs.athleteId, viewer.id), eq(programs.authorId, viewer.id), eq(programs.status, "active")));

    const goalLabel = GOALS.find((g) => g.value === goal)?.label.toLowerCase() ?? goal;
    const [program] = await tx
      .insert(programs)
      .values({
        name: `Bloque de ${draft.weeks} semanas: ${goalLabel}`,
        description: notes.join(" ") || null,
        athleteId: viewer.id,
        authorId: viewer.id,
        origin: "template",
        weeks: draft.weeks,
        status: "active",
      })
      .returning({ id: programs.id });

    const sessions = await tx
      .insert(plannedSessions)
      .values(
        draft.sessions.map((s) => ({
          programId: program!.id,
          week: s.week,
          dayIndex: s.dayIndex,
          name: s.name,
          estimatedMinutes: s.estimatedMinutes,
        })),
      )
      .returning({ id: plannedSessions.id });
    await tx.insert(plannedExercises).values(
      draft.sessions.flatMap((s, i) =>
        s.exercises.map((e) => ({
          sessionId: sessions[i]!.id,
          exerciseId: e.exerciseId,
          position: e.position,
          restSeconds: e.restSeconds,
          sets: e.sets,
        })),
      ),
    );

    await tx
      .update(athleteProfiles)
      .set({ trainingDaysPerWeek: request.daysPerWeek, sessionMinutes: request.sessionMinutes, trainingPlaces: [request.place] })
      .where(eq(athleteProfiles.userId, viewer.id));

    revalidatePath("/", "layout");
    return { ok: true };
  });
}
