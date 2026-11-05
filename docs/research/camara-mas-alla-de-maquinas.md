# La cámara más allá de reconocer máquinas

Fecha: 5 de noviembre de 2026. Complementa `reconocimiento-maquinas.md` y las secciones 4.2, 4.3 y 4.4 de `PLAN.md`. No es asesoría jurídica ni médica.

## Conclusión

Reconocer la máquina es la puerta de entrada, no el producto. Lo más valioso es lo que pasa en los 10 segundos siguientes: cómo se ajusta, cuánto peso poner y qué hacer si está ocupada. Eso casi no necesita IA nueva, cuesta poco y no toca datos sensibles.

Analizar a la persona con cámara es posible y llamativo, pero la evidencia es más débil y el riesgo mayor. Conviene hacerlo por etapas, siempre dentro del teléfono y empezando por medir, no por juzgar la técnica.

**Niveles de evidencia usados aquí:**
- **Verificado:** lo leí en la fuente original.
- **Resumen:** lo vi en el resumen de un buscador, sin leer el texto completo.
- **Encuesta comercial:** dato de una empresa interesada; sirve como indicio.
- **Hipótesis:** idea mía, sin evidencia todavía.

## Qué problema hay que resolver

No saber usar los equipos aparece entre las barreras frecuentes para entrar al gym: 43 % en una encuesta de 1.000 personas en EE. UU. y 26 % en una de 2.000 en Reino Unido. Una encuesta a personas que no van al gym encontró que 48 % se avergonzaría de pedir ayuda y 64 % no sabría cuánto peso usar. Son encuestas comerciales con preguntas distintas, y ninguna es de Colombia. Aun así, apuntan a lo mismo: la duda no es solo "qué máquina es", sino "cómo la uso sin hacer el ridículo".

## Prioridades

### Primero: alrededor de la máquina

| # | Función | Qué hace | IA nueva | Datos sensibles | Evidencia |
|---|---|---|---|---|---|
| 1 | **Tarjeta de la máquina** | Al confirmar: cómo ajustarla, músculos, 2 o 3 indicaciones y errores comunes | No (faltan contenidos y revisión) | No | Encuesta comercial sobre la necesidad |
| 2 | **Cuánto peso poner** | Lo que hizo la última vez y una propuesta aceptable o rechazable. Si es la primera vez, una guía para encontrar el peso | No | Salud, ya autorizado | Encuesta comercial sobre la necesidad |
| 3 | **Mi ajuste en esta máquina** | Recuerda altura de asiento, posición del respaldo y notas de esa máquina en ese gym | No | No | Hipótesis |
| 4 | **Está ocupada** | Propone otro ejercicio por músculo y patrón de movimiento, datos que el catálogo ya tiene | No | No | Ya está en `PLAN.md` |
| 5 | **Unidades y carga real** | Avisa que la pila puede estar en libras, sin números o con una carga distinta en otro gym, y evita comparar marcas entre máquinas diferentes | Quizás leer la pila por foto | No | Hipótesis; medir antes de prometer |
| 6 | **Mi gym** | Las máquinas confirmadas forman el inventario del usuario. Reconoce más rápido y adapta el plan a lo que hay | No al inicio | Ubicación, opcional | Ya está en `reconocimiento-maquinas.md` |

### Después: la persona, en etapas

| Etapa | Función | Qué dice la evidencia | Decisión |
|---|---|---|---|
| A | **Contar repeticiones y medir ritmo** con el teléfono apoyado | La cuenta puede acercarse a la humana, pero empeora con oclusión, ángulo y distancia (resumen). En una máquina, la propia estructura tapa el cuerpo | Prototipo. Registrar solo si la persona confirma |
| B | **Medidas objetivas por ejercicio:** rango, simetría y velocidad | Un trabajo reciente con pose sin marcadores se presenta como estudio de factibilidad, no como evaluación biomecánica validada (resumen) | Mostrar números, no calificaciones |
| C | **Revisar mi ajuste** con una foto sentado en la máquina, por ejemplo rodilla alineada con el eje | No encontré estudios ni apps que lo validen. Podría ser un diferencial | Hipótesis. Probarla primero con 2 o 3 máquinas |
| D | **Video para el entrenador** | Ya está en `PLAN.md`. Una persona evalúa; la IA no opina | Sí, cuando exista el panel |

### Por ahora no

- **Puntaje o corrección automática de técnica ("tu sentadilla: B+").** Un resumen de 2026 afirma que ninguna app de consumo detecta y corrige fallas con la precisión de un entrenador presente. Ese resumen viene de un blog del sector, pero tampoco encontré evidencia independiente en contra. Un "técnica correcta" equivocado puede dar falsa seguridad y lesionar a alguien.
- **Velocidad de la barra.** Es valiosa para avanzados, no para el problema principal. En 20 powerlifters, en un laboratorio ordenado y con el teléfono en soporte, hubo apps que perdieron el 84 % de las repeticiones de banca o el 16,5 % de las de peso muerto, y solo una igualó al transductor en los tres levantamientos (verificado). Además, un metaanálisis no encontró que la pérdida de velocidad durante la serie influyera en las ganancias de fuerza (resumen).
- **Grasa corporal por foto y comentarios sobre el cuerpo.** Ver la siguiente sección.
- **Reconocimiento facial o identificar personas.** No aporta nada a un registro de entrenamiento y es el dato biométrico más delicado.

## El caso de la foto corporal

La técnica parece buena sobre el papel: errores de unos 2 a 2,5 puntos frente a DXA en adultos (resumen). Tres cosas frenan la decisión:

1. **La evidencia es parcial.** Parte de ella viene de empresas que venden la tecnología: el estudio de Visual Body Composition declara autores empleados por Amazon, y otro resultado es un preprint. No encontré validación en población colombiana ni réplicas independientes. Un error de 2 puntos, además, puede tapar el cambio real de varias semanas.
2. **El riesgo no está medido.** No encontré estudios que midan el daño de estas apps en personas jóvenes. Eso significa que nadie lo descartó, no que sea seguro. La app atiende a menores y pide datos de ánimo y salud.
3. **El plan ya es prudente.** `PLAN.md` trata las fotos corporales como la categoría más restringida y las medidas estimadas por foto como dato complementario.

**Recomendación:** mantener las fotos de progreso con silueta guía como dice el plan, guardadas en privado, sin estimar grasa ni comentar el cuerpo. Si algún día se agrega, debe ser opcional, solo para adultos, mostrar tendencia con margen de error y desactivarse ante señales de riesgo. Conviene que lo valide un profesional de salud, porque el plan hoy no cuenta con uno.

## Reglas para todo lo que mire a la persona

- **Procesar en el teléfono.** MediaPipe Pose Landmarker corre en navegador con `@mediapipe/tasks-vision`, en versiones lite, full y heavy, y admite video (verificado). Sin enviar el video no hay costo por consulta ni encargado adicional.
- **Medir en teléfonos reales antes de comprometerse.** No encontré datos de rendimiento en gama baja dentro de un navegador o WebView.
- **Revisar el sesgo.** Un resumen secundario de la ficha del modelo reporta 5,7 a 7,3 % de diferencia de confianza entre tonos de piel. No encontré una auditoría independiente ni resultados por tamaño corporal. Hay que probar con personas diversas.
- **Autorización aparte y explícita.** La Ley 1581 considera sensibles los datos de salud y los biométricos, y su tratamiento exige autorización explícita (arts. 5 y 6, verificado). Falta preguntarle al abogado si los puntos corporales de una pose cuentan como biométricos.
- **Menores.** El artículo 7 proscribe en principio tratar sus datos (verificado). El artículo 12 del Decreto 1377 y la SIC lo admiten con requisitos, respeto de sus derechos y autorización del representante (resumen). Mientras el abogado no lo revise: **funciones de cámara sobre el cuerpo apagadas para menores**.
- **Otras personas en el gym.** Grabar puede captar a terceros. Hay que pedir encuadres sin otras personas, no subir video por defecto y contemplar gyms que no permitan grabar. Es el caso práctico más probable de queja.
- **Nada de presión sobre el cuerpo.** Sin comparaciones entre personas ni lenguaje de "ideal".

## Qué medir

| Función | Señal de que funciona |
|---|---|
| Identificar máquina | % de identificaciones confirmadas y % que termina en búsqueda manual |
| Tarjeta y ajuste | Series completadas después de identificar; se usa una segunda vez |
| Propuesta de peso | % aceptada y % ajustada a mano |
| Conteo de repeticiones | Diferencia con lo que la persona confirma; % de sesiones en que lo abandona |

La evidencia general sobre apps apunta a un efecto moderado en adherencia al entrenamiento de fuerza (0,40 en un metaanálisis, leído solo en un resumen). Eso no dice qué función lo produce, así que hay que medirlo en la app.

## Lo que no se pudo verificar

- Dos trabajos sobre cámara y pose no se pudieron leer completos: el de JMIR Mhealth 2026 y el de arXiv 2608.24384. Solo vi su resumen, así que no cito cifras de ellos.
- No se revisó qué ofrecen hoy Hevy, Fitbod o Strong: la búsqueda no los devolvió, y lo demás era marketing. Falta una revisión directa de competidores.
- No se encontraron datos de Colombia sobre barreras en el gym.
- La Sentencia C-748 de 2011 no se pudo leer.

## Fuentes

- [Validez de apps de velocidad de barra, PLOS ONE (PMC11575817)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11575817/)
- [Posición de la cámara y conteo de repeticiones, JMIR Mhealth 2026](https://mhealth.jmir.org/2026/1/e82412/PDF)
- [Pose sin marcadores para evaluar técnica, arXiv 2608.24384](https://arxiv.org/pdf/2608.24384)
- [Validez de captura de movimiento con teléfono, Western University](https://uwo.scholaris.ca/server/api/core/bitstreams/46e449ea-bf65-4ca7-ae14-2c834ff8566d/content)
- [Pérdida de velocidad, metaanálisis (PMC9807551)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9807551/)
- [Visual Body Composition frente a DXA, medRxiv](https://www.medrxiv.org/content/10.1101/2021.06.10.21258595v1.full.pdf+html)
- [PhotoScan, composición corporal con teléfono, arXiv 2603.27017](https://arxiv.org/abs/2603.27017v2)
- [Grasa corporal con una imagen lateral, Sensors 2022](https://recercat.cat/handle/2117/376655)
- [Revisión clínica de IA y trastornos alimentarios](https://wjgnet.com/2220-3206/full/v15/i8/107122.htm)
- [MediaPipe Pose Landmarker para web](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js)
- [Ficha de BodyPose, ml5.js](https://deploy-preview-58--ml5-next-gen.netlify.app/model-card/bodypose)
- [Ley 1581 de 2012](https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=49981)
- [Decreto 1377 de 2013](https://www.unidadvictimas.gov.co/wp-content/uploads/Documentos/decretos/DECRETO_1377_2013.pdf)
- [Concepto de la SIC sobre datos de menores](https://sedeelectronica.sic.gov.co/sites/default/files/normatividad/022019/Rad18_18267888PDG.PDF)
- [Encuesta MuscleBooster, EE. UU.](https://musclebooster.welltech.com/gymtimidation-us)
- [Encuesta Virgin Active, Health Club Management](https://www.healthclubmanagement.co.uk/health-club-management-news/&lsquo;Gymtimidation&rsquo;-holding-back-potential-members/317987)
- [Encuesta a personas que no van al gym, DJS Research](https://djsresearch.co.uk/insights/half-of-non-gym-users-find-the-idea-of-going-to-one-scary-according-to-poll-04446)
- [Comparativa de apps de técnica, SensAI (blog de un competidor)](https://www.sensai.fit/blog/best-ai-workout-form-check-apps-2026)
- [Metaanálisis de apps y adherencia, resumen](https://synapsesocial.com/es/papers/69a76706badf0bb9e87df5a4)
