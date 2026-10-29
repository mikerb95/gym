"use client";

import { useState } from "react";
import { readiness, type ReadinessAnswers, type SessionAdjustment } from "@gym/core";
import { buttonPrimary, buttonQuiet, Stepper } from "./ui";

type ScaleKey = Exclude<keyof ReadinessAnswers, "sleepHours">;

const QUESTIONS: { key: ScaleKey; question: string; low: string; high: string }[] = [
  { key: "sleepQuality", question: "¿Cómo dormiste?", low: "Fatal", high: "Excelente" },
  { key: "energy", question: "¿Cuánta energía tienes?", low: "Ninguna", high: "A tope" },
  { key: "soreness", question: "¿Cómo están tus músculos?", low: "Muy adoloridos", high: "Sin dolor" },
  { key: "stress", question: "¿Cómo va el estrés?", low: "Muy alto", high: "Tranquilo" },
  { key: "mood", question: "¿Cómo está tu ánimo?", low: "Bajo", high: "Muy bien" },
];

const ADJUSTMENT_COPY: Record<SessionAdjustment, { title: string; body: string }> = {
  as_planned: { title: "Entrena como está planeado", body: "Vas bien. Si hoy sientes que puedes más, súbele en la última serie." },
  reduce_volume: {
    title: "Hoy, una serie menos por ejercicio",
    body: "Mantén los pesos, recorta volumen para recuperarte mejor.",
  },
  reduce_intensity: {
    title: "Baja el peso un 10 %",
    body: "Mismas series y repeticiones, con más reserva. La técnica primero.",
  },
  recovery: {
    title: "Mejor una sesión suave",
    body: "Movilidad, cardio ligero o descanso. Forzar hoy no suma.",
  },
};

export function ReadinessCheck() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<ReadinessAnswers>>({});
  const [sleepHours, setSleepHours] = useState(7);

  const done = step > QUESTIONS.length;

  if (done) {
    const result = readiness({ ...(answers as ReadinessAnswers), sleepHours });
    const copy = ADJUSTMENT_COPY[result.adjustment];
    return (
      <div className="rounded-2xl bg-surface p-5 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-7">
        <div className="flex items-end gap-4">
          <p className="figure text-[64px]">{result.score}</p>
          <p className="pb-2 text-muted">de 10 de disposición para entrenar</p>
        </div>
        <p className="heading mt-5 text-xl">{copy.title}</p>
        <p className="mt-1 max-w-[56ch] text-muted">{copy.body}</p>
        {result.reasons.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {result.reasons.map((r) => (
              <li key={r} className="rounded-full bg-amber-tint px-3 py-1 text-sm">
                {r}
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          className={`${buttonQuiet} mt-6`}
          onClick={() => {
            setStep(0);
            setAnswers({});
          }}
        >
          Responder de nuevo
        </button>
      </div>
    );
  }

  if (step === QUESTIONS.length) {
    return (
      <div className="rounded-2xl bg-surface p-5 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-7">
        <p className="heading mb-5 text-xl">¿Cuántas horas dormiste?</p>
        <Stepper label="Horas de sueño" value={sleepHours} onChange={setSleepHours} step={0.5} min={0} max={14} unit="h" />
        <button type="button" className={`${buttonPrimary} mt-6 w-full`} onClick={() => setStep(step + 1)}>
          Ver mi resultado
        </button>
      </div>
    );
  }

  const q = QUESTIONS[step]!;
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-7">
      <p className="text-sm text-muted">
        Pregunta {step + 1} de {QUESTIONS.length + 1}
      </p>
      <p className="heading mt-1 text-xl">{q.question}</p>
      <div className="mt-5 grid grid-cols-5 gap-2" role="radiogroup" aria-label={q.question}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={answers[q.key] === n}
            onClick={() => {
              setAnswers({ ...answers, [q.key]: n });
              setStep(step + 1);
            }}
            className="figure grid h-16 place-items-center rounded-xl bg-sunken text-2xl hover:bg-cobalt-tint aria-checked:bg-cobalt aria-checked:text-cobalt-ink"
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-sm text-muted">
        <span>{q.low}</span>
        <span>{q.high}</span>
      </div>
      {step > 0 ? (
        <button type="button" onClick={() => setStep(step - 1)} className="mt-4 text-sm font-medium text-cobalt">
          Volver a la anterior
        </button>
      ) : null}
    </div>
  );
}
