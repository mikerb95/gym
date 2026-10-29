# Plan maestro: plataforma de entrenamiento y nutrición con IA

Versión 0.1 (borrador para discusión) · 28 de octubre de 2026

Este documento define la visión, los módulos, la experiencia de uso, la arquitectura, el stack, la estrategia de IA, el roadmap y las preguntas abiertas. Las preguntas del final no son de relleno: muchas cambian decisiones de arquitectura y deben responderse antes de escribir código de producción.

---

## Decisiones confirmadas (28 de octubre de 2026)

Esta sección manda sobre cualquier parte del documento que la contradiga.

**Negocio y alcance**
- Mercado: **Colombia**. Pesos colombianos, Ley 1581 de 2012 y Decreto 1377 de 2013 (los datos de salud son sensibles y requieren autorización expresa), tabla de composición de alimentos del ICBF y comida colombiana curada.
- Monetización mixta: suscripción del atleta, plan del entrenador, licencia de gimnasio y comisión sobre lo que los entrenadores cobran a sus afiliados.
- El MVP sirve a la vez al atleta con IA y al entrenador. Es **una sola app con cambio de modo**, con marca blanca (logo y colores del entrenador o gym).
- Sin componente social. Tono cercano, tuteo. Tema según el sistema. Aún no hay marca: hay que proponer nombre e identidad.
- Plazo: **menos de un mes** para tener una primera versión con usuarios reales, con todo el alcance. Presupuesto: **menos de USD 100 al mes** en infraestructura e IA.

**Poblaciones:** se atienden menores, embarazo y posparto, adultos mayores, y lesiones y rehabilitación. No hay un profesional que valide: los protocolos se basan en guías publicadas (ACSM, OMS, PAR-Q+), con reglas duras en `packages/core`. Los menores requieren la autorización de su representante legal.

**Entrenamiento**
- Disciplinas: musculación y fitness, fuerza (powerlifting y halterofilia), funcional, crossfit y calistenia, y cardio y running.
- Lugares: gimnasio comercial, casa, aire libre y parques.
- Ejercicios ilustrados con **animaciones 3D** (modelo anatómico con los músculos activados).
- La IA **propone** los ajustes y el atleta los acepta o mantiene el plan original. Si el atleta tiene entrenador, **el entrenador aprueba**, y mientras tanto el atleta sigue el plan original.

**Reconocimiento de máquinas**
- Nadie registra el inventario de cada gym. Hay que reconocer todas las máquinas a partir de un catálogo global de imágenes de referencia, que se usan solo para hacer el match y no se muestran en la app.
- El reconocimiento se organiza por **función** (prensa 45°, jalón al pecho, etc.), independiente del color, la marca o la tapicería, y luego por marca y modelo.
- Los usuarios autorizan que sus fotos confirmadas de **máquinas** se sumen como referencia. Las de comida y las corporales no.
- QR/NFC: probablemente algunos gyms lo acepten, así que queda como capa adicional.
- La investigación técnica está en `docs/research/reconocimiento-maquinas.md` y reemplaza la sección 4.4 (que suponía un inventario por gym). Conclusiones:
  - Se registra el **ejercicio**, no la máquina. Si todas las candidatas permiten el ejercicio del plan, la app no pregunta.
  - Modelo: DINOv2 o DINOv3 tamaño S afinado (ArcFace con negativos difíciles) + kNN contra una galería global de 172 clases funcionales (~2 MB), en el teléfono con ONNX Runtime Web (WebGPU con respaldo WASM). Además, cada gym tiene una galería local que se forma sola con las fotos confirmadas por los usuarios. MobileCLIP queda descartado porque su licencia es solo para investigación.
  - Bandas de confianza: se autoconfirma con p ≥ 0,92 y margen ≥ 0,30. Entre 0,55 y 0,92 decide un VLM verificador barato (~USD 0,0003 por consulta). Cuando la duda cae en un grupo de confusión conocido, se pide una segunda foto dirigida.
  - Metas honestas: lo autoconfirmado acierta en ≥ 99,5 %. Top-1 de 88 a 93 % y top-3 de 97 a 99 % al lanzar, y más de 99 % en las máquinas ya confirmadas en ese gym. Solo QR/NFC llega al 100 %.
  - Las imágenes de catálogos de fabricantes no se pueden usar sin permiso (términos de uso y Ley 23 de 1982). El dataset sale de una campaña propia de fotos: 30 a 40 gyms, unas 55 horas, de 100 a 300 fotos por clase. Antes de escalar, un piloto de 2 a 3 semanas.
  - Costo: USD 20 a 45 al mes con 2.000 usuarios activos.
- Las secciones 4.4, 6 y 7 que mencionan Expo, React Native o un inventario por gym quedan reemplazadas por esta sección.

**Nutrición**
- Planes completos: menús, recetas, cantidades y lista de mercado con costos estimados en COP. Suplementos, ayuno intermitente y modo sin números.
- Micronutrientes completos (30 o más).
- Reconocimiento de comida casera colombiana, productos empacados, restaurantes y cadenas, y comida internacional.

**Cuerpo y bienestar**
- Lo único obligatorio en el onboarding es el peso y la estatura. Todo lo demás es opcional y guiado.
- Integraciones: InBody y bioimpedancia (por foto del reporte), básculas inteligentes, relojes y wearables, y plicómetro.
- Seguimiento emocional con escalas rápidas, cuestionarios validados y ciclo menstrual.
- Ante una bandera roja, la app detiene la sesión y orienta con líneas de ayuda en Colombia, avisa al entrenador y avisa al contacto de emergencia.

**Ubicación (todo opcional):** se usa para registrar el lugar, mostrar gyms cercanos y estimar la afluencia. El atleta decide si el entrenador ve dónde entrenó.

**Entrenador**
- Herramientas: cobro a afiliados (PSE, Nequi, tarjeta), facturación electrónica DIAN, agenda de sesiones y clases grupales.
- Comunicación: chat 1 a 1, grupos y anuncios, y WhatsApp para recordatorios.
- Informes: PDF mensual con su marca y resumen semanal generado por la IA.
- Si el atleta deja al entrenador, este pierde todo acceso a sus datos.

**Plataformas y stack (reemplaza la sección 6.1 donde choque)**
- **PWA** (Next.js) para móvil y escritorio, para atletas y entrenadores. Incluye uso sin conexión con service worker e IndexedDB, cámara con reconocimiento en el navegador (ONNX Runtime Web con WebGPU o transformers.js, y MediaPipe Tasks), push web e instalación.
- **App Android nativa desde ya**: la misma PWA empaquetada con **Capacitor**, más plugins nativos para Health Connect, cámara y notificaciones. Un solo código. iOS después.
- Pagos con proveedores locales: **Wompi** o **Mercado Pago** (PSE, Nequi, tarjetas). Stripe no opera para comercios colombianos. Facturación DIAN por API de un proveedor autorizado (Alegra, Siigo o similar).
- IA dentro del presupuesto: el reconocimiento de máquinas corre en el dispositivo. Haiku 5.5 se usa por defecto y Sonnet 5.5 solo cuando hace falta visión de comida o análisis profundo, con caché y topes por usuario. Infraestructura base: Vercel Pro (USD 20) y Supabase Pro (USD 25).
- Región: Supabase en `us-east-1` (Virginia) y funciones de Vercel en `iad1` (Washington), en el mismo sitio para que cada consulta no cruce el continente. Los cables submarinos de Colombia (ARCOS, Maya-1, AMX-1, CFX-1) salen del Caribe hacia Florida, así que el tráfico a São Paulo suele dar la vuelta por Miami. Medido desde Colombia el 29 de octubre de 2026 (conexión TCP): us-east-1 90 ms, us-east-2 102 ms, sa-east-1 134 ms.
- El plan de privacidad, los términos y los consentimientos se redactan conforme a la Ley 1581 y al Decreto 1377.

---

## 0. Tres verdades incómodas que el plan asume desde el inicio

1. **"100% confiable" no existe en visión por computadora.** Ningún modelo reconoce máquinas con certeza absoluta (hay cientos de marcas, modelos casi idénticos, fotos con mala luz, máquinas con pines y poleas iguales). Lo que sí se puede lograr es una **experiencia que nunca registra algo equivocado**: el sistema solo autoconfirma cuando la confianza es muy alta, en el resto de casos ofrece 3 opciones visuales y, como capa determinista, admite **códigos QR/NFC pegados en la máquina** (eso sí es 100% fiable). El diseño de la sección 4.4 se basa en esto.
2. **La estimación de calorías por foto tiene error real (típicamente ±20-30% en porciones).** La app debe mostrarlo con honestidad, permitir ajustar porciones en segundos y ofrecer un "modo precisión" con báscula de cocina. Los números de macros y micros **siempre salen de bases de datos nutricionales verificadas**, nunca los inventa un modelo de lenguaje.
3. **"Reemplazar al entrenador" y "ser la herramienta del entrenador" son dos promesas en tensión.** El plan las resuelve así: la IA es un entrenador completo para quien entrena solo, y para quien tiene entrenador humano la IA pasa a ser su asistente (prepara borradores, detecta alertas, resume), y el humano decide. Un mismo motor, dos niveles de autoridad.

Además: una app que recoge peso, medidas, fotos corporales, estado emocional, lesiones y ubicación maneja **datos de salud sensibles**. Privacidad, consentimiento y seguridad son requisitos de la primera versión, no una fase posterior.

---

## 1. Visión y propuesta de valor

**Para el usuario (atleta):** un entrenador personal profesional en el bolsillo que conoce su cuerpo, su historial, sus lesiones, su ánimo y su comida, y que ajusta el plan cada semana con base en datos reales, no en plantillas genéricas.

**Para el entrenador:** un centro de mando donde ve a todos sus afiliados en una sola pantalla, sabe a quién atender hoy (alertas priorizadas), construye programas en minutos y cobra por su trabajo, con la IA haciendo el trabajo repetitivo.

**Diferenciadores frente a apps existentes:**

- Registro sin fricción en el gym: foto a la máquina, QR o búsqueda, y el ejercicio aparece con tu historial y tu objetivo de hoy.
- Un único perfil que une entrenamiento, nutrición, cuerpo, sueño y ánimo, con análisis cruzado ("tu rendimiento cae los días que duermes menos de 6 h y comes menos de 1.6 g/kg de proteína").
- Programación con autorregulación real (RPE/RIR, readiness, deloads automáticos).
- Diseñada para usarse con una mano, sudando, con mala señal.

---

## 2. Roles y permisos

| Rol | Descripción | Puede |
|---|---|---|
| **Atleta** | Usuario final. Puede entrenar solo (con IA) o vinculado a uno o varios entrenadores. | Registrar todo, ver su progreso, aceptar o rechazar a un entrenador, decidir qué datos comparte (por categoría: fotos, peso, ánimo, ubicación, nutrición). |
| **Entrenador** | Profesional que gestiona afiliados. | Ver datos compartidos de sus afiliados, crear programas y planes de nutrición, revisar check-ins, comentar, chatear, cobrar. |
| **Admin de organización** (fase posterior) | Dueño de un gimnasio o de un equipo de entrenadores. | Gestionar entrenadores, inventario de máquinas del gym, marca, facturación de la organización. |
| **Superadmin de plataforma** | Equipo interno. | Catálogos globales (ejercicios, máquinas, alimentos), moderación, soporte, métricas. |

Principios de permisos:

- Un usuario puede ser atleta y entrenador a la vez (cambio de modo en la app, como cambiar de cuenta).
- El atleta es dueño de sus datos. Al desvincularse de un entrenador, este pierde acceso (configurable: conservar solo histórico ya compartido o nada).
- Permisos granulares por categoría de dato; las fotos corporales son la categoría más restringida (opt-in explícito por entrenador).
- Toda acción del entrenador sobre datos del atleta queda en bitácora de auditoría.

---

## 3. Experiencia de uso: principios no negociables

1. **Modo gym:** durante una sesión, botones grandes (mín. 56 pt), contraste alto, pantalla siempre encendida, registro de una serie en 1 toque cuando coincide con lo planeado ("hecho como estaba planeado") y en 2-3 toques si cambió peso o reps (rueda de peso, no teclado).
2. **Offline primero:** el sótano del gym no tiene señal. Todo el registro funciona sin conexión y se sincroniza después. El reconocimiento de máquinas del gym propio también debe funcionar offline (modelo en el dispositivo).
3. **Cero pantallas vacías:** cada pantalla dice qué hacer a continuación ("Hoy: Pierna A · 55 min · tu readiness es 7/10").
4. **Una sola pregunta a la vez** en check-ins, con escalas visuales (caras, sliders) y opción de saltar. Nunca formularios largos post-entreno.
5. **Explicar cada recomendación:** si la IA baja el peso de hoy, dice por qué ("dormiste 5 h y reportaste dolor en rodilla").
6. **Progreso visible y honesto:** tendencias suavizadas (no el ruido diario del peso), comparativas de fotos alineadas, PRs celebrados sin infantilizar.
7. **Accesibilidad:** Dynamic Type, lectores de pantalla, no depender solo del color en semáforos, modo oscuro real.
8. **Navegación del atleta (5 pestañas):** Hoy · Entrenar · Nutrición · Progreso · Perfil/Chat.
9. **Panel del entrenador:** web de escritorio como herramienta principal (construir programas en un teléfono es miserable) y app móvil para revisar alertas, responder chat y ver resúmenes.

---

## 4. Módulos funcionales

### 4.1 Onboarding y evaluación inicial

Objetivo: obtener todo lo que un entrenador profesional preguntaría en la primera cita, sin agotar al usuario. Se divide en un núcleo obligatorio corto (5 min) y bloques progresivos que la app pide en los días siguientes.

**Núcleo (día 1):**
- Datos básicos: fecha de nacimiento, sexo biológico (para fórmulas metabólicas) e identidad de género opcional, estatura, peso, unidades (kg/lb, cm/in).
- Objetivo principal y secundario: perder grasa, ganar músculo, recomposición, fuerza, rendimiento deportivo específico, salud general, rehabilitación supervisada, preparación para competencia.
- Experiencia: años entrenando, frecuencia actual, familiaridad con ejercicios clave.
- Disponibilidad: días por semana, minutos por sesión, horarios preferidos.
- Dónde entrena: gimnasio comercial (cuál), casa (qué equipo), exterior, mixto.
- Cuestionario de seguridad **PAR-Q+**: si alguna respuesta es positiva, la app recomienda autorización médica y limita la intensidad hasta tenerla.

**Bloques progresivos (días 2-7):**
- Historial de lesiones y molestias actuales con **mapa corporal interactivo** (tocar la zona, intensidad 0-10, qué movimientos duelen).
- Condiciones médicas relevantes y medicamentos que afectan el entrenamiento o la nutrición (betabloqueadores, insulina, etc.), con disclaimer claro.
- Estilo de vida: ocupación (sedentaria/activa), pasos diarios, sueño habitual, estrés, consumo de alcohol, tabaco.
- Nutrición: tipo de dieta (omnívora, vegetariana, vegana, keto, etc.), alergias e intolerancias, alimentos que no come, presupuesto, si cocina, número de comidas, restricciones religiosas o culturales.
- Relación con la comida y la imagen corporal: preguntas de cribado suaves para detectar riesgo de trastorno de conducta alimentaria (si hay señales, la app desactiva conteos agresivos y sugiere apoyo profesional).
- Motivación y preferencias: qué ejercicios disfruta u odia, estilo de coaching preferido (directo, motivador, técnico), qué le hizo abandonar antes.
- Evaluación física opcional guiada: tests de fuerza submáxima (estimación de 1RM con reps al fallo técnico), movilidad (sentadilla profunda, overhead, toe touch), cardio (test de caminata o de escalón), con videos demostrativos.
- Mediciones y fotos iniciales (ver 4.2).

### 4.2 Mediciones corporales y estado físico

**Peso:**
- Registro manual, por báscula inteligente (HealthKit / Health Connect) o foto de la pantalla de la báscula (OCR).
- Protocolo sugerido: en ayunas, después del baño, misma hora. Recordatorio configurable.
- Visualización con **tendencia suavizada (media móvil exponencial)** y tasa semanal real, para que el ruido diario de agua no desmotive.

**Medidas con cinta, guiadas paso a paso:**
- Cuello, hombros, pecho, cintura (a la altura del ombligo y la mínima), cadera, muslo, pantorrilla, brazo relajado y contraído, antebrazo.
- Cada medida con ilustración animada del punto exacto, cómo sostener la cinta (paralela al suelo, sin comprimir), postura, y momento de la respiración.
- Opción de medir con ayuda de otra persona o del entrenador.
- Detección de valores atípicos ("tu cintura bajó 6 cm en una semana, ¿quieres repetir la medida?").

**Composición corporal (con nivel de confianza explícito):**
- Fórmula de la Marina de EE. UU. (cinta), pliegues cutáneos con plicómetro (Jackson-Pollock 3 y 7 pliegues) para entrenadores, importación de bioimpedancia, captura manual de DEXA/InBody con foto del reporte (OCR + validación).
- Cada valor muestra el método y su margen de error. Nunca se mezclan métodos en una misma curva sin avisarlo.

**Fotos de progreso:**
- Guía con **silueta fantasma superpuesta** de la foto anterior para repetir encuadre, distancia y postura (frente, perfil, espalda).
- Temporizador y control por voz para tomarlas solo. Detección de pose (MediaPipe) para validar que la postura coincide.
- Comparativa lado a lado y deslizador antes/después.
- Almacenamiento cifrado, nunca en el carrete del teléfono salvo que el usuario lo pida, compartidas con el entrenador solo con opt-in explícito.
- Estimación de medidas a partir de fotos: solo como dato complementario y marcado como estimado; no sustituye la cinta.

**Otros indicadores:**
- Frecuencia cardiaca en reposo, VFC (HRV), presión arterial (manual o dispositivos), pasos, sueño (de wearables).
- Rendimiento: 1RM estimados por ejercicio, récords personales por rango de repeticiones, volumen semanal, tests periódicos.

### 4.3 Motor de entrenamiento

**Biblioteca de ejercicios:**
- Catálogo propio curado (objetivo: 800+ ejercicios), cada uno con: video en bucle desde dos ángulos, músculos primarios y secundarios, patrón de movimiento, equipo requerido, nivel, cues técnicos, errores comunes, variantes y sustitutos, contraindicaciones por lesión.
- Ejercicios personalizados creados por el entrenador o el usuario.
- Búsqueda tolerante a errores y acentos, filtros por músculo, equipo, patrón.

**Programas:**
- Generados por la IA a partir del perfil, o creados por el entrenador, o elegidos de plantillas.
- Estructura: programa > mesociclo/bloque > semana > sesión > ejercicio > series.
- Tipos de serie: calentamiento, efectivas, top set + back-off, drop sets, rest-pause, myo-reps, superseries, circuitos, EMOM/AMRAP, por tiempo, cardio (zonas de FC).
- Prescripción por carga fija, %1RM, RPE o RIR, rango de reps con doble progresión.
- Periodización lineal, ondulante o por bloques. Deloads programados o disparados por fatiga.

**Durante la sesión:**
- Vista de la sesión de hoy con duración estimada; reordenar ejercicios si la máquina está ocupada (con sugerencia de sustituto equivalente disponible en ese gym).
- Por serie: peso y reps objetivo, lo que hiciste la última vez, botón "como lo planeado", RPE/RIR opcional.
- Temporizador de descanso automático con notificación y vibración (funciona con la pantalla bloqueada, widget y Live Activity en iOS).
- Calculadora de discos y de carga por lado, conversor kg/lb, calentamiento automático hacia el top set.
- Notas por serie, por ejercicio y por sesión; grabar video de una serie para que el entrenador revise técnica.
- Registro de molestias en el momento (toca la zona del cuerpo).
- Integración con Apple Watch / Wear OS en fase posterior (registrar series desde el reloj).

**Progresión y autorregulación:**
- Ajuste semanal automático según rendimiento real, RPE reportado, readiness, adherencia y molestias.
- Detección de estancamiento (3+ semanas sin progreso en un movimiento) con cambios propuestos.
- Si el usuario falta días, la IA reorganiza la semana en lugar de "romper" el programa.

**Cardio y actividad:**
- Registro de cardio en máquina (cinta, bici, elíptica, remo) con distancia, tiempo, FC; importación de wearables; pasos diarios como objetivo.

### 4.4 Reconocimiento de máquinas del gym

**Flujo de usuario:**
1. En la sesión, toca "Identificar máquina" (o el atajo de cámara).
2. Apunta la cámara; el reconocimiento ocurre en vivo, sin necesidad de pulsar el disparador.
3. Resultado:
   - **Confianza alta:** muestra la máquina y los ejercicios que permite, preseleccionando el que está en el plan de hoy. Un toque para confirmar.
   - **Confianza media:** 3 tarjetas con foto de referencia ("¿es alguna de estas?").
   - **Confianza baja:** abre la búsqueda en el listado, ya filtrada por la categoría detectada (por ejemplo "prensa" o "polea").
4. Una máquina puede permitir varios ejercicios (una estación de poleas, un rack). La app pregunta cuál, sugiriendo el del programa.

**Arquitectura en capas (de más a menos fiable):**

| Capa | Mecanismo | Fiabilidad | Cuándo aplica |
|---|---|---|---|
| 0 | QR o NFC pegado en la máquina (kit para gimnasios aliados) | Determinista | Gyms aliados |
| 1 | Reconocimiento contra el **inventario del gym del usuario** (conjunto cerrado de 50-200 máquinas, con fotos reales de ese gym) mediante embeddings visuales en el dispositivo | Muy alta (problema cerrado) | Gym registrado con inventario |
| 2 | Reconocimiento contra el **catálogo global** por marca y modelo (Life Fitness, Hammer Strength, Technogym, Matrix, Precor, Cybex, Panatta, Gym80, etc.) + lectura de placas/logos (OCR) | Alta | Cualquier gym |
| 3 | Modelo de visión-lenguaje en servidor que describe la máquina y la clasifica por tipo funcional | Media | Máquinas desconocidas |
| 4 | Listado manual con filtros | Total (lo elige el usuario) | Siempre disponible |

**Mejora continua:**
- Cada confirmación del usuario (con su consentimiento) se convierte en una foto etiquetada del inventario de ese gym. Tras 5-10 fotos de una máquina, la capa 1 la reconoce prácticamente siempre.
- El entrenador o el gym pueden "dar de alta" su inventario recorriendo el gimnasio y fotografiando cada máquina (flujo guiado de 20-30 min).
- Métricas: tasa de autoconfirmación, tasa de corrección del usuario (debe tender a ~0), latencia (< 500 ms en el dispositivo).

**Regla de oro:** si el sistema duda, pregunta. Un registro equivocado contamina el historial y destruye la confianza.

### 4.5 Lugares de entrenamiento y ubicación

- Totalmente opcional y explícito. Sin ubicación, la app funciona igual.
- Perfil de gimnasio: nombre, dirección (Google Places), horario, inventario de máquinas, notas ("la prensa 2 está rota").
- Varios lugares por usuario (gym de casa, gym del trabajo, hotel en viaje). Al cambiar de lugar, la sesión se adapta al equipo disponible.
- Check-in automático por geocerca (opcional) para iniciar la sesión y saber asistencia real.
- Estadísticas: asistencia por lugar, horas más concurridas (si hay suficientes usuarios), racha.
- Ubicación precisa nunca se comparte con el entrenador salvo permiso; por defecto se comparte solo "entrenó en X".

### 4.6 Nutrición

**Formas de registrar (de más rápida a más precisa):**
1. **Foto del plato:** el modelo de visión identifica cada componente y estima porciones; el usuario ajusta con deslizadores visuales ("¿más o menos que esto?") y referencias de tamaño (mano, puño, plato estándar).
2. **Código de barras:** Open Food Facts + base propia + verificación comunitaria.
3. **Foto de la etiqueta nutrimental:** OCR para productos sin código o desconocidos.
4. **Búsqueda por texto o voz:** "dos huevos revueltos con una tortilla y medio aguacate" se convierte en ítems.
5. **Comidas guardadas, recetas propias** (con cálculo por porción) y "repetir lo de ayer".
6. **Modo precisión:** pesar con báscula de cocina, gramos exactos.

**Fuentes de datos nutricionales:** USDA FoodData Central, Open Food Facts, tablas nacionales según mercado (por ejemplo el Sistema Mexicano de Alimentos Equivalentes, BEDCA en España, tablas de Latinoamérica), más platillos locales curados (tacos, chilaquiles, arepas, empanadas, etc.), que es donde fallan casi todas las apps.

**Qué calcula:**
- Calorías, proteína, carbohidratos (fibra, azúcares añadidos), grasas (saturadas, insaturadas), y **micronutrientes**: hierro, calcio, vitamina D, B12, magnesio, potasio, sodio, zinc, folato, omega-3, etc., con porcentaje del requerimiento según edad y sexo.
- Hidratación, cafeína, alcohol.
- Suplementos (creatina, proteína, vitaminas) con registro rápido.

**Objetivos y ajuste:**
- Cálculo inicial de gasto (Mifflin-St Jeor o Katch-McArdle si hay % de grasa fiable) + factor de actividad.
- **TDEE adaptativo:** cada semana compara ingesta registrada con la tendencia de peso real y recalibra el gasto. Es lo que hace un buen nutriólogo y es la función de más valor del módulo.
- Objetivo de proteína por kg de masa magra, distribución por comida, ajuste en días de entreno vs. descanso (ciclado opcional).
- Modos de seguimiento: conteo completo, solo proteína y calorías, o **modo hábitos sin números** (para quien no debe o no quiere contar).

**Planes y ayudas:**
- Plan de comidas generado o creado por el entrenador, con lista de compras.
- Sugerencias contextuales ("te faltan 40 g de proteína; opciones con lo que sueles comer: ...").
- Avisos de micronutrientes deficientes sostenidos (no de un día).

**Límite profesional:** la app no prescribe dietas clínicas (diabetes, enfermedad renal, embarazo). Si el perfil lo indica, recomienda nutriólogo y se limita a registro.

### 4.7 Bienestar, estado emocional y check-ins

**Readiness antes de entrenar (30 segundos, 4-5 preguntas con escalas visuales):**
- Horas y calidad de sueño (o importado del wearable), energía, estrés, dolor muscular, ánimo, motivación.
- Resultado: puntuación de readiness que ajusta la sesión de hoy (mantener, reducir volumen, cambiar a sesión técnica o de recuperación).

**Después de entrenar (20 segundos):**
- ¿Cómo se sintió la sesión? (sRPE 1-10), disfrute, energía final, molestias nuevas (mapa corporal), comentario libre o nota de voz (transcrita).

**Check-in semanal (2-3 minutos, el más importante para el entrenador):**
- Peso promedio, medidas si toca, fotos si toca, adherencia percibida al entrenamiento y la dieta, hambre, digestión, sueño, estrés, ánimo, vida social, qué salió bien, qué fue difícil, pregunta para el entrenador.

**Otros:**
- Seguimiento del ciclo menstrual opcional (afecta rendimiento, retención de líquidos y hambre), con ajustes de interpretación del peso.
- Diario breve opcional.

**Banderas rojas y deber de cuidado:**
- Dolor en el pecho, mareo, desmayo, dolor articular agudo: detener sesión, recomendar atención médica.
- Señales de trastorno alimentario, sobreentrenamiento o ánimo bajo sostenido: la app no diagnostica; muestra recursos de ayuda profesional, suaviza objetivos y avisa al entrenador si el atleta lo permitió.
- Protocolos definidos con un profesional de salud antes del lanzamiento.

### 4.8 Motor de análisis e insights

**Principio:** los números los calcula código determinista y verificable; la IA explica, prioriza y redacta. Nunca al revés.

**Métricas calculadas:**
- Volumen efectivo semanal por grupo muscular (series duras) frente a rangos recomendados.
- Carga de entrenamiento (sRPE × duración), relación carga aguda/crónica, monotonía.
- Progresión de 1RM estimado y de rendimiento por ejercicio.
- Tendencia de peso, tasa semanal, TDEE adaptativo.
- Adherencia: sesiones completadas, series completadas vs. planeadas, días con registro nutricional, objetivo de proteína cumplido.
- Readiness y su relación con el rendimiento.
- Composición: cambios de medidas vs. peso (¿pierde grasa o músculo?).

**Salidas:**
- **Informe semanal** para el atleta: qué pasó, qué significa, qué cambia la próxima semana (3 puntos accionables como máximo).
- **Correlaciones personales** con suficiente evidencia (mínimo de datos, sin inventar causalidad).
- **Alertas para el entrenador**, priorizadas (ver 4.10).
- Proyecciones: "a este ritmo llegas a 78 kg alrededor del 15 de febrero", con rango.

### 4.9 Coach IA conversacional

- Chat (texto y voz) que conoce todo el perfil y el historial mediante herramientas de consulta (no se le pega toda la base en el prompt).
- Puede: explicar el plan, sustituir un ejercicio, reprogramar la semana, resolver dudas de técnica y nutrición, registrar cosas por voz ("hice 3 series de 10 con 60 kilos en press banca").
- Los cambios que hace al plan se muestran como propuesta con antes y después; el usuario (o el entrenador, si tiene uno) aprueba.
- Si el atleta tiene entrenador humano, la IA no contradice sus decisiones: deriva la duda al entrenador y lo indica.
- Límites duros: no diagnostica, no prescribe medicamentos ni dietas clínicas, no recomienda sustancias ilegales o dopaje, y escala banderas rojas.

### 4.10 Panel del entrenador

**Pantalla principal "Hoy":**
- Roster de afiliados con semáforo (verde, amarillo, rojo) calculado por: adherencia, check-in pendiente, readiness bajo sostenido, molestias nuevas, estancamiento, inactividad, desviación nutricional, fin de programa próximo, pago vencido.
- Bandeja de alertas priorizada con acción sugerida y borrador de mensaje generado por la IA.

**Ficha del afiliado:**
- Línea de tiempo unificada: sesiones, check-ins, peso, fotos, comida, mensajes, notas.
- Gráficas de todas las métricas, comparativa de fotos, mapa de lesiones.
- Notas privadas del entrenador (no visibles al atleta).

**Constructor de programas:**
- Editor tipo hoja de cálculo con arrastrar y soltar, atajos de teclado, duplicar semanas, progresiones automáticas por fórmula.
- Biblioteca de plantillas propias; asignar un programa a muchos afiliados a la vez con ajustes individuales.
- La IA genera un borrador a partir del perfil del afiliado y el entrenador lo edita.

**Nutrición:** asignar objetivos, planes de comidas, revisar diarios, comentar comidas.

**Check-ins:** formularios personalizables, revisión en cola (uno tras otro, como bandeja de correo), respuestas rápidas, respuesta en video o audio.

**Revisión de técnica:** ver videos de series con anotaciones dibujadas y comentario con marca de tiempo.

**Comunicación:** chat 1 a 1, mensajes a grupos, anuncios, mensajes programados.

**Negocio:** invitar afiliados por enlace o código, paquetes y precios, cobro recurrente (Stripe Connect), estado de pagos, métricas del negocio (retención, ingresos, afiliados activos), marca blanca (logo y colores) en fase posterior.

**Equipo:** organización con varios entrenadores, reasignación de afiliados, permisos (fase posterior).

### 4.11 Comunicación y notificaciones

- Push, email y, opcionalmente, WhatsApp (muy relevante en Latinoamérica).
- Notificaciones inteligentes con límite diario y horario de silencio; nunca culpabilizantes.
- Recordatorios: entreno del día, check-in, pesaje, fotos, comidas (opcional), hidratación (opcional).
- Centro de notificaciones dentro de la app.

### 4.12 Motivación y gamificación (sobria)

- Rachas flexibles (cuentan semanas cumplidas, no días, para no premiar el sobreentrenamiento).
- Récords personales, hitos (primer 100 kg en sentadilla, 50 sesiones), resúmenes mensuales compartibles.
- Retos opcionales creados por el entrenador para sus afiliados.
- Comunidad o ranking: solo si se decide (ver preguntas); por defecto, privado.

### 4.13 Integraciones

- Apple HealthKit y Google Health Connect (peso, pasos, sueño, FC, HRV, entrenamientos).
- Wearables vía API: Garmin, Oura, Whoop, Polar, Fitbit (fase posterior; agregadores como Terra pueden acelerar).
- Básculas inteligentes (vía HealthKit/Health Connect).
- Calendario (agendar sesiones), Strava (cardio).

### 4.14 Seguridad, privacidad y cumplimiento

- Cifrado en tránsito (TLS) y en reposo; fotos corporales en almacenamiento privado con URLs firmadas de corta duración.
- Control de acceso a nivel de fila en la base de datos (cada consulta respeta quién puede ver qué).
- Consentimientos versionados y separados por finalidad (servicio, compartir con entrenador, uso de fotos para mejorar modelos, marketing).
- Derechos del titular: exportar todos los datos (JSON + PDF), eliminar cuenta y datos de forma real.
- Marco legal según mercado: LFPDPPP (México, datos sensibles requieren consentimiento expreso), GDPR (UE), LGPD (Brasil), leyes estatales de EE. UU. sobre datos de salud de consumidores. Revisión legal antes del lanzamiento.
- Los proveedores de IA deben operar con retención cero de datos; no se envían fotos corporales a modelos externos salvo necesidad y consentimiento.
- Autenticación con passkeys, Apple/Google, email; 2FA obligatorio para entrenadores.
- Bitácora de auditoría de accesos a datos sensibles.
- Disclaimers médicos claros sin esconder la utilidad.

### 4.15 Internacionalización y unidades

- Español primero (neutro con variantes regionales de alimentos y nombres de ejercicios), inglés después.
- Unidades métricas e imperiales por preferencia, independientes entre peso corporal y cargas (muchos gyms en Latam usan libras en las máquinas).
- Zonas horarias correctas para rachas y recordatorios.

---

## 5. Flujos clave (de punta a punta)

**A. Primer día del atleta sin entrenador:** descarga, cuenta con Apple/Google, núcleo de onboarding (5 min), PAR-Q+, elige gym (opcional), la IA genera programa de 4 semanas y objetivos nutricionales, ve "Hoy" con su primera sesión y una guía de cómo tomarse medidas mañana en ayunas.

**B. Sesión en el gym:** readiness de 30 s, sesión ajustada, primer ejercicio, máquina ocupada, apunta la cámara a otra, la app la reconoce y propone el sustituto equivalente, registra series con un toque, descansos automáticos, molestia leve en hombro registrada tocando el mapa, check-in post-sesión de 20 s, resumen con PR destacado.

**C. Comida:** foto del plato, la app detecta arroz, pollo, frijoles y aguacate con porciones estimadas, el usuario sube la porción de arroz con un deslizador, guarda. Dashboard muestra que faltan 35 g de proteína y propone opciones habituales.

**D. Semana del entrenador:** el lunes abre el panel, 3 alertas rojas (un afiliado con dolor de rodilla recurrente, otro sin check-in, otro estancado en peso 3 semanas), la IA propone cambios concretos y borradores de mensaje, el entrenador aprueba dos y edita uno; revisa 12 check-ins en cola en 25 minutos.

**E. Alta de inventario de un gym:** el entrenador inicia "registrar mi gym", recorre las máquinas tomando 3 fotos de cada una, la app sugiere marca y modelo, confirma, y desde ese momento todos los usuarios de ese gym tienen reconocimiento casi perfecto.

---

## 6. Arquitectura y stack recomendado

### 6.1 Resumen

| Capa | Elección | Por qué |
|---|---|---|
| Lenguaje | **TypeScript** en todo (más Python solo para ML) | Un solo lenguaje para app, web y backend; tipos compartidos de punta a punta. |
| Monorepo | **Turborepo + pnpm** | Paquetes compartidos (tipos, validaciones, lógica de cálculo, cliente de API, UI tokens). |
| App móvil | **React Native con Expo** (Expo Router, EAS Build/Update) | iOS y Android con un código, actualizaciones OTA para corregir sin pasar por la tienda, acceso nativo completo a cámara, HealthKit, Health Connect, notificaciones, widgets. |
| Cámara y ML en dispositivo | **react-native-vision-camera** + modelos con **ExecuTorch o TFLite** (react-native-fast-tflite), **MediaPipe** para pose | Reconocimiento en vivo, offline y en < 500 ms; detección de pose para fotos de progreso y, después, conteo de repeticiones. |
| UI móvil | **NativeWind** (Tailwind para RN) + componentes propios, **Reanimated**, **Skia** (gráficas con Victory Native) | Mismo lenguaje de diseño que la web, animaciones a 60 fps, gráficas fluidas. |
| Datos offline en el móvil | **SQLite local + PowerSync** (sincroniza con Postgres) | Registro completo sin señal, resolución de conflictos, sincronización parcial por usuario. |
| Panel del entrenador (web) | **Next.js (App Router) en Vercel** + **shadcn/ui** + Tailwind + TanStack Table | Herramienta de escritorio rica (tablas, editor de programas), despliegues de vista previa por rama. |
| Backend / API | **Route handlers y server actions de Next.js** o **Hono** como API dedicada, con **tRPC** o contratos **Zod** compartidos | Tipado de extremo a extremo entre app, web y servidor. |
| Base de datos | **PostgreSQL** gestionado (**Supabase**) con **pgvector**, **pg_trgm** y **unaccent** | Relacional para datos de entrenamiento (muy estructurados), vectores para reconocimiento y búsqueda semántica, búsqueda tolerante a acentos, RLS para permisos atleta-entrenador. |
| ORM y migraciones | **Drizzle ORM** | SQL explícito, tipos fuertes, migraciones versionadas. |
| Autenticación | **Supabase Auth** (Apple, Google, email, passkeys) | Integrada con RLS en Postgres; alternativa: Clerk si se priorizan organizaciones B2B listas para usar. |
| Archivos (fotos, videos) | **Supabase Storage privado** (o S3/R2) con URLs firmadas; transcodificación de video con **Mux** | Fotos corporales nunca públicas; videos de técnica con streaming eficiente. |
| Tiempo real (chat) | **Supabase Realtime** al inicio; **Stream** si el chat crece en funciones | Chat entrenador-atleta, presencia, notificaciones en vivo en el panel. |
| Trabajos en segundo plano | **Vercel Workflow / Queues** (o Trigger.dev) | Informes semanales, recálculo de TDEE, procesamiento de fotos, generación de programas: tareas largas con reintentos. |
| IA (LLM y visión) | **AI SDK** a través de **Vercel AI Gateway** con modelos Claude (Opus 5.5 para programación y análisis profundo, Sonnet 5.5 para chat y visión de comida, Haiku 5.5 para clasificación rápida y barata) | Un solo SDK, fallbacks entre modelos, observabilidad de costos, retención cero. |
| ML propio | Servicio en **Python** (FastAPI) para entrenar y servir embeddings de máquinas; GPU bajo demanda (Modal o similar) | Entrenamiento del modelo de máquinas y re-indexado del catálogo. |
| Datos nutricionales | USDA FoodData Central, Open Food Facts, tablas nacionales, base propia curada | Números verificables, nunca inventados. |
| Pagos | **RevenueCat** (suscripciones en App Store y Google Play) + **Stripe** (web y B2B) + **Stripe Connect** (entrenadores cobrando a afiliados) | Cumplir reglas de las tiendas y permitir el negocio del entrenador. |
| Notificaciones | **Expo Notifications** (push), **Resend** (email), WhatsApp Business API (opcional) | Canales adecuados por mercado. |
| Analítica y flags | **PostHog** (eventos, embudos, feature flags, experimentos) | Medir activación y retención; grabación de sesiones desactivada en pantallas sensibles. |
| Errores y rendimiento | **Sentry** (móvil y web) | Trazas de crashes, rendimiento de pantallas. |
| Pruebas | **Vitest** (lógica), **Playwright** (web), **Maestro** (E2E móvil), suite de **evals** para IA | Las fórmulas y la IA se prueban con casos dorados. |
| CI/CD | **GitHub Actions** + **EAS** (móvil) + **Vercel** (web) | Vista previa por PR, builds automatizados, OTA controlado. |

### 6.2 Alternativas descartadas y por qué

- **Flutter:** excelente para UI, pero obliga a Dart en móvil y TypeScript en la web; se pierde compartir tipos y lógica de cálculo con el panel.
- **Nativo puro (Swift + Kotlin):** el mejor rendimiento, pero dos equipos y el doble de costo para un producto que necesita iterar rápido. Se reserva para módulos concretos (widgets, Live Activities, Apple Watch) como módulos nativos de Expo.
- **Firebase/Firestore:** rápido para empezar, pero los datos de entrenamiento son profundamente relacionales (programas, series, analíticas por semana); las consultas analíticas en documentos son dolorosas y caras.
- **Solo PWA:** sin acceso fiable a HealthKit, notificaciones limitadas en iOS, cámara en vivo con ML inferior.

### 6.3 Estructura del monorepo

```
apps/
  mobile/          Expo (atleta y entrenador en móvil)
  web/             Next.js (panel del entrenador, landing, admin interno)
  ml/              Python: entrenamiento e indexado de modelos de visión
packages/
  core/            Fórmulas y lógica de dominio pura (1RM, TDEE, volumen, readiness)
  db/              Esquema Drizzle, migraciones, políticas RLS, seeds
  api/             Contratos (Zod/tRPC) y cliente tipado
  ai/              Prompts, herramientas del coach, evals
  ui/              Tokens de diseño compartidos y componentes base
  i18n/            Traducciones
```

`packages/core` es crítico: toda fórmula vive ahí una sola vez, con pruebas, y la usan tanto el móvil (offline) como el servidor.

### 6.4 Modelo de datos núcleo (simplificado)

- **Identidad:** `users`, `profiles`, `athlete_profiles`, `coach_profiles`, `organizations`, `memberships`, `coach_athlete_links` (estado, permisos por categoría), `consents`.
- **Salud y cuerpo:** `body_weights`, `body_measurements` (tipo, valor, método), `body_compositions` (método, margen de error), `progress_photos`, `injuries`, `medical_screenings` (PAR-Q+), `wearable_daily_metrics`.
- **Entrenamiento:** `exercises`, `exercise_media`, `muscles`, `equipment`, `machines` (marca, modelo, tipo), `machine_exercises`, `programs`, `program_blocks`, `program_weeks`, `planned_sessions`, `planned_exercises`, `planned_sets`, `workout_sessions`, `performed_exercises`, `performed_sets` (peso, reps, RPE/RIR, tipo), `personal_records`.
- **Lugares:** `gyms`, `gym_machines` (inventario), `machine_images` (con embedding vectorial), `user_locations`, `check_ins`.
- **Nutrición:** `foods`, `food_nutrients`, `food_portions`, `recipes`, `meals`, `meal_items`, `nutrition_targets`, `meal_plans`, `water_logs`, `supplement_logs`.
- **Bienestar:** `readiness_checks`, `session_feedback`, `weekly_checkins`, `checkin_templates`, `pain_reports`, `cycle_logs`.
- **Coaching:** `conversations`, `messages`, `coach_notes`, `alerts`, `ai_proposals` (antes/después, estado de aprobación), `weekly_reports`.
- **Negocio:** `plans`, `subscriptions`, `invoices`, `payouts`.
- **Plataforma:** `audit_log`, `ai_usage` (tokens y costo por usuario), `notifications`.

Todas las tablas con datos personales llevan `user_id` y políticas RLS; las de entrenador se resuelven a través de `coach_athlete_links` y sus permisos.

---

## 7. Estrategia de IA

| Tarea | Enfoque | Modelo / técnica |
|---|---|---|
| Reconocer máquina (gym conocido) | Embeddings visuales en el dispositivo + kNN contra el inventario del gym | Modelo compacto tipo MobileCLIP/SigLIP afinado con fotos de máquinas |
| Reconocer máquina (desconocida) | Embeddings contra catálogo global en servidor + OCR de marca + verificación con modelo de visión-lenguaje | pgvector + Claude Sonnet 5.5 (visión) |
| Reconocer comida | Visión-lenguaje para identificar componentes y porciones, luego mapeo a base nutricional | Claude Sonnet 5.5 (visión) + búsqueda en base propia |
| Código de barras y etiquetas | Lectura nativa de códigos + OCR | Vision Camera + ML Kit / Vision |
| Pose (fotos, técnica) | Estimación de puntos clave en el dispositivo | MediaPipe Pose |
| Generar programas | Reglas de programación (volumen, frecuencia, patrones) como restricciones + LLM para elegir y ajustar | Claude Opus 5.5 con salida estructurada validada por Zod y por reglas de `packages/core` |
| Informes semanales y alertas | Métricas deterministas + LLM que redacta y prioriza | Claude Sonnet 5.5 |
| Coach conversacional | Agente con herramientas de consulta y de propuesta (nunca escribe directo sin aprobación) | Claude Sonnet 5.5, Opus 5.5 para preguntas complejas |
| Clasificar texto libre, notas de voz | Extracción estructurada | Claude Haiku 5.5 + transcripción de voz |

**Calidad y control:**
- Suite de evaluaciones con casos dorados: 500 fotos de máquinas etiquetadas, 500 fotos de comida con peso real medido, 100 perfiles de atleta con programas revisados por entrenadores certificados.
- Toda salida estructurada se valida; si no pasa las reglas (por ejemplo, volumen fuera de rango seguro), se rechaza y se reintenta.
- Registro de costo por usuario y tope mensual por plan; caché de respuestas e informes.
- Revisión humana de una muestra de recomendaciones cada semana durante la beta.

---

## 8. Roadmap por fases

Las duraciones dependen del tamaño del equipo (ver preguntas); se indican criterios de salida en lugar de fechas.

**Fase 0: Descubrimiento y diseño**
- Responder las preguntas de la sección 10.
- Entrevistas con 10 entrenadores y 20 atletas; validar disposición a pagar.
- Diseño completo en Figma de los flujos A a E y del sistema de diseño.
- Curación inicial del catálogo de ejercicios (300) y de alimentos locales.
- Salida: prototipo navegable validado con usuarios reales.

**Fase 1: MVP (entrenador + atleta, núcleo sólido)**
- Cuentas, roles, vínculo entrenador-atleta con permisos.
- Onboarding núcleo, PAR-Q+, lesiones.
- Registro de entrenamiento offline con listado de ejercicios, temporizador, historial, PRs.
- Programas creados por el entrenador (constructor web) y plantillas.
- Peso, medidas guiadas, fotos de progreso con silueta.
- Readiness, feedback post-sesión, check-in semanal.
- Nutrición: búsqueda, código de barras, comidas guardadas, objetivos.
- Panel del entrenador: roster con semáforo, ficha, cola de check-ins, chat.
- Salida: 5 entrenadores usándolo con sus afiliados reales durante 4 semanas.

**Fase 2: Inteligencia**
- Reconocimiento de máquinas capas 0, 1 y 4 (QR + inventario del gym + listado); alta de inventario guiada.
- Foto de comida y OCR de etiquetas.
- Motor de análisis, informes semanales, alertas priorizadas, TDEE adaptativo.
- Lugares de entrenamiento y check-in por geocerca.
- HealthKit y Health Connect.
- Salida: tasa de corrección de máquinas < 2% en gyms con inventario; retención a 8 semanas medida.

**Fase 3: Entrenador IA autónomo**
- Generación y ajuste automático de programas para atletas sin entrenador.
- Coach conversacional con propuestas aprobables.
- Reconocimiento capas 2 y 3 (catálogo global).
- Pagos: suscripción del atleta, Stripe Connect para entrenadores.
- Revisión de técnica en video con anotaciones.
- Salida: atletas sin entrenador con adherencia comparable a los que sí tienen.

**Fase 4: Escala**
- Organizaciones y gimnasios (admin de gym), marca blanca.
- Wearables vía API, Apple Watch / Wear OS.
- Conteo de repeticiones y feedback de técnica por cámara.
- Marketplace de entrenadores, comunidad y retos (si se decide).
- Inglés y nuevos mercados.

---

## 9. Riesgos principales y mitigación

| Riesgo | Mitigación |
|---|---|
| Expectativa de reconocimiento "perfecto" | Capas con umbral, QR determinista, nunca autoconfirmar con duda, comunicarlo bien. |
| Lesión de un usuario por una recomendación | PAR-Q+, reglas de seguridad duras en `core`, progresiones conservadoras, revisión de protocolos por profesionales, términos y seguro de responsabilidad. |
| Fomentar trastornos alimentarios | Cribado, modo sin números, límites mínimos de calorías, lenguaje cuidado. |
| Fuga de fotos corporales | Almacenamiento privado cifrado, URLs firmadas, auditoría, mínimo de copias, pruebas de penetración. |
| Costo de IA por usuario | Modelos en dispositivo para lo frecuente, modelo barato para lo simple, caché, topes por plan. |
| Rechazo en App Store por salud/pagos | Disclaimers, cumplir guías de salud, pagos de contenido digital vía compras dentro de la app. |
| Fricción de registro alto que mata la retención | Modo gym, "como lo planeado", offline, check-ins de una pregunta. |
| Catálogo de alimentos locales pobre | Curación propia desde el día uno, contribuciones verificadas. |

---

## 10. Preguntas abiertas para definir la app

Responder estas preguntas define el alcance real del MVP, el modelo de negocio y varias decisiones técnicas. Están agrupadas y numeradas para que se puedan contestar por número.

### A. Negocio y mercado
1. ¿En qué país o países se lanza primero? (Define leyes de datos, tablas de alimentos, idioma, moneda, métodos de pago, uso de WhatsApp.)
2. ¿Quién paga? ¿El atleta (B2C), el entrenador (B2B), el gimnasio, o una combinación?
3. ¿Cuál es el cliente prioritario para la primera versión: el atleta que entrena solo o el entrenador con afiliados? (Cambia el orden del roadmap.)
4. ¿Hay entrenadores o gimnasios concretos dispuestos a probarla desde el inicio? ¿Cuántos y con cuántos afiliados cada uno?
5. ¿Rango de precio imaginado para el atleta y para el entrenador?
6. ¿Habrá un plan gratuito? ¿Qué incluye y qué queda detrás del pago?
7. ¿Los entrenadores cobrarán a sus afiliados a través de la app (la plataforma toma comisión) o fuera de ella?
8. ¿Se piensa en un marketplace donde atletas encuentren entrenadores?
9. ¿La app tendrá marca propia o los entrenadores/gyms querrán su propia marca (marca blanca)?
10. ¿Competidores que admiras o detestas y por qué? (Por ejemplo apps de registro de entreno, de conteo de calorías o de gestión de entrenadores.)

### B. Usuarios y alcance
11. ¿Perfil de edad objetivo? ¿Se permiten menores de edad? (Implica consentimiento parental y restricciones.)
12. ¿Se atenderán poblaciones especiales: embarazo, adultos mayores, rehabilitación, condiciones crónicas? ¿Con qué límites?
13. ¿Solo musculación y fitness, o también deportes específicos (crossfit, powerlifting, halterofilia, running, calistenia, deportes de equipo)?
14. ¿Entrenamiento en casa y al aire libre es parte del alcance desde el MVP?
15. ¿Un atleta puede tener varios entrenadores a la vez (por ejemplo uno de fuerza y un nutriólogo)?
16. ¿Habrá un rol separado de nutriólogo/dietista, distinto del entrenador?
17. ¿Un entrenador puede trabajar en varias organizaciones o gyms?
18. ¿Los entrenadores también entrenan presencialmente a sus afiliados? ¿Necesitan agenda de citas y control de sesiones presenciales?
19. ¿Hay entrenamiento grupal (clases) que gestionar?

### C. Entrenamiento
20. ¿Qué tan autónoma debe ser la IA para un atleta sin entrenador: puede cambiar el programa sola o siempre pide confirmación?
21. ¿Qué metodologías de programación deben soportarse sí o sí (RPE, %1RM, RIR, doble progresión, 5/3/1, bloques)?
22. ¿Se necesita registro por tiempo y distancia para cardio y funcional, o solo pesas al inicio?
23. ¿Importa soportar libras y kilos mezclados en el mismo gym?
24. ¿Videos de ejercicios propios (producción propia, mejor calidad y coherencia) o licenciados? ¿Hay presupuesto para grabarlos?
25. ¿Los entrenadores podrán subir sus propios videos de ejercicios?
26. ¿Análisis de técnica por cámara (conteo de reps, ángulos) es deseable a mediano plazo?
27. ¿Integración con Apple Watch / Wear OS para registrar desde el reloj es prioritaria?

### D. Reconocimiento de máquinas
28. ¿Es aceptable que el reconocimiento "casi perfecto" dependa de que el gym tenga su inventario registrado (fotos de sus máquinas)?
29. ¿Habrá gimnasios aliados dispuestos a pegar códigos QR/NFC en las máquinas?
30. ¿Quién registra el inventario de un gym: el entrenador, el gym, la plataforma, o los propios usuarios colaborativamente?
31. ¿Hay acceso a gimnasios para fotografiar máquinas y construir el conjunto de datos inicial? ¿Cuántos?
32. ¿Qué marcas de máquinas predominan en el mercado objetivo?
33. ¿Se acepta pedir consentimiento para usar las fotos de los usuarios para mejorar el modelo?

### E. Nutrición
34. ¿La app debe dar planes de alimentación completos con menús y recetas, o solo objetivos y registro?
35. ¿Qué tan importante es la comida local y casera frente a productos empaquetados?
36. ¿Se necesita lista de compras y recetas con costo estimado?
37. ¿Se registran suplementos? ¿Se recomiendan? (Cuidado regulatorio.)
38. ¿Ayuno intermitente y otros protocolos deben soportarse explícitamente?
39. ¿Debe existir un modo sin números para personas con historial de trastornos alimentarios?
40. ¿Se integrará con restaurantes o cadenas populares (menús con información nutricional)?
41. ¿Precisión de micronutrientes: solo los principales (8-10) o completos (30+)?

### F. Cuerpo, salud y bienestar
42. ¿Qué medidas corporales son obligatorias y cuáles opcionales?
43. ¿Los entrenadores harán pliegues cutáneos? ¿Con qué protocolo?
44. ¿Se integrarán dispositivos tipo InBody o básculas concretas que ya usan los gyms aliados?
45. ¿Hasta dónde llega el seguimiento emocional: solo escalas de ánimo y estrés, o también diario, cuestionarios validados (por ejemplo de estrés o bienestar)?
46. ¿Hay un profesional de salud (médico deportivo, psicólogo, nutriólogo) que valide protocolos y banderas rojas?
47. ¿Seguimiento del ciclo menstrual entra en el MVP?
48. ¿Qué se hace ante una bandera roja: solo mostrar recursos, avisar al entrenador, ambas?

### G. Ubicación
49. ¿Para qué se usa la ubicación además de registrar el lugar: asistencia, check-in automático, gyms cercanos, estadísticas de afluencia?
50. ¿El entrenador debe poder ver dónde entrenó su afiliado?
51. ¿Se quiere detectar automáticamente cuando el usuario llega al gym (geocerca) para iniciar la sesión?

### H. Panel del entrenador
52. ¿Cuántos afiliados maneja un entrenador típico de tu mercado? (Define el diseño del roster: 10 o 200 cambian todo.)
53. ¿Qué herramientas usan hoy los entrenadores (Excel, WhatsApp, Google Forms, otras apps) y qué odian de ellas?
54. ¿El entrenador necesita comunicarse por video llamada dentro de la app?
55. ¿Qué informes quieren enviar a sus clientes (PDF mensual con su marca)?
56. ¿Necesitan gestión de pagos, facturación fiscal (por ejemplo CFDI en México), recordatorios de cobro?
57. ¿Requieren formularios de check-in completamente personalizables?
58. ¿El entrenador debe aprobar cada cambio que proponga la IA para sus afiliados, o puede delegar ciertos cambios?

### I. Comunicación y comunidad
59. ¿Chat solo entre entrenador y afiliado, o también grupos?
60. ¿WhatsApp como canal de notificación es importante?
61. ¿Habrá comunidad, feed social o rankings entre usuarios? ¿Públicos o por gym?
62. ¿Qué tono debe tener la app y el coach IA: cercano, técnico, motivador, neutral? ¿Tuteo o usted?

### J. Diseño y marca
63. ¿Ya existe nombre, logo, paleta o identidad de marca?
64. ¿Referencias visuales que te gusten (apps, sitios)?
65. ¿Modo oscuro por defecto (habitual en gyms) o claro?
66. ¿La app del entrenador y la del atleta son la misma aplicación con cambio de modo, o dos apps separadas en la tienda?

### K. Datos, privacidad y legal
67. ¿Cuentas con asesoría legal para términos, privacidad y consentimiento de datos sensibles?
68. ¿Los datos deben residir en una región específica (por ejemplo dentro del país o la UE)?
69. ¿Se permite usar datos anonimizados para mejorar el producto y los modelos?
70. ¿Qué pasa con los datos del atleta si deja al entrenador? ¿Y si el entrenador deja la plataforma?
71. ¿Habrá auditorías o certificaciones requeridas por clientes empresariales (gimnasios grandes)?

### L. Técnico y operación
72. ¿Tamaño y perfil del equipo de desarrollo? ¿Experiencia en React Native, Next.js, Python, ML?
73. ¿Presupuesto mensual aproximado para infraestructura e IA en el primer año?
74. ¿Plazo objetivo para tener el MVP en manos de entrenadores reales?
75. ¿iOS y Android a la vez o uno primero? ¿Qué proporción hay en el mercado objetivo?
76. ¿Hay restricciones de proveedor (nube preferida, proveedores de IA aprobados o prohibidos)?
77. ¿Qué tan importante es el funcionamiento sin conexión en tu mercado? (Por ejemplo gyms en sótanos.)
78. ¿Se necesita un panel de administración interno para gestionar catálogos y soporte desde el MVP?
79. ¿Soporte al cliente: chat dentro de la app, email, WhatsApp?

### M. Métricas de éxito
80. ¿Cómo se mide el éxito a 6 meses: usuarios activos, entrenadores de pago, retención, ingresos, resultados físicos de los usuarios?
81. ¿Qué resultado concreto debe poder mostrar un usuario tras 12 semanas para considerar que la app "funciona"?
82. ¿Se quiere comparar resultados de atletas con IA frente a atletas con entrenador humano como prueba del producto?

---

## 11. Próximos pasos inmediatos

1. Responder las preguntas, priorizando A1-A4, B11-B13, D28-D31, H52-H53, K67, L72-L75.
2. Con esas respuestas: cerrar el alcance del MVP y ajustar el stack si alguna restricción lo exige.
3. Sesión de diseño de flujos A a E y del sistema de diseño.
4. Inicializar el monorepo (Turborepo, Expo, Next.js, Drizzle, Supabase) con CI, entornos y `packages/core` con sus primeras fórmulas probadas.
5. Arrancar en paralelo la recolección del conjunto de datos de máquinas en 2-3 gyms aliados, que es el camino crítico del reconocimiento.
