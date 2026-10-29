import type { Metadata } from "next";
import Link from "next/link";
import { buttonQuiet, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Perfil" };

const SHARING = [
  { label: "Entrenamientos", detail: "Sesiones, series y récords" },
  { label: "Nutrición", detail: "Comidas y objetivos" },
  { label: "Cuerpo", detail: "Peso y medidas" },
  { label: "Fotos de progreso", detail: "Apagado hasta que tú lo actives" },
  { label: "Bienestar", detail: "Ánimo, sueño y check-ins" },
  { label: "Ubicación", detail: "Dónde entrenaste" },
];

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Perfil" />
      <Section title="Qué ve tu entrenador">
        <p className="mb-4 max-w-[60ch] leading-relaxed text-muted">
          Tú decides cada categoría y puedes cambiarla cuando quieras. Si terminas con tu entrenador, deja de ver todo.
        </p>
        <ul className="divide-y divide-line rounded-2xl bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
          {SHARING.map((s) => (
            <li key={s.label} className="flex min-h-16 flex-col justify-center px-5 py-3">
              <span className="font-medium">{s.label}</span>
              <span className="text-sm text-muted">{s.detail}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="¿Eres entrenador?">
        <p className="mb-4 max-w-[60ch] leading-relaxed text-muted">
          Usa la misma cuenta para gestionar a tus afiliados. Cambias de modo cuando quieras.
        </p>
        <Link href="/entrenador" className={buttonQuiet}>
          Pasar a modo entrenador
        </Link>
      </Section>
    </>
  );
}
