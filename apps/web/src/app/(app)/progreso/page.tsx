import type { Metadata } from "next";
import { EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Progreso" };

export default function ProgressPage() {
  return (
    <>
      <PageHeader title="Progreso" lead="Tu peso, tus medidas y tu fuerza a lo largo del tiempo." />
      <Section title="Peso">
        <EmptyState title="Pésate mañana al despertar">
          En ayunas, después de ir al baño y siempre a la misma hora. Mostramos la tendencia, no el número de cada
          día, para que el agua y la sal no te confundan.
        </EmptyState>
      </Section>
      <Section title="Medidas y fotos">
        <EmptyState title="Tus primeras medidas toman 5 minutos">
          Te guiamos punto por punto con la cinta, y para las fotos te mostramos la silueta de la anterior para que
          siempre salgan igual. Las fotos solo las ves tú, salvo que decidas compartirlas con tu entrenador.
        </EmptyState>
      </Section>
    </>
  );
}
