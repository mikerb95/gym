"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, TriangleAlert } from "lucide-react";
import { buttonPrimary, buttonQuiet, Segmented, Stepper } from "@/components/ui";
import {
  ageOn,
  CONSENTS,
  EXPERIENCE,
  GOALS,
  onboardingSchema,
  PARQ_QUESTIONS,
  type ConsentPurpose,
  type OnboardingInput,
  type ParqId,
} from "@/lib/onboarding";
import { completeOnboarding } from "./actions";

type Draft = Omit<OnboardingInput, "parq" | "consents"> & {
  parq: Partial<Record<ParqId, boolean>>;
  consents: Record<ConsentPurpose, boolean>;
};

const STEPS = [
  { title: "Sobre ti", lead: "Con esto calculamos tu gasto de energía y tus cargas de partida." },
  { title: "Tu objetivo", lead: "Lo puedes cambiar cuando quieras. El plan se ajusta solo." },
  { title: "Tu salud", lead: "Es el cuestionario PAR-Q+, el estándar para empezar a entrenar con seguridad." },
  { title: "Por si algo pasa", lead: "Solo se usa si en un check-in reportas algo que preocupe." },
  { title: "Tus autorizaciones", lead: "Tus datos son tuyos. Aquí decides qué hacemos con ellos." },
] as const;

const field =
  "block w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-[17px] outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/30 aria-invalid:border-danger";

const STEP_FIELDS: string[][] = [
  ["fullName", "birthDate", "sex", "pregnant", "heightCm", "weightKg"],
  ["goal", "experience", "trainingDaysPerWeek", "sessionMinutes"],
  ["parq"],
  ["emergencyContactName", "emergencyContactPhone", "guardianName"],
  ["consents.service", "consents.sensitive_health", "consents.guardian"],
];

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>({
    fullName: "",
    birthDate: "",
    sex: "female",
    pregnant: false,
    heightCm: 165,
    weightKg: 65,
    goal: "recomposition",
    experience: "beginner",
    trainingDaysPerWeek: 3,
    sessionMinutes: 60,
    parqSkipped: false,
    parq: {},
    emergencyContactName: "",
    emergencyContactPhone: "",
    guardianName: "",
    consents: {
      service: false,
      sensitive_health: false,
      machine_photos_training: false,
      marketing: false,
      guardian: false,
    },
  });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const age = /^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate) ? ageOn(draft.birthDate) : null;
  const minor = age !== null && age < 18;
  const parqYes = PARQ_QUESTIONS.some((q) => draft.parq[q.id]);

  /** Valida solo los campos del paso actual antes de avanzar. */
  function validateStep(index: number) {
    const result = onboardingSchema.safeParse(draft);
    const stepErrors: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (STEP_FIELDS[index]!.some((f) => key === f || key.startsWith(`${f}.`))) stepErrors[key] ??= issue.message;
      }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    startTransition(async () => {
      const result = await completeOnboarding(draft);
      if (result && !result.ok) {
        setErrors(result.errors);
        const first = STEP_FIELDS.findIndex((fields) =>
          Object.keys(result.errors).some((k) => fields.some((f) => k === f || k.startsWith(`${f}.`))),
        );
        if (first >= 0) setStep(first);
      }
    });
  }

  const current = STEPS[step]!;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
      className="mt-8"
    >
      <div className="flex items-center gap-3">
        <ol className="flex flex-1 gap-1.5" aria-label="Progreso">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              aria-current={i === step ? "step" : undefined}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-cobalt" : "bg-line"}`}
            >
              <span className="sr-only">{s.title}</span>
            </li>
          ))}
        </ol>
        <span className="text-sm font-medium text-muted tabular-nums">
          Paso {step + 1} de {STEPS.length}
        </span>
      </div>

      <h1 className="heading mt-6 text-[32px] leading-tight">{current.title}</h1>
      <p className="mt-2 text-[17px] leading-relaxed text-muted">{current.lead}</p>

      <div className="mt-8 grid gap-6">
        {step === 0 ? (
          <>
            <Field label="¿Cómo te llamamos?" error={errors.fullName}>
              <input
                autoComplete="name"
                value={draft.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                aria-invalid={!!errors.fullName}
                className={field}
              />
            </Field>
            <Field label="Fecha de nacimiento" error={errors.birthDate}>
              <input
                type="date"
                autoComplete="bday"
                max={new Date().toISOString().slice(0, 10)}
                value={draft.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
                aria-invalid={!!errors.birthDate}
                className={field}
              />
            </Field>
            <div>
              <Segmented
                label="Sexo biológico"
                options={[
                  { value: "female", label: "Mujer" },
                  { value: "male", label: "Hombre" },
                ]}
                value={draft.sex}
                onChange={(sex) => setDraft((d) => ({ ...d, sex, pregnant: sex === "male" ? false : d.pregnant }))}
              />
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Lo usan las fórmulas de gasto calórico y grasa corporal. No cambia cómo te tratamos.
              </p>
            </div>
            {draft.sex === "female" ? (
              <Toggle
                checked={draft.pregnant}
                onChange={(pregnant) => set("pregnant", pregnant)}
                title="Estoy embarazada"
                detail="Nunca te propondremos déficit calórico y adaptamos los ejercicios."
              />
            ) : null}
            <div className="grid gap-6 md:grid-cols-2">
              <Stepper label="Estatura" value={draft.heightCm} onChange={(v) => set("heightCm", v)} step={1} min={120} max={230} unit="cm" />
              <Stepper label="Peso de hoy" value={draft.weightKg} onChange={(v) => set("weightKg", v)} step={0.5} min={30} max={300} unit="kg" />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Segmented label="¿Qué quieres lograr?" options={GOALS} value={draft.goal} onChange={(goal) => set("goal", goal)} />
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-muted">Tu experiencia</legend>
              <div className="grid gap-2">
                {EXPERIENCE.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    aria-pressed={draft.experience === e.value}
                    onClick={() => set("experience", e.value)}
                    className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 text-left aria-pressed:border-cobalt aria-pressed:bg-cobalt-tint"
                  >
                    <span>
                      <span className="block font-semibold">{e.label}</span>
                      <span className="block text-sm text-muted">{e.detail}</span>
                    </span>
                    {draft.experience === e.value ? <Check aria-hidden className="shrink-0 text-cobalt" /> : null}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-6 md:grid-cols-2">
              <Stepper
                label="Días por semana"
                value={draft.trainingDaysPerWeek}
                onChange={(v) => set("trainingDaysPerWeek", v)}
                step={1}
                min={1}
                max={7}
                unit="días"
              />
              <Stepper
                label="Tiempo por sesión"
                value={draft.sessionMinutes}
                onChange={(v) => set("sessionMinutes", v)}
                step={15}
                min={20}
                max={180}
                unit="min"
              />
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <button
              type="button"
              aria-pressed={draft.parqSkipped}
              onClick={() => set("parqSkipped", !draft.parqSkipped)}
              className="min-h-12 rounded-xl bg-sunken px-4 py-2 text-left font-semibold text-muted aria-pressed:bg-cobalt-tint aria-pressed:text-ink"
            >
              Prefiero no responder
              <span className="mt-0.5 block text-sm font-normal">
                No es obligatorio. Sin estas respuestas no podemos advertirte si conviene una valoración médica.
              </span>
            </button>
            {draft.parqSkipped ? null : (
            <ul className="grid gap-3">
              {PARQ_QUESTIONS.map((q) => (
                <li key={q.id} className="rounded-2xl bg-surface p-4 shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
                  <p className="text-[16px] leading-relaxed font-medium">{q.text}</p>
                  {"hint" in q ? <p className="mt-1 text-sm leading-relaxed text-muted">{q.hint}</p> : null}
                  <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label={q.text}>
                    {[
                      { value: false, label: "No" },
                      { value: true, label: "Sí" },
                    ].map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        aria-pressed={draft.parq[q.id] === o.value}
                        onClick={() => set("parq", { ...draft.parq, [q.id]: o.value })}
                        className="min-h-12 rounded-xl bg-sunken font-semibold text-muted aria-pressed:bg-cobalt aria-pressed:text-cobalt-ink"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            )}
            {errors.parq ? <ErrorText>{errors.parq}</ErrorText> : null}
            {parqYes && !draft.parqSkipped ? (
              <div className="flex gap-3 rounded-2xl bg-amber-tint p-4">
                <TriangleAlert aria-hidden className="mt-0.5 shrink-0 text-amber" />
                <p className="text-[15px] leading-relaxed">
                  Te recomendamos una valoración médica antes de subir la intensidad. Mientras tanto puedes usar la app:
                  empezaremos con cargas suaves, sin series al fallo, y te avisaremos si algo de lo que registras pide
                  parar.
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="-mt-2 text-[15px] leading-relaxed text-muted">
              Es opcional, pero lo recomendamos. Nunca lo contactamos sin que tú lo veas primero.
            </p>
            <Field label="Contacto de emergencia" error={errors.emergencyContactName}>
              <input
                autoComplete="off"
                placeholder="Nombre"
                value={draft.emergencyContactName}
                onChange={(e) => set("emergencyContactName", e.target.value)}
                className={field}
              />
            </Field>
            <Field label="Celular del contacto" error={errors.emergencyContactPhone}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="300 123 4567"
                value={draft.emergencyContactPhone}
                onChange={(e) => set("emergencyContactPhone", e.target.value)}
                className={field}
              />
            </Field>
            {minor ? (
              <div className="grid gap-4 rounded-2xl bg-cobalt-tint p-4">
                <p className="text-[15px] leading-relaxed">
                  Como eres menor de edad, tu papá, tu mamá o tu representante legal debe autorizar el uso de la app. Lo
                  hace en el siguiente paso.
                </p>
                <Field label="Nombre de tu representante legal" error={errors.guardianName}>
                  <input
                    value={draft.guardianName}
                    onChange={(e) => set("guardianName", e.target.value)}
                    aria-invalid={!!errors.guardianName}
                    className={field}
                  />
                </Field>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            {(Object.keys(CONSENTS) as ConsentPurpose[])
              .filter((p) => p !== "guardian" || minor)
              .map((purpose) => {
                const c = CONSENTS[purpose];
                const required = c.required || purpose === "guardian";
                const withoutHealth = purpose === "sensitive_health" && !draft.consents.sensitive_health;
                return (
                  <div key={purpose}>
                    <Toggle
                      checked={draft.consents[purpose]}
                      onChange={(value) => set("consents", { ...draft.consents, [purpose]: value })}
                      title={`${c.title}${required ? "" : " (opcional)"}`}
                      detail={c.text}
                    />
                    {errors[`consents.${purpose}`] ? <ErrorText>{errors[`consents.${purpose}`]}</ErrorText> : null}
                    {withoutHealth ? (
                      <p className="mt-2 px-1 text-sm leading-relaxed text-muted">
                        Sin esta autorización no guardamos tu peso, tu estatura ni tu cuestionario. Podrás usar las
                        herramientas generales, y activarla después desde tu perfil.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            <p className="text-sm leading-relaxed text-muted">
              Lee la{" "}
              <Link href="/privacidad" target="_blank" className="font-medium text-ink underline underline-offset-2">
                política de tratamiento de datos
              </Link>{" "}
              y los{" "}
              <Link href="/terminos" target="_blank" className="font-medium text-ink underline underline-offset-2">
                términos
              </Link>
              . Puedes revocar cualquier autorización desde tu perfil.
            </p>
          </>
        ) : null}
      </div>

      {errors._form ? <ErrorText>{errors._form}</ErrorText> : null}

      <div className="mt-10 flex gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setErrors({});
              setStep(step - 1);
            }}
            className={`${buttonQuiet} px-4`}
            aria-label="Paso anterior"
          >
            <ArrowLeft aria-hidden />
          </button>
        ) : null}
        <button type="submit" disabled={pending} className={`${buttonPrimary} flex-1`}>
          {step < STEPS.length - 1 ? "Continuar" : pending ? "Guardando…" : "Crear mi perfil"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </label>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <span role="alert" className="mt-1 block text-[15px] text-danger">
      {children}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  detail,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  detail: string;
}) {
  return (
    <label className="flex cursor-pointer gap-4 rounded-2xl bg-surface p-4 shadow-[0_1px_3px_rgb(0_0_0/0.08)] has-checked:bg-cobalt-tint">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 border-line bg-surface peer-checked:border-cobalt peer-checked:bg-cobalt peer-focus-visible:ring-2 peer-focus-visible:ring-cobalt/40"
      >
        {checked ? <Check size={16} strokeWidth={3} className="text-cobalt-ink" /> : null}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-[15px] leading-relaxed text-muted">{detail}</span>
      </span>
    </label>
  );
}
