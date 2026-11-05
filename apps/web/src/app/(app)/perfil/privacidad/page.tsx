import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isConsentActive } from "@gym/core";
import { PageHeader, Section } from "@/components/ui";
import { LEGAL } from "@/lib/legal";
import { CONSENTS, type ConsentPurpose } from "@/lib/onboarding";
import { getAccessLog, getConsents } from "@/lib/privacy";
import { ConsentCard, DataActions } from "./privacy-controls";

export const metadata: Metadata = { title: "Privacidad y datos" };

const REVOCABLE: ConsentPurpose[] = ["sensitive_health", "machine_photos_training", "marketing"];
const dateTime = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" });

export default async function PrivacyPage() {
  const [current, accesses] = await Promise.all([getConsents(), getAccessLog()]);
  const service = current.get("service");
  const guardian = current.get("guardian");

  return (
    <>
      <Link href="/perfil" className="mb-4 inline-flex min-h-11 items-center gap-1.5 font-medium text-muted">
        <ArrowLeft aria-hidden size={18} />
        Perfil
      </Link>
      <PageHeader title="Privacidad y datos" lead="Tus datos son tuyos. Aquí decides qué hacemos con ellos." />

      <Section title="Tus autorizaciones">
        <div className="grid gap-3">
          {REVOCABLE.map((purpose) => {
            const record = current.get(purpose);
            return (
              <ConsentCard
                key={purpose}
                purpose={purpose}
                title={CONSENTS[purpose].title}
                text={CONSENTS[purpose].text}
                active={isConsentActive(record)}
                since={record ? dateTime.format(record.revokedAt ?? record.grantedAt) : null}
              />
            );
          })}
        </div>
        <div className="mt-4 rounded-2xl bg-sunken p-4 text-[15px] leading-relaxed text-muted">
          <p>
            <strong className="font-semibold text-ink">{CONSENTS.service.title}:</strong>{" "}
            {service ? `autorizado el ${dateTime.format(service.grantedAt)}, versión ${service.policyVersion}.` : "sin registro."}{" "}
            {guardian ? `Tu representante legal autorizó el ${dateTime.format(guardian.grantedAt)}. ` : null}
            Sin esta autorización no podemos prestarte el servicio, así que se retira eliminando la cuenta.
          </p>
          <p className="mt-2">
            La prueba completa de cada autorización viene en tu descarga de datos. Si prefieres, escríbenos a{" "}
            <a href={`mailto:${LEGAL.email}`} className="font-medium text-ink underline underline-offset-2">
              {LEGAL.email}
            </a>
            .
          </p>
        </div>
      </Section>

      <Section title="Quién ha visto tus datos">
        {accesses.length === 0 ? (
          <p className="max-w-[60ch] leading-relaxed text-muted">Nadie más ha accedido a tus datos.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
            {accesses.map((a) => (
              <li key={a.id} className="px-5 py-3">
                <span className="block font-medium">{a.actorName ?? "Un entrenador con el que ya no tienes vínculo"}</span>
                <span className="block text-sm text-muted">
                  {a.resource}, {dateTime.format(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Tu información">
        <DataActions />
      </Section>
    </>
  );
}
