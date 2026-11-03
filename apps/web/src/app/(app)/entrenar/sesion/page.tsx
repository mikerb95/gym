import type { Metadata } from "next";
import { WorkoutLogger } from "@/components/workout/workout-logger";
import { getCatalog, getLastPerformance } from "@/lib/training";

export const metadata: Metadata = { title: "Entrenando" };

export default async function SessionPage() {
  const [catalog, last] = await Promise.all([getCatalog(), getLastPerformance()]);
  return <WorkoutLogger catalog={catalog} last={last} />;
}
