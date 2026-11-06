"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Check, Minus, Plus, Search, Timer, Trash2, Trophy, X } from "lucide-react";
import { saveWorkout, type SaveWorkoutResult } from "@/app/(app)/entrenar/actions";
import { buttonPrimary, buttonQuiet } from "@/components/ui";
import { ExerciseHelp } from "@/components/workout/exercise-help";
import { MachineScanner } from "@/components/workout/machine-scanner";
import { loadIncrementKg, proposeLoad, type LoadProposal } from "@gym/core";
import { fmt } from "@/lib/format";
import {
  MUSCLE_LABELS,
  normalize,
  type ActiveWorkout,
  type CatalogExercise,
  type ExercisePlan,
  type LastPerformance,
  type LoggedExercise,
  type LoggedSet,
  type PlannedWorkout,
  type WorkoutPayload,
} from "@/lib/workout";
import { parseDecimal, subscribe, workoutStore, type RestState } from "@/lib/workout-store";

type Props = { catalog: CatalogExercise[]; last: LastPerformance; planned?: PlannedWorkout | null };

type Outcome = { kind: "saved"; records: Extract<SaveWorkoutResult, { ok: true }>["records"] } | { kind: "queued" };

/** Arma la sesión desde el programa: parte de lo último que hizo, y la propuesta de carga queda por decidir. */
function workoutFromPlan(planned: PlannedWorkout, byId: Map<string, CatalogExercise>, last: LastPerformance): ActiveWorkout {
  const exercises: LoggedExercise[] = [];
  for (const { exerciseId, plan } of planned.exercises) {
    const exercise = byId.get(exerciseId);
    if (!exercise) continue;
    const sets: LoggedSet[] = [];
    for (let i = 0; i < plan.sets; i++) {
      const set = newSet(exercise, last[exerciseId], sets);
      sets.push({
        ...set,
        // Lo último que hizo de verdad; la meta del programa se muestra aparte.
        reps: set.reps ?? plan.repsMin,
        durationSeconds: plan.durationS ?? set.durationSeconds,
      });
    }
    exercises.push({ key: crypto.randomUUID(), exerciseId, plan, sets });
  }
  return { id: crypto.randomUUID(), startedAt: new Date().toISOString(), plannedSessionId: planned.id, exercises };
}

export function WorkoutLogger({ catalog, last, planned }: Props) {
  const router = useRouter();
  // undefined mientras se lee el teléfono (y en el servidor); null si no hay sesión.
  const workout = useSyncExternalStore(subscribe, workoutStore.getActive, () => undefined);
  const [closed, setClosed] = useState(false);
  const [picking, setPicking] = useState<boolean | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const rest = useSyncExternalStore(subscribe, workoutStore.getRest, () => null);
  const storageFailed = useSyncExternalStore(subscribe, workoutStore.getWriteFailed, () => false);
  useWakeLock(!!workout);
  const byId = useMemo(() => new Map(catalog.map((e) => [e.id, e])), [catalog]);

  // Sin sesión abierta en el teléfono: se crea una al entrar.
  useEffect(() => {
    if (workout === null && !closed) {
      workoutStore.setActive(
        planned
          ? workoutFromPlan(planned, byId, last)
          : { id: crypto.randomUUID(), startedAt: new Date().toISOString(), exercises: [] },
      );
    }
  }, [workout, closed, planned, byId, last]);

  function update(fn: (w: ActiveWorkout) => ActiveWorkout) {
    const current = workoutStore.getActive();
    if (current) workoutStore.setActive(fn(current));
  }

  function addExercise(exercise: CatalogExercise, identifiedBy?: LoggedExercise["identifiedBy"]) {
    update((w) => ({
      ...w,
      exercises: [
        ...w.exercises,
        {
          key: crypto.randomUUID(),
          exerciseId: exercise.id,
          identifiedBy,
          suggestion: freeSuggestion(exercise, last[exercise.id]),
          sets: [newSet(exercise, last[exercise.id], [])],
        },
      ],
    }));
  }

  /** La máquina está ocupada: cambia el ejercicio y conserva lo que pedía el programa, menos la carga. */
  function swapExercise(logged: LoggedExercise, exercise: CatalogExercise) {
    const history = last[exercise.id];
    const plan = logged.plan ? { ...logged.plan, proposal: null, proposalDecision: undefined } : undefined;
    const sets: LoggedSet[] = [];
    for (let i = 0; i < Math.max(1, logged.sets.length); i += 1) sets.push(newSet(exercise, history, sets));
    update((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.key === logged.key
          ? { key: crypto.randomUUID(), exerciseId: exercise.id, plan, suggestion: plan ? undefined : freeSuggestion(exercise, history), sets }
          : e,
      ),
    }));
  }

  function close() {
    setClosed(true);
    workoutStore.setRest(null);
    workoutStore.setActive(null);
  }

  if (outcome) return <Done outcome={outcome} />;
  if (!workout) return <div aria-hidden className="h-64 animate-pulse rounded-2xl bg-sunken" />;

  const doneSets = workout.exercises.flatMap((e) => e.sets.filter((s) => s.done));

  if (finishing) {
    return (
      <FinishPanel
        workout={workout}
        byId={byId}
        onBack={() => setFinishing(false)}
        onDiscard={() => {
          close();
          router.push("/entrenar");
        }}
        onDone={(o) => {
          close();
          setOutcome(o);
        }}
      />
    );
  }

  return (
    <>
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 bg-chalk/95 px-4 py-3 backdrop-blur md:-mx-10 md:px-10">
        <div>
          <p className="text-sm text-muted">En curso</p>
          <Elapsed since={workout.startedAt} />
        </div>
        {doneSets.length > 0 ? (
          <button type="button" onClick={() => setFinishing(true)} className={`${buttonPrimary} min-h-11 px-4`}>
            Terminar
          </button>
        ) : confirmExit ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                close();
                router.push("/entrenar");
              }}
              className="min-h-11 rounded-lg bg-danger px-4 font-semibold text-surface"
            >
              Sí, descartar
            </button>
            <button type="button" onClick={() => setConfirmExit(false)} aria-label="Seguir en la sesión" className="grid size-11 place-items-center">
              <X aria-hidden size={20} />
            </button>
          </div>
        ) : (
          // Sin series hechas no hay nada que terminar, pero sí debe poder salirse de la sesión.
          <button type="button" onClick={() => setConfirmExit(true)} className={`${buttonQuiet} min-h-11 px-4`}>
            Descartar
          </button>
        )}
      </header>

      {storageFailed ? (
        <p role="alert" className="mt-4 rounded-xl bg-danger-tint px-4 py-3 text-[15px] leading-relaxed text-danger">
          Tu teléfono no dejó guardar los últimos cambios, quizás por falta de espacio. No cierres la app hasta terminar la sesión.
        </p>
      ) : null}

      {planned && workout.plannedSessionId !== planned.id ? (
        <p className="mt-4 rounded-xl bg-amber-tint px-4 py-3 text-[15px] leading-relaxed">
          Ya tenías una sesión abierta. Termínala o descártala para empezar {planned.name}.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4">
        {workout.exercises.map((logged) => {
          const exercise = byId.get(logged.exerciseId);
          if (!exercise) return null;
          return (
            <ExerciseCard
              key={logged.key}
              exercise={exercise}
              logged={logged}
              last={last[logged.exerciseId]}
              catalog={catalog}
              lastAll={last}
              inSession={workout.exercises.map((e) => e.exerciseId)}
              onSwap={(next) => swapExercise(logged, next)}
              onChange={(next) =>
                update((w) => ({ ...w, exercises: w.exercises.map((e) => (e.key === logged.key ? next : e)) }))
              }
              onRemove={() => update((w) => ({ ...w, exercises: w.exercises.filter((e) => e.key !== logged.key) }))}
              onSetDone={() => {
                const total = logged.plan?.restSeconds ?? workoutStore.getRestFor(logged.exerciseId);
                workoutStore.setRest({ endsAt: Date.now() + total * 1000, total, exerciseId: logged.exerciseId });
              }}
            />
          );
        })}
      </div>

      {workout.exercises.length === 0 ? (
        <p className="mt-6 text-[17px] leading-relaxed text-muted">
          Agrega el primer ejercicio. Todo lo que registres queda guardado en tu teléfono aunque pierdas la señal.
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setPickerQuery("");
            setPicking(true);
          }}
          className={buttonQuiet}
        >
          <Plus aria-hidden size={20} />
          Agregar ejercicio
        </button>
        <button type="button" onClick={() => setScanning(true)} className={buttonQuiet}>
          <Camera aria-hidden size={20} />
          Identificar máquina
        </button>
      </div>

      {rest ? <RestTimer rest={rest} onChange={workoutStore.setRest} /> : null}

      {scanning ? (
        <MachineScanner
          catalog={catalog}
          onClose={() => setScanning(false)}
          onPick={(exercise) => {
            setScanning(false);
            setPicking(false);
            addExercise(exercise, "camera");
          }}
          onManual={(query) => {
            setScanning(false);
            setPickerQuery(query);
            setPicking(true);
          }}
        />
      ) : (picking ?? workout.exercises.length === 0) ? (
        <ExercisePicker
          catalog={catalog}
          last={last}
          initialQuery={pickerQuery}
          onClose={() => setPicking(false)}
          onScan={() => {
            setPicking(false);
            setScanning(true);
          }}
          onPick={(exercise) => {
            setPicking(false);
            addExercise(exercise);
          }}
        />
      ) : null}
    </>
  );
}

// Rango general para proponer carga cuando no hay un programa que fije otro.
const FREE_REPS = { min: 8, max: 12, rir: 2 };

/** Al subir la carga las repeticiones vuelven al piso del rango, como dice la propuesta. */
function applyProposal(sets: LoggedSet[], proposal: LoadProposal, repsMin: number | null) {
  return sets.map((s) => {
    if (s.done) return s;
    const reps = proposal.action === "increase" && repsMin !== null ? repsMin : s.reps;
    return { ...s, weightKg: proposal.weightKg, reps };
  });
}

function freeSuggestion(exercise: CatalogExercise, last: LastPerformance[string] | undefined) {
  if (!exercise.tracksWeight || !last) return undefined;
  const proposal = proposeLoad({
    last: last.sets,
    repsMin: FREE_REPS.min,
    repsMax: FREE_REPS.max,
    targetRir: FREE_REPS.rir,
    incrementKg: loadIncrementKg(exercise),
  });
  return proposal ? { proposal } : undefined;
}

/** Mantiene la pantalla encendida durante la sesión. Sin soporte, simplemente no hace nada. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    async function acquire() {
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) void next.release();
        else lock = next;
      } catch {
        // Batería baja o pestaña oculta: se reintenta al volver.
      }
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [active]);
}

/**
 * Serie nueva: el peso sigue al de hoy; las repeticiones, a las de esa misma serie
 * la última vez. El esfuerzo no se copia: un RIR que nadie declaró falsearía los récords.
 */
function newSet(exercise: CatalogExercise, last: LastPerformance[string] | undefined, current: LoggedSet[]): LoggedSet {
  const previous = current.at(-1);
  const workingCount = current.filter((s) => s.type !== "warmup").length;
  const fromLast = last?.sets[workingCount] ?? last?.sets.at(-1);
  return {
    id: crypto.randomUUID(),
    weightKg: exercise.tracksWeight ? (previous?.weightKg ?? fromLast?.weightKg ?? null) : null,
    reps: fromLast?.reps ?? previous?.reps ?? null,
    rir: null,
    durationSeconds: exercise.tracksDuration ? (previous?.durationSeconds ?? fromLast?.durationSeconds ?? null) : null,
    distanceMeters: previous?.distanceMeters ?? null,
    done: false,
    completedAt: null,
  };
}

function Elapsed({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <p className="figure text-[28px] leading-none">{clock((now - new Date(since).getTime()) / 1000)}</p>;
}

function clock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

function lastSummary(last: LastPerformance[string]) {
  const sets = last.sets.filter((s) => s.reps || s.durationSeconds);
  if (!sets.length) return null;
  const parts = sets.map((s) =>
    s.durationSeconds && !s.reps ? clock(s.durationSeconds) : s.weightKg ? `${fmt(s.weightKg)} × ${s.reps}` : `${s.reps} reps`,
  );
  const days = Math.round((Date.now() - new Date(last.date).getTime()) / 86_400_000);
  const when = days <= 0 ? "hoy" : days === 1 ? "ayer" : `hace ${days} días`;
  return `La última vez, ${when}: ${parts.join(", ")}`;
}

function ExerciseCard({
  exercise,
  logged,
  last,
  catalog,
  lastAll,
  inSession,
  onSwap,
  onChange,
  onRemove,
  onSetDone,
}: {
  exercise: CatalogExercise;
  logged: LoggedExercise;
  last: LastPerformance[string] | undefined;
  catalog: CatalogExercise[];
  lastAll: LastPerformance;
  inSession: string[];
  onSwap: (next: CatalogExercise) => void;
  onChange: (next: LoggedExercise) => void;
  onRemove: () => void;
  onSetDone: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removed, setRemoved] = useState<{ set: LoggedSet; index: number } | null>(null);
  useEffect(() => {
    if (!removed) return;
    const id = setTimeout(() => setRemoved(null), 5000);
    return () => clearTimeout(id);
  }, [removed]);
  const setSet = (id: string, patch: Partial<LoggedSet>) =>
    onChange({ ...logged, sets: logged.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const summary = last ? lastSummary(last) : null;
  const showWeight = exercise.tracksWeight;
  const durationOnly = exercise.tracksDuration && !exercise.tracksWeight;
  const showReps = !durationOnly;

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-[0_1px_3px_rgb(0_0_0/0.08)] md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="heading text-xl">{exercise.name}</h2>
          <p className="mt-1 text-sm text-muted">{summary ?? "Primera vez: empieza liviano, con un peso que te permita hacer 12 repeticiones y te sobren al menos 3."}</p>
        </div>
        {confirmRemove ? (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={onRemove} className="min-h-11 rounded-lg bg-danger-tint px-3 text-sm font-semibold text-danger">
              Quitar
            </button>
            <button type="button" onClick={() => setConfirmRemove(false)} aria-label="Cancelar" className="grid size-11 place-items-center rounded-lg text-muted">
              <X aria-hidden size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label={`Quitar ${exercise.name}`}
            className="grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-sunken"
          >
            <Trash2 aria-hidden size={18} />
          </button>
        )}
      </div>

      {logged.plan ? <PlanTarget plan={logged.plan} /> : null}
      {logged.plan?.proposal ? (
        <ProposalCard
          plan={logged.plan}
          onDecide={(decision) => {
            const plan = { ...logged.plan!, proposalDecision: decision };
            onChange({
              ...logged,
              plan,
              sets: decision === "accepted" ? applyProposal(logged.sets, logged.plan!.proposal!, logged.plan!.repsMin) : logged.sets,
            });
          }}
        />
      ) : null}

      {!logged.plan && logged.suggestion?.proposal ? (
        <ProposalCard
          plan={logged.suggestion}
          onDecide={(decision) => {
            onChange({
              ...logged,
              suggestion: { ...logged.suggestion!, proposalDecision: decision },
              sets: decision === "accepted" ? applyProposal(logged.sets, logged.suggestion!.proposal!, FREE_REPS.min) : logged.sets,
            });
          }}
        />
      ) : null}

      <ExerciseHelp
        exercise={exercise}
        catalog={catalog}
        last={lastAll}
        inSession={inSession}
        openFirst={logged.identifiedBy === "camera" && !last && !logged.sets.some((s) => s.done)}
        canSwap={!logged.sets.some((s) => s.done)}
        onSwap={onSwap}
      />

      <div className="mt-4 grid gap-2">
        <div className={`${SET_GRID} px-1 text-xs font-medium text-muted`}>
          <span>Serie</span>
          <span>{showWeight ? "Kg" : durationOnly ? "Min" : ""}</span>
          <span>{showReps ? "Reps" : ""}</span>
          <span title="Repeticiones que te quedaban en reserva">{showReps ? "En reserva" : ""}</span>
          <span className="sr-only">Hecha</span>
        </div>
        {logged.sets.map((set, i) => (
          <SetRow
            key={set.id}
            label={setLabel(logged.sets, i)}
            set={set}
            previous={set.type === "warmup" ? undefined : previousLabel(last, logged.sets, i)}
            showWeight={showWeight}
            showReps={showReps}
            showDuration={durationOnly}
            onChange={(patch) => setSet(set.id, patch)}
            onRemove={
              logged.sets.length > 1
                ? () => {
                    setRemoved({ set, index: i });
                    onChange({ ...logged, sets: logged.sets.filter((s) => s.id !== set.id) });
                  }
                : undefined
            }
            onDone={() => {
              const done = !set.done;
              setSet(set.id, { done, completedAt: done ? new Date().toISOString() : null });
              if (done) {
                navigator.vibrate?.(30);
                onSetDone();
              }
            }}
          />
        ))}
      </div>

      {removed ? (
        <div role="status" className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-ink px-4 py-1.5 text-[15px] text-chalk">
          Serie borrada
          <button
            type="button"
            onClick={() => {
              const sets = [...logged.sets];
              sets.splice(removed.index, 0, removed.set);
              onChange({ ...logged, sets });
              setRemoved(null);
            }}
            className="min-h-11 rounded-lg px-3 font-semibold underline"
          >
            Deshacer
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onChange({ ...logged, sets: [...logged.sets, newSet(exercise, last, logged.sets)] })}
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[15px] font-semibold text-cobalt hover:bg-cobalt-tint"
      >
        <Plus aria-hidden size={18} />
        Agregar serie
      </button>
    </section>
  );
}

function PlanTarget({ plan }: { plan: NonNullable<LoggedExercise["plan"]> }) {
  const series = `${plan.sets} ${plan.sets === 1 ? "serie" : "series"}`;
  const target = plan.durationS
    ? `${series} de ${plan.durationS} segundos`
    : `${series} de ${plan.repsMin === plan.repsMax ? plan.repsMin : `${plan.repsMin} a ${plan.repsMax}`} repeticiones, dejando ${plan.rir} en reserva`;
  return <p className="mt-3 text-[15px] font-medium">Meta: {target}</p>;
}

/** Propuesta de carga. Nunca se aplica sola: el atleta la acepta o sigue con lo que venía. */
function ProposalCard({
  plan,
  onDecide,
}: {
  plan: Pick<ExercisePlan, "proposal" | "proposalDecision">;
  onDecide: (decision: "accepted" | "kept") => void;
}) {
  const proposal = plan.proposal!;
  if (proposal.action === "keep") return <p className="mt-2 text-[15px] leading-relaxed text-muted">{proposal.reason}</p>;
  if (plan.proposalDecision) {
    return (
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        {plan.proposalDecision === "accepted" ? `Vas con ${fmt(proposal.weightKg)} kg.` : "Sigues con el peso que traías."}
      </p>
    );
  }
  return (
    <div className="mt-3 rounded-xl bg-cobalt-tint p-3">
      <p className="font-semibold">Propuesta: {fmt(proposal.weightKg)} kg</p>
      <p className="mt-1 text-[15px] leading-relaxed">{proposal.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => onDecide("accepted")} className={`${buttonPrimary} min-h-11 px-4`}>
          Aceptar
        </button>
        <button type="button" onClick={() => onDecide("kept")} className={`${buttonQuiet} min-h-11 bg-surface px-4`}>
          Seguir igual
        </button>
      </div>
    </div>
  );
}

const cell =
  "h-12 w-full min-w-0 rounded-lg border border-line bg-surface px-2 text-center text-[18px] font-semibold tabular-nums outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/30 disabled:opacity-60";

function NumberCell({
  value,
  onChange,
  label,
  decimal,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  decimal?: boolean;
  disabled?: boolean;
}) {
  // Texto local para poder escribir "82," sin que se borre la coma.
  const [text, setText] = useState(value === null ? "" : fmt(value));
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : value === null ? "" : fmt(value);
  return (
    <input
      aria-label={label}
      inputMode={decimal ? "decimal" : "numeric"}
      size={1}
      value={shown}
      disabled={disabled}
      onFocus={(e) => {
        setText(value === null ? "" : fmt(value));
        setFocused(true);
        requestAnimationFrame(() => e.target.select());
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const raw = decimal ? e.target.value.replace(/[^\d.,]/g, "") : e.target.value.replace(/\D/g, "");
        setText(raw);
        const n = parseDecimal(raw);
        onChange(n === null ? null : decimal ? n : Math.round(n));
      }}
      className={cell}
    />
  );
}

const SET_GRID = "grid grid-cols-[2rem_1fr_1fr_4.5rem_3.5rem] items-center gap-2";

/** Los calentamientos no gastan número: la serie 1 es la primera efectiva. */
function setLabel(sets: LoggedSet[], index: number) {
  if (sets[index].type === "warmup") return "C";
  return String(sets.slice(0, index + 1).filter((s) => s.type !== "warmup").length);
}

function previousLabel(last: LastPerformance[string] | undefined, sets: LoggedSet[], index: number) {
  const position = sets.slice(0, index).filter((s) => s.type !== "warmup").length;
  const before = last?.sets[position];
  if (!before) return undefined;
  if (before.durationSeconds && !before.reps) return clock(before.durationSeconds);
  if (!before.reps) return undefined;
  return before.weightKg ? `${fmt(before.weightKg)} × ${before.reps}` : `${before.reps} reps`;
}

function SetRow({
  label,
  set,
  previous,
  showWeight,
  showReps,
  showDuration,
  onChange,
  onRemove,
  onDone,
}: {
  label: string;
  set: LoggedSet;
  previous?: string;
  showWeight: boolean;
  showReps: boolean;
  showDuration: boolean;
  onChange: (patch: Partial<LoggedSet>) => void;
  onRemove?: () => void;
  onDone: () => void;
}) {
  const canComplete = showDuration ? !!set.durationSeconds : !!set.reps;
  const [menu, setMenu] = useState(false);
  const warmup = set.type === "warmup";
  const name = warmup ? "calentamiento" : `serie ${label}`;
  return (
    <div className={`rounded-xl p-1 ${set.done ? "bg-ok-tint" : ""}`}>
      <div className={SET_GRID}>
      <button
        type="button"
        onClick={() => setMenu(!menu)}
        aria-expanded={menu}
        aria-label={`Opciones de ${name}`}
        className={`figure h-14 rounded-lg text-center text-lg ${warmup ? "text-amber" : "text-muted"}`}
      >
        {label}
      </button>
      {showWeight ? (
        <NumberCell label={`Kilos, ${name}`} value={set.weightKg} onChange={(weightKg) => onChange({ weightKg })} decimal disabled={set.done} />
      ) : showDuration ? (
        <NumberCell
          label={`Minutos, ${name}`}
          value={set.durationSeconds === null ? null : Math.round((set.durationSeconds / 60) * 10) / 10}
          onChange={(min) => onChange({ durationSeconds: min === null ? null : Math.round(min * 60) })}
          decimal
          disabled={set.done}
        />
      ) : (
        <span />
      )}
      {showReps ? (
        <NumberCell label={`Repeticiones, ${name}`} value={set.reps} onChange={(reps) => onChange({ reps })} disabled={set.done} />
      ) : (
        <span />
      )}
      {showReps ? (
        <select
          aria-label={`Repeticiones en reserva, ${name}`}
          value={set.rir ?? ""}
          disabled={set.done}
          onChange={(e) => onChange({ rir: e.target.value === "" ? null : Number(e.target.value) })}
          className={`${cell} appearance-none`}
        >
          <option value="">-</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4+</option>
        </select>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onDone}
        disabled={!canComplete && !set.done}
        aria-pressed={set.done}
        aria-label={set.done ? `Desmarcar ${name}` : `Marcar ${name} como hecha`}
        className="grid h-14 place-items-center rounded-lg bg-sunken text-muted disabled:opacity-40 aria-pressed:bg-ok aria-pressed:text-surface"
      >
        <Check aria-hidden size={24} strokeWidth={3} />
      </button>
      </div>
      {previous ? <p className="mt-0.5 pl-10 text-xs text-muted tabular-nums">Antes: {previous}</p> : null}
      {menu ? (
        <div className="mt-1 flex flex-wrap gap-1.5 pl-10">
          <button
            type="button"
            aria-pressed={warmup}
            onClick={() => {
              onChange({ type: warmup ? "working" : "warmup" });
              setMenu(false);
            }}
            className="min-h-11 rounded-lg bg-sunken px-3 text-sm font-semibold aria-pressed:bg-amber-tint"
          >
            {warmup ? "Volver a efectiva" : "Es calentamiento"}
          </button>
          {onRemove ? (
            <button type="button" onClick={onRemove} className="min-h-11 rounded-lg bg-danger-tint px-3 text-sm font-semibold text-danger">
              Borrar serie
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RestTimer({
  rest,
  onChange,
}: {
  rest: RestState;
  onChange: (r: RestState | null) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const buzzed = useRef(false);
  const remaining = Math.ceil((rest.endsAt - now) / 1000);

  useEffect(() => {
    buzzed.current = false;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [rest.endsAt]);

  useEffect(() => {
    if (remaining <= 0 && !buzzed.current) {
      buzzed.current = true;
      // Terminó mientras la app estaba cerrada: ya no hay nada que avisar.
      if (remaining < -4) {
        onChange(null);
        return;
      }
      navigator.vibrate?.([200, 100, 200]);
      const id = setTimeout(() => onChange(null), 4000);
      return () => clearTimeout(id);
    }
  }, [remaining, onChange]);

  const adjust = (delta: number) => {
    const total = Math.max(15, rest.total + delta);
    if (rest.exerciseId) workoutStore.setRestFor(rest.exerciseId, total);
    onChange({ ...rest, endsAt: rest.endsAt + delta * 1000, total });
  };
  const progress = Math.min(1, Math.max(0, 1 - remaining / rest.total));

  return (
    <div
      role="timer"
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-3 pb-2 md:bottom-4 md:left-60 md:px-10"
    >
      <div className="relative mx-auto flex max-w-3xl items-center gap-2 overflow-hidden rounded-2xl bg-ink p-2 pl-4 text-chalk shadow-lg">
        <span aria-hidden className="absolute inset-y-0 left-0 bg-cobalt/35" style={{ width: `${progress * 100}%` }} />
        <Timer aria-hidden size={20} className="relative shrink-0" />
        <p className="relative flex-1 font-semibold">
          {remaining > 0 ? (
            <>
              Descanso <span className="figure ml-1 text-[22px]">{clock(remaining)}</span>
            </>
          ) : (
            <span role="status">A la siguiente serie</span>
          )}
        </p>
        <button type="button" onClick={() => adjust(-15)} aria-label="Restar 15 segundos" className="relative grid size-11 place-items-center rounded-xl bg-chalk/10">
          <Minus aria-hidden size={18} />
        </button>
        <button type="button" onClick={() => adjust(15)} aria-label="Sumar 15 segundos" className="relative grid size-11 place-items-center rounded-xl bg-chalk/10">
          <Plus aria-hidden size={18} />
        </button>
        <button type="button" onClick={() => onChange(null)} className="relative min-h-11 rounded-xl bg-chalk/10 px-3 text-sm font-semibold">
          Saltar
        </button>
      </div>
    </div>
  );
}

function ExercisePicker({
  catalog,
  last,
  initialQuery,
  onPick,
  onScan,
  onClose,
}: {
  catalog: CatalogExercise[];
  last: LastPerformance;
  initialQuery: string;
  onPick: (e: CatalogExercise) => void;
  onScan: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const q = normalize(query.trim());
  const results = q
    ? catalog.filter((e) => [e.name, ...e.aliases].some((t) => normalize(t).includes(q)))
    : catalog;
  const recent = q
    ? []
    : Object.entries(last)
        .sort((a, b) => b[1].date.localeCompare(a[1].date))
        .slice(0, 6)
        .map(([id]) => catalog.find((e) => e.id === id))
        .filter((e): e is CatalogExercise => !!e);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label="Elegir ejercicio"
      className="m-0 mt-auto h-[88dvh] max-h-none w-full max-w-none rounded-t-3xl bg-surface p-0 text-ink backdrop:bg-ink/50 md:m-auto md:h-[80dvh] md:max-w-xl md:rounded-3xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-line p-3">
          <label className="flex flex-1 items-center gap-2 rounded-xl bg-sunken px-3">
            <Search aria-hidden size={20} className="text-muted" />
            <span className="sr-only">Buscar ejercicio</span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca: jalón, prensa, sentadilla…"
              className="h-12 min-w-0 flex-1 bg-transparent text-[17px] outline-none"
            />
          </label>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Cerrar" className="grid size-12 place-items-center rounded-xl text-muted">
            <X aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-2">
          <button
            type="button"
            onClick={onScan}
            className="mb-1 flex min-h-14 w-full items-center gap-3 rounded-xl bg-cobalt-tint px-3 py-2 text-left font-semibold"
          >
            <Camera aria-hidden size={20} className="shrink-0 text-cobalt" />
            Identificar máquina con la cámara
          </button>
          {recent.length ? (
            <>
              <p className="px-3 pt-2 pb-1 text-sm font-medium text-muted">Hechos hace poco</p>
              <ExerciseList items={recent} onPick={onPick} />
              <p className="px-3 pt-4 pb-1 text-sm font-medium text-muted">Todos</p>
            </>
          ) : null}
          {results.length ? (
            <ExerciseList items={results} onPick={onPick} />
          ) : (
            <p className="px-3 py-6 leading-relaxed text-muted">
              No encontramos “{query}”. Prueba con otro nombre, por ejemplo “polea” o “máquina”.
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}

function ExerciseList({ items, onPick }: { items: CatalogExercise[]; onPick: (e: CatalogExercise) => void }) {
  return (
    <ul>
      {items.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => onPick(e)}
            className="flex min-h-14 w-full flex-col justify-center rounded-xl px-3 py-2 text-left hover:bg-sunken focus-visible:bg-sunken"
          >
            <span className="font-medium">{e.name}</span>
            <span className="text-sm text-muted">{e.primaryMuscles.map((m) => MUSCLE_LABELS[m] ?? m).join(", ")}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const SAVE_TIMEOUT_MS = 10_000;

const RPE_HINTS: Record<number, string> = {
  1: "Muy fácil",
  3: "Suave",
  5: "Moderado",
  7: "Duro",
  9: "Muy duro",
  10: "Al límite",
};

const FEELINGS = ["Muy mal", "Mal", "Normal", "Bien", "Excelente"];

function FinishPanel({
  workout,
  byId,
  onBack,
  onDiscard,
  onDone,
}: {
  workout: ActiveWorkout;
  byId: Map<string, CatalogExercise>;
  onBack: () => void;
  onDiscard: () => void;
  onDone: (o: Outcome) => void;
}) {
  const [rpe, setRpe] = useState<number | null>(null);
  const [enjoyment, setEnjoyment] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pending, startTransition] = useTransition();

  const done = workout.exercises.flatMap((e, ei) =>
    e.sets.filter((s) => s.done).map((s) => ({ ...s, exerciseId: e.exerciseId, identifiedBy: e.identifiedBy, ei })),
  );
  const volume = done.filter((s) => s.type !== "warmup").reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
  const [openedAt] = useState(() => Date.now());
  const minutes = Math.round((openedAt - new Date(workout.startedAt).getTime()) / 60000);
  const exerciseCount = new Set(done.map((s) => s.exerciseId)).size;

  function save() {
    setError(null);
    const payload: WorkoutPayload = {
      id: workout.id,
      plannedSessionId: workout.plannedSessionId,
      startedAt: workout.startedAt,
      endedAt: new Date().toISOString(),
      sessionRpe: rpe,
      enjoyment,
      notes,
      sets: done.map((s, position) => ({
        id: s.id,
        exerciseId: s.exerciseId,
        identifiedBy: s.identifiedBy,
        type: s.type ?? "working",
        position,
        weightKg: s.weightKg,
        reps: s.reps,
        rir: s.rir,
        durationSeconds: s.durationSeconds,
        distanceMeters: s.distanceMeters,
        completedAt: s.completedAt ?? new Date().toISOString(),
      })),
    };
    startTransition(async () => {
      try {
        // Con señal débil no se deja esperando: a los 10 s pasa a la bandeja. Si el
        // servidor también lo recibe no se duplica, porque los ids los genera el cliente.
        const result = await Promise.race([
          saveWorkout(payload),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), SAVE_TIMEOUT_MS)),
        ]);
        if (!result.ok) return setError(result.error);
        onDone({ kind: "saved", records: result.records });
      } catch {
        // Sin conexión: queda en el teléfono y se sube sola después.
        workoutStore.enqueue(payload);
        onDone({ kind: "queued" });
      }
    });
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="heading text-[32px]">Buen trabajo</h1>
        <dl className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Minutos", value: fmt(minutes) },
            { label: "Series", value: fmt(done.length) },
            { label: "Kg movidos", value: fmt(Math.round(volume)) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-surface p-3.5 shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="figure mt-1 text-[28px]">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-muted">
          {exerciseCount} {exerciseCount === 1 ? "ejercicio" : "ejercicios"}:{" "}
          {[...new Set(done.map((s) => byId.get(s.exerciseId)?.name))].filter(Boolean).join(", ")}
        </p>
      </div>

      <fieldset>
        <legend className="heading text-xl">¿Qué tan duro fue?</legend>
        <p className="mt-1 text-[15px] text-muted">De 1 a 10, la sesión completa. Nos ayuda a dosificar la próxima.</p>
        <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={rpe === n}
              onClick={() => setRpe(n)}
              className="figure h-12 rounded-xl bg-surface text-xl shadow-[0_1px_2px_rgb(0_0_0/0.08)] aria-pressed:bg-cobalt aria-pressed:text-cobalt-ink"
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-2 h-5 text-sm font-medium">{rpe ? (RPE_HINTS[rpe] ?? RPE_HINTS[rpe - 1] ?? "") : ""}</p>
      </fieldset>

      <fieldset>
        <legend className="heading text-xl">¿Cómo te sentiste?</legend>
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {FEELINGS.map((label, i) => (
            <button
              key={label}
              type="button"
              aria-pressed={enjoyment === i + 1}
              onClick={() => setEnjoyment(i + 1)}
              className="min-h-12 rounded-xl bg-surface px-1 text-[13px] leading-tight font-semibold shadow-[0_1px_2px_rgb(0_0_0/0.08)] aria-pressed:bg-cobalt aria-pressed:text-cobalt-ink sm:text-[15px]"
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-2">
        <span className="heading text-xl">Notas</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Molestias, cómo dormiste, qué cambiarías…"
          className="rounded-xl border border-line bg-surface px-4 py-3 text-[17px] outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/30"
        />
      </label>

      {error ? (
        <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-[15px] text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3">
        <button type="button" onClick={save} disabled={pending} className={buttonPrimary}>
          {pending ? "Guardando…" : "Guardar entrenamiento"}
        </button>
        <button type="button" onClick={onBack} className={buttonQuiet}>
          Seguir entrenando
        </button>
        {confirmDiscard ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-danger-tint p-3">
            <p className="flex-1 text-[15px] text-danger">Se borran todas las series de esta sesión.</p>
            <button type="button" onClick={onDiscard} className="min-h-11 rounded-lg bg-danger px-4 font-semibold text-surface">
              Descartar
            </button>
            <button type="button" onClick={() => setConfirmDiscard(false)} className="min-h-11 px-3 font-semibold">
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDiscard(true)} className="min-h-11 text-[15px] font-medium text-muted">
            Descartar sesión
          </button>
        )}
      </div>
    </div>
  );
}

function Done({ outcome }: { outcome: Outcome }) {
  return (
    <div className="grid gap-6">
      <div className="grid size-14 place-items-center rounded-2xl bg-ok-tint text-ok">
        <Check aria-hidden size={30} strokeWidth={3} />
      </div>
      {outcome.kind === "saved" ? (
        <>
          <h1 className="heading text-[32px]">Entrenamiento guardado</h1>
          {outcome.records.length ? (
            <ul className="grid gap-3">
              {outcome.records.map((r) => (
                <li key={r.exercise} className="flex items-center gap-4 rounded-2xl bg-amber-tint p-4">
                  <Trophy aria-hidden className="shrink-0 text-amber" />
                  <p className="text-[16px] leading-relaxed">
                    <strong className="font-semibold">Nuevo récord en {r.exercise}.</strong> Tu máximo estimado sube a{" "}
                    {fmt(r.kg)} kg (antes {fmt(r.previousKg)} kg).
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[17px] leading-relaxed text-muted">
              Quedó en tu historial. Con cada sesión afinamos tus cargas para la siguiente.
            </p>
          )}
        </>
      ) : (
        <>
          <h1 className="heading text-[32px]">Guardado en tu teléfono</h1>
          <p className="text-[17px] leading-relaxed text-muted">
            No hay conexión ahora. Tu entrenamiento se sube solo apenas vuelva internet; no tienes que hacer nada.
          </p>
        </>
      )}
      <Link href="/entrenar" className={buttonPrimary}>
        Volver a Entrenar
      </Link>
    </div>
  );
}
