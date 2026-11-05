import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft, Check } from "lucide-react";
import { athleteProfiles } from "@gym/db/schema";
import { PageHeader, Section } from "@/components/ui";
import { asViewer } from "@/lib/auth";
import { getProgramOverview, type SessionSummary } from "@/lib/programs";
import { ProgramForm } from "./program-form";

export const metadata: Metadata = { title: "Tu programa" };

export default async function ProgramPage() {
  const [program, [athlete]] = await Promise.all([
    getProgramOverview(),
    asViewer((tx, viewer) =>
      tx
        .select({ days: athleteProfiles.trainingDaysPerWeek, minutes: athleteProfiles.sessionMinutes, places: athleteProfiles.trainingPlaces })
        .from(athleteProfiles)
        .where(eq(athleteProfiles.userId, viewer.id)),
    ),
  ]);
  const defaults = {
    daysPerWeek: athlete?.days ?? 3,
    sessionMinutes: athlete?.minutes ?? 60,
    place: athlete?.places.includes("home") ? ("home" as const) : ("gym" as const),
  };
  const weeks = program ? Array.from({ length: program.weeks }, (_, i) => i + 1) : [];

  return (
    <>
      <Link href="/entrenar" className="mb-4 inline-flex min-h-11 items-center gap-1.5 font-medium text-muted">
        <ArrowLeft aria-hidden size={18} />
        Entrenar
      </Link>
      <PageHeader
        title={program?.name ?? "Tu programa"}
        lead={program?.description ?? "Armamos un bloque de 4 semanas con tu objetivo y tu experiencia. Las sesiones van en orden: si faltas un día, sigues donde ibas."}
      />

      {program ? (
        <>
          {weeks.map((week) => (
            <Section key={week} title={`Semana ${week}${week === program.weeks ? ", de descarga" : ""}`}>
              <ul className="divide-y divide-line rounded-2xl bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
                {program.sessions
                  .filter((s) => s.week === week)
                  .map((s) => (
                    <SessionRow key={s.id} session={s} isNext={program.next?.id === s.id} />
                  ))}
              </ul>
            </Section>
          ))}
          <Section title="¿Cambió algo?">
            <ProgramForm defaults={defaults} replacing />
          </Section>
        </>
      ) : (
        <ProgramForm defaults={defaults} replacing={false} />
      )}
    </>
  );
}

function SessionRow({ session, isNext }: { session: SessionSummary; isNext: boolean }) {
  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{session.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{session.exercises.join(", ")}</p>
          {session.estimatedMinutes ? <p className="mt-1 text-sm text-muted">Unos {session.estimatedMinutes} minutos</p> : null}
        </div>
        {session.done ? (
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-ok">
            <Check aria-hidden size={16} />
            Hecha
          </span>
        ) : isNext ? (
          <Link href={`/entrenar/sesion?plan=${session.id}`} className="shrink-0 font-semibold text-cobalt">
            Empezar
          </Link>
        ) : null}
      </div>
    </li>
  );
}
