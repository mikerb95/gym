"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { saveWorkout } from "@/app/(app)/entrenar/actions";
import { NO_REVIEW, subscribe, workoutStore, type ReviewItem } from "@/lib/workout-store";

/** Sube los entrenos guardados sin conexión apenas se pueda, y nunca borra uno rechazado. */
export function OutboxSync() {
  const router = useRouter();
  const review = useSyncExternalStore(subscribe, workoutStore.getReview, () => NO_REVIEW);

  useEffect(() => {
    let running = false;
    async function flush() {
      if (running || !navigator.onLine) return;
      running = true;
      let uploaded = false;
      for (const payload of workoutStore.getOutbox()) {
        try {
          const result = await saveWorkout(payload);
          if (result.ok) {
            workoutStore.dequeue(payload.id);
            uploaded = true;
          } else {
            // Reintentar no lo arregla, pero el entreno sigue siendo de la persona.
            workoutStore.moveToReview(payload, result.error);
          }
        } catch {
          break; // Sigue sin conexión: se reintenta en el próximo evento.
        }
      }
      running = false;
      if (uploaded) router.refresh();
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") void flush();
    };
    void flush();
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, review.length]);

  if (review.length === 0) return null;
  return (
    <div className="grid gap-2 px-4 pt-4 md:px-10">
      {review.map((item) => (
        <ReviewNotice key={item.payload.id} item={item} />
      ))}
    </div>
  );
}

function ReviewNotice({ item }: { item: ReviewItem }) {
  const [downloaded, setDownloaded] = useState(false);
  const day = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" }).format(new Date(item.payload.startedAt));

  async function download() {
    const name = `steadyrep-entreno-${item.payload.startedAt.slice(0, 10)}.json`;
    const file = new File([JSON.stringify(item.payload, null, 2)], name, { type: "application/json" });
    // En la app Android las descargas de un blob no son confiables: se usa compartir.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        setDownloaded(true);
      } catch {
        // Canceló: sin copia a salvo no se ofrece descartar.
      }
      return;
    }
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setDownloaded(true);
  }

  const action = "min-h-11 rounded-lg bg-surface px-3 text-sm font-semibold";
  return (
    <div role="alert" className="rounded-xl bg-amber-tint px-4 py-3 text-[15px] leading-relaxed">
      <p>
        <span className="font-semibold">Tu entreno del {day} no se pudo subir.</span> Sigue guardado en este teléfono. Motivo: {item.error}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => workoutStore.retryReview(item.payload.id)} className={action}>
          Reintentar
        </button>
        <button type="button" onClick={() => void download()} className={action}>
          Descargar copia
        </button>
        {/* Descartar solo aparece con una copia a salvo. */}
        {downloaded ? (
          <button type="button" onClick={() => workoutStore.discardReview(item.payload.id)} className={`${action} text-danger`}>
            Descartar
          </button>
        ) : null}
      </div>
    </div>
  );
}
