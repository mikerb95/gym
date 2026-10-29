"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, Dumbbell, LineChart, Sun, UserRound, Users } from "lucide-react";
import { BRAND } from "@/lib/brand";

const ATHLETE_TABS = [
  { href: "/", label: "Hoy", icon: Sun },
  { href: "/entrenar", label: "Entrenar", icon: Dumbbell },
  { href: "/nutricion", label: "Nutrición", icon: Apple },
  { href: "/progreso", label: "Progreso", icon: LineChart },
  { href: "/perfil", label: "Perfil", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Escritorio: riel lateral con el cambio de modo siempre visible. */}
      <nav
        aria-label="Principal"
        className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col gap-1 border-r border-line bg-surface px-3 py-6 md:flex"
      >
        <span className="heading px-3 pb-6 text-2xl">{BRAND.name}</span>
        {ATHLETE_TABS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(pathname, href) ? "page" : undefined}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-muted hover:bg-sunken hover:text-ink aria-[current=page]:bg-cobalt-tint aria-[current=page]:text-ink"
          >
            <Icon aria-hidden size={20} strokeWidth={2} />
            {label}
          </Link>
        ))}
        <Link
          href="/entrenador"
          aria-current={pathname.startsWith("/entrenador") ? "page" : undefined}
          className="mt-auto flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-[15px] font-medium hover:bg-sunken aria-[current=page]:bg-cobalt-tint"
        >
          <Users aria-hidden size={20} />
          Modo entrenador
        </Link>
      </nav>

      {/* Móvil: barra inferior con objetivos táctiles grandes (uso con una mano). */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {ATHLETE_TABS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted aria-[current=page]:text-cobalt"
              >
                <Icon aria-hidden size={24} strokeWidth={2} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
