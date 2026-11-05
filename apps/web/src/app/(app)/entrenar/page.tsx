import type { Metadata } from "next";
import Link from "next/link";
import { OneRepMax } from "@/components/one-rep-max";
import { PlateCalculator } from "@/components/plate-calculator";
import { PageHeader, Section } from "@/components/ui";
import { StartWorkout } from "@/components/workout/start-workout";
import { fmt } from "@/lib/format";
import { getHistory, type HistoryItem } from "@/lib/training";

export const metadata: Metadata = { title: "Entrenar" };

export default async function TrainPage() {
  const history = await getHistory();
  return (
    <>
      <PageHeader title="Entrenar" lead="Registra tus series, carga la barra sin hacer cuentas y calcula tus pesos." />
      <Section
        title="Hoy"
        aside={
          <Link href="/entrenar/programa" className="font-medium text-cobalt underline-offset-2 hover:underline">
            Tu programa
          </Link>
        }
      >
        <StartWorkout />
      </Section>
      <Section title="Tus sesiones">
        {history.length ? (
          <ul className="divide-y divide-line rounded-2xl bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
            {history.map((h) => (
              <SessionRow key={h.id} item={h} />
            ))}
          </ul>
        ) : (
          <p className="max-w-[60ch] leading-relaxed text-muted">
            Aquí verás cada sesión con su duración, sus series y los kilos que moviste.
          </p>
        )}
      </Section>
      <Section title="¿Qué discos pongo?">
        <PlateCalculator />
      </Section>
      <Section title="Tu máximo estimado">
        <OneRepMax />
      </Section>
    </>
  );
}

const dayFormat = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Bogota",
});

function SessionRow({ item }: { item: HistoryItem }) {
  const minutes = item.endedAt ? Math.round((item.endedAt.getTime() - item.startedAt.getTime()) / 60000) : null;
  const day = dayFormat.format(item.startedAt);
  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-semibold first-letter:uppercase">{day}</p>
        <p className="text-sm text-muted tabular-nums">
          {minutes !== null ? `${minutes} min, ` : ""}
          {item.sets} series
          {item.volumeKg > 0 ? `, ${fmt(Math.round(item.volumeKg))} kg` : ""}
        </p>
      </div>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">{item.exercises.join(", ")}</p>
    </li>
  );
}
