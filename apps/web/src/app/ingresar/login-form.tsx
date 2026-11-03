"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonPrimary } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const field =
  "block w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-[17px] outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/30";

/** Solo rutas internas, para que `next` no sirva para redirigir a otro sitio. */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function describe(error: { message: string; status?: number; code?: string }) {
  if (error.status === 429 || error.code === "over_email_send_rate_limit")
    return "Pediste varios códigos seguidos. Espera un minuto y vuelve a intentarlo.";
  if (error.code === "otp_expired" || /expired|invalid/i.test(error.message))
    return "El código no es válido o ya venció. Revisa los 6 dígitos o pide uno nuevo.";
  if (/fetch|network/i.test(error.message)) return "No hay conexión. Revisa tu internet e inténtalo de nuevo.";
  return "No pudimos completar el ingreso. Inténtalo de nuevo en un momento.";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "enlace" ? "El enlace no es válido o ya venció. Pide uno nuevo." : null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function sendCode() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const { error } = await createClient().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) return setError(describe(error));
      setStep("code");
      setNotice(
        `Enviamos un correo a ${email.trim().toLowerCase()}. Ábrelo en este mismo dispositivo y toca el enlace para entrar. Puede tardar un minuto; revisa también spam.`,
      );
    });
  }

  function verify(token: string) {
    setError(null);
    startTransition(async () => {
      const { error } = await createClient().auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: "email",
      });
      if (error) {
        setCode("");
        return setError(describe(error));
      }
      router.replace(next);
      router.refresh();
    });
  }

  if (step === "email") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendCode();
        }}
        className="grid gap-4"
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Correo electrónico</span>
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className={field}
          />
        </label>
        {error ? (
          <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-[15px] text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={pending || !email} className={buttonPrimary}>
          {pending ? "Enviando…" : "Enviarme el enlace"}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        verify(code);
      }}
      className="grid gap-4"
    >
      {notice ? <p className="text-[15px] leading-relaxed">{notice}</p> : null}
      <label className="grid gap-2">
        <span className="text-sm font-medium text-muted">Si el correo trae un código de 6 dígitos, escríbelo aquí</span>
        <input
          required
          autoFocus
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(digits);
            if (digits.length === 6) verify(digits);
          }}
          className={`${field} figure text-center text-[32px] tracking-[0.4em]`}
        />
      </label>
      {error ? (
        <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-[15px] text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending || code.length !== 6} className={buttonPrimary}>
        {pending ? "Verificando…" : "Entrar"}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
          className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-muted"
        >
          <ArrowLeft aria-hidden size={18} />
          Cambiar correo
        </button>
        <button
          type="button"
          onClick={sendCode}
          disabled={pending}
          className="min-h-11 text-[15px] font-medium text-cobalt disabled:opacity-40"
        >
          Enviar otro correo
        </button>
      </div>
    </form>
  );
}
