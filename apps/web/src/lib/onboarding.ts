import { z } from "zod";

/**
 * Preguntas generales del PAR-Q+ (versión 2023), adaptadas al español de
 * Colombia. Un "sí" en cualquiera indica que conviene una valoración médica
 * antes de subir la intensidad.
 */
export const PARQ_QUESTIONS = [
  {
    id: "heart",
    text: "¿Algún médico te ha dicho que tienes una enfermedad del corazón o presión arterial alta?",
  },
  {
    id: "chest_pain",
    text: "¿Sientes dolor en el pecho en reposo, en tus actividades diarias o cuando haces actividad física?",
  },
  {
    id: "dizziness",
    text: "¿En los últimos 12 meses has perdido el equilibrio por mareo o has perdido el conocimiento?",
    hint: "Responde no si el mareo fue por respirar agitado durante un ejercicio fuerte.",
  },
  {
    id: "chronic",
    text: "¿Te han diagnosticado otra enfermedad crónica, distinta del corazón o la presión alta?",
    hint: "Por ejemplo diabetes, asma, enfermedad renal, cáncer u osteoporosis.",
  },
  {
    id: "medication",
    text: "¿Tomas medicamentos recetados para una enfermedad crónica?",
  },
  {
    id: "musculoskeletal",
    text: "¿Tienes ahora, o tuviste en los últimos 12 meses, un problema de huesos, articulaciones, músculos, ligamentos o tendones que podría empeorar si haces más actividad física?",
    hint: "Responde no si fue en el pasado y hoy no te limita.",
  },
  {
    id: "supervision",
    text: "¿Algún médico te ha dicho que solo debes hacer actividad física con supervisión médica?",
  },
] as const;

export type ParqId = (typeof PARQ_QUESTIONS)[number]["id"];

/**
 * Textos de autorización. Se guardan tal cual en la evidencia de cada
 * consentimiento (Decreto 1377 de 2013, art. 7: prueba de la autorización).
 */
export const CONSENTS = {
  service: {
    required: true,
    title: "Términos y tratamiento de datos",
    text: "Acepto los términos de uso y autorizo el tratamiento de mis datos personales según la política de tratamiento de datos, para crear mi cuenta y prestarme el servicio.",
  },
  sensitive_health: {
    required: false,
    title: "Datos de salud",
    text: "Autorizo de forma expresa el tratamiento de mis datos de salud (cuestionario médico, peso, medidas, lesiones, sueño y estado de ánimo) para personalizar mi entrenamiento y mi alimentación. Sé que son datos sensibles, que no estoy obligado a entregarlos y que sin ellos la app no puede ajustar el plan a mí. Puedo revocar esta autorización cuando quiera.",
  },
  machine_photos_training: {
    required: false,
    title: "Fotos de máquinas",
    text: "Autorizo usar las fotos de máquinas que tome en la app para mejorar el reconocimiento. Solo se usa la máquina; las fotos con personas se descartan.",
  },
  marketing: {
    required: false,
    title: "Novedades",
    text: "Quiero recibir novedades y ofertas por correo o WhatsApp.",
  },
  guardian: {
    required: false,
    title: "Autorización del representante legal",
    text: "Soy el padre, la madre o el representante legal de este menor de edad y autorizo el tratamiento de sus datos, incluidos los de salud, para que use la app.",
  },
} as const;

export type ConsentPurpose = keyof typeof CONSENTS;

export const GOALS = [
  { value: "fat_loss", label: "Perder grasa" },
  { value: "muscle_gain", label: "Ganar músculo" },
  { value: "recomposition", label: "Recomposición" },
  { value: "performance", label: "Rendimiento" },
  { value: "maintenance", label: "Mantenerme" },
] as const;

export const EXPERIENCE = [
  { value: "beginner", label: "Empiezo", detail: "Menos de 6 meses entrenando con constancia" },
  { value: "intermediate", label: "Intermedio", detail: "Entre 6 meses y 3 años" },
  { value: "advanced", label: "Avanzado", detail: "Más de 3 años y conozco mis cargas" },
] as const;

export function ageOn(birthDate: string, today = new Date()) {
  const [y, m, d] = birthDate.split("-").map(Number) as [number, number, number];
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

export const MIN_AGE = 13;

export const onboardingSchema = z
  .object({
    fullName: z.string().trim().min(2, "Escribe tu nombre").max(80),
    birthDate: z.iso.date("Fecha no válida"),
    sex: z.enum(["female", "male"]),
    pregnant: z.boolean(),
    heightCm: z.number().min(120, "Revisa la estatura").max(230, "Revisa la estatura"),
    weightKg: z.number().min(30, "Revisa el peso").max(300, "Revisa el peso"),
    goal: z.enum(["fat_loss", "muscle_gain", "recomposition", "maintenance", "performance"]),
    experience: z.enum(["beginner", "intermediate", "advanced"]),
    trainingDaysPerWeek: z.number().int().min(1).max(7),
    sessionMinutes: z.number().int().min(20).max(180),
    parqSkipped: z.boolean(),
    // Parcial: quien elige no responder no manda nada. Las faltantes se revisan abajo.
    parq: z.partialRecord(z.enum(PARQ_QUESTIONS.map((q) => q.id) as [ParqId, ...ParqId[]]), z.boolean()),
    emergencyContactName: z.string().trim().max(80),
    // Opcional, pero si viene debe poder marcarse: 7 a 15 dígitos, el largo de un número internacional.
    emergencyContactPhone: z
      .string()
      .trim()
      .max(20)
      .refine((v) => v === "" || /^\+?[\d\s()-]+$/.test(v) && /^\d{7,15}$/.test(v.replace(/\D/g, "")), "Escribe un celular válido"),
    guardianName: z.string().trim().max(80),
    consents: z.object({
      // Se exige abajo: un z.literal(true) que falla aborta el superRefine, y la edad y el
      // representante dejarían de validarse en cada paso hasta llegar a las autorizaciones.
      service: z.boolean(),
      // Ley 1581, art. 6: nadie está obligado a autorizar el tratamiento de datos sensibles.
      sensitive_health: z.boolean(),
      machine_photos_training: z.boolean(),
      marketing: z.boolean(),
      guardian: z.boolean(),
    }),
  })
  .superRefine((v, ctx) => {
    if (!v.consents.service) {
      ctx.addIssue({ code: "custom", path: ["consents", "service"], message: "Debes aceptar los términos para crear tu cuenta" });
    }
    const age = ageOn(v.birthDate);
    if (age < MIN_AGE || age > 100) {
      ctx.addIssue({ code: "custom", path: ["birthDate"], message: `La app es para personas desde ${MIN_AGE} años` });
    }
    if (age < 18) {
      if (v.guardianName.length < 2)
        ctx.addIssue({ code: "custom", path: ["guardianName"], message: "Escribe el nombre de tu representante legal" });
      if (!v.consents.guardian)
        ctx.addIssue({ code: "custom", path: ["consents", "guardian"], message: "Tu representante legal debe autorizar" });
    }
    if (!v.parqSkipped && PARQ_QUESTIONS.some((q) => v.parq[q.id] === undefined)) {
      ctx.addIssue({ code: "custom", path: ["parq"], message: "Responde todas las preguntas" });
    }
    if (v.sex === "male" && v.pregnant) ctx.addIssue({ code: "custom", path: ["pregnant"], message: "Dato no válido" });
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
