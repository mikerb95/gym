import Link from "next/link";
import { ReadinessCheck } from "@/components/readiness-check";
import { buttonPrimary, EmptyState, PageHeader, Section } from "@/components/ui";

export default function TodayPage() {
  return (
    <>
      <PageHeader title="Hoy" lead="Antes de entrenar, cuéntanos cómo llegas. Con eso ajustamos la sesión." />

      <Section title="¿Cómo llegas hoy?">
        <ReadinessCheck />
      </Section>

      <Section title="Tu sesión">
        <EmptyState
          title="Todavía no tienes programa"
          action={
            <Link href="/perfil" className={buttonPrimary}>
              Completar mi perfil
            </Link>
          }
        >
          Con tu objetivo, tu experiencia y los días que puedes entrenar armamos tu primer bloque de 4 semanas. Si
          tienes entrenador, te lo asigna desde su panel.
        </EmptyState>
      </Section>
    </>
  );
}
