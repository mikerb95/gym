import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos",
  description: `Cómo ${BRAND.name} recoge, usa, protege y comparte tus datos personales, y cómo ejercer tus derechos.`,
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Política de tratamiento de datos personales</h1>
      <p className="meta">
        Versión {LEGAL.policyVersion}. Última actualización: {LEGAL.updatedOn}.
      </p>

      <p>
        Esta política explica cómo {BRAND.name} trata tus datos personales, en cumplimiento de la Ley 1581 de 2012, el
        Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas colombianas de protección de datos.
      </p>

      <h2>1. Quién es el responsable</h2>
      <ul>
        <li>Responsable: {LEGAL.controller}</li>
        <li>NIT: {LEGAL.nit ?? "pendiente de registro"}</li>
        <li>Domicilio: {LEGAL.address ?? "pendiente de registro"}, {LEGAL.city}</li>
        <li>
          Correo para temas de datos personales: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </li>
      </ul>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li>
          <strong>De identificación y contacto:</strong> nombre, correo, celular, fecha de nacimiento y contacto de
          emergencia.
        </li>
        <li>
          <strong>De entrenamiento:</strong> ejercicios, series, cargas, repeticiones, esfuerzo percibido, programas y
          récords.
        </li>
        <li>
          <strong>De salud (datos sensibles):</strong> respuestas al cuestionario PAR-Q+, peso, medidas, composición
          corporal, fotos de progreso, lesiones, sueño, energía, estado de ánimo, ciclo menstrual si decides
          registrarlo, embarazo y datos de dispositivos como frecuencia cardíaca o pasos.
        </li>
        <li>
          <strong>De alimentación:</strong> comidas, fotos de platos, preferencias, alergias y objetivos.
        </li>
        <li>
          <strong>De ubicación:</strong> el gimnasio donde entrenas, solo si lo activas.
        </li>
        <li>
          <strong>Técnicos:</strong> dirección IP, tipo de dispositivo y navegador, usados para seguridad y para probar
          que diste tu autorización.
        </li>
      </ul>

      <h2>3. Datos sensibles</h2>
      <p>
        Los datos de salud son sensibles. Por eso te pedimos una autorización expresa y separada. No estás obligado a
        autorizar su tratamiento ni a responder preguntas sobre ellos. Si no los entregas, podrás usar las herramientas
        generales, pero la app no podrá ajustar tu entrenamiento ni tu alimentación a tu caso. Nunca condicionamos otra
        actividad a que los entregues.
      </p>

      <h2>4. Niñas, niños y adolescentes</h2>
      <p>
        La app es para personas desde 13 años. Para menores de 18 años pedimos la autorización de su representante
        legal, respetamos su interés superior y sus derechos fundamentales, y no les proponemos déficit calórico ni
        contenidos de pérdida de peso.
      </p>

      <h2>5. Para qué usamos tus datos</h2>
      <ol>
        <li>Crear tu cuenta, identificarte y darte acceso.</li>
        <li>Diseñar, ajustar y hacer seguimiento a tu entrenamiento y tu alimentación.</li>
        <li>Calcular indicadores como gasto calórico, máximos estimados, tendencia de peso y recuperación.</li>
        <li>Detectar señales de riesgo (dolor, mareo, lesiones) y avisarte, y si lo autorizas, a tu entrenador.</li>
        <li>Compartir con tu entrenador solo las categorías que tú actives.</li>
        <li>Reconocer máquinas y comidas a partir de fotos.</li>
        <li>Atender tus solicitudes, cobrar suscripciones y emitir facturas.</li>
        <li>Mantener la seguridad, prevenir fraude y cumplir obligaciones legales.</li>
        <li>Enviarte novedades, solo si lo autorizas.</li>
      </ol>
      <p>
        Las propuestas generadas con inteligencia artificial siempre las aprueba una persona (tú o tu entrenador) antes
        de aplicarse. No tomamos decisiones con efectos jurídicos sobre ti de forma automática.
      </p>

      <h2>6. Con quién compartimos tus datos</h2>
      <ul>
        <li>
          <strong>Tu entrenador:</strong> solo si te vinculas con uno, y solo las categorías que tú actives
          (entrenamiento, nutrición, cuerpo, fotos, bienestar, ubicación). Las fotos de progreso y la ubicación vienen
          apagadas. Puedes cambiar esto o terminar el vínculo cuando quieras, y desde ese momento deja de ver tus datos.
        </li>
        <li>
          <strong>Proveedores que nos prestan servicios</strong> (encargados del tratamiento), con contratos que los
          obligan a proteger tus datos y a usarlos solo para lo que les pedimos: alojamiento y base de datos (Supabase y
          Vercel), análisis de fotos y texto con inteligencia artificial (Anthropic, a través de Vercel), envío de
          correos y procesamiento de pagos.
        </li>
        <li>
          <strong>Autoridades</strong>, cuando una norma o una orden lo exija.
        </li>
      </ul>
      <p>
        No vendemos tus datos. Los proveedores de inteligencia artificial que usamos no entrenan sus modelos con tus
        datos.
      </p>

      <h2>7. Transferencia y transmisión internacional</h2>
      <p>
        Nuestros servidores están en Estados Unidos (Virginia), país que la Superintendencia de Industria y Comercio
        reconoce con un nivel adecuado de protección de datos. Al aceptar esta política autorizas que tus datos se
        almacenen y procesen allí, con las mismas garantías descritas aquí.
      </p>

      <h2>8. Tus derechos</h2>
      <p>Como titular de los datos tienes derecho a:</p>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos.</li>
        <li>Pedir prueba de la autorización que nos diste.</li>
        <li>Saber cómo hemos usado tus datos.</li>
        <li>Revocar tu autorización y pedir que borremos tus datos, cuando no exista un deber legal de conservarlos.</li>
        <li>Acceder gratis a tus datos y descargarlos.</li>
        <li>
          Presentar quejas ante la Superintendencia de Industria y Comercio, después de haber agotado el trámite con
          nosotros.
        </li>
      </ul>

      <h2>9. Cómo ejercerlos</h2>
      <p>
        Desde tu perfil puedes ver y cambiar tus autorizaciones, descargar tus datos y eliminar tu cuenta. También
        puedes escribir a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> desde el correo de tu cuenta, indicando
        tu solicitud.
      </p>
      <ul>
        <li>
          <strong>Consultas:</strong> respondemos en máximo 10 días hábiles. Si no podemos, te explicamos por qué y
          respondemos en máximo 5 días hábiles más.
        </li>
        <li>
          <strong>Reclamos</strong> (corrección, actualización, supresión o incumplimiento): respondemos en máximo 15
          días hábiles. Si no podemos, te explicamos por qué y respondemos en máximo 8 días hábiles más. Si el reclamo
          está incompleto, te pedimos lo que falte dentro de los 5 días siguientes.
        </li>
      </ul>

      <h2>10. Cómo protegemos tus datos</h2>
      <p>
        Ciframos los datos en tránsito y en reposo. Cada usuario solo puede leer lo suyo, y esa regla la aplica la
        propia base de datos, no solo la app. Las fotos se guardan en almacenamiento privado y se muestran con enlaces
        temporales. Las fotos que tomas para identificar una máquina se envían a nuestro proveedor de inteligencia
        artificial solo para analizarlas y no las guardamos, salvo que autorices usarlas para mejorar el reconocimiento.
        Registramos quién accede a datos de otra persona.
      </p>

      <h2>11. Cuánto tiempo los guardamos</h2>
      <p>
        Mientras tengas tu cuenta activa. Si la eliminas, borramos tus datos en máximo 30 días, salvo los que una norma
        nos obligue a conservar (por ejemplo, facturas), que guardamos solo por el plazo legal.
      </p>

      <h2>12. Cambios a esta política</h2>
      <p>
        Si cambiamos algo importante te avisamos en la app y, cuando la ley lo exija, te pedimos una nueva autorización.
        Esta política rige desde el {LEGAL.updatedOn}.
      </p>

      <p>
        Consulta también los <Link href="/terminos">términos de uso</Link>.
      </p>
    </>
  );
}
