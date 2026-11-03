import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BRAND } from "@/lib/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(3rem,env(safe-area-inset-top))] pb-8">
      <p className="heading text-2xl">{BRAND.name}</p>
      <h1 className="heading mt-12 text-[32px] leading-tight">Entra con tu correo</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-muted">
        Te enviamos un enlace para entrar. Sin contraseñas que recordar. Si es tu primera vez, la cuenta se crea sola.
      </p>
      <div className="mt-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-auto pt-10 text-sm leading-relaxed text-muted">
        Al continuar aceptas los{" "}
        <Link href="/terminos" className="font-medium text-ink underline underline-offset-2">
          términos
        </Link>{" "}
        y la{" "}
        <Link href="/privacidad" className="font-medium text-ink underline underline-offset-2">
          política de tratamiento de datos
        </Link>
        .
      </p>
    </main>
  );
}
