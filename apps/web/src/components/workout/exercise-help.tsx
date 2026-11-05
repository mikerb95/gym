"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { BookOpen, Repeat, SlidersHorizontal } from "lucide-react";
import { suggestAlternatives } from "@gym/core";
import { MUSCLE_LABELS, type CatalogExercise, type LastPerformance } from "@/lib/workout";
import { subscribe, workoutStore } from "@/lib/workout-store";

type Panel = "guide" | "setup" | "busy";

const NOTE_MAX = 200;

/** Lo que se necesita frente a la máquina: cómo usarla, cómo la dejé y qué hacer si está ocupada. */
export function ExerciseHelp({
  exercise,
  catalog,
  last,
  inSession,
  openFirst,
  canSwap,
  onSwap,
}: {
  exercise: CatalogExercise;
  catalog: CatalogExercise[];
  last: LastPerformance;
  inSession: string[];
  /** Abre la guía de entrada: acaba de identificar una máquina que nunca ha usado. */
  openFirst: boolean;
  canSwap: boolean;
  onSwap: (next: CatalogExercise) => void;
}) {
  const hasGuide = exercise.cues.length > 0;
  const [panel, setPanel] = useState<Panel | null>(openFirst && hasGuide ? "guide" : null);
  const notes = useSyncExternalStore(subscribe, workoutStore.getMachineNotes, () => null);
  const note = notes?.[exercise.id] ?? "";
  const usesStack = exercise.equipment.some((q) => q === "machine" || q === "cable");

  const options = useMemo(
    () =>
      panel === "busy"
        ? suggestAlternatives(exercise, catalog, { exclude: inSession, known: new Set(Object.keys(last)) })
        : [],
    [panel, exercise, catalog, inSession, last],
  );

  const tabs: { id: Panel; label: string; icon: typeof BookOpen; show: boolean }[] = [
    { id: "guide", label: "Cómo usarla", icon: BookOpen, show: hasGuide },
    { id: "setup", label: "Mi ajuste", icon: SlidersHorizontal, show: true },
    { id: "busy", label: "Está ocupada", icon: Repeat, show: canSwap },
  ];

  return (
    <div className="mt-3">
      {note && panel !== "setup" ? <p className="mb-2 text-sm"><span className="font-semibold">Tu ajuste:</span> {note}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              aria-expanded={panel === t.id}
              onClick={() => setPanel(panel === t.id ? null : t.id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-sunken px-3 text-sm font-semibold text-ink aria-expanded:bg-cobalt-tint"
            >
              <t.icon aria-hidden size={16} className="text-cobalt" />
              {t.label}
            </button>
          ))}
      </div>

      {panel === "guide" ? (
        <div className="mt-2 rounded-xl bg-sunken p-3 text-[15px] leading-relaxed">
          <ol className="grid list-inside list-decimal gap-1">
            {exercise.cues.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
          {exercise.commonMistakes.length ? (
            <>
              <p className="mt-3 font-semibold">Evita</p>
              <ul className="mt-1 grid list-inside list-disc gap-1">
                {exercise.commonMistakes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="mt-3 text-sm text-muted">Cada máquina cambia: si trae placa de instrucciones, síguela. Si sientes dolor, detente.</p>
        </div>
      ) : null}

      {panel === "setup" ? (
        <div className="mt-2 rounded-xl bg-sunken p-3">
          <label className="text-[15px] font-semibold" htmlFor={`note-${exercise.id}`}>
            ¿Cómo dejas esta máquina?
          </label>
          <textarea
            id={`note-${exercise.id}`}
            rows={2}
            maxLength={NOTE_MAX}
            value={note}
            placeholder="Asiento en 4, respaldo en 2"
            onChange={(e) => workoutStore.setMachineNote(exercise.id, e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-surface p-2 text-[16px] outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/30"
          />
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {usesStack ? "Si la pila está en libras o sin números, anota aquí el número de placa. " : ""}
            Se guarda solo en este teléfono.
          </p>
        </div>
      ) : null}

      {panel === "busy" ? (
        <div className="mt-2 rounded-xl bg-sunken p-3">
          {options.length ? (
            <>
              <p className="text-[15px] font-semibold">Mismo músculo, otra opción</p>
              <ul className="mt-2 grid gap-1.5">
                {options.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => onSwap(o)}
                      className="flex min-h-14 w-full flex-col justify-center rounded-lg bg-surface px-3 py-2 text-left"
                    >
                      <span className="font-medium">{o.name}</span>
                      <span className="text-sm text-muted">{o.primaryMuscles.map((m) => MUSCLE_LABELS[m] ?? m).join(", ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-muted">Revisa que esté disponible en tu gym antes de cambiar.</p>
            </>
          ) : (
            <p className="text-[15px] text-muted">No encontramos otra opción para este músculo en el catálogo.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
