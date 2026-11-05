import { and, count, eq, gt } from "drizzle-orm";
import { aiUsage } from "@gym/db/schema";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { identifyMachine } from "@/lib/machine-identify";
import { PHOTO_MAX_BYTES, type MachineIdentification } from "@/lib/machine-recognition";
import { getCatalog } from "@/lib/training";

const FEATURE = "machine_recognition";
/** Tope por usuario en 24 horas. Una sesión normal identifica unas pocas máquinas. */
const DAILY_LIMIT = 40;

function json(body: MachineIdentification, status = 200) {
  return Response.json(body, { status });
}

/** Devuelve los bytes si es un JPEG aceptable; el cliente siempre convierte a JPEG. */
async function readPhoto(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0 || value.size > PHOTO_MAX_BYTES) return null;
  const bytes = new Uint8Array(await value.arrayBuffer());
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? bytes : null;
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.profile?.onboardedAt) return new Response(null, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, reason: "invalid" }, 400);
  }
  const nameEntry = form.get("name");
  const namePhoto = nameEntry ? await readPhoto(nameEntry) : null;
  const machinePhoto = await readPhoto(form.get("machine"));
  if (!machinePhoto || (nameEntry && !namePhoto)) return json({ ok: false, reason: "invalid" }, 400);

  // ai_usage no tiene políticas para usuarios: solo el servidor la lee y la escribe.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ used }] = await db
    .select({ used: count() })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, viewer.id), eq(aiUsage.feature, FEATURE), gt(aiUsage.createdAt, since)));
  if (used >= DAILY_LIMIT) return json({ ok: false, reason: "limit" }, 429);

  const catalog = await getCatalog();

  try {
    const identification = await identifyMachine({ catalog, namePhoto, machinePhoto });
    await db.insert(aiUsage).values({ userId: viewer.id, feature: FEATURE, ...identification.usage });

    return json({ ok: true, ...identification.result });
  } catch (error) {
    console.error("[maquinas/identificar]", error instanceof Error ? error.name : "error");
    return json({ ok: false, reason: "unavailable" }, 503);
  }
}
