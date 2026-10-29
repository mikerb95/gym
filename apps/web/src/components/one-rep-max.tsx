"use client";

import { useState } from "react";
import { estimateOneRepMax, weightForReps } from "@gym/core";
import { fmt } from "@/lib/format";
import { Stepper } from "./ui";

const TARGET_REPS = [3, 5, 8, 10, 12];

export function OneRepMax() {
  const [weight, setWeight] = useState(80);
  const [reps, setReps] = useState(6);
  const [rir, setRir] = useState(1);
  const estimate = estimateOneRepMax({ weightKg: weight, reps, rir });

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-7">
      <div className="grid gap-x-8 md:grid-cols-2">
      <div className="grid content-start gap-5">
        <Stepper label="Peso" value={weight} onChange={setWeight} step={2.5} min={0} max={500} unit="kg" />
        <Stepper label="Repeticiones" value={reps} onChange={setReps} step={1} min={1} max={30} />
        <Stepper label="Reps en reserva" value={rir} onChange={setRir} step={1} min={0} max={5} />
      </div>

      <div>
      <div className="mt-6 flex items-end gap-4 md:mt-7">
        <p className="figure text-[56px]">{fmt(estimate.kg)}</p>
        <p className="pb-1.5 text-muted">kg de máximo estimado</p>
      </div>
      {!estimate.reliable ? (
        <p className="mt-2 text-sm text-amber">Con más de 12 repeticiones la estimación pierde precisión.</p>
      ) : null}

      <table className="mt-6 w-full text-left text-[15px]">
        <caption className="mb-2 text-left text-sm text-muted">Peso sugerido dejando 2 repeticiones en reserva</caption>
        <tbody>
          {TARGET_REPS.map((r) => (
            <tr key={r} className="border-t border-line">
              <th scope="row" className="py-2.5 font-medium">
                {r} reps
              </th>
              <td className="py-2.5 text-right font-semibold tabular-nums">{fmt(weightForReps(estimate.kg, r, 2))} kg</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </div>
    </div>
  );
}
