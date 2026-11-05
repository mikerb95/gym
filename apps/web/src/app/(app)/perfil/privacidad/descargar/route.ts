import { NextResponse } from "next/server";
import { exportUserData, withRls } from "@gym/db";
import { auditLog } from "@gym/db/schema";
import { getViewer } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { db } from "@/lib/db";
import { LEGAL } from "@/lib/legal";

/** Descarga de todos los datos del titular (Ley 1581, art. 8). Pasa por RLS y queda registrada. */
export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.redirect(new URL("/ingresar", request.url), { status: 303 });

  const data = await withRls(db, viewer.claims, (tx) => exportUserData(tx));
  await db.insert(auditLog).values({
    actorId: viewer.id,
    subjectUserId: viewer.id,
    action: "data.exported",
    resource: "profile",
  });

  const exportedAt = new Date().toISOString();
  const body = JSON.stringify(
    { app: BRAND.name, exportedAt, email: viewer.email, policyVersion: LEGAL.policyVersion, data },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="steadyrep-datos-${exportedAt.slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
