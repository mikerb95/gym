import type { Metadata } from "next";
import Link from "next/link";
import { buttonQuiet, EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Modo entrenador" };

export default function CoachPage() {
  return (
    <>
      <PageHeader
        title="Tus afiliados"
        lead="Aquí ves a quién atender hoy: check-ins pendientes, molestias nuevas, estancamientos y pagos."
      />
      <Section title="Para atender hoy">
        <EmptyState title="Invita a tu primer afiliado">
          Le envías un enlace por WhatsApp. Cuando acepta, eliges su programa y su plan de comida, y desde ese momento
          te avisamos lo que necesite tu atención.
        </EmptyState>
      </Section>
      <Link href="/" className={buttonQuiet}>
        Volver a modo atleta
      </Link>
    </>
  );
}
