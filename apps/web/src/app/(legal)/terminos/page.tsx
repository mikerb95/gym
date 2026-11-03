import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: `Las reglas para usar ${BRAND.name} como atleta o como entrenador.`,
};

export default function TermsPage() {
  return (
    <>
      <h1>Términos de uso</h1>
      <p className="meta">
        Versión {LEGAL.policyVersion}. Última actualización: {LEGAL.updatedOn}.
      </p>

      <p>
        Estos términos regulan el uso de {BRAND.name}, ofrecida por {LEGAL.controller}. Al crear una cuenta los aceptas.
        Si no estás de acuerdo, no uses la app.
      </p>

      <h2>1. Qué es {BRAND.name}</h2>
      <p>
        Una herramienta para planear, registrar y analizar tu entrenamiento, tu alimentación y tu bienestar, sola o
        acompañada de un entrenador. Incluye cálculos, recomendaciones y funciones de inteligencia artificial.
      </p>

      <h2>2. No es un servicio médico</h2>
      <p>
        {BRAND.name} no diagnostica, no trata enfermedades y no reemplaza a un médico, un nutricionista ni un
        fisioterapeuta. El cuestionario PAR-Q+ sirve para detectar cuándo conviene una valoración médica; si alguna
        respuesta lo indica, consulta a un profesional de la salud antes de subir la intensidad. Si sientes dolor en el
        pecho, mareo, falta de aire anormal o dolor agudo, detén el ejercicio y busca atención médica.
      </p>

      <h2>3. Tu cuenta</h2>
      <ul>
        <li>Debes tener al menos 13 años. Si eres menor de 18, necesitas la autorización de tu representante legal.</li>
        <li>La información que registras debe ser real; de ella dependen los cálculos.</li>
        <li>Tu cuenta es personal. Avísanos si crees que alguien entró sin permiso.</li>
      </ul>

      <h2>4. Recomendaciones e inteligencia artificial</h2>
      <p>
        Las cargas, calorías, reconocimientos de máquinas y comidas, y demás estimaciones son aproximaciones con un
        margen de error que indicamos cuando aplica. Ningún cambio propuesto por la inteligencia artificial se aplica a
        tu plan sin que tú o tu entrenador lo aprueben. Usa tu criterio: si algo no te parece seguro, no lo hagas.
      </p>

      <h2>5. Entrenadores</h2>
      <ul>
        <li>
          El entrenador es un profesional independiente de {BRAND.name}. Responde por sus programas, indicaciones y
          servicios, y por cumplir las normas que le apliquen.
        </li>
        <li>
          Solo ve los datos que el atleta comparte y debe usarlos únicamente para acompañarlo. No puede copiarlos,
          venderlos ni usarlos para otros fines.
        </li>
        <li>El atleta puede terminar el vínculo en cualquier momento.</li>
      </ul>

      <h2>6. Uso aceptable</h2>
      <p>
        No puedes usar la app para acosar a otras personas, subir contenido ilegal o de terceros sin permiso, intentar
        acceder a datos ajenos, ni copiar o revender el servicio.
      </p>

      <h2>7. Pagos</h2>
      <p>
        Las funciones de pago, sus precios en pesos colombianos y las condiciones de renovación y cancelación se informan
        antes de cobrar. Puedes cancelar cuando quieras y conservas el acceso hasta el final del periodo pagado. Tus
        derechos como consumidor bajo la Ley 1480 de 2011 se mantienen, incluido el derecho de retracto cuando aplique.
      </p>

      <h2>8. Contenido y propiedad</h2>
      <p>
        Tus datos y fotos son tuyos; nos das permiso de usarlos solo para prestarte el servicio, según la{" "}
        <Link href="/privacidad">política de tratamiento de datos</Link>. La app, su diseño y su código son de{" "}
        {LEGAL.controller}.
      </p>

      <h2>9. Responsabilidad</h2>
      <p>
        Trabajamos para que la app funcione bien y sin interrupciones, pero puede tener fallas. En la medida que permite
        la ley, no respondemos por lesiones o daños derivados de no seguir las indicaciones de seguridad, de información
        falsa registrada por el usuario, ni de los servicios que preste un entrenador.
      </p>

      <h2>10. Cambios y terminación</h2>
      <p>
        Podemos actualizar estos términos y te avisaremos en la app antes de que rijan los cambios importantes. Puedes
        eliminar tu cuenta cuando quieras. Podemos suspender cuentas que incumplan estos términos.
      </p>

      <h2>11. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de Colombia. Para dudas o reclamos escribe a{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    </>
  );
}
