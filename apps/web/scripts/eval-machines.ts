// Mide el reconocimiento de máquinas con fotos de licencia abierta, sin ir a un gym.
// Gasta créditos de AI Gateway (menos de USD 0,001 por foto).
// Uso: pnpm --filter @gym/web eval:machines [cantidad]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EXERCISES } from "../../../packages/db/src/seed/exercises";
import { identifyMachine } from "../src/lib/machine-identify";
import type { CatalogExercise } from "../src/lib/workout";

type Sample = { title: string; thumb: string; license: string; author: string; page: string; expected: string[]; difficulty?: string };

const samples: Sample[] = JSON.parse(readFileSync(join(__dirname, "machine-eval-set.json"), "utf8"));
const limit = Number(process.argv[2]) || samples.length;

// En la evaluación el id de cada ejercicio es su slug, para comparar sin base de datos.
const catalog: CatalogExercise[] = EXERCISES.map((e) => ({
  id: e.slug,
  name: e.name,
  aliases: e.aliases ?? [],
  primaryMuscles: e.primaryMuscles,
  tracksWeight: e.tracksWeight ?? true,
  tracksDuration: e.tracksDuration ?? false,
  tracksDistance: e.tracksDistance ?? false,
}));

const CACHE = join(tmpdir(), "steadyrep-eval-fotos");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Descarga una sola vez y respeta el límite de Commons, que corta las descargas rápidas. */
async function loadPhoto(url: string): Promise<Uint8Array> {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, Buffer.from(url).toString("base64url").slice(-120));
  if (existsSync(file)) return new Uint8Array(readFileSync(file));
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": "steadyrep-eval/0.1" } });
    if (response.ok) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      writeFileSync(file, bytes);
      await sleep(5_000);
      return bytes;
    }
    if (response.status !== 429) throw new Error(`foto ${response.status}`);
    await sleep(30_000 * (attempt + 1));
  }
  throw new Error("foto: Commons sigue limitando las descargas");
}

async function main() {
  let top1 = 0;
  let top3 = 0;
  let errors = 0;
  let cost = 0;
  const times: number[] = [];

  for (const sample of samples.slice(0, limit)) {
    let started = Date.now();
    try {
      const machinePhoto = await loadPhoto(sample.thumb);
      started = Date.now();
      const { result, usage } = await identifyMachine({ catalog, namePhoto: null, machinePhoto });
        // Sin ejercicios esperados es una foto de control: lo correcto es no proponer nada.
      const first = sample.expected.length ? sample.expected.includes(result.exerciseIds[0] ?? "") : result.exerciseIds.length === 0;
      const any = first || result.exerciseIds.some((id) => sample.expected.includes(id));
      top1 += first ? 1 : 0;
      top3 += any ? 1 : 0;
      cost += usage.costUsd;
      times.push(Date.now() - started);
      console.log(`${first ? "OK " : any ? "~  " : "NO "} ${sample.expected[0]} -> ${result.exerciseIds.join(", ") || "(nada)"} [${result.confidence}] ${sample.title}`);
    } catch (error) {
      errors += 1;
      console.log(`ERR ${sample.title}: ${error instanceof Error ? error.message : "error"}`);
    }
  }

  const done = times.length;
  const pct = (n: number) => `${done ? Math.round((n / done) * 100) : 0} %`;
  const median = [...times].sort((a, b) => a - b)[Math.floor(done / 2)] ?? 0;
  console.log(`\nFotos: ${done}, errores: ${errors}`);
  console.log(`Primera opción correcta: ${pct(top1)}. Entre las 3 opciones: ${pct(top3)}.`);
  console.log(`Mediana por foto: ${(median / 1000).toFixed(1)} s. Costo total: USD ${cost.toFixed(4)}.`);
}

void main();
