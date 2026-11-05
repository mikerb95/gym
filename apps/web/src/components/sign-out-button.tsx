"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { buttonQuiet } from "@/components/ui";
import { clearDeviceData } from "@/lib/device-data";
import { subscribe, workoutStore } from "@/lib/workout-store";

/** Cierra la sesión y limpia el dispositivo. Avisa antes si hay entrenamientos sin subir. */
export function SignOutButton() {
  // Lo que se perdería: entrenamientos en cola y la sesión abierta, si la hay.
  const queued = useSyncExternalStore(
    subscribe,
    () => workoutStore.getOutbox().length + (workoutStore.getActive() ? 1 : 0),
    () => 0,
  );
  const [warning, setWarning] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  async function signOut() {
    await clearDeviceData();
    form.current?.submit();
  }

  return (
    <form ref={form} action="/auth/salir" method="post" onSubmit={(e) => e.preventDefault()}>
      {warning ? (
        <div className="rounded-xl bg-amber-tint p-3">
          <p className="max-w-[50ch] text-[15px] leading-relaxed">
            {queued === 1 ? "Tienes un entrenamiento sin subir" : `Tienes ${queued} entrenamientos sin subir`}. Si cierras
            sesión se pierde{queued === 1 ? "" : "n"}. Conéctate a internet para que se suba{queued === 1 ? "" : "n"} antes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={signOut} className={buttonQuiet}>
              Cerrar sesión igual
            </button>
            <button type="button" onClick={() => setWarning(false)} className={buttonQuiet}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => (queued > 0 ? setWarning(true) : signOut())} className={buttonQuiet}>
          Cerrar sesión
        </button>
      )}
    </form>
  );
}
