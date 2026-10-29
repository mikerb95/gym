"use client";

import { useState } from "react";
import { plateLoad } from "@gym/core";
import { fmt } from "@/lib/format";
import { Barbell } from "./barbell";
import { Segmented, Stepper } from "./ui";

const BARS = [
  { value: 20, label: "20 kg" },
  { value: 15, label: "15 kg" },
  { value: 10, label: "10 kg" },
] as const;

export function PlateCalculator() {
  const [target, setTarget] = useState(100);
  const [bar, setBar] = useState<number>(20);
  const load = plateLoad(target, bar);

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-7">
      <div className="grid gap-5 md:grid-cols-2">
        <Stepper label="Peso total" value={target} onChange={setTarget} step={2.5} min={bar} max={500} unit="kg" />
        <Segmented label="Barra" options={BARS} value={bar} onChange={setBar} />
      </div>

      <Barbell perSide={load.perSide} className="mt-6 h-40 w-full md:h-52" />

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[17px]">
          {load.perSide.length ? (
            <>
              Por lado: <strong className="font-semibold">{load.perSide.map(fmt).join(" + ")} kg</strong>
            </>
          ) : (
            "Solo la barra"
          )}
        </p>
        {load.remainderKg !== 0 ? (
          <p className="rounded-full bg-amber-tint px-3 py-1 text-sm">
            Con discos estándar llegas a {fmt(load.achievedKg)} kg
          </p>
        ) : null}
      </div>
    </div>
  );
}
