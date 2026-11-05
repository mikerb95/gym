"use client";

import { useState, useTransition } from "react";
import { buttonPrimary, buttonQuiet, Segmented, Stepper } from "@/components/ui";
import { createProgram } from "./actions";

export function ProgramForm({
  defaults,
  replacing,
}: {
  defaults: { daysPerWeek: number; sessionMinutes: number; place: "gym" | "home" };
  replacing: boolean;
}) {
  const [open, setOpen] = useState(!replacing);
  const [daysPerWeek, setDays] = useState(defaults.daysPerWeek);
  const [sessionMinutes, setMinutes] = useState(defaults.sessionMinutes);
  const [place, setPlace] = useState(defaults.place);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonQuiet}>
        Armar otro programa
      </button>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createProgram({ daysPerWeek, sessionMinutes, place });
      if (result.ok) {
        if (replacing) setOpen(false);
      } else setError(result.error);
    });
  }

  return (
    <div className="grid gap-5 rounded-2xl bg-surface p-5 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-7">
      <Stepper label="Días por semana" value={daysPerWeek} onChange={setDays} step={1} min={1} max={7} />
      <Stepper label="Minutos por sesión" value={sessionMinutes} onChange={setMinutes} step={15} min={30} max={180} unit="min" />
      <Segmented
        label="Dónde entrenas"
        options={[
          { value: "gym", label: "Gimnasio" },
          { value: "home", label: "En casa, con mancuernas" },
        ]}
        value={place}
        onChange={setPlace}
      />
      {replacing ? (
        <p className="text-[15px] leading-relaxed text-muted">
          Reemplaza tu programa actual. Lo que ya entrenaste sigue en tu historial.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={submit} className={buttonPrimary}>
          {pending ? "Armando…" : "Armar programa"}
        </button>
        {replacing ? (
          <button type="button" onClick={() => setOpen(false)} className={buttonQuiet}>
            Cancelar
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-[15px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
