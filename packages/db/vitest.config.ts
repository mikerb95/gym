import { defineConfig } from "vitest/config";

// Levantar PGlite y aplicar las migraciones toma varios segundos.
export default defineConfig({
  test: { hookTimeout: 60_000 },
});
