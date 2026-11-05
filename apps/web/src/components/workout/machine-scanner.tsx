"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useOffline } from "next/offline";
import { Camera, Check, ChevronRight, RotateCcw, Search, X } from "lucide-react";
import { buttonPrimary, buttonQuiet } from "@/components/ui";
import { PHOTO_MAX_BYTES, PHOTO_MAX_EDGE, type MachineIdentification } from "@/lib/machine-recognition";
import { MUSCLE_LABELS, type CatalogExercise } from "@/lib/workout";

type PhotoKind = keyof typeof PHOTO_MAX_EDGE;
type Result = Extract<MachineIdentification, { ok: true }>;
type Step =
  | { kind: "name" }
  | { kind: "machine" }
  | { kind: "analyzing" }
  | { kind: "result"; result: Result }
  | { kind: "failed"; message: string; canRetry: boolean };

type Props = {
  catalog: CatalogExercise[];
  onPick: (exercise: CatalogExercise) => void;
  /** Abre la búsqueda manual, con lo que se alcanzó a reconocer como punto de partida. */
  onManual: (query: string) => void;
  onClose: () => void;
};

/** Reduce la foto a JPEG: sube rápido con mala señal y respeta la orientación. */
async function toJpeg(file: File, kind: PhotoKind): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PHOTO_MAX_EDGE[kind] / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob || blob.size > PHOTO_MAX_BYTES) throw new Error("photo");
  return blob;
}

const FAILURES: Record<Exclude<MachineIdentification, { ok: true }>["reason"], { message: string; canRetry: boolean }> = {
  invalid: { message: "No pudimos procesar esas fotos. Prueba a tomarlas de nuevo.", canRetry: false },
  limit: { message: "Llegaste al límite de identificaciones por hoy. Puedes buscar el ejercicio a mano.", canRetry: false },
  unavailable: { message: "El reconocimiento no está disponible en este momento.", canRetry: true },
};

/**
 * Identifica una máquina con dos fotos: primero el nombre marcado en ella (se
 * puede saltar si no tiene) y luego la máquina. La persona siempre confirma el
 * ejercicio y siempre puede seguir a mano, con o sin señal.
 */
export function MachineScanner({ catalog, onPick, onManual, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const isOffline = useOffline();
  const [step, setStep] = useState<Step>({ kind: "name" });
  const [photos, setPhotos] = useState<{ name?: Blob; machine?: Blob }>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [namePreview, setNamePreview] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const previewUrl = useRef<string | null>(null);

  function showNamePreview(photo: Blob | null) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = photo ? URL.createObjectURL(photo) : null;
    setNamePreview(previewUrl.current);
  }

  useEffect(() => {
    dialog.current?.showModal();
    return () => {
      request.current?.abort();
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  async function analyze(current: { name?: Blob; machine?: Blob }) {
    if (!current.machine) return;
    setStep({ kind: "analyzing" });
    const body = new FormData();
    if (current.name) body.append("name", current.name, "nombre.jpg");
    body.append("machine", current.machine, "maquina.jpg");
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await fetch("/api/maquinas/identificar", { method: "POST", body, signal: controller.signal });
      const data = (await response.json()) as MachineIdentification;
      if (data.ok) setStep({ kind: "result", result: data });
      else setStep({ kind: "failed", ...FAILURES[data.reason] });
    } catch {
      if (controller.signal.aborted) return;
      setStep({ kind: "failed", message: "No pudimos conectarnos para identificar la máquina.", canRetry: true });
    }
  }

  async function capture(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    const kind: PhotoKind = step.kind === "name" ? "name" : "machine";
    try {
      const photo = await toJpeg(file, kind);
      const next = { ...photos, [kind]: photo };
      setPhotos(next);
      if (kind === "name") {
        showNamePreview(photo);
        setStep({ kind: "machine" });
      } else {
        await analyze(next);
      }
    } catch {
      setPhotoError("No pudimos leer esa foto. Inténtalo de nuevo.");
    }
  }

  function restart() {
    setPhotos({});
    showNamePreview(null);
    setPhotoError(null);
    setStep({ kind: "name" });
  }

  const hint = step.kind === "result" ? (step.result.readName ?? step.result.machineName ?? "") : "";

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label="Identificar máquina"
      className="m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-3xl bg-surface p-0 text-ink backdrop:bg-ink/50 md:m-auto md:max-w-xl md:rounded-3xl"
    >
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="heading text-xl">Identificar máquina</p>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Cerrar" className="-mt-2 -mr-2 grid size-12 shrink-0 place-items-center rounded-xl text-muted">
            <X aria-hidden />
          </button>
        </div>

        {/* capture abre la cámara nativa, tanto en la PWA como en la app Android. */}
        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void capture(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {isOffline && (step.kind === "name" || step.kind === "machine") ? (
          <Message title="Sin señal no podemos identificarla">Busca el ejercicio a mano. Lo que registres se guarda en tu teléfono.</Message>
        ) : step.kind === "name" ? (
          <CaptureStep
            number={1}
            title="Foto del nombre"
            description="Busca el nombre en la placa o la calcomanía de la máquina y acércate hasta que se lea completo."
            action="Tomar foto del nombre"
            error={photoError}
            onCapture={() => input.current?.click()}
          >
            <button type="button" onClick={() => { setPhotoError(null); setStep({ kind: "machine" }); }} className={`${buttonQuiet} w-full`}>
              No tiene nombre visible, continuar
              <ChevronRight aria-hidden size={18} />
            </button>
          </CaptureStep>
        ) : step.kind === "machine" ? (
          <CaptureStep
            number={2}
            title="Foto de la máquina"
            description="Aléjate hasta que se vea entera, mejor de lado o en diagonal. Procura que no salga ninguna persona."
            action="Tomar foto de la máquina"
            error={photoError}
            onCapture={() => input.current?.click()}
          >
            {namePreview ? (
              <div className="flex items-center gap-3 rounded-xl bg-ok-tint p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local, no pasa por el optimizador */}
                <img src={namePreview} alt="Tu foto del nombre" className="size-12 rounded-lg object-cover" />
                <p className="flex-1 text-[15px] font-medium">Foto del nombre lista</p>
                <button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[15px] font-semibold text-cobalt">
                  <RotateCcw aria-hidden size={16} />
                  Repetir
                </button>
              </div>
            ) : (
              <button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg px-2 text-[15px] font-semibold text-cobalt">
                <RotateCcw aria-hidden size={16} />
                Sí tiene nombre, volver
              </button>
            )}
          </CaptureStep>
        ) : step.kind === "analyzing" ? (
          <div role="status" className="grid gap-3 py-4">
            <div aria-hidden className="h-16 animate-pulse rounded-xl bg-sunken" />
            <div aria-hidden className="h-16 animate-pulse rounded-xl bg-sunken" />
            <p className="text-[15px] text-muted">Identificando la máquina…</p>
          </div>
        ) : step.kind === "result" ? (
          <ResultStep result={step.result} catalog={catalog} onPick={onPick} />
        ) : (
          <Message title="No se pudo identificar">{step.message}</Message>
        )}

        <div className="grid gap-2">
          {step.kind === "failed" && step.canRetry && !isOffline ? (
            <button type="button" onClick={() => void analyze(photos)} className={`${buttonPrimary} w-full`}>
              Intentar de nuevo
            </button>
          ) : null}
          {step.kind === "result" || step.kind === "failed" ? (
            <button type="button" onClick={restart} className={`${buttonQuiet} w-full`}>
              <RotateCcw aria-hidden size={18} />
              Tomar otras fotos
            </button>
          ) : null}
          <button type="button" onClick={() => onManual(hint)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-[15px] font-semibold text-cobalt">
            <Search aria-hidden size={16} />
            {step.kind === "result" && step.result.exerciseIds.length ? "No es ninguno, buscar a mano" : "Buscar a mano"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function CaptureStep({
  number,
  title,
  description,
  action,
  error,
  onCapture,
  children,
}: {
  number: number;
  title: string;
  description: string;
  action: string;
  error: string | null;
  onCapture: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-muted">Paso {number} de 2</p>
        <p className="heading mt-1 text-lg">{title}</p>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">{description}</p>
      </div>
      <button type="button" onClick={onCapture} className={`${buttonPrimary} w-full`}>
        <Camera aria-hidden size={20} />
        {action}
      </button>
      {error ? (
        <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-[15px] text-danger">
          {error}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function ResultStep({
  result,
  catalog,
  onPick,
}: {
  result: Result;
  catalog: CatalogExercise[];
  onPick: (exercise: CatalogExercise) => void;
}) {
  const candidates = result.exerciseIds
    .map((id) => catalog.find((e) => e.id === id))
    .filter((e): e is CatalogExercise => !!e);
  const seen = result.readName ? `Leímos “${result.readName}”.` : result.machineName ? `Parece: ${result.machineName}.` : null;

  if (!candidates.length) {
    return (
      <Message title="No la encontramos en el catálogo">
        {seen} Prueba con otras fotos o busca el ejercicio a mano.
      </Message>
    );
  }

  return (
    <div>
      <p className="heading text-lg">{result.confidence === "alta" ? "Confirma el ejercicio" : "¿Es alguno de estos?"}</p>
      {seen ? <p className="mt-1 text-[15px] text-muted">{seen}</p> : null}
      <ul className="mt-3 grid gap-2">
        {candidates.map((e, i) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onPick(e)}
              className={`flex min-h-16 w-full items-center gap-3 rounded-xl px-4 py-2 text-left active:scale-[0.99] ${i === 0 ? "bg-cobalt-tint" : "bg-sunken"}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{e.name}</span>
                <span className="block text-sm text-muted">{e.primaryMuscles.map((m) => MUSCLE_LABELS[m] ?? m).join(", ")}</span>
              </span>
              <Check aria-hidden size={20} className="shrink-0 text-cobalt" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status">
      <p className="heading text-lg">{title}</p>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}
