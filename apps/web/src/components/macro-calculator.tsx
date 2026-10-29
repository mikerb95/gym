"use client";

import { useState } from "react";
import {
  bmrMifflinStJeor,
  estimateTdee,
  macroTargets,
  type ActivityLevel,
  type BiologicalSex,
  type Goal,
} from "@gym/core";
import { Segmented, Stepper } from "./ui";

const GOALS: { value: Goal; label: string }[] = [
  { value: "fat_loss", label: "Perder grasa" },
  { value: "recomposition", label: "Recomposición" },
  { value: "maintenance", label: "Mantener" },
  { value: "muscle_gain", label: "Ganar músculo" },
];

const ACTIVITY: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentario" },
  { value: "light", label: "Poco activo" },
  { value: "moderate", label: "Activo" },
  { value: "high", label: "Muy activo" },
];

const SEX: { value: BiologicalSex; label: string }[] = [
  { value: "female", label: "Mujer" },
  { value: "male", label: "Hombre" },
];

export function MacroCalculator() {
  const [sex, setSex] = useState<BiologicalSex>("female");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(165);
  const [weight, setWeight] = useState(65);
  const [activity, setActivity] = useState<ActivityLevel>("light");
  const [goal, setGoal] = useState<Goal>("recomposition");

  const tdee = estimateTdee(bmrMifflinStJeor({ sex, ageYears: age, heightCm: height, weightKg: weight }), activity);
  const targets = macroTargets({ tdee, weightKg: weight, sex, goal, ageYears: age });

  const macros = [
    { label: "Proteína", grams: targets.proteinG, kcal: targets.proteinG * 4 },
    { label: "Carbohidratos", grams: targets.carbsG, kcal: targets.carbsG * 4 },
    { label: "Grasas", grams: targets.fatG, kcal: targets.fatG * 9 },
  ];

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-7">
      <div className="grid gap-5 md:grid-cols-2">
        <Segmented label="Sexo biológico" options={SEX} value={sex} onChange={setSex} />
        <Stepper label="Edad" value={age} onChange={setAge} step={1} min={14} max={95} unit="años" />
        <Stepper label="Estatura" value={height} onChange={setHeight} step={1} min={120} max={230} unit="cm" />
        <Stepper label="Peso" value={weight} onChange={setWeight} step={0.5} min={30} max={250} unit="kg" />
      </div>
      <div className="mt-5 grid gap-5">
        <Segmented label="Tu día a día" options={ACTIVITY} value={activity} onChange={setActivity} />
        <Segmented label="Objetivo" options={GOALS} value={goal} onChange={setGoal} />
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="figure text-[56px]">{targets.kcal.toLocaleString("es-CO")}</p>
        <p className="pb-1.5 text-muted">kcal al día. Gastas unas {tdee.toLocaleString("es-CO")}.</p>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        {macros.map((m) => (
          <div key={m.label} className="rounded-xl bg-sunken p-3.5">
            <dt className="text-sm text-muted">{m.label}</dt>
            <dd className="figure mt-1.5 text-[28px]">
              {m.grams}
              <span className="ml-1 text-base font-medium text-muted">g</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 max-w-[60ch] text-sm leading-relaxed text-muted">
        Es un punto de partida. Cuando registres tu peso y tu comida durante dos semanas, lo recalculamos con tu gasto
        real.
      </p>
    </div>
  );
}
