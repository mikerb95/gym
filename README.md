# Steadyrep

Plataforma de entrenamiento, nutrición y seguimiento con IA para atletas y entrenadores en Colombia.
El plan completo está en `docs/PLAN.md` y la investigación de reconocimiento de máquinas en `docs/research/`.

## Estructura

| Ruta | Qué es |
|---|---|
| `apps/web` | PWA en Next.js 16 para móvil y escritorio (atleta y modo entrenador) |
| `apps/android` | App Android con Capacitor que carga la PWA y expone Health Connect |
| `packages/core` | Fórmulas de dominio con pruebas: 1RM, discos, TDEE adaptativo, % de grasa, readiness, macros |
| `packages/db` | Esquema Drizzle (Postgres/Supabase), migraciones y políticas RLS con pruebas |

## Comandos

```sh
pnpm install
pnpm dev                                   # PWA en http://localhost:3000
pnpm test                                  # pruebas de core y de seguridad por fila
pnpm typecheck && pnpm lint
pnpm --filter @gym/db db:check             # aplica las migraciones en un Postgres en memoria
pnpm --filter @gym/db db:migrate           # aplica las migraciones en Supabase (requiere DATABASE_URL)
pnpm --filter @gym/android sync            # sincroniza la app Android
```

Requiere Node 24 y pnpm (`corepack enable pnpm`).
