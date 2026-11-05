"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { buttonPrimary, buttonQuiet } from "@/components/ui";
import { clearDeviceData } from "@/lib/device-data";
import { LEGAL } from "@/lib/legal";
import { changeConsent, deleteAccount } from "./actions";

export function ConsentCard({
  purpose,
  title,
  text,
  active,
  since,
}: {
  purpose: string;
  title: string;
  text: string;
  active: boolean;
  since: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [purge, setPurge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isHealth = purpose === "sensitive_health";

  function submit(granted: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await changeConsent({ purpose, granted, deleteHealthData: purge });
      if (result.ok) {
        setConfirming(false);
        setPurge(false);
      } else setError(result.error);
    });
  }

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
      <div className="flex items-center gap-2">
        <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${active ? "bg-ok" : "bg-line"}`} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{text}</p>
      <p className="mt-2 text-sm text-muted">
        {active ? "Autorizado" : "Sin autorizar"}
        {since ? ` desde el ${since}` : ""}
      </p>

      {confirming ? (
        <div className="mt-3 rounded-xl bg-sunken p-3">
          <p className="text-[15px] leading-relaxed">
            {isHealth
              ? "Dejaremos de tratar tus datos de salud y de ajustar el plan a tu caso. Las herramientas generales siguen disponibles."
              : "Dejaremos de usar tus datos para esto desde ahora."}
          </p>
          {isHealth ? (
            <label className="mt-3 flex min-h-11 items-start gap-3 text-[15px] leading-relaxed">
              <input type="checkbox" checked={purge} onChange={(e) => setPurge(e.target.checked)} className="mt-1 size-5 accent-[var(--cobalt)]" />
              También borrar los datos de salud que ya tienen: peso, medidas, lesiones, cuestionarios y check-ins. No se
              puede deshacer.
            </label>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={pending} onClick={() => submit(false)} className={buttonPrimary}>
              {pending ? "Guardando…" : "Revocar"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={buttonQuiet}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => (active ? setConfirming(true) : submit(true))}
          className={`${buttonQuiet} mt-3`}
        >
          {active ? "Revocar autorización" : pending ? "Guardando…" : "Autorizar"}
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-[15px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function DataActions() {
  const [confirming, setConfirming] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(phrase);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await clearDeviceData();
      // Recarga completa a propósito: descarta de la memoria todo lo de la cuenta borrada.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/ingresar?cuenta=eliminada");
    });
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl bg-surface p-4 shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
        <h3 className="font-semibold">Descargar tus datos</h3>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          Un archivo JSON con todo lo que guardamos de ti, incluidas tus autorizaciones y su prueba.
        </p>
        {/* Enlace normal, no <Link>: es una descarga y no debe precargarse. */}
        <a href="/perfil/privacidad/descargar" download className={`${buttonQuiet} mt-3`}>
          <Download aria-hidden size={18} />
          Descargar
        </a>
      </div>

      <div className="rounded-2xl bg-surface p-4 shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
        <h3 className="font-semibold">Eliminar tu cuenta</h3>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          Borramos tu cuenta y tus datos en el acto. No se puede deshacer, así que descarga antes lo que quieras
          conservar. Solo guardamos lo que la ley nos obliga, como los pagos para facturación, sin vincularlo a tu
          cuenta.
        </p>
        {confirming ? (
          <div className="mt-3 rounded-xl bg-danger-tint p-3">
            <label htmlFor="confirm-delete" className="block text-[15px] font-medium">
              Escribe ELIMINAR para confirmar
            </label>
            <input
              id="confirm-delete"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
              className="mt-2 block w-full rounded-xl border border-line bg-surface px-4 py-3 text-[17px] outline-none focus:border-cobalt"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending || phrase.trim().toUpperCase() !== "ELIMINAR"}
                onClick={remove}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-danger px-5 font-semibold text-white active:scale-[0.98] disabled:opacity-40"
              >
                {pending ? "Eliminando…" : "Eliminar mi cuenta"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={buttonQuiet}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={`${buttonQuiet} mt-3 text-danger`}>
            Eliminar mi cuenta
          </button>
        )}
        {error ? (
          <p role="alert" className="mt-2 text-[15px] text-danger">
            {error}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-muted">¿Dudas? Escríbenos a {LEGAL.email}.</p>
      </div>
    </div>
  );
}
