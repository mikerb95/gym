import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Bienvenida" };

export default function WelcomePage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-10 md:pt-14">
      <p className="heading text-2xl">{BRAND.name}</p>
      <Suspense fallback={<div className="mt-10 h-96 animate-pulse rounded-2xl bg-sunken" />}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  const viewer = await getViewer();
  if (!viewer) redirect("/ingresar");
  if (viewer.profile?.onboardedAt) redirect("/");
  return <OnboardingForm />;
}
