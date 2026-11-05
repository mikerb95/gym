"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptPolicy, acknowledgePolicy, type ActionResult } from "@/app/(app)/perfil/privacidad/actions";
import { DataActions } from "@/app/(app)/perfil/privacidad/privacy-controls";
import { buttonPrimary, buttonQuiet } from "@/components/ui";
import { LEGAL } from "@/lib/legal";

function usePolicyAction(action: () => Promise<ActionResult>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = () =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  return { run, pending, error };
}

const policyLink = (
  <Link href="/privacidad" target="_blank" className="font-medium underline underline-offset-2">
    política de tratamiento de datos
  </Link>
);

/** Aviso de un cambio informativo de la política. */
export function PolicyNotice() {
  const { run, pending, error } = usePolicyAction(acknowledgePolicy);
  return (
    <div role="status" className="mb-6 rounded-2xl bg-cobalt-tint p-4">
      <p className="text-[15px] leading-relaxed">
        Actualizamos la {policyLink} el {LEGAL.updatedOn}. Tus autorizaciones siguen iguales.
      </p>
      <button type="button" disabled={pending} onClick={run} className={`${buttonQuiet} mt-3`}>
        Entendido
      </button>
      {error ? <p role="alert" className="mt-2 text-[15px] text-danger">{error}</p> : null}
    </div>
  );
}

/** Pantalla que reemplaza a la app hasta dar la nueva autorización que exige un cambio de la política. */
export function PolicyGate() {
  const { run, pending, error } = usePolicyAction(acceptPolicy);
  return (
    <>
    <div className="mb-6 rounded-2xl bg-surface p-5 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-7">
      <h1 className="heading text-2xl">Necesitamos tu autorización</h1>
      <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">
        Cambiamos la {policyLink} el {LEGAL.updatedOn} y la ley nos pide tu autorización para seguir tratando tus datos.
        Si aceptas, también renovamos la de datos de salud si la tenías activa.
      </p>
      <button type="button" disabled={pending} onClick={run} className={`${buttonPrimary} mt-5`}>
        {pending ? "Guardando…" : "Leí y acepto"}
      </button>
      {error ? <p role="alert" className="mt-2 text-[15px] text-danger">{error}</p> : null}
    </div>
    <p className="mb-3 max-w-[60ch] leading-relaxed text-muted">Si no aceptas, puedes llevarte tus datos y eliminar tu cuenta.</p>
    <DataActions />
    </>
  );
}
