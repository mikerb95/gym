"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { withRls } from "@gym/db";
import { athleteProfiles, auditLog, bodyWeights, consents, medicalScreenings, profiles } from "@gym/db/schema";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { LEGAL } from "@/lib/legal";
import { ageOn, CONSENTS, onboardingSchema, PARQ_QUESTIONS, type ConsentPurpose } from "@/lib/onboarding";

export type OnboardingResult = { ok: false; errors: Record<string, string> } | undefined;

/** Fecha de hoy en Bogotá, en formato AAAA-MM-DD. */
function todayInBogota() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export async function completeOnboarding(input: unknown): Promise<OnboardingResult> {
  const viewer = await getViewer();
  if (!viewer) redirect("/ingresar");

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join(".")] ??= issue.message;
    return { ok: false, errors };
  }

  const v = parsed.data;
  const minor = ageOn(v.birthDate) < 18;
  const requiresClearance = PARQ_QUESTIONS.some((q) => v.parq[q.id]);
  const now = new Date();
  const h = await headers();
  const evidence = {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
    email: viewer.email,
  };

  // Datos del usuario: con RLS, como el propio usuario.
  await withRls(db, viewer.claims, async (tx) => {
    const profile = {
      fullName: v.fullName,
      birthDate: v.birthDate,
      sex: v.sex,
      heightCm: v.heightCm,
    };
    await tx
      .insert(profiles)
      .values({ id: viewer.id, ...profile })
      .onConflictDoUpdate({ target: profiles.id, set: profile });

    const athlete = {
      primaryGoal: v.goal,
      experience: v.experience,
      trainingDaysPerWeek: v.trainingDaysPerWeek,
      sessionMinutes: v.sessionMinutes,
      pregnant: v.sex === "female" && v.pregnant,
      emergencyContactName: v.emergencyContactName || null,
      emergencyContactPhone: v.emergencyContactPhone || null,
      guardianName: minor ? v.guardianName : null,
      guardianConsentAt: minor ? now : null,
    };
    await tx
      .insert(athleteProfiles)
      .values({ userId: viewer.id, ...athlete })
      .onConflictDoUpdate({ target: athleteProfiles.userId, set: athlete });

    await tx.insert(bodyWeights).values({ userId: viewer.id, measuredOn: todayInBogota(), weightKg: v.weightKg });
    await tx.insert(medicalScreenings).values({ userId: viewer.id, answers: v.parq, requiresClearance });
  });

  // Consentimientos y auditoría: solo los escribe el servidor, con la evidencia.
  const purposes = (Object.keys(CONSENTS) as ConsentPurpose[]).filter((p) => p !== "guardian" || minor);
  await db.transaction(async (tx) => {
    await tx.insert(consents).values(
      purposes.map((purpose) => ({
        userId: viewer.id,
        purpose,
        policyVersion: LEGAL.policyVersion,
        granted: v.consents[purpose],
        evidence: { ...evidence, text: CONSENTS[purpose].text, ...(purpose === "guardian" ? { guardianName: v.guardianName } : {}) },
      })),
    );
    await tx.insert(auditLog).values({
      actorId: viewer.id,
      subjectUserId: viewer.id,
      action: "onboarding.completed",
      resource: "profile",
      metadata: { requiresClearance, minor, policyVersion: LEGAL.policyVersion },
    });
  });

  await withRls(db, viewer.claims, (tx) => tx.update(profiles).set({ onboardedAt: now }).where(eq(profiles.id, viewer.id)));

  redirect("/");
}
