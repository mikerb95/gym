import type { Metadata } from "next";
import { WorkoutLogger } from "@/components/workout/workout-logger";
import { getPlannedWorkout } from "@/lib/programs";
import { getCatalog, getLastPerformance } from "@/lib/training";

export const metadata: Metadata = { title: "Entrenando" };

export default async function SessionPage({ searchParams }: PageProps<"/entrenar/sesion">) {
  const { plan } = await searchParams;
  const [catalog, last, planned] = await Promise.all([
    getCatalog(),
    getLastPerformance(),
    typeof plan === "string" ? getPlannedWorkout(plan) : null,
  ]);
  return <WorkoutLogger catalog={catalog} last={last} planned={planned} />;
}
