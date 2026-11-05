import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { OutboxSync } from "@/components/workout/outbox-sync";
import { PolicyGate, PolicyNotice } from "@/components/policy-notice";
import { requireAthlete } from "@/lib/auth";
import { getPolicyStatus } from "@/lib/privacy";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="md:pl-60">
      <AppNav />
      <OfflineBanner />
      <OutboxSync />
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:px-10 md:pt-10 md:pb-12">
        <Suspense fallback={<PageSkeleton />}>
          <Gate>{children}</Gate>
        </Suspense>
      </main>
    </div>
  );
}

/** Sin sesión va a ingresar; sin perfil completo, al onboarding. */
async function Gate({ children }: { children: React.ReactNode }) {
  await requireAthlete();
  const status = await getPolicyStatus();
  if (status === "reauthorize") return <PolicyGate />;
  return (
    <>
      {status === "notice" ? <PolicyNotice /> : null}
      {children}
    </>
  );
}

function PageSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="h-10 w-40 rounded-lg bg-sunken" />
      <div className="mt-3 h-5 w-72 max-w-full rounded bg-sunken" />
      <div className="mt-10 h-56 rounded-2xl bg-sunken" />
    </div>
  );
}
