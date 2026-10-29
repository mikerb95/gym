"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="heading text-[32px] md:text-[40px]">{title}</h1>
      {lead ? <p className="mt-2 max-w-[60ch] text-[17px] leading-relaxed text-muted">{lead}</p> : null}
    </header>
  );
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="heading text-xl">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Control de cifra con botones grandes, pensado para usar con el pulgar. */
export function Stepper({
  label,
  value,
  onChange,
  step,
  min = 0,
  max = 1000,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min?: number;
  max?: number;
  unit?: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-muted" id={`${label}-label`}>
        {label}
      </span>
      <div className="flex items-center gap-2" role="group" aria-labelledby={`${label}-label`}>
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          aria-label={`Restar ${step}`}
          className="grid size-14 shrink-0 place-items-center rounded-xl bg-sunken active:scale-95"
        >
          <Minus aria-hidden />
        </button>
        <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2.5">
          <span className="sr-only">{label}</span>
          <input
            inputMode="decimal"
            size={1}
            value={value}
            onChange={(e) => {
              const parsed = Number(e.target.value.replace(",", "."));
              if (!Number.isNaN(parsed)) onChange(clamp(parsed));
            }}
            className="figure w-full min-w-0 bg-transparent text-center text-[28px] outline-none"
          />
          {unit ? <span className="text-sm text-muted">{unit}</span> : null}
        </label>
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          aria-label={`Sumar ${step}`}
          className="grid size-14 shrink-0 place-items-center rounded-xl bg-sunken active:scale-95"
        >
          <Plus aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-muted">{label}</legend>
      <div className={`grid gap-1 rounded-xl bg-sunken p-1 ${options.length > 3 ? "grid-cols-2" : "grid-flow-col auto-cols-fr"}`}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className="min-h-11 rounded-lg px-3 py-1.5 text-[15px] leading-tight font-medium text-muted aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.12)] aria-pressed:ring-2 aria-pressed:ring-cobalt"
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-8">
      <p className="heading text-lg">{title}</p>
      <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">{children}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export const buttonPrimary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cobalt px-5 text-[16px] font-semibold text-cobalt-ink active:scale-[0.98] disabled:opacity-40";
export const buttonQuiet =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sunken px-5 text-[16px] font-semibold text-ink active:scale-[0.98]";
