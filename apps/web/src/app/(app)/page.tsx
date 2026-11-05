import Link from "next/link";
import { Play } from "lucide-react";
import { ReadinessCheck } from "@/components/readiness-check";
import { buttonPrimary, buttonQuiet, EmptyState, PageHeader, Section } from "@/components/ui";
import { getProgramOverview } from "@/lib/programs";

export default async function TodayPage() {
  const program = await getProgramOverview();
  const next = program?.next ?? null;
  return (
    <>
      <PageHeader title="Hoy" lead="Antes de entrenar, cuéntanos cómo llegas. Con eso ajustamos la sesión." />

      <Section title="¿Cómo llegas hoy?">
        <ReadinessCheck />
      </Section>

      <Section title="Tu sesión">
        {next ? (
          <div className="rounded-2xl bg-surface p-5 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-7">
            <p className="text-sm text-muted">
              Semana {next.week} de {program!.weeks}, unos {next.estimatedMinutes} minutos
            </p>
            <p className="heading mt-1 text-xl">{next.name}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{next.exercises.join(", ")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/entrenar/sesion?plan=${next.id}`} className={buttonPrimary}>
                <Play aria-hidden size={18} fill="currentColor" />
                Empezar
              </Link>
              <Link href="/entrenar/programa" className={buttonQuiet}>
                Ver programa
              </Link>
            </div>
          </div>
        ) : program ? (
          <EmptyState
            title="Terminaste tu bloque"
            action={
              <Link href="/entrenar/programa" className={buttonPrimary}>
                Armar el siguiente
              </Link>
            }
          >
            Completaste todas las sesiones. Arma el siguiente bloque para seguir progresando.
          </EmptyState>
        ) : (
          <EmptyState
            title="Todavía no tienes programa"
            action={
              <Link href="/entrenar/programa" className={buttonPrimary}>
                Armar mi programa
              </Link>
            }
          >
            Con tu objetivo, tu experiencia y los días que puedes entrenar armamos tu primer bloque de 4 semanas. Si
            tienes entrenador, te lo asigna desde su panel.
          </EmptyState>
        )}
      </Section>
    </>
  );
}
