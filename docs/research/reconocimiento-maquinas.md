# Reconocimiento de máquinas de gimnasio por foto: informe técnico

Fecha: 28 de octubre de 2026
Alcance: PWA en Next.js y app Android con Capacitor que envuelve la PWA. Mercado: Colombia y Latinoamérica. Presupuesto de infraestructura e IA: menos de USD 100 al mes.

---

## 0. Resumen ejecutivo

1. **El problema que hay que resolver no es "qué máquina es", sino "qué ejercicio se va a registrar".** Una máquina se identifica por su función (prensa 45°, curl femoral sentado, jalón al pecho), no por su marca. La taxonomía propuesta tiene **172 clases funcionales** agrupadas en 15 familias, con un atributo aparte para el tipo de carga (pila de placas, discos, cable con discos). La marca y el modelo quedan como un tercer nivel opcional que no bloquea el registro.
2. **Enfoque recomendado:** recuperación por embeddings con un backbone autosupervisado **afinado con aprendizaje métrico** (DINOv2 o DINOv3 tamaño S, licencias que permiten uso comercial), kNN contra una galería global de prototipos por clase **más una galería local por gimnasio** que se forma sola con las fotos que los usuarios confirman. Corre en el dispositivo con ONNX Runtime Web (WebGPU con respaldo WASM). Un **modelo de visión-lenguaje barato** (Claude Haiku 5.5 o Gemini 2.5 Flash-Lite, unos USD 0,0003 por consulta) actúa solo como verificador en la franja de confianza media y elige entre los 5 candidatos o responde "ninguno".
3. **No usar MobileCLIP en producción:** su licencia (apple-amlr) es solo para investigación. **No usar imágenes de catálogos de fabricantes** sin permiso escrito: los términos de uso de Life Fitness prohíben el uso comercial de sus imágenes y la ley colombiana (Ley 23 de 1982) no tiene excepción de minería de datos.
4. **Las cifras honestas:** no existe un benchmark público de máquinas de gimnasio comparable. Extrapolando de reconocimiento de productos con brecha catálogo-foto real (DINOv2 sin afinar: 35,5 % top-1; afinado: 76 a 81 % top-1 con 1.865 productos), para ~170 clases funcionales con un dataset propio de 150 a 300 fotos reales por clase se puede esperar **88 a 93 % top-1 y 97 a 99 % top-3 con una sola foto** en gimnasios nunca vistos. Lo que sí se puede garantizar es **precisión de 99,5 % en lo que se autoconfirma**, con una cobertura de autoconfirmación de 60 a 75 % al lanzar y de 85 a 90 % cuando las galerías locales maduran. Ningún enfoque visual llega a 100 %; solo QR/NFC es determinista.
5. **Costo mensual estimado:** USD 20 a 45 con 2.000 usuarios activos y USD 55 a 90 con 10.000, dentro del presupuesto, porque la inferencia principal ocurre en el teléfono. El costo grande es único y humano: construir el dataset (unas 55 horas de captura en 30 a 40 gimnasios).

---

## 1. Supuestos y dos correcciones de enfoque

**1.1 Lo que se registra es un ejercicio, no una foto.** El historial del usuario guarda `ejercicio + implemento + (opcional) instancia de máquina en ese gym`. Esto cambia el criterio de "inequívoco": si el plan de hoy dice "aperturas en máquina" y el modelo duda entre *pec deck* y *pec deck/deltoide posterior combo*, ambas permiten ese ejercicio y el registro es correcto sin desambiguar la máquina. Por eso la arquitectura (sección 5.3) calcula una **confianza a nivel de ejercicio**: la suma de probabilidades de todas las clases que permiten el ejercicio planificado. En la práctica, esto elimina una buena parte de las preguntas al usuario sin sacrificar exactitud.

**1.2 Diferencia con `docs/PLAN.md`.** El plan maestro asume React Native con Expo y una capa 1 basada en "inventario registrado del gym". Este informe sigue el encargo actual: PWA más Capacitor y **sin que nadie registre inventarios**. El inventario no desaparece: se forma de manera emergente agrupando las fotos confirmadas por los usuarios en cada gym (sección 5.8). La tabla de capas del plan sigue siendo válida si se reinterpreta "inventario registrado" como "galería local aprendida".

**1.3 Restricción de presentación.** Las imágenes de referencia nunca se muestran. Las tarjetas de "¿es alguna de estas?" deben usar **ilustraciones propias** de cada clase (pictogramas vectoriales hechos una vez por clase) y la foto del propio usuario. Esto además reduce el riesgo legal de las imágenes de referencia.

---

## 2. Taxonomía funcional

### 2.1 Principios

- **Una clase = una función mecánica distinta** que cambia lo que se registra (patrón de movimiento, posición del cuerpo, trayectoria). Dos máquinas de marcas distintas con la misma función son la misma clase.
- **Atributos separados, no clases separadas:**
  - `tipo_carga`: pila de placas (selectorizada), discos (plate-loaded), cable con discos, peso corporal, motor (cardio). Se predice con una cabeza aparte y sirve para comparar cargas entre gyms, no para el ejercicio.
  - `independiente`: brazos independientes (iso-lateral, permite unilateral) o barra unida.
  - `marca` y `línea`: tercer nivel opcional (sección 3).
- **Jerarquía:** familia (15) > clase funcional (172) > variante de carga > marca/modelo. La familia sirve para filtrar el listado manual cuando la clase es dudosa.
- **Clases combo** (una máquina con dos funciones) existen como clases propias porque visualmente difieren de las simples y porque el selector de ejercicio debe ofrecer las dos funciones.
- La columna "Se confunde con" usa los números de clase. Los rasgos distintivos son los que el etiquetador y el verificador VLM deben mirar; también sirven como texto de las descripciones que recibe el VLM.

### 2.2 Familia A: prensas y sentadillas guiadas (11 clases)

| # | Clase | Ejercicios que permite | Se confunde con | Rasgos visuales distintivos |
|---|---|---|---|---|
| 1 | Prensa 45° (trineo) | Prensa bilateral, unilateral, pies altos/bajos/anchos, pantorrilla en prensa | 2, 4, 6, 7, 8 | Rieles inclinados ~45° con carro deslizante y plataforma de pies grande arriba; respaldo reclinado y bajo, por debajo del carro; postes de discos en el carro; topes de seguridad laterales. |
| 2 | Prensa horizontal sentada (selectorizada) | Prensa, pantorrilla en prensa | 1, 3, 4 | Usuario sentado casi erguido frente a plataforma vertical; pila de placas con pin y cable; el asiento o la plataforma se desplaza en horizontal. |
| 3 | Prensa vertical | Prensa vertical | 1, 2 | Usuario acostado boca arriba; plataforma por encima que sube y baja en rieles verticales. Poco común. |
| 4 | Prensa horizontal de discos | Prensa | 1, 2, 5 | Carro sobre rieles horizontales o levemente inclinados con postes para discos; sin pila de placas; asiento reclinado. |
| 5 | Prensa iso-lateral de palanca | Prensa bilateral y unilateral | 1, 4, 10 | Brazos de palanca con pivote y movimiento en arco; una plataforma por pierna o plataforma unida a la palanca; postes de discos en los brazos. |
| 6 | Hack squat | Sentadilla hack, hack inversa (mirando al respaldo), pantorrilla | 1, 7, 8, 10 | Usuario de pie con la espalda contra respaldo inclinado que se desliza en rieles; hombreras acolchadas; plataforma de pies inferior fija e inclinada. |
| 7 | Combo prensa 45°/hack | Prensa 45°, sentadilla hack | 1, 6 | Trineo de prensa con hombreras abatibles o respaldo convertible; dos posiciones de asiento visibles. |
| 8 | Sentadilla péndulo | Sentadilla péndulo, zancada inversa | 6, 10 | Brazo largo que gira desde un pivote trasero alto; hombreras unidas al brazo; trayectoria en arco; plataforma de pies inclinada fija. |
| 9 | Belt squat (sentadilla con cinturón) | Sentadilla con cinturón, marcha, peso muerto con cinturón | 10, 60 | Plataforma elevada con ranura central; cinturón con cadena a palanca o cable por debajo; manijas frontales. |
| 10 | Sentadilla de palanca (V-squat, power squat) | Sentadilla, en algunos modelos zancada y pantorrilla | 6, 8, 9 | Hombreras unidas a brazo pivotante corto; sin respaldo deslizante; postes de discos en el brazo; el usuario puede mirar al frente o hacia la máquina. |
| 11 | Estación sissy squat | Sissy squat | 30, 164 | Plataforma pequeña con rodilleras altas y sujetador de tobillos bajo; sin carga o con un poste de disco. |

### 2.3 Familia B: aislamiento de pierna y cadera (20 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 12 | Extensión de cuádriceps | Extensión bilateral y unilateral | 13, 14, 16 | Asiento con respaldo; rodillo de tobillo **delante y abajo** de las espinillas; eje de giro a la altura de la rodilla; sin rodillo sobre los muslos (o con sujetador ligero). |
| 13 | Extensión de cuádriceps de discos | Extensión | 12 | Igual función con brazo de palanca y postes de discos en vez de pila. |
| 14 | Curl femoral sentado | Curl sentado bilateral/unilateral | 12, 16 | Rodillo de tobillo **detrás y arriba** de las pantorrillas al inicio (piernas extendidas); **rodillo o almohadilla sobre los muslos** que los sujeta; respaldo más reclinado que en 12. |
| 15 | Curl femoral acostado | Curl prono | 16, 17, 27 | Banco donde el usuario se acuesta boca abajo, a menudo con quiebre en la cadera; rodillo sobre los talones en el extremo; manijas al frente. |
| 16 | Combo extensión/curl | Extensión y curl (sentado o acostado según modelo) | 12, 14, 15 | Un solo asiento con dos rodillos (delante y detrás) o rodillo superior abatible; muy común en multigimnasios y fabricantes locales. |
| 17 | Curl femoral de pie | Curl de pie unilateral | 15, 18, 22 | Usuario de pie, muslo apoyado en almohadilla vertical, apoyos de antebrazo, rodillo detrás del tobillo. |
| 18 | Curl femoral arrodillado | Curl arrodillado unilateral | 17, 23 | Rodillera inclinada con apoyo de antebrazos o pecho; brazo de palanca con discos (tipo Hammer Kneeling Leg Curl). |
| 19 | Aductores sentado | Aducción de cadera | 20, 21 | Asiento reclinado; almohadillas en la **cara interna** de las rodillas, que empiezan abiertas. |
| 20 | Abductores sentado | Abducción de cadera | 19, 21 | Mismo chasis que 19; almohadillas en la **cara externa**, que empiezan juntas. |
| 21 | Combo aductor/abductor | Aducción y abducción | 19, 20 | Almohadillas giratorias de doble cara y palanca de selección de rango. En una sola foto frontal suele ser imposible distinguirla de 19/20 (ver 2.17). |
| 22 | Multicadera | Flexión, extensión, abducción y aducción de cadera de pie | 17, 23, 24 | Rodillo unido a un brazo que gira a la altura de la cadera; plataforma elevada ajustable; manijas laterales. |
| 23 | Patada de glúteo en máquina | Patada de glúteo de pie o arrodillado | 18, 22 | Rodillera o plataforma con soporte de pecho/antebrazo y placa de pie que se empuja hacia atrás y arriba. |
| 24 | Abductor de pie | Abducción de cadera de pie | 22, 20 | Usuario de pie de lado con almohadilla en la cara externa del muslo unida a palanca; menos común. |
| 25 | Hip thrust en máquina | Hip thrust, puente de glúteo | 26, 2 | Respaldo bajo para la parte alta de la espalda y almohadilla o cinturón sobre la cadera unido a palanca o pila (tipo Booty Builder, Nautilus Glute Drive). |
| 26 | Banco de hip thrust | Hip thrust con barra o banda | 25, 103 | Banco bajo con respaldo fijo, ganchos para banda o soporte de barra y plataforma de pies. |
| 27 | Hiperextensión 45° (banco romano) | Extensión lumbar, extensión de cadera, oblicuos | 28, 29, 30 | Marco inclinado ~45° con almohadillas de cadera y rodillos de tobillo bajos sobre una plataforma. |
| 28 | Glute ham developer (GHD) | Glute ham raise, extensión de espalda, abdominal GHD | 27, 29, 30 | Almohadillas de cadera grandes y placa de pies alta con rodillos detrás de los tobillos; marco horizontal largo. |
| 29 | Hiperextensión 90° | Extensión horizontal | 27, 28 | Marco horizontal, cuerpo paralelo al suelo. |
| 30 | Banco de curl nórdico | Curl nórdico | 28, 11 | Rodillera con sujeción de tobillos baja, sin almohadilla de cadera. |
| 31 | Hiperextensión inversa | Reverse hyper | 27, 28 | Plataforma de torso elevada con péndulo o palanca y correa de tobillos colgando detrás. |

### 2.4 Familia C: pantorrilla y tibial (4 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 32 | Pantorrilla de pie | Elevación de talones de pie | 6, 10, 34 | Hombreras acolchadas sobre un **escalón pequeño** para el antepié; pila o palanca; no hay respaldo deslizante. |
| 33 | Pantorrilla sentado | Elevación de talones sentado | 32, 14 | Asiento bajo con almohadilla sobre las rodillas unida a palanca con postes de discos; escalón para antepié. |
| 34 | Pantorrilla burro | Donkey calf | 32, 23 | Usuario inclinado hacia delante con almohadilla sobre caderas; apoyo de antebrazos. |
| 35 | Máquina de tibial | Elevación tibial | 33 | Asiento y rodillo sobre el empeine; poco común. |

### 2.5 Familia D: pecho (10 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 36 | Press de pecho sentado (selectorizado) | Press horizontal; unilateral si los brazos son independientes | 37, 38, 42, 63 | Asiento vertical, manijas a la altura del pecho que empujan al frente; pila detrás; a veces pedal asistente. |
| 37 | Press de pecho de discos (iso-lateral) | Press convergente, unilateral | 36, 39, 41 | Brazos de palanca que pivotan arriba y atrás; postes de discos laterales; sin pila. |
| 38 | Press inclinado sentado (selectorizado) | Press inclinado | 36, 39, 63 | Respaldo más reclinado; manijas que empujan arriba y adelante. |
| 39 | Press inclinado de discos | Press inclinado convergente | 37, 38, 64 | Trayectoria ascendente marcada; asiento bajo; postes de discos. |
| 40 | Press declinado en máquina | Press declinado | 36, 37 | Manijas bajas que empujan abajo y adelante; respaldo casi vertical; a veces sujetador de piernas. |
| 41 | Press de banca acostado de discos | Press de banca guiado | 37, 106, 86 | Banco plano con brazos de palanca sobre el pecho y postes de discos; sin barra libre. |
| 42 | Combo press pecho/hombro | Press de pecho y press de hombro | 36, 63 | Manijas dobles (horizontales y verticales) o asiento con dos posiciones en una misma máquina. |
| 43 | Pec deck (aperturas) | Aperturas | 44, 36, 64 | Brazos con almohadillas de antebrazo o manijas verticales que se cierran en arco al frente; eje de giro sobre la cabeza; pila detrás. |
| 44 | Combo pec deck/deltoide posterior | Aperturas y aperturas inversas | 43, 66 | Igual que 43, pero los brazos giran y hay perilla de posición inicial; el respaldo sirve de apoyo de pecho. |
| 45 | Aperturas de palanca de discos | Aperturas | 43 | Brazos largos de palanca con postes de discos; poco común. |

### 2.6 Familia E: espalda (17 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 46 | Jalón al pecho (polea alta) | Jalón con agarres varios, jalón con brazos rectos, tríceps en polea | 47, 48, 49, 58 | Torre alta con polea arriba y barra colgando del cable; asiento con **rodilleras**; pila detrás. |
| 47 | Jalón de discos (iso-lateral) | Jalón convergente, unilateral | 46, 48, 53 | Brazos de palanca altos que bajan en arco; postes de discos; rodilleras; sin cable. |
| 48 | Jalón de brazos independientes (selectorizado) | Jalón convergente, unilateral | 46, 47 | Dos manijas en brazos articulados sobre la cabeza con pila; no hay barra colgante. |
| 49 | Combo jalón/remo | Jalón al pecho y remo bajo | 46, 50 | Polea alta y polea baja en la misma estación; plataforma de pies frontal y rodillera removible. |
| 50 | Remo sentado en polea baja | Remo con triángulo o barra, unilateral, curl y tríceps desde abajo | 49, 51, 94 | Banco largo y bajo con plataforma de pies al frente; polea baja; cable horizontal. |
| 51 | Remo con apoyo de pecho (selectorizado) | Remo sentado, aperturas inversas | 50, 52, 44 | Asiento con almohadilla de pecho vertical; manijas al frente en brazos articulados; pila. |
| 52 | Remo iso-lateral de discos | Remo convergente con apoyo de pecho, unilateral | 51, 53, 54, 55 | Almohadilla de pecho y brazos de palanca con discos que se tiran hacia atrás. |
| 53 | Remo alto de discos | Remo alto (de arriba hacia atrás y abajo) | 47, 52 | Manijas altas por delante; rodillera o asiento sin apoyo de pecho; trayectoria descendente. |
| 54 | Remo bajo de discos | Remo bajo | 52, 50 | Manijas bajas, asiento bajo, apoyo de pecho, postes de discos. |
| 55 | Remo T con apoyo de pecho | Remo T | 52, 56, 110 | Plataforma inclinada con almohadilla de pecho larga; palanca con poste de discos al frente; usuario de pie sobre la plataforma. |
| 56 | Remo T libre / remo landmine | Remo T de pie | 55, 100 | Plataforma de pie con palanca larga anclada al piso y manijas en Y; sin almohadilla de pecho. |
| 57 | Pullover en máquina | Pullover | 46, 45 | Brazo que gira desde detrás de la cabeza; almohadillas de codo; asiento con cinturón. Común en gyms antiguos. |
| 58 | Dominadas/fondos asistidos | Dominada asistida, fondo asistido | 46, 59, 74 | Torre con manijas altas (dominada) y medias (fondo); plataforma o rodillera que sube asistida por la pila. |
| 59 | Torre de dominadas y fondos (power tower) | Dominadas, fondos, elevación de rodillas, flexiones | 58, 83, 101 | Estructura sin pila de placas; respaldo y apoyabrazos para elevar rodillas; barra alta. |
| 60 | Máquina de peso muerto (ground base) | Peso muerto, encogimientos, sentadilla con manijas | 9, 61, 10 | Plataforma de pie y brazos de palanca desde el suelo con manijas a los lados. |
| 61 | Encogimientos en máquina | Encogimientos (shrug) | 60, 32 | Manijas laterales bajas unidas a palanca; usuario de pie entre ellas o con almohadilla de pecho. |
| 62 | Ground base multipropósito (jammer) | Press de pie, remo, sentadilla según modelo | 60, 10, 100 | Palancas largas ancladas a una base en el suelo con manijas altas; postes de discos. |

### 2.7 Familia F: hombro y cuello (7 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 63 | Press de hombro (selectorizado) | Press de hombro | 36, 38, 42 | Asiento vertical; manijas a la altura de los hombros que empujan hacia arriba. |
| 64 | Press de hombro de discos | Press convergente, unilateral | 63, 39 | Brazos de palanca ascendentes; postes de discos. |
| 65 | Elevaciones laterales (selectorizada) | Elevación lateral | 43, 66 | Almohadillas en la cara externa de los brazos que giran hacia arriba a los costados; asiento con almohadilla de pecho o espalda. |
| 66 | Elevaciones laterales de discos o de pie | Elevación lateral | 65 | Palanca con postes de discos; usuario de pie o sentado. |
| 67 | Deltoide posterior dedicado | Aperturas inversas | 44, 51 | Almohadilla de pecho y manijas que se abren hacia atrás; sin función de pec deck. |
| 68 | Remo al mentón en máquina | Remo vertical | 61, 63 | Manijas bajas que suben pegadas al cuerpo; poco común. |
| 69 | Máquina de cuello (4 vías) | Flexión, extensión y lateral de cuello | 63 | Almohadilla para la cabeza frente a un asiento; poco común. |

### 2.8 Familia G: brazos y antebrazo (8 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 70 | Curl de bíceps en máquina (selectorizada) | Curl de bíceps | 71, 72, 75 | Almohadilla inclinada tipo predicador; manijas en brazo pivotante; pila. |
| 71 | Curl de bíceps de discos | Curl | 70 | Palanca con postes de discos. |
| 72 | Banco predicador (Scott) | Curl predicador con barra Z o mancuerna | 70, 75 | Almohadilla inclinada y asiento sin mecanismo de carga; soportes para barra. |
| 73 | Extensión de tríceps en máquina | Extensión sentado o sobre la cabeza | 70, 74 | Apoyo de codos y manijas que se empujan hacia abajo o adelante. |
| 74 | Fondos sentado en máquina | Fondos de tríceps sentado | 73, 58, 40 | Asiento con manijas a los costados que se empujan hacia abajo; cinturón de muslo. |
| 75 | Combo bíceps/tríceps | Curl y extensión | 70, 73 | Almohadilla de brazos reversible o dos brazos; asiento que se usa de frente o de espaldas. |
| 76 | Estación de fondos en paralelas | Fondos | 59, 58 | Barras paralelas a la altura de la cadera, sin respaldo, a veces con escalones. |
| 77 | Máquina de antebrazo/muñeca | Curl de muñeca, rodillo | 72 | Rodillo o manija giratoria con cuerda o palanca a la altura del pecho; poco común. |

### 2.9 Familia H: core (8 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 78 | Crunch abdominal en máquina | Crunch | 79, 80, 81, 84 | Asiento con almohadillas sobre el pecho o manijas sobre los hombros que giran hacia delante; pila. |
| 79 | Rotación de torso | Rotación de tronco | 78 | Asiento con almohadilla de pecho y base giratoria o almohadillas de muslo que giran. |
| 80 | Extensión lumbar en máquina | Extensión lumbar | 78, 81 | Asiento con almohadilla en la espalda alta que se empuja hacia atrás; reposapiés. |
| 81 | Combo abdominal/lumbar | Crunch y extensión lumbar | 78, 80 | Almohadilla reversible adelante y atrás. |
| 82 | Banco de abdominales declinado | Abdominal declinado, elevación de piernas | 108, 28 | Banco inclinado con rodillos para los pies en la parte alta. |
| 83 | Silla romana (captain's chair) | Elevación de rodillas y piernas | 59, 76 | Respaldo vertical con apoyabrazos; a diferencia de 59, sin barra alta. |
| 84 | Ab coaster | Crunch inverso en riel | 82, 79 | Riel curvo con carro de rodillas y manijas fijas. |
| 85 | Estación de abdominales colgada (barra con correas) | Elevación de piernas colgado | 101, 59 | Correas de brazo colgando de una barra; sin respaldo. |

### 2.10 Familia I: multipower, poleas y estaciones (12 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 86 | Multipower / Smith vertical | Sentadilla, press banca, press militar, remo, zancada, hip thrust, pantorrilla | 87, 88, 89, 98 | Barra fija a dos rieles verticales; ganchos de seguridad giratorios; marco rectangular. |
| 87 | Smith angulado | Igual que 86 | 86 | Rieles inclinados unos 7 a 12° respecto a la vertical (se ve en foto lateral). |
| 88 | Smith 3D | Igual que 86, con desplazamiento horizontal | 86 | Rieles verticales montados sobre un carro horizontal: dos ejes de rieles visibles. |
| 89 | Estación combinada Smith + rack + poleas | Todo lo de Smith, rack y poleas | 86, 90, 98 | Un marco con Smith al centro, poleas laterales y barra de dominadas arriba. Frecuente en gyms pequeños y fabricantes locales. |
| 90 | Poleas dobles ajustables (functional trainer) | Cruces, aperturas, remo, jalón, curl, tríceps, face pull, pallof, rotaciones, patada de glúteo, y más | 91, 92, 89, 96 | Dos columnas con carro de polea que se desliza en riel vertical; pilas a cada lado; marco con barra de dominadas. |
| 91 | Crossover de poleas | Cruces altos y bajos y todo lo de cable | 90, 92 | Dos torres grandes separadas varios metros y unidas por un travesaño alto; poleas fijas arriba y abajo o ajustables. |
| 92 | Polea simple ajustable (una columna) | Ejercicios de cable unilaterales | 90, 93, 97 | Una sola columna con carro ajustable. |
| 93 | Torre de polea alta/baja fija | Jalón de tríceps, curl, remo bajo | 92, 46 | Torre con poleas fijas en los extremos, sin carro ajustable. |
| 94 | Multiestación de poleas (4 a 8 puestos) | Varios según estación | 90, 91, 46, 50 | Estructura central con varias pilas y estaciones alrededor; casi nunca cabe completa en la foto. |
| 95 | Multigimnasio compacto (home gym) | Press de pecho, pec deck, jalón, extensión/curl, remo bajo | 94, 16, 43 | Una pila de placas, asiento central con brazos de pecho, rodillo de piernas y polea alta en un marco compacto. |
| 96 | Poleas de brazos pivotantes (tipo dual cable cross) | Como 90 | 90 | Los brazos de polea giran en arco en vez de un carro en riel. |
| 97 | Polea de discos (cable con poste de discos) | Ejercicios de cable | 92, 93 | Columna con cable y poste para discos en lugar de pila. Común en fabricantes locales. |

### 2.11 Familia J: racks y estructuras (8 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 98 | Power rack (jaula) | Sentadilla, press banca con banco, press militar, dominadas, rack pull | 99, 102, 89 | Cuatro postes con agujeros y barras de seguridad horizontales dentro de la jaula. |
| 99 | Half rack | Igual que 98 | 98, 102 | Dos postes principales con extensión trasera corta o soportes de discos. |
| 100 | Landmine | Press landmine, remo, rotaciones, sentadilla | 56, 62 | Tubo pivotante anclado al suelo o a un rack donde se inserta una barra. |
| 101 | Barra de dominadas de pared o techo | Dominadas, colgarse | 59, 85, 104 | Barra fija sin estructura de piso. |
| 102 | Soportes de sentadilla (squat stand) | Sentadilla, press | 99, 106 | Dos postes con ganchos en J, sin jaula. |
| 103 | Rack de pared plegable | Sentadilla, press | 102 | Postes fijados a la pared con bisagras. |
| 104 | Rig funcional modular | Dominadas, muscle-ups, anillas, estaciones de sentadilla | 98, 59 | Marco largo con varias barras de dominadas, anillas, saco. |
| 105 | Plataforma de levantamiento | Peso muerto, levantamientos olímpicos | 98 | Plataforma de madera o caucho a ras de suelo, a veces con rack integrado. |

### 2.12 Familia K: bancos (8 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 106 | Banco press de banca plano (con soportes) | Press de banca con barra | 41, 102, 107 | Banco con soportes verticales integrados en la cabecera; a veces plataforma de spotter. |
| 107 | Banco press inclinado (con soportes) | Press inclinado con barra | 106, 109 | Respaldo inclinado fijo, asiento y soportes altos. |
| 108 | Banco press declinado (con soportes) | Press declinado con barra | 106, 82 | Respaldo declinado y rodillos de pierna. |
| 109 | Banco press militar (asiento vertical con soportes) | Press militar sentado con barra | 107, 111 | Respaldo vertical fijo y soportes altos para la barra. |
| 110 | Banco de remo con apoyo de pecho (seal row) | Remo boca abajo con mancuernas o barra | 55, 112 | Banco alto con almohadilla de pecho; reposapiés. |
| 111 | Banco utilitario 90° | Press de hombro sentado con mancuernas | 109, 112 | Respaldo vertical fijo sin soportes de barra. |
| 112 | Banco ajustable (plano, inclinado, declinado) | Press con mancuernas en varios ángulos, remo, press de hombro | 113, 111 | Respaldo con escalera de ajuste y asiento abatible. |
| 113 | Banco plano | Press con mancuernas, remo, step-up, hip thrust | 112, 26 | Banco recto sin ajuste. |

### 2.13 Familia L: peso libre y accesorios (20 clases)

En estas clases el ejercicio casi nunca se deduce del implemento; el reconocimiento solo filtra el selector de ejercicios.

| # | Clase | Ejercicios (ejemplos) | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 114 | Mancuernas fijas (con rack) | Press, curl, remo, zancadas, etc. | 115, 121 | Rack escalonado con pares de mancuernas. |
| 115 | Mancuernas ajustables | Igual que 114 | 114 | Base con selector o discos atornillables. |
| 116 | Barra olímpica con discos | Sentadilla, peso muerto, press, remo, olímpicos | 117, 119, 120 | Barra larga (~2,2 m) con mangas gruesas. |
| 117 | Barra Z (EZ) | Curl, extensión de tríceps | 116, 119 | Barra corta en zigzag. |
| 118 | Barra hexagonal (trap bar) | Peso muerto, encogimientos, paseo del granjero | 116 | Marco hexagonal con manijas internas. |
| 119 | Barras precargadas (rack) | Curl, remo, press | 117, 114 | Rack de barras con discos fijos. |
| 120 | Barra de sentadilla de seguridad (SSB) | Sentadilla | 116 | Almohadilla y manijas frontales. |
| 121 | Kettlebell | Swing, goblet, turca, snatch | 114 | Bola con asa. |
| 122 | Balón medicinal / slam ball / wall ball | Lanzamientos, wall ball, slam | 129 | Esfera de caucho o tela sin asa. |
| 123 | Bandas elásticas y minibandas | Variados | 124 | Bandas de látex o tela. |
| 124 | Entrenamiento en suspensión (TRX) | Remo invertido, flexiones, sentadilla | 123, 130 | Correas con manijas colgando de un anclaje. |
| 125 | Cuerdas de batalla | Ondas, slams | 124 | Cuerda gruesa anclada al centro. |
| 126 | Cajón pliométrico | Saltos, step-up | 113 | Caja de madera o espuma. |
| 127 | Trineo (sled) | Empuje, arrastre | 105 | Trineo con postes de carga sobre césped o rieles. |
| 128 | Fitball / bosu | Estabilidad, core | 122 | Balón grande o media esfera. |
| 129 | Saco de arena (sandbag) | Cargas, sentadilla, lanzamientos | 122 | Bolsa con asas. |
| 130 | Anillas de gimnasia | Dominadas, fondos, remo | 124 | Anillas de madera o plástico con correas. |
| 131 | Saco de boxeo | Golpeo | 130 | Saco colgante pesado. |
| 132 | Step aeróbico | Step, subidas | 126 | Plataforma baja de plástico con elevadores. |
| 133 | Discos y árbol de discos | No es estación: preguntar ejercicio | 116 | Discos sueltos o en soporte. |

### 2.14 Familia M: cardio (15 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 134 | Caminadora motorizada | Caminar, trotar, correr, inclinación | 135 | Banda plana larga con consola y motor cubierto al frente. |
| 135 | Caminadora curva no motorizada | Carrera autopropulsada, empuje | 134 | Banda curva de listones, sin motor. |
| 136 | Elíptica con brazos | Elíptica | 137, 139, 153 | Pedales sobre rieles con trayectoria elíptica y brazos móviles; volante delantero o trasero. |
| 137 | Arc trainer / elíptica de trayectoria lateral | Arco, escalada | 136, 139 | Pedales con trayectoria en arco, carcasa cerrada y sin volante visible (tipo Cybex Arc). |
| 138 | Bicicleta vertical | Ciclismo | 140, 141, 142 | Carcasa cerrada, sillín y manubrio con consola, volante oculto. |
| 139 | Escaladora / stepper | Escalada | 137, 143 | Dos pedales que suben y bajan alternadamente, sin trayectoria elíptica. |
| 140 | Bicicleta reclinada | Ciclismo reclinado | 138 | Asiento con respaldo y pedales al frente, cuerpo bajo. |
| 141 | Bicicleta de spinning | Ciclismo indoor | 138, 142 | Volante pesado delantero expuesto (o protegido), manubrio deportivo, cuadro abierto. |
| 142 | Bicicleta de aire (air bike) | Ciclismo con brazos, intervalos | 141, 138 | Ventilador grande al frente y brazos móviles. |
| 143 | Escalera continua (stairmill) | Subida de escalones | 139, 134 | Escalones rotatorios como escalera mecánica, marco alto. |
| 144 | Remo ergómetro (aire, agua o magnético) | Remo | 145, 149 | Riel largo bajo con asiento deslizante y manija con cadena o correa; volante o tanque de agua al frente. |
| 145 | Ergómetro de esquí (SkiErg) | Doble bastón | 144 | Columna vertical con dos manijas colgando y volante arriba. |
| 146 | Ergómetro de brazos (UBE) | Pedaleo con brazos | 138 | Manivelas a la altura del pecho, asiento independiente o sin asiento. |
| 147 | Escalador vertical (tipo VersaClimber) | Escalada vertical | 145 | Columna alta inclinada con manijas y pedales que se deslizan. |
| 148 | Escalera infinita tipo Jacob's ladder | Escalada en escalera inclinada | 143, 147 | Peldaños inclinados en cinta continua. |

### 2.15 Familia N: pilates y estudios (3 clases)

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 149 | Reformer de pilates | Ejercicios de reformer | 144, 150 | Marco bajo con carro sobre resortes y barra de pies. |
| 150 | Torre o cadillac de pilates | Ejercicios de torre | 149 | Estructura con barras verticales y resortes sobre una camilla. |
| 151 | Plataforma vibratoria | Ejercicios sobre vibración | Ninguna frecuente | Plataforma baja con columna de manijas. |

### 2.16 Familia O: gimnasio biosaludable al aire libre (parques de Colombia) (8 clases)

Los parques biosaludables son muy comunes en las ciudades colombianas; conviene cubrirlos porque el usuario que entrena en la calle también registra.

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 152 | Caminador aéreo / esquí de parque | Marcha pendular | 153, 136 | Dos pedales colgando de un eje alto que oscilan adelante y atrás; tubo grueso pintado. |
| 153 | Elíptica de parque | Elíptica | 152, 136 | Pedales con biela y manijas, sin consola. |
| 154 | Press de pecho / hombro de parque | Press sentado con peso corporal | 155 | Asiento y manijas unidas a palanca que levanta el propio peso. |
| 155 | Remo / jalón de parque | Remo o jalón con peso corporal | 154 | Asiento y manijas altas o frontales con palanca. |
| 156 | Timón / rueda de hombros | Rotación de hombros | 157 | Discos giratorios verticales en un poste. |
| 157 | Cintura giratoria (twister) | Rotación de tronco | 156 | Plataforma giratoria a ras del piso con manija. |
| 158 | Bicicleta de parque | Pedaleo | 153 | Bicicleta estática de tubo, sin carcasa. |
| 159 | Barras de calistenia de parque | Dominadas, fondos, flexiones | 59, 76 | Barras fijas de distintas alturas en el suelo. |

### 2.17 Clases complementarias (13 clases) para completar la cobertura

| # | Clase | Ejercicios | Se confunde con | Rasgos distintivos |
|---|---|---|---|---|
| 160 | Remo sentado de discos con pecho libre (DY row / remo de pie) | Remo de pie o sentado sin apoyo | 52, 53 | Manijas a la altura media, usuario de pie o sentado sin almohadilla de pecho. |
| 161 | Press de pecho de pie de discos | Press de pie | 37, 62 | Usuario de pie en plataforma empujando palancas al frente. |
| 162 | Glute press / patada de glúteo de discos acostado | Empuje de glúteo inclinado | 23, 1 | Usuario boca abajo o inclinado con placa de pie de una sola pierna. |
| 163 | Zancada guiada (lunge machine) | Zancada | 10, 8 | Plataforma con hombreras y riel para zancada; rara. |
| 164 | Soporte de sentadilla búlgara | Sentadilla búlgara | 11, 113 | Rodillo de apoyo trasero sobre base con altura ajustable. |
| 165 | Banco de aductores (Copenhague) | Plancha de Copenhague | 113 | Banco con almohadilla lateral; raro. |
| 166 | Jalón de rodillas (kneeling pulldown) | Jalón arrodillado | 46 | Rodillera baja en vez de asiento; poco común. |
| 167 | Máquina de crunch de pie / de rodillas | Crunch | 78 | Almohadillas sobre hombros y plataforma para rodillas o pies. |
| 168 | Máquina de aductores de pie | Aducción de pie | 22, 24 | Igual que 24 pero almohadilla en la cara interna. |
| 169 | Máquina de pantorrilla en prensa (calf press dedicada) | Pantorrilla sentado con piernas extendidas | 2, 33 | Plataforma pequeña de pies frente a un asiento con respaldo alto. |
| 170 | Estación de dips/chin con banco de abdominales (combo de calistenia) | Dominadas, fondos, abdominal | 59, 83 | Torre con banco abdominal integrado. |
| 171 | Escalera de agilidad y conos (zona funcional) | Agilidad | Ninguna frecuente | Escalera plana en el piso. |
| 172 | **Otro / fuera de catálogo** | Abre el listado | (todas) | Clase de rechazo explícito, no se entrena como clase normal (ver 5.6). |

**Total: 172 clases** (171 funcionales más la de rechazo). Para el lanzamiento conviene priorizar las ~110 clases de las familias A a K y M, que concentran más del 90 % de los registros esperados, y marcar como "beta" las clases raras (por ejemplo 31, 35, 69, 77, 163, 165), con umbrales más estrictos.

### 2.18 Grupos de confusión y ángulo discriminante

Estos son los pares donde una sola foto suele no bastar. El "ángulo discriminante" es lo que la app pide en la segunda foto (sección 5.4).

| Grupo | Clases | Qué decide | Segunda foto que se pide |
|---|---|---|---|
| Prensas y hack | 1, 6, 7, 8, 10, 32 | Dónde va la espalda (respaldo bajo el carro, hombreras con respaldo deslizante, brazo pivotante, escalón pequeño) | Lateral completa a 3-4 m, que se vea todo el recorrido del carro |
| Extensión vs curl sentado | 12, 14, 16 | Posición del rodillo (delante-abajo o detrás-arriba) y si hay rodillo sobre los muslos | Lateral a la altura del asiento |
| Aductor vs abductor | 19, 20, 21 | Cara interna o externa de las almohadillas; almohadilla doble | Frontal cerca de las almohadillas, o la placa de instrucciones |
| Pec deck, combo, laterales | 43, 44, 65, 67 | Si los brazos giran 180°, dónde están las almohadillas | Frontal del asiento y los brazos |
| Press pecho, inclinado, hombro | 36, 38, 42, 63 | Ángulo del respaldo y altura de las manijas | Lateral |
| Remo polea baja vs combo | 49, 50 | Si hay polea alta en la misma estación | Foto amplia hacia arriba |
| Jalón vs dominada asistida | 46, 58 | Rodillera o plataforma de rodillas | Foto de la parte baja |
| Smith | 86, 87, 88, 89 | Inclinación y número de ejes de rieles | Lateral del riel |
| Poleas | 90, 91, 92, 96 | Número de columnas y tipo de brazo | Foto amplia de toda la estructura |
| Bicicletas | 138, 140, 141, 142 | Volante expuesto, ventilador, carcasa | Lateral |
| Elíptica, arc, escaladora | 136, 137, 139 | Trayectoria de pedales y volante | Lateral |
| Remos con apoyo | 52, 54, 55, 110 | Si el usuario va de pie, sentado o acostado | Lateral |
| Glúteo | 23, 25, 26, 162 | Posición del cuerpo y tipo de almohadilla | Lateral |
| Curl femoral de pie, arrodillado, patada | 17, 18, 23 | Rodillera, almohadilla de muslo | Lateral |

**Atajo casi determinista:** las máquinas comerciales (Life Fitness, Matrix, Technogym, Precor, Panatta, etc.) traen una **placa de instrucciones** con el nombre del ejercicio en inglés ("SEATED LEG CURL", "HIP ADDUCTION") y una silueta. Cuando el grupo de confusión lo permite, la mejor segunda foto es esa placa: un VLM o un OCR la lee con mucha fiabilidad. Las máquinas de fabricantes locales colombianos muchas veces no tienen placa, por eso el ángulo lateral sigue siendo necesario.

---

## 3. Marcas, fabricantes y fuentes de imágenes

### 3.1 Marcas internacionales relevantes en Colombia y Latinoamérica

| Marca (grupo) | Líneas que más se ven | Presencia comprobada en Colombia/Latam | Pistas visuales |
|---|---|---|---|
| **Matrix** (Johnson Health Tech) | Fuerza selectorizada Ultra, Aura, Versa, Go; Magnum (discos y racks); cardio Performance, Lifestyle, Endurance | Acuerdo para equipar 200 sedes de Smart Fit en Latinoamérica (2020) ([Athletic Business](https://www.athleticbusiness.com/industry-press-room/article/15158752/matrix-fitness-smart-fit-announce-partnership)); sedes de Bodytech con "tecnología Matrix" ([Noticias RCN](https://www.noticiasrcn.com/salud-y-bienestar/grupo-bodytech-abre-tres-nuevos-gimnasios-en-bogota-y-medellin-en-2026-982456)) | Logo "MATRIX" en la cubierta de la pila; carenados plateados o negros. |
| **Life Fitness** | Insignia, Signature, Axiom, Optima, Circuit; cardio Integrity, Discover, Platinum Club | Marca muy extendida en la región; distribuye en 166 países ([Athletic Business buyers guide](https://www.athleticbusiness.com/buyers_guide/life-fitness.html)) | Logo de Life Fitness; cubiertas grises o negras. |
| **Hammer Strength** (Life Fitness) | Plate-Loaded Iso-Lateral (bench, incline, row, high row, low row, D.Y. row, front pulldown, leg press, kneeling leg curl), Select, MTS, HD Elite | Catálogo oficial ([Life Fitness, Hammer Strength plate loaded](https://lifefitness.com/es-es/productos/fuerza/plate-loaded/hammer-strength)); muy copiado por fabricantes asiáticos y locales | Tubo estructural rojo o negro, logo del martillo, diseño de palancas convergentes. |
| **Cybex** (Life Fitness) | Eagle NX, Prestige, VRS; Arc Trainer | Presente en gyms premium | Logo Cybex; el Arc Trainer es la referencia de la clase 137. |
| **Technogym** | Selection 700/900, Pure Strength, Element+, Artis, Biostrength, Kinesis; cardio Excite, Skillrow, Skillmill | Presente en gyms premium y hoteles | Diseño italiano curvo, logo Technogym. |
| **Precor** (Peloton) | Discovery (selectorizada y de discos), Resolute, Vitality, Icarian; cardio Experience | Llegó a Colombia con la línea Discovery a través de Gym Shop ([Portafolio](https://www.portafolio.co/tendencias/fitness-negocio-maquina-51658)) | Logo Precor; cubiertas grises. |
| **Panatta** (Italia) | Fit Evo, Monolith, Freeweight HP | Bodytech Usaquén integra Panatta y Matrix ([Noticias RCN](https://www.noticiasrcn.com/salud-y-bienestar/grupo-bodytech-abre-tres-nuevos-gimnasios-en-bogota-y-medellin-en-2026-982456)); Panatta buscaba distribuidores en Colombia ([Portafolio](https://www.portafolio.co/contenido-patrocinado/panatta-una-marca-un-nombre-una-historia-547503)) | Estructuras macizas, tapizado de colores, logo Panatta. |
| **Booty Builder** | Máquinas de glúteo (hip thrust, abductores) | En sedes de Bodytech ([Noticias RCN](https://www.noticiasrcn.com/salud-y-bienestar/grupo-bodytech-abre-tres-nuevos-gimnasios-en-bogota-y-medellin-en-2026-982456)) | Rosado y negro característicos; referencia de la clase 25. |
| **Gym80** (Alemania) | Sygnum, Pure Kraft | Escasa en Colombia; aparece en gyms de culturismo | Estructuras muy robustas. |
| **Nautilus**, Star Trac, StairMaster, Schwinn (Core Health & Fitness) | Nitro, Impact, Leverage; StairMaster (clase 143) | StairMaster y Schwinn muy comunes en cardio | Logos en consola. |
| **BH Fitness** (España) | Fuerza LK, cardio comercial y de hogar | Presente en Latam a través de distribuidores (no se encontró fuente específica para Colombia) | Logo BH. |
| **Impulse** (China) | IT, IF, SL | Muy común en gyms de gama media latinoamericanos (sin fuente específica) | Logo Impulse; copias de diseños conocidos. |
| **Concept2** | RowErg, SkiErg, BikeErg | Ubicuo en zonas funcionales | Muy reconocible, referencia de 144 y 145. |
| OEM chinos (Yanre, DHZ, Thaco y otros) | Copias de Hammer, Life Fitness y Technogym | Ofrecen fabricación OEM a terceros ([Yanre](https://www.yanrefitness.com/plate-loaded-gym-equipment), [Thaco](https://thacoindustries.com/en/custom-plate-loaded-machines-manufacturers/)) | Formas iguales a las originales, logos distintos o ninguno. |

### 3.2 Fabricantes colombianos

Hay una industria metalmecánica local que fabrica máquinas "de tráfico pesado" para gyms de barrio, que son probablemente la mayoría de los gimnasios del país en número. No se encontró un listado oficial; estos son fabricantes que se anuncian como tales (verificar en RUES antes de cualquier acuerdo):

| Fabricante | Ciudad | Fuente |
|---|---|---|
| XTENSOR | Manizales, Bogotá, Pereira, Palmira | [xtensor.com.co](https://xtensor.com.co/) |
| ABC Fitness | Medellín | [abcfitnesscolombia.com](https://www.abcfitnesscolombia.com/) |
| Futuremachines | Cali | [machinesgym.wixsite.com/futuremachinescali](https://machinesgym.wixsite.com/futuremachinescali) |
| Oakland Sport Machine | Barranquilla | [oaklandsportmachine.com](https://oaklandsportmachine.com/) |
| Home Athletic | Nacional | [homeathletic.com.co](https://homeathletic.com.co/) |
| Gymmachines | Bogotá | [Facebook](https://www.facebook.com/maquinasparagymnasio/) |
| Máquinas Deportivas (industrialgym_colombia) | Sin ciudad | [Instagram](https://www.instagram.com/industrialgym_colombia/) |
| Family Gym Colombia | Sin ciudad | [Instagram](https://www.instagram.com/familygymcolombiaa/) |

**Implicación técnica clave:** las máquinas locales copian formas de las marcas internacionales, se pintan del color que pida el gym (rojo, amarillo, verde), rara vez tienen placa de instrucciones y combinan funciones en una misma estructura (clases 16, 21, 89, 95, 97). Esto confirma que **el modelo debe aprender la geometría funcional y ser invariante al color y al logo**. Reconocer la marca no ayuda en estos casos, y un dataset construido solo con fotos de catálogo de marcas premium fallaría justo en el segmento más numeroso. Además, estos fabricantes son aliados naturales: pueden autorizar fotos de su catálogo y de su planta, y son un canal para pegar QR en máquinas nuevas.

### 3.3 Fuentes de imágenes de referencia y sus licencias

| Fuente | Qué hay | Licencia | ¿Se puede usar para el match? |
|---|---|---|---|
| **Fotos propias** (campaña de captura en gyms) | Todo lo que se fotografíe | Propia; se necesita permiso del gym para fotografiar y evitar personas (Ley 1581 de 2012 de datos personales) | **Sí. Es la fuente principal.** |
| **Fotos de usuarios** confirmadas | Fotos reales en condiciones reales | Consentimiento del usuario, limitado a máquinas | **Sí**, con el proceso de 5.8 |
| Catálogos y webs de fabricantes (Life Fitness, Matrix, Technogym, etc.) | Fotos de estudio, fondo blanco, varios ángulos | Copyright del fabricante. Los términos de Life Fitness prohíben el uso comercial del sitio y su contenido, imágenes incluidas, sin autorización ([Life Fitness, condiciones de uso](https://lifefitness.com/fr-be/legal/terms-of-use)) | **No sin permiso escrito.** Pedir autorización a fabricantes y distribuidores (suelen tener kits de medios para revendedores). Uso interno para investigación y para redactar la taxonomía, sí. |
| Archivos BIM/CAD de fabricantes (para renders sintéticos) | Modelos 3D de máquinas para arquitectos | Licencia por fabricante y plataforma, normalmente restringida a proyectos de diseño | Solo con permiso. Verificar caso por caso. |
| **Roboflow Universe** | Proyectos de "gym equipment": clasificación (Gym Tools, 420 imágenes; gym_tools, 492; GYM, 1.480) y detección (Fitness Equipment Recognition, 3.430 y 8.880 imágenes) ([búsqueda en Universe](https://universe.roboflow.com/sowon/codeflex), [FitForge](https://universe.roboflow.com/fitforge/gym-equipment-detection-bcdfz)) | La pone quien sube el dataset; CC BY 4.0 permite uso comercial con atribución; "sin licencia" significa todos los derechos reservados; hay casos de datasets resubidos con licencia equivocada ([foro de Roboflow](https://discuss.roboflow.com/t/my-dataset-was-used-with-an-inappropriate-license/11399), [uso comercial](https://discuss.roboflow.com/t/usability-of-dataset-for-commercial-use/2847)) | **Sí, solo los CC BY 4.0, CC0 o MIT con procedencia verificable**, y con atribución. Útiles como semilla y negativos; tienen pocas clases y suelen ser fotos raspadas de la web, con procedencia dudosa. |
| **Kaggle** | Datasets pequeños de equipos, casi todos raspados de la web | Varía por dataset; no se encontró ninguno de equipos de gym con licencia clara | Evitar para producción salvo licencia y procedencia claras. |
| **Open Images V7** | Clases genéricas (verificar en `class-descriptions-boxable.csv` cuáles existen: por ejemplo caminadora, mancuerna, bicicleta estática) | Anotaciones CC BY 4.0; imágenes listadas como CC BY 2.0, pero Google no garantiza la licencia de cada imagen ([Open Images V7](https://research.google/blog/open-images-v7-now-featuring-point-labels/), [Voxel51](https://docs.voxel51.com/dataset_zoo/datasets/open_images_v7.html)) | Útil para negativos y para clases genéricas de cardio y peso libre; verificar la licencia de cada imagen. |
| **Wikimedia Commons** | Pocas fotos por clase (la categoría Weight training tiene del orden de 150 archivos y subcategorías) ([espejo de la categoría](https://c.enwp.org/wiki/Category:Weight_training)) | Por archivo: CC0, CC BY, CC BY-SA, dominio público | Sí con atribución; cuidado con CC BY-SA si se redistribuye el dataset. Volumen insignificante. |
| GitHub (por ejemplo Gym-Equipment-Classifier: 1.472 imágenes, 6 clases, raspadas) ([repo](https://github.com/siddharthkhincha/Gym-Equipment-Classifier)) | Datos raspados | Sin derechos sobre las imágenes | No. |
| **Imágenes sintéticas** (edición de fotos propias, generación, renders 3D) | Variación de color, tapicería, fondo | Depende de los términos del generador y del origen 3D | Sí para entrenamiento, con tope de proporción; nunca en prueba (ver 5.9). |

### 3.4 Situación legal en Colombia (no es asesoría jurídica)

- Cualquier uso de una obra protegida requiere autorización previa o debe encajar en las excepciones del capítulo III de la Ley 23 de 1982 ([Xataka Colombia](https://www.xataka.com.co/legislacion-y-derechos/ia-no-puede-tener-derechos-autor-abogado-nos-habla-ia-su-legalidad-colombia)). Colombia no tiene excepción de minería de textos y datos; la discusión está abierta ([LexLatin](https://lexlatin.com/reportajes/medios-comunicacion-derechos-autor-inteligencia-artificial-fair-use)).
- Se reporta un Proyecto de Ley 043 de 2025 que exigiría consentimiento expreso para usar obras e imágenes en entrenamiento de modelos ([Impacto TIC](https://impactotic.co/inteligencia-artificial/ia-y-derechos-de-autor-desafios-y-estrategias/)). No se verificó su estado.
- Que las imágenes "no se muestren en la app" reduce la exposición, pero guardar copias y calcular embeddings sigue siendo reproducción. **Recomendación:** galería de producción solo con fotos propias, de usuarios con consentimiento, de fabricantes que autoricen por escrito y de datasets con licencia abierta verificada. Validar con un abogado de propiedad intelectual antes del lanzamiento.

---

## 4. Comparación de enfoques

### 4.1 Lo que dicen los datos publicados

No existe un benchmark público de reconocimiento de máquinas de gimnasio por función con más de unas pocas clases. Lo más cercano:

- Tesis de Western Ontario (2016): CNN con 14 categorías de equipos, **83,3 % top-3** ([Kalra](https://ir.lib.uwo.ca/etd/3770)).
- Proyecto abierto: ResNet50 afinado, 6 clases, 1.472 imágenes raspadas, **~89 %** ([GitHub](https://github.com/siddharthkhincha/Gym-Equipment-Classifier)).
- Tesis de Bologna con Technogym: detección en móvil con **70 a 80 % de AP** ([Tortolini 2024](https://amslaurea.unibo.it/id/eprint/30862/)).

El análogo más útil es el reconocimiento de productos con brecha entre imagen de catálogo y foto real (Cat2Real, 2026): 5.043 fotos de estante, 1.865 productos, 2.155 candidatos ([arXiv 2607.09888](https://arxiv.org/html/2607.09888)):

| Método | Top-1 | Top-5 |
|---|---|---|
| DINOv2 ViT-L/14 sin afinar | 35,5 % | 61,4 % |
| DINOv3 ViT-L/16 sin afinar (384 px) | 53,8 % | 78,1 % |
| Gemini-Embedding-2 (comercial) | 68,7 % | 89,3 % |
| DINOv2 afinado con contraste y negativos difíciles | 76,3 % | 93,1 % |
| DINOv3 afinado (384 px) | 80,7 % | 94,7 % |

Lecciones que se trasladan directamente: (1) un backbone genérico sin afinar rinde mal en dominios estrechos; (2) afinar con fotos reales cierra gran parte de la brecha; (3) **los negativos difíciles son lo que más pesa** (quitar la selección de productos similares baja de 80,7 a 74,8 %); (4) la exactitud sobre productos nunca vistos en el entrenamiento casi no cae (80,7 a 80,2 %), lo que sugiere que una galería ampliable por kNN funciona. Nuestro problema tiene **10 veces menos clases** que Cat2Real, pero clases más parecidas entre sí y más variación de color, por eso la estimación de 88 a 93 % top-1 (sección 6.4).

Sobre backbones (cifras del paper de cada modelo):

| Modelo | Tamaño | ImageNet | Notas | Licencia |
|---|---|---|---|---|
| DINOv2 ViT-S/14 | 21 M | kNN 79,0 %, lineal 81,1 % | Muy bueno en recuperación de instancias: Oxford-H 43,2 mAP frente a 19,7 de OpenCLIP ViT-G ([DINOv2](https://arxiv.org/html/2304.07193)) | Apache 2.0 |
| DINOv2 ViT-B/14 | 86 M | kNN 82,1 %, lineal 84,5 % | Lineal en Cars 88,2 %, Aircraft 79,4 % | Apache 2.0 |
| DINOv3 ViT-S/16 y ConvNeXt-T | 21 a 29 M | Destilados del ViT-7B | Mejor que DINOv2 sin afinar en Cat2Real | Licencia propia de Meta que permite uso comercial ([Meta](https://ai.meta.com/blog/dinov3-self-supervised-vision-model/)); leerla antes |
| SigLIP 2 B/16 (256 px) | 86 M | Zero-shot 79,1 %, 10-shot 73,1 % | Trae torre de texto para zero-shot y descripciones ([SigLIP 2](https://arxiv.org/html/2502.14786)) | Apache 2.0 |
| SigLIP 2 So400m/14 (384 px) | 400 M | Zero-shot 84,1 % | Demasiado grande para el teléfono; útil como profesor en servidor | Apache 2.0 |
| MobileCLIP2-S2 / S4 | 36 M / 322 M de imagen | Zero-shot 77,2 % / 81,9 %; 3,6 ms / 19,6 ms de imagen en iPhone ([model card](https://huggingface.co/apple/MobileCLIP2-S2)) | Excelente latencia | **apple-amlr: solo investigación, prohíbe uso comercial** ([repo](https://github.com/apple/ml-mobileclip)). Descartado. |
| MediaPipe Image Embedder (MobileNetV3) | Pequeño | Entrenado en ImageNet | 3,9 ms CPU (small) según Google ([MediaPipe](https://developers.google.com/edge/mediapipe/solutions/vision/image_embedder)) | Apache 2.0; poca capacidad para clases finas |

Sobre modelos de visión-lenguaje como clasificadores: GPT-4V y modelos tipo LLaVA rinden **significativamente por debajo de CLIP** en clasificación estándar, y la causa principal es la frecuencia de cada clase en sus datos de entrenamiento ([Zhang et al. 2024](https://arxiv.org/abs/2405.18415)). Las evaluaciones de opción múltiple sobrestiman su capacidad de reconocimiento fino frente a preguntas abiertas ([FROW, arXiv 2512.10384](https://arxiv.org/html/2512.10384v1)). Conclusión: un VLM es buen **verificador entre pocos candidatos** (y muy bueno leyendo placas y logos), pero mal clasificador primario entre 170 clases finas.

### 4.2 Tabla comparativa

Exactitud estimada para ~170 clases funcionales, una foto, gimnasio nunca visto, salvo que se diga otra cosa. Las estimaciones propias se marcan "(est.)" y deben validarse con el plan de la sección 6. Latencias en el navegador son estimaciones: no se encontraron mediciones publicadas de ViT en WebGPU sobre Android.

| Enfoque | Exactitud esperada | Latencia | ¿Navegador? | Costo por consulta | Comentario |
|---|---|---|---|---|---|
| **Zero-shot** (SigLIP 2, CLIP con textos de clase) | 30 a 55 % top-1 (est.); Cat2Real muestra que incluso embeddings fuertes sin afinar se quedan en 35 a 69 % en dominio estrecho | 50 a 300 ms en dispositivo | Sí (ONNX Runtime Web; SigLIP 2 en transformers.js no está confirmado) | 0 | Sirve para preetiquetar y como línea base, no para producción. |
| **Embeddings sin afinar + kNN** (DINOv2/v3) | 55 a 75 % top-1 (est.) | 40 a 400 ms (est.) | Sí: DINOv2 y DINOv3 tienen exportaciones ONNX para transformers.js ([DINOv2 ONNX](https://huggingface.co/onnx-community/dinov2-with-registers-base)) | 0 | Muy bueno para la galería local de un gym (misma máquina, mismas condiciones): ahí la tarea es casi recuperación de instancias, donde DINOv2 brilla. |
| **Clasificador afinado** (cabeza softmax sobre backbone) | 88 a 94 % top-1 (est.) | Igual que el backbone | Sí | 0 | Exacto en conjunto cerrado; malo en open set; añadir clases exige reentrenar; no aprovecha la galería local sin reentrenar. |
| **Embeddings afinados con aprendizaje métrico + kNN** | 88 a 93 % top-1, 97 a 99 % top-3 (est.); más de 98 % con galería local madura | 40 a 400 ms en dispositivo (est.) | Sí | 0 | **Recomendado como núcleo.** Permite añadir ejemplos y clases sin reentrenar, da una medida natural de distancia para open set. |
| **VLM como verificador** (Claude Haiku 5.5, Gemini 2.5 Flash-Lite) | Aporta sobre todo en los pares con placa o logo legible; sin dato publicado para este dominio; medir | 1 a 3 s (red incluida) (est.) | No (servidor) | ~USD 0,00023 a 0,0003 | Barato; usarlo solo en la franja media. Con el nivel gratuito de Gemini el contenido puede usarse para mejorar productos de Google ([precios Gemini](https://ai.google.dev/gemini-api/docs/pricing)): usar nivel de pago. |
| **VLM fuerte** (Claude Sonnet 5.5, Gemini Flash 3.x) | Mejor razonamiento en casos difíciles; medir | 2 a 5 s (est.) | No | ~USD 0,006 (Sonnet 5.5); ~USD 0,002 (Gemini 3.x Flash) | Solo escalamiento raro. |
| **VLM como clasificador primario** | Inferior a CLIP afinado en clasificación ([Zhang et al.](https://arxiv.org/abs/2405.18415)) | 1 a 5 s | No | 0,0003 a 0,006 | No recomendado: caro a escala, lento, sin modo offline. |
| **Embedding comercial** (Gemini-Embedding-2) | 68,7 % top-1 en Cat2Real sin afinar | ~0,5 a 1 s | No | ~USD 0,00012 por imagen (agregadores, [ejemplo](https://tokencost.app/blog/gemini-embedding-2-pricing)) | No se puede afinar; dependencia de red; útil como segunda opinión, no como núcleo. |
| **OCR de logos y placas** | Marca: alta si el logo es legible; función: muy alta si la placa de instrucciones es legible; nula en máquinas locales sin placa | 100 a 500 ms en dispositivo (ML Kit vía plugin nativo) o dentro de la llamada al VLM | Parcial (Tesseract WASM es lento; mejor plugin nativo en Capacitor o el VLM) | 0 en dispositivo | Señal complementaria, no primaria. |
| **Jerárquico** (familia > clase > marca) | Familia: 97 a 99 % (est.); clase como arriba; marca y modelo: 60 a 80 % (est.) | Suma de etapas | Sí | 0 | La jerarquía se implementa **marginalizando** probabilidades de clase, no con modelos separados (ver 5.2). |
| **QR / NFC** | 100 % (determinista) | Inmediato | QR sí (cámara); Web NFC solo Chrome Android ([Chrome](https://developer.chrome.com/docs/capabilities/nfc)); en Capacitor con plugin nativo ([Capawesome NFC](https://capawesome.io/plugins/nfc)) | 0 más el costo de stickers | Capa 0 donde haya gyms aliados. |

### 4.3 Ejecución en el navegador y en Capacitor

- **ONNX Runtime Web** con proveedor WebGPU y respaldo WASM es la opción base: soporta cualquier modelo exportado a ONNX, incluido un backbone afinado propio ([ORT WebGPU](https://www.mintlify.com/microsoft/onnxruntime/execution-providers/webgpu)). **transformers.js** usa ORT Web por debajo y facilita el preprocesamiento; tiene soporte para DINOv2 y añadió DINOv3 ([release](https://releases.sh/release/rel_30Ii2uc5q8brdSu1a47a5)); el soporte de SigLIP 2 no está confirmado ([hilo](https://huggingface.co/spaces/onnx-community/convert-to-onnx/discussions/27)). **MediaPipe Tasks** solo sirve si se convierte el modelo a TFLite con metadatos; su modelo por defecto (MobileNetV3) es insuficiente para 170 clases finas.
- **WebGPU en Android:** Chrome 121+ en Android 12+ con GPU Qualcomm o ARM ([Chrome](https://developer.chrome.com/blog/new-in-webgpu-121)); el modo de compatibilidad sobre OpenGL ES llega a Android y **Android WebView** en la versión 146 ([intent to ship](https://groups.google.com/a/chromium.org/g/blink-dev/c/N3RlLGCOTJ4/m/loneRTlPBwAJ)). Capacitor usa el WebView del sistema, así que la disponibilidad depende de la versión de Android System WebView del usuario. Safari soporta WebGPU desde la versión 26 ([web.dev](https://web.dev/blog/webgpu-supported-major-browsers)). Siempre hay que tener el respaldo WASM (SIMD, multihilo con `crossOriginIsolated`).
- **Tamaño de descarga:** ViT-S/14 en fp16 son ~44 MB, en int8 ~22 MB. Guardarlo con Cache Storage en el service worker y servirlo desde un CDN con egreso gratuito (Cloudflare R2). La galería de prototipos (sección 5.2) pesa ~2 MB.
- **Plan B nativo:** si el teléfono de gama baja tarda más de 800 ms por inferencia en WASM, un plugin de Capacitor con ONNX Runtime Mobile o LiteRT (con NNAPI o GPU) da 3 a 10 veces menos latencia (est.). En la PWA pura, ese usuario usa el respaldo en servidor (5.1).

---

## 5. Arquitectura recomendada

### 5.1 Flujo de punta a punta

```
[Cámara en vivo]
   |
   |-- ¿QR visible? (BarcodeDetector / zxing-wasm) ---------> máquina del gym (100 %)
   |-- ¿NFC? (plugin Capacitor o Web NFC en Chrome) -------> máquina del gym (100 %)
   |
[Filtro de calidad en el dispositivo]
   nitidez (varianza del laplaciano), exposición, máquina ocupa >35 % del cuadro,
   persona dominante en el cuadro -> pide reencuadrar
   |
[Embedding en el dispositivo]  backbone S afinado, 224 px, fp16/int8
   promedio de 5 cuadros en ~1 s (ensamble temporal) + recorte central y cuadro completo
   |
[kNN doble]
   a) galería LOCAL del gym (fotos confirmadas en ese gym, por GPS o gym elegido)
   b) galería GLOBAL de prototipos (16 centroides por clase x 171 clases)
   |
[Fusión y calibración] -> p(clase), p(familia), p(ejercicio del plan), puntaje OOD
   |
   +-- ALTA ----------------> 1 tarjeta, ejercicio del plan preseleccionado, 1 toque
   +-- MEDIA ---------------> verificador VLM (servidor) con top-5 y descripciones
   |                            |-- coincide -> 1 tarjeta
   |                            |-- grupo de confusión conocido -> pide 2.ª foto dirigida
   |                            '-- no -> 3 tarjetas (ilustraciones propias)
   +-- BAJA u OOD ----------> listado filtrado por familia probable + "no está en la lista"
   |
[Confirmación del usuario] -> registro del ejercicio
   -> (con consentimiento) foto a la cola de aprendizaje (5.8)
```

Respaldo en servidor: si el dispositivo no puede correr el modelo (sin WebGPU y WASM demasiado lento) o el usuario aún no lo descargó, la foto (1024 px) va a un endpoint que corre el mismo modelo en CPU (ViT-S en un servidor de 4 vCPU tarda del orden de 100 a 300 ms, est.) y aplica la misma lógica.

### 5.2 Modelos y galerías

**Backbone de producción (dispositivo):** DINOv2 ViT-S/14 con registros (Apache 2.0) o DINOv3 ViT-S/16 (si la licencia se valida). Elegir con una prueba de 2 semanas sobre el conjunto piloto (sección 6.6). SigLIP 2 B/16 queda como alternativa si se quiere aprovechar texto.

**Entrenamiento:**
1. **Profesor** en servidor: DINOv3 o DINOv2 ViT-B/L, 320 a 384 px, afinado con pérdida sub-center ArcFace ([ArcFace](https://arxiv.org/abs/1801.07698)) más un término triplet con **negativos difíciles tomados de los grupos de confusión** de 2.18 (la lección más fuerte de Cat2Real). Muestreo P x K: P clases por lote, K imágenes de **gimnasios distintos** por clase.
2. **Alumno** ViT-S a 224 px, destilado del profesor (pérdida de similitud entre embeddings) más la misma pérdida métrica.
3. Cabezas ligeras sobre el embedding del alumno: `tipo_carga` (5 clases) y `familia` (15 clases) como auxiliares de entrenamiento.
4. Exportar a ONNX, cuantizar a fp16 (WebGPU) e int8 dinámico (WASM). Verificar que la cuantización no baje más de 0,5 puntos top-1.

**Galería global:** de las ~30.000 imágenes de entrenamiento, calcular **16 centroides por clase** con k-means sobre sus embeddings (captura vistas distintas: frontal, lateral, de cerca). 171 x 16 x 384 dimensiones x 2 bytes ≈ 2,1 MB. Se versiona con el modelo.

**Galería local por gym:** embeddings de fotos confirmadas en ese gym, con `gym_id`, `clase`, `instancia` (5.8). Se descarga al entrar al gym (normalmente menos de 200 KB) y funciona offline.

**Puntaje por clase:**
- `s_global(c)` = media de las 3 mayores similitudes coseno entre la consulta y los centroides de la clase c.
- `s_local(c)` = máxima similitud con fotos confirmadas de la clase c en este gym (si existen).
- `s(c) = max(s_global(c), s_local(c) + β)`, con β ≈ 0,05 para preferir la memoria local (ajustar en validación).
- `p(c) = softmax(s(c) / T)` con temperatura T ajustada en validación (temperature scaling, [Guo et al. 2017](https://arxiv.org/abs/1706.04599)).
- `p(familia) = Σ p(c)` sobre las clases de la familia.
- `p(ejercicio e) = Σ p(c)` sobre las clases que permiten e.

### 5.3 Umbrales de confianza

Los valores son **iniciales** y se recalibran sobre el conjunto de validación para cumplir la meta de precisión (sección 6). La regla de diseño es: **lo que se autopropone debe acertar al menos 99,5 % de las veces**.

| Banda | Condición (valores iniciales) | Acción |
|---|---|---|
| **Local segura** | `s_local` de la clase top ≥ 0,85 y al menos 2 confirmaciones previas de esa instancia en el gym, y la clase top global no contradice (está en el top-3) | 1 tarjeta, un toque. Es el caso de la máquina "de siempre". |
| **Alta** | `p(top1) ≥ 0,92` y margen `p(top1) - p(top2) ≥ 0,30` y OOD por debajo del percentil 95 de validación; **o** `p(ejercicio del plan) ≥ 0,95` | 1 tarjeta con el ejercicio del plan preseleccionado. |
| **Media** | `0,55 ≤ p(top1) < 0,92` o margen < 0,30, sin señal OOD | Llamada al VLM verificador con la foto y las descripciones textuales de los 5 primeros. Si el VLM elige el top-1 y `p(top1) ≥ 0,75`: 1 tarjeta. Si top-1 y top-2 están en un grupo de confusión de 2.18: pedir la segunda foto dirigida. En otro caso: 3 tarjetas. |
| **Baja** | `p(top1) < 0,55`, o OOD sobre el percentil 95, o el VLM responde "ninguno" | Listado manual. Si `p(familia) ≥ 0,80`, el listado se abre filtrado por esa familia. Botón "no está en la lista". |

Sin conexión, la banda media salta el VLM: va directo a la segunda foto (si aplica) o a las 3 tarjetas.

**Siempre hay confirmación humana.** Incluso en la banda alta, el usuario ve qué se va a registrar y lo acepta con un toque. Esto convierte los errores del modelo en fricción, no en datos falsos, y genera la señal de aprendizaje.

### 5.4 Cuándo pedir una segunda foto o un ángulo distinto

Se pide **como máximo una segunda foto, y una tercera solo si la segunda sube la confianza pero no cruza el umbral**. Después, tarjetas o listado.

- **Cuándo:** banda media y (a) top-1 y top-2 pertenecen al mismo grupo de confusión de 2.18, o (b) el filtro de calidad detecta que la máquina sale cortada, o (c) el VLM responde "no se puede decidir desde este ángulo".
- **Qué se pide:** la instrucción concreta del grupo ("Toma la foto de lado, que se vea dónde va la espalda") con una silueta guía superpuesta en la cámara. Para máquinas comerciales, ofrecer también "o fotografía la placa de instrucciones".
- **Fusión multivista:** sumar log-probabilidades de las dos vistas (equivale a promediar evidencias independientes) y recalcular la banda. Si hay placa legible, el VLM o el OCR que la lee tiene prioridad sobre la vista lateral.
- **Cuándo no:** si el plan del día ya resuelve el ejercicio (`p(ejercicio) ≥ 0,95`), no se pide nada aunque la máquina sea ambigua.

### 5.5 Máquinas multifunción

1. **Modelo de datos:** cada clase tiene una lista ordenada de ejercicios (`machine_class_exercises`). Las clases combo (16, 21, 42, 44, 49, 58, 75, 81) y las estaciones (86 a 97, 98 a 105) tienen muchos.
2. **Selector de ejercicio:** tras identificar la clase, la app muestra el ejercicio del plan preseleccionado si la clase lo permite; si no, muestra los sustitutos equivalentes que la clase sí permite (por ejemplo, plan "jalón al pecho" y máquina reconocida "poleas dobles": propone "jalón en polea alta de rodillas").
3. **Confianza por ejercicio:** como se dijo en 1.1, si varias clases candidatas permiten el ejercicio del plan, el registro no necesita resolver la máquina.
4. **Estaciones grandes** (multiestación de poleas, rig): segundo nivel "¿en qué puesto estás?" con iconos de los puestos de esa instancia (se aprende de las confirmaciones en ese gym).
5. **La instancia importa para la carga:** 50 kg en una prensa Hammer no equivalen a 50 kg en una prensa local. El historial guarda la instancia (`gym_machine_id`, aprendida en 5.8) para comparar cargas solo dentro de la misma máquina, y la clase para comparar progresión general.

### 5.6 Detección de lo que no está en el catálogo (open set)

- **Puntaje principal:** distancia al k-ésimo vecino más cercano entre embeddings normalizados, umbral fijado sobre datos del catálogo (sin necesitar ejemplos de fuera), siguiendo a Sun et al., que con este método reducen el FPR@TPR95 en 24,8 puntos frente a Mahalanobis en ImageNet ([ICML 2022](https://proceedings.mlr.press/v162/sun22d.html)). Umbral inicial: percentil 95 de las distancias de validación (5 % de falsos rechazos aceptados).
- **Exposición a atípicos en el entrenamiento:** incluir un conjunto de negativos (vistas del gym sin máquina centrada, espejos, lockers, personas, pisos, equipos de hogar, maquinaria no deportiva) con pérdida que los aleje de todos los prototipos. Estos negativos **no** son la clase 172; solo enseñan al embedding a no parecerse a nada conocido.
- **Segunda opinión:** el VLM siempre puede responder "ninguno".
- **Qué hace la app:** abre el listado filtrado por la familia más probable con un botón "no está en la lista" que permite escribir un nombre libre. Ese registro se guarda con `machine_class = otro` y el texto.
- **Crecimiento de la taxonomía:** cada mes, agrupar (HDBSCAN) los embeddings de las fotos "otro". Un grupo con fotos de al menos 5 usuarios en 3 gyms distintos pasa a revisión humana para crear clase nueva o corregir etiquetas. Gracias al kNN, la nueva clase funciona en cuanto tiene prototipos, sin reentrenar.

### 5.7 QR y NFC

- El QR codifica una URL `https://<dominio>/m/<gym_machine_id>`: funciona con cualquier cámara, abre la app si está instalada (App Links en Android) o la PWA.
- La lectura en la app usa `BarcodeDetector` (Chrome Android) o `zxing-wasm` como respaldo, en el mismo flujo de cámara.
- NFC: en Capacitor con un plugin nativo (por ejemplo [@capawesome-team/capacitor-nfc](https://capawesome.io/plugins/nfc)); en la PWA solo en Chrome Android con Web NFC (HTTPS, permiso del usuario) ([Chrome NFC](https://developer.chrome.com/docs/capabilities/nfc)); no disponible en la PWA de iOS.
- La primera vez que alguien escanea un QR sin asignar, la app le pide fotografiar la máquina e identificarla: el sticker queda asociado a la instancia y esa foto entra a la galería local con etiqueta de nivel alto.
- Los fabricantes colombianos (3.2) pueden entregar máquinas nuevas con QR de fábrica.

### 5.8 Cómo incorporar las fotos confirmadas por los usuarios

**Consentimiento y privacidad (antes de subir):**
- Solo se suben fotos de máquinas, como autorizó el usuario. En el dispositivo se corre un detector de rostros y personas (MediaPipe Face/Object Detector): si hay una persona que ocupa más de 15 % del cuadro, la foto no se sube; si hay rostros pequeños, se difuminan antes de subir.
- Se eliminan los metadatos EXIF (incluida la ubicación GPS) y se guarda solo `gym_id`. Se redimensiona a 1024 px de lado largo, JPEG calidad 80.
- Retención y revocación: si el usuario retira el consentimiento, se borran sus fotos y sus embeddings de las galerías. Cumplir la Ley 1581 de 2012.

**Niveles de etiqueta:**

| Nivel | Origen | Uso |
|---|---|---|
| L1 | El usuario aceptó la única tarjeta propuesta | Galería local del propio usuario de inmediato; galería del gym si coincide con otra confirmación independiente. No entra a reentrenamiento salvo muestreo auditado. |
| L2 | El usuario eligió entre 3 tarjetas, en el listado, o **corrigió** al modelo | Señal fuerte. Galería del gym inmediata. Las correcciones van a la cola de revisión con prioridad, porque son los ejemplos más informativos. |
| L3 | Revisada por el equipo o asociada a un QR | Entra al conjunto de entrenamiento y a la galería global. |

La razón para no reentrenar con L1 sin auditoría: si el modelo se equivoca y el usuario acepta por prisa, entrenar con esa foto refuerza el error (sesgo de confirmación).

**Inventario emergente:** dentro de cada gym, agrupar los embeddings confirmados por clase (similitud coseno ≥ 0,85 entre fotos, est.) para formar **instancias** (`gym_machine`). Así cada gym acumula su inventario sin que nadie lo registre. Una instancia se comparte con todos los usuarios del gym cuando tiene al menos 2 confirmaciones de usuarios distintos o una de nivel L2/L3.

**Protección contra abuso:** límite de aportes por usuario y día, puntaje de confianza por usuario (proporción de sus etiquetas que coinciden con el consenso), y voto por mayoría cuando una instancia recibe etiquetas en conflicto.

**Reentrenamiento:** mensual, con conjuntos versionados. Los gimnasios del conjunto de prueba (6.2) están en una lista de exclusión: sus fotos de usuario nunca entran a entrenamiento. Despliegue en modo sombra durante una semana (el modelo nuevo predice en paralelo, sin mostrarse) y solo se publica si no empeora ninguna métrica del umbral de calidad.

### 5.9 Plan de construcción del dataset

**Fase 0: guía de etiquetado (1 semana).** Una ficha por clase con los rasgos de 2.2 a 2.17, fotos de ejemplo propias y los grupos de confusión. Doble etiquetado de 10 % de las fotos para medir acuerdo (meta: kappa de Cohen ≥ 0,9 a nivel de clase).

**Fase 1: campaña de captura propia (4 a 6 semanas, 2 personas).**
- 30 a 40 gimnasios en Bogotá, Medellín y Cali, con mezcla deliberada: cadenas (Bodytech, Smart Fit), gyms independientes medianos, gyms de barrio con máquinas locales, gyms de hotel o conjunto residencial, y parques biosaludables. Pedir permiso al gym y fotografiar en horas valle.
- Por cada máquina, 12 a 16 fotos con teléfono, en vertical como las tomará el usuario: frontal, 45° a cada lado, lateral de cada lado, posterior en diagonal, de cerca a la placa o logo, desde 3 a 4 m, con mala luz si la hay. Más un video de 10 s alrededor de la máquina del que se extraen 10 cuadros (deduplicar: descartar pares con similitud coseno ≥ 0,95).
- **Metas por clase:** mínimo 100 imágenes de entrenamiento de al menos **10 instancias físicas** en al menos 5 gyms y, cuando exista, de al menos 3 marcas o fabricantes; objetivo de 200 a 300. Validación: 20 por clase. Prueba: 30 a 50 por clase **de gyms que no aparecen en entrenamiento**.
- Volumen: ~171 clases x ~12 instancias ≈ 2.000 instancias; a ~1,5 minutos por instancia son unas **55 horas de captura**, más el tiempo de etiquetado. Resultado: 30.000 a 45.000 imágenes de entrenamiento.
- Las clases raras con menos de 5 instancias en el país se marcan "beta", con umbrales más altos y apoyo del VLM.

**Fase 2: semillas externas con licencia.** Datasets CC BY 4.0 o CC0 de Roboflow con procedencia verificada, imágenes de Open Images y Wikimedia con licencia comprobada por archivo, y fotos de catálogos solo de fabricantes que lo autoricen. Usarlas como entrenamiento adicional, nunca en prueba.

**Aumentos de datos (en entrenamiento):**
- Color fuerte, porque el color no debe importar: cambio de tono en todo el rango, saturación 0,3 a 1,7, escala de grises con probabilidad 0,2.
- Geometría: recorte aleatorio redimensionado (escala 0,35 a 1), perspectiva leve, rotación de ±12°, volteo horizontal (las máquinas son casi simétricas; no afecta a la función).
- Fotometría del gimnasio: poca luz, contraluz de ventanales, desenfoque de movimiento, ruido de sensor, compresión JPEG 40 a 90.
- Oclusión: recortes aleatorios y pegado de siluetas de personas y de otras máquinas en primer plano (es lo normal en un gym lleno).

**Imágenes sintéticas:**
1. **Recoloreado y retapizado de fotos propias**: segmentar marco y tapicería (SAM o similar) y cambiarles el color y la textura. Es barato y ataca directamente el sesgo de color. Prioridad alta.
2. **Edición con modelos generativos**: cambiar fondo, iluminación o estilo de la máquina preservando la geometría. Revisar cada lote: los generadores a veces alteran la mecánica (rodillos que desaparecen), lo que contaminaría etiquetas finas.
3. **Renders 3D con aleatorización de dominio** (luces, texturas, fondos, poses de cámara), que en detección funcionan sobre todo combinados con datos reales ([Tremblay et al. 2018](https://arxiv.org/pdf/1804.06516)). Solo si hay modelos 3D con licencia; esfuerzo alto, dejar para clases con pocas fotos.
- **Tope:** las sintéticas no superan 25 % de las imágenes de una clase en entrenamiento, **nunca** van a validación ni prueba, y se mide su aporte con un experimento de ablación (con y sin sintéticas).

**Fase 3: bucle con usuarios** (5.8) desde la beta privada.

---

## 6. Plan de evaluación

### 6.1 Métricas

| Métrica | Definición | Para qué |
|---|---|---|
| Top-1 y top-3 por clase funcional | Sobre el conjunto de prueba, una foto | Capacidad bruta del modelo |
| Exactitud por familia | Top-1 de familia marginalizada | Calidad del filtro del listado manual |
| Exactitud macro | Media de la exactitud por clase | Evita que las clases comunes oculten las raras |
| **Precisión de autoconfirmación** | Aciertos entre las fotos que caen en banda alta o local segura | La métrica de producto más importante |
| **Cobertura** | Proporción de fotos que caen en banda alta o local segura | Cuánta fricción se ahorra |
| Curva riesgo-cobertura y AURC | Error frente a cobertura al mover el umbral | Elegir umbrales |
| Error de calibración (ECE) | Diferencia entre confianza y exactitud | Que 0,92 signifique 92 % |
| OOD: AUROC y FPR@TPR95 | Con el conjunto de fuera de catálogo | Open set |
| Exactitud con segunda foto | Fusión de 2 vistas en los grupos de confusión | Valor del flujo de 5.4 |
| Aporte del VLM | Exactitud de la banda media con y sin VLM; costo por acierto ganado | Justificar el gasto |
| Latencia p50 y p95 | En 3 teléfonos de referencia (gama baja tipo Samsung A1x o Redmi, gama media, gama alta), con WebGPU y con WASM, en frío y en caliente | Requisito de menos de 500 ms en caliente |
| Métricas de producto (beta) | Tasa de corrección del usuario, abandono del flujo, tiempo hasta registrar, proporción de registros por listado manual | Realidad en el gym |

Todo desglosado por: tipo de gym (cadena, independiente, barrio, parque), tipo de carga, marca internacional frente a fabricante local, y condiciones de luz.

### 6.2 Conjunto de prueba

- **Separación por gimnasio**, no por foto: 10 a 15 gimnasios completos reservados solo para prueba (si una máquina aparece en entrenamiento y prueba, la exactitud se infla).
- **Tamaño:** 30 a 50 fotos por clase, de al menos 3 instancias, para ~171 clases: **6.000 a 8.000 fotos**. Más **1.000 fotos fuera de catálogo** (equipos no listados, máquinas de hogar raras, escenas del gym sin máquina) para OOD.
- **Precisión estadística:** con 6.000 fotos, un top-1 de 90 % tiene un intervalo de confianza de 95 % de unos ±0,8 puntos. Para afirmar que la precisión de autoconfirmación es ≥ 99,5 % se necesitan al menos ~2.000 autoconfirmaciones en prueba: con 0,5 % de error observado, el intervalo de Wilson va de ~0,2 a ~0,9 % de error. Con 30 fotos por clase, el intervalo por clase es amplio (±10 puntos): sirve para detectar clases rotas, no para comparar clases parecidas.
- **Congelado:** el conjunto de prueba no se toca ni se usa para ajustar umbrales (para eso está validación). Se amplía una vez al año con gyms nuevos.

### 6.3 Evaluación en la beta (modo sombra)

Durante las primeras 4 a 8 semanas con usuarios reales, registrar todas las predicciones y lo que el usuario eligió. Muestrear 500 registros por mes para revisión humana: la elección del usuario también tiene errores, y esa tasa hay que conocerla.

### 6.4 Metas honestas

| Medida | Al lanzar (dataset propio, sin galerías locales) | A 6 meses (galerías locales y reentrenos) |
|---|---|---|
| Top-1 clase, una foto, gym nuevo | 88 a 93 % | 91 a 95 % |
| Top-3 clase | 97 a 99 % | 98 a 99,5 % |
| Exactitud de familia | 97 a 99 % | ≥ 99 % |
| Máquina ya confirmada antes en ese gym (galería local) | No aplica | ≥ 99 % top-1 |
| Precisión de autoconfirmación | ≥ 99,5 % (es una restricción de diseño: los umbrales se ajustan para cumplirla) | ≥ 99,5 % |
| Cobertura de autoconfirmación | 60 a 75 % | 85 a 90 % |
| Registros que terminan en listado manual | 5 a 10 % | 2 a 5 % |
| OOD AUROC | ≥ 0,90 | ≥ 0,93 |
| Marca y modelo (opcional) | 60 a 80 % | Sin meta |
| Latencia en caliente en el dispositivo | p95 < 500 ms gama media; < 900 ms gama baja con WASM | Igual |

**Lo que no se puede prometer:**
- **100 % por visión no existe.** El techo real lo ponen las máquinas combo que se ven idénticas a las simples, las fotos parciales y los diseños locales únicos. Solo QR/NFC es determinista.
- Los números de esta tabla son **extrapolaciones** de papers de dominios vecinos (Cat2Real, DINOv2, trabajos pequeños de equipos de gym); no hay un benchmark público del dominio. La primera tarea de ingeniería es medir con el piloto (6.6) y corregir estas metas.
- Las clases raras tendrán peor desempeño que el promedio durante meses.
- La exactitud depende más del **dataset** (diversidad de gyms, de fabricantes locales y de ángulos) que de la elección del modelo.

### 6.5 Umbrales de calidad para publicar un modelo nuevo

No empeorar en más de 0,3 puntos el top-1 global ni en más de 2 puntos ninguna familia; precisión de autoconfirmación ≥ 99,5 % en prueba; ECE ≤ 3 %; latencia p95 sin regresión mayor a 10 %.

### 6.6 Piloto antes de comprometerse (2 a 3 semanas)

Con 40 clases difíciles (todos los grupos de 2.18), 5 gyms de entrenamiento y 2 de prueba: comparar DINOv2-S, DINOv3-S y SigLIP 2-B sin afinar (kNN) y afinados; medir latencia real en 3 teléfonos dentro del WebView de Capacitor y en Chrome; medir el aporte de Haiku 5.5 frente a Gemini 2.5 Flash-Lite como verificadores. Si el top-1 afinado en esas 40 clases difíciles queda por debajo de 85 %, revisar el plan de datos antes de escalar.

---

## 7. Costos mensuales estimados

**Supuestos:** cada usuario activo entrena 12 veces al mes e identifica 4 máquinas por sesión (las demás las resuelve el plan o la memoria local): 48 identificaciones por usuario al mes. La proporción que llega al VLM baja con el tiempo por las galerías locales.

**Costo por llamada al VLM** (foto de ~1024 x 768 más descripciones de 5 candidatos y salida JSON corta):

| Modelo | Tokens aprox. | Precio | Costo por llamada |
|---|---|---|---|
| Claude Haiku 5.5 | ~1.050 de imagen (ancho x alto / 750, [docs de visión](https://platform.claude.com/docs/en/build-with-claude/vision)) + ~1.200 de texto; ~150 de salida | USD 0,10 / 0,50 por millón ([precios](https://platform.claude.com/docs/en/about-claude/pricing)) | ~USD 0,0003 |
| Gemini 2.5 Flash-Lite | 258 tokens por tesela de 768 px (~516) + ~1.200; ~150 de salida ([tokens](https://ai.google.dev/gemini-api/docs/generate-content/tokens)) | USD 0,10 / 0,40 por millón ([precios](https://ai.google.dev/gemini-api/docs/pricing)) | ~USD 0,00023 |
| Claude Sonnet 5.5 (escalamiento) | ~2.300 de entrada, ~150 de salida | USD 2 / 10 por millón | ~USD 0,006 |
| Gemini 3.1 Flash-Lite (escalamiento barato) | Igual | USD 0,25 / 1,50 por millón | ~USD 0,0007 |

El prompt de sistema con las descripciones de las 171 clases puede ir en caché (en Claude, la lectura de caché de Haiku 5.5 cuesta USD 0,01 por millón), lo que permite mandar descripciones más ricas sin encarecer.

**Escenarios:**

| Partida | 2.000 usuarios activos (96.000 identificaciones) | 10.000 usuarios activos (480.000 identificaciones) |
|---|---|---|
| Inferencia principal | En el dispositivo: USD 0 | USD 0 |
| VLM verificador (25 % al inicio; 12 % maduro) | 24.000 x 0,0003 ≈ USD 7 | 57.600 x 0,0003 ≈ USD 17 |
| Escalamiento (2 % al inicio; 1 % maduro) con Sonnet 5.5 | 1.900 x 0,006 ≈ USD 12 | 4.800 x 0,006 ≈ USD 29 (o ~USD 3 con Gemini 3.1 Flash-Lite) |
| Servidor de respaldo para inferencia en CPU (4 vCPU) | USD 8 a 15 (est.) | USD 15 a 25 (est.; dos instancias) |
| Almacenamiento de fotos (~250 KB cada una; R2 a USD 0,015 por GB al mes) y CDN del modelo (egreso gratuito en R2) | < USD 2 | < USD 5 |
| Vectores (pgvector en el Supabase que ya existe en el plan) | Compartido (USD 0 incremental) | Compartido |
| Reentrenamiento mensual en GPU bajo demanda (L4/A10, 4 a 8 h) | USD 5 a 10 (est.) | USD 5 a 10 |
| **Total** | **~USD 20 a 45** | **~USD 55 a 90** |

Por encima de ~12.000 usuarios activos el presupuesto se ajusta: bajar la proporción de VLM subiendo la cobertura local, usar Gemini 3.1 Flash-Lite o Haiku para el escalamiento, o usar la API por lotes (50 % de descuento en Claude) para tareas no interactivas como la revisión de la cola de aprendizaje.

**Costos únicos fuera del presupuesto mensual:** campaña de captura (2 personas, 4 a 6 semanas, transporte y quizás un pago simbólico a los gyms), ilustraciones vectoriales de 171 clases, y revisión legal de las licencias.

---

## 8. Riesgos principales

| Riesgo | Mitigación |
|---|---|
| El dataset queda sesgado a cadenas premium y falla en gyms de barrio | Cuotas por tipo de gym en la campaña; métricas desglosadas por tipo; prioridad a fabricantes locales. |
| Gyms que no permiten fotografiar | Pedir permiso formal, ofrecer a cambio el kit de QR o visibilidad; usar fabricantes locales (plantas y showrooms). |
| Latencia alta en teléfonos de gama baja dentro del WebView | Respaldo WASM y respaldo en servidor; plan B con plugin nativo; medir en el piloto. |
| Etiquetas contaminadas por usuarios con prisa | Niveles L1/L2/L3, auditoría, consenso entre usuarios. |
| Cambios de precio o de modelos VLM | El verificador es intercambiable (AI SDK / AI Gateway); el núcleo no depende de él. |
| Licencias de modelos | DINOv2 y SigLIP 2 son Apache 2.0; DINOv3 tiene licencia propia por revisar; MobileCLIP descartado. |
| Riesgo legal de imágenes de terceros | Galería solo con fuentes autorizadas (3.4). |

---

## 9. Hoja de ruta sugerida

1. Semanas 1 a 3: guía de etiquetado, ilustraciones de las 40 clases del piloto, piloto de 6.6.
2. Semanas 4 a 9: campaña de captura completa, etiquetado, entrenamiento profesor y alumno.
3. Semanas 10 a 11: integración en la PWA y Capacitor (ORT Web, caché del modelo, flujo de bandas, VLM verificador, QR).
4. Semanas 12 a 19: beta en modo sombra con 3 a 5 gyms; calibrar umbrales con datos reales.
5. Después: reentreno mensual, inventario emergente, crecimiento de la taxonomía desde "otro".

---

## 10. Fuentes

**Modelos y métodos**
- DINOv2 (resultados kNN, lineales, grano fino y recuperación): https://arxiv.org/html/2304.07193
- DINOv3, anuncio y licencia comercial: https://ai.meta.com/blog/dinov3-self-supervised-vision-model/
- SigLIP 2 (tabla 1, zero-shot y 10-shot): https://arxiv.org/html/2502.14786
- MobileCLIP2, model card: https://huggingface.co/apple/MobileCLIP2-S2
- MobileCLIP, repositorio y licencia: https://github.com/apple/ml-mobileclip
- Cat2Real, reconocimiento de productos catálogo a foto real: https://arxiv.org/html/2607.09888
- Why are visually-grounded language models bad at image classification?: https://arxiv.org/abs/2405.18415
- FROW, reconocimiento fino con LVLM: https://arxiv.org/html/2512.10384v1
- OOD con vecinos más cercanos (Sun et al., ICML 2022): https://proceedings.mlr.press/v162/sun22d.html
- ArcFace: https://arxiv.org/abs/1801.07698
- Calibración con temperatura (Guo et al. 2017): https://arxiv.org/abs/1706.04599
- Aleatorización de dominio con datos sintéticos (Tremblay et al. 2018): https://arxiv.org/pdf/1804.06516
- MediaPipe Image Embedder: https://developers.google.com/edge/mediapipe/solutions/vision/image_embedder

**Ejecución en navegador y dispositivo**
- Transformers.js v3 y WebGPU: https://huggingface.co/blog/transformersjs-v3
- Transformers.js, guía WebGPU: https://huggingface.co/docs/transformers.js/en/guides/webgpu
- DINOv2 en ONNX para transformers.js: https://huggingface.co/onnx-community/dinov2-with-registers-base
- Soporte de DINOv3 en transformers.js: https://releases.sh/release/rel_30Ii2uc5q8brdSu1a47a5
- Conversión de SigLIP 2 a ONNX (limitaciones): https://huggingface.co/spaces/onnx-community/convert-to-onnx/discussions/27
- ONNX Runtime Web, proveedor WebGPU: https://www.mintlify.com/microsoft/onnxruntime/execution-providers/webgpu
- WebGPU en Chrome para Android: https://developer.chrome.com/blog/new-in-webgpu-121
- WebGPU, modo de compatibilidad en Android y WebView: https://groups.google.com/a/chromium.org/g/blink-dev/c/N3RlLGCOTJ4/m/loneRTlPBwAJ
- WebGPU en navegadores principales: https://web.dev/blog/webgpu-supported-major-browsers
- Web NFC: https://developer.chrome.com/docs/capabilities/nfc
- Plugin NFC para Capacitor: https://capawesome.io/plugins/nfc

**Precios**
- Precios de Claude: https://platform.claude.com/docs/en/about-claude/pricing
- Tokens de imagen en Claude: https://platform.claude.com/docs/en/build-with-claude/vision
- Precios de Gemini: https://ai.google.dev/gemini-api/docs/pricing
- Tokens de imagen en Gemini: https://ai.google.dev/gemini-api/docs/generate-content/tokens
- Gemini Embedding 2, precio por imagen (agregador): https://tokencost.app/blog/gemini-embedding-2-pricing

**Datos y licencias**
- Roboflow Universe, proyectos de equipos de gym: https://universe.roboflow.com/sowon/codeflex, https://universe.roboflow.com/fitforge/gym-equipment-detection-bcdfz, https://universe.roboflow.com/gym-ai-5yfhp/gym-machine_classify
- Roboflow, licencias y uso comercial: https://discuss.roboflow.com/t/usability-of-dataset-for-commercial-use/2847, https://discuss.roboflow.com/t/my-dataset-was-used-with-an-inappropriate-license/11399
- Open Images V7: https://research.google/blog/open-images-v7-now-featuring-point-labels/ y https://docs.voxel51.com/dataset_zoo/datasets/open_images_v7.html
- Wikimedia, categoría Weight training (espejo): https://c.enwp.org/wiki/Category:Weight_training
- Gym-Equipment-Classifier: https://github.com/siddharthkhincha/Gym-Equipment-Classifier
- Kalra, tesis de reconocimiento de equipos: https://ir.lib.uwo.ca/etd/3770
- Tortolini, tesis con Technogym: https://amslaurea.unibo.it/id/eprint/30862/
- Life Fitness, condiciones de uso: https://lifefitness.com/fr-be/legal/terms-of-use
- IA y derecho de autor en Colombia: https://www.xataka.com.co/legislacion-y-derechos/ia-no-puede-tener-derechos-autor-abogado-nos-habla-ia-su-legalidad-colombia, https://lexlatin.com/reportajes/medios-comunicacion-derechos-autor-inteligencia-artificial-fair-use, https://impactotic.co/inteligencia-artificial/ia-y-derechos-de-autor-desafios-y-estrategias/

**Mercado**
- Matrix y Smart Fit: https://www.athleticbusiness.com/industry-press-room/article/15158752/matrix-fitness-smart-fit-announce-partnership
- Bodytech con Matrix, Panatta y Booty Builder: https://www.noticiasrcn.com/salud-y-bienestar/grupo-bodytech-abre-tres-nuevos-gimnasios-en-bogota-y-medellin-en-2026-982456
- Precor y Gym Shop en Colombia: https://www.portafolio.co/tendencias/fitness-negocio-maquina-51658
- Panatta en Colombia: https://www.portafolio.co/contenido-patrocinado/panatta-una-marca-un-nombre-una-historia-547503
- Hammer Strength plate loaded: https://lifefitness.com/es-es/productos/fuerza/plate-loaded/hammer-strength
- Fabricantes colombianos: https://xtensor.com.co/, https://www.abcfitnesscolombia.com/, https://machinesgym.wixsite.com/futuremachinescali, https://oaklandsportmachine.com/, https://homeathletic.com.co/
- OEM asiáticos: https://www.yanrefitness.com/plate-loaded-gym-equipment, https://thacoindustries.com/en/custom-plate-loaded-machines-manufacturers/
