import type { Metadata } from "next";
import { OneRepMax } from "@/components/one-rep-max";
import { PlateCalculator } from "@/components/plate-calculator";
import { PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Entrenar" };

export default function TrainPage() {
  return (
    <>
      <PageHeader title="Entrenar" lead="Carga la barra sin hacer cuentas y calcula tus pesos de trabajo." />
      <Section title="¿Qué discos pongo?">
        <PlateCalculator />
      </Section>
      <Section title="Tu máximo estimado">
        <OneRepMax />
      </Section>
    </>
  );
}
