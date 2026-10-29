import type { Metadata } from "next";
import { MacroCalculator } from "@/components/macro-calculator";
import { PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Nutrición" };

export default function NutritionPage() {
  return (
    <>
      <PageHeader title="Nutrición" lead="Cuánto comer para tu objetivo, en calorías y gramos de cada macro." />
      <Section title="Tus objetivos diarios">
        <MacroCalculator />
      </Section>
    </>
  );
}
