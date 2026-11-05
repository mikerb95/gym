# Técnica e interfaz para capturar series y repeticiones en una app de gym web-first

Consulta hecha el 5 de noviembre de 2026. Las versiones de navegador salen de caniuse (Chrome Android 157, Samsung Internet 31, Firefox Android 159 en esa fecha) y de la rama `main` de MDN browser-compat-data (BCD).

Estado del repositorio verificado directamente: `apps/android/capacitor.config.ts` usa `server.url`, minSdk 26, targetSdk 36; hay `@capacitor/haptics` 8.0.2 y `@capgo/capacitor-health` 8.11.13; no hay plugin de notificaciones locales; el `AndroidManifest.xml` de la app declara solo `INTERNET` (no revisé lo que añaden los manifiestos de los plugins al fusionarse); `workout-store.ts` persiste en localStorage y, si la escritura falla, guarda en un `Map` en memoria.

## Temporizador de descanso con la pantalla bloqueada

### Takeaway
Con pantalla bloqueada y sin señal, solo una alarma o un servicio nativos son fiables: en Capacitor Android es viable, en la PWA pura (Android o iOS) no existe una vía local. La hora de fin debe guardarse como timestamp absoluto; ninguna capa debe depender de `setInterval`.

### Cited Findings

Matriz de capacidades (detalle y fuentes abajo):

| Mecanismo | Chrome Android (PWA) | WebView (Capacitor Android) | iOS PWA | Funciona bloqueado y sin señal |
|---|---|---|---|---|
| Web Push | Sí | No | Sí, solo instalada, desde 16.4 | No, necesita red |
| Notification Triggers | Desarrollo terminado | No | No | No |
| Wake Lock | Sí | BCD lo hereda de Chrome, sin prueba propia | Sí desde 18.4 | No, se libera al ocultarse |
| Alarma nativa | No aplica | Sí, con plugin | No aplica | Sí, con matices de exactitud |
| Servicio en primer plano | No aplica | Sí, con código nativo | No aplica | Sí, con matices de fabricante |

**Web**
- Notification Triggers: Chrome declara que el desarrollo terminó porque no estaba claro que pudiera ofrecer una experiencia consistente entre plataformas. El trial está "Complete" y el lanzamiento "Not started". La página es de 2019 y no da versiones ni fecha de cierre: [Chrome Developers](https://developer.chrome.com/docs/web-platform/notification-triggers).
- WebView no implementa `Notification` ni `PushManager` ni `SyncManager` (`version_added: false`). Por tanto Web Push no sirve dentro de la app Capacitor: [BCD Notification](https://github.com/mdn/browser-compat-data/blob/main/api/Notification.json), [BCD PushManager](https://github.com/mdn/browser-compat-data/blob/main/api/PushManager.json), [BCD SyncManager](https://github.com/mdn/browser-compat-data/blob/main/api/SyncManager.json).
- En Chrome Android y Samsung Internet las notificaciones solo se pueden lanzar desde un service worker: [BCD Notification](https://github.com/mdn/browser-compat-data/blob/main/api/Notification.json).
- Temporizadores en páginas ocultas de Chrome (desde Chrome 88, enero de 2021): se revisan una vez por segundo; tras 5 minutos oculta, con cadena de 5 o más timers y 30 segundos de silencio, una vez por minuto. El sonido reciente eleva a throttling mínimo, pero **una pista silenciosa no cuenta**, así que el truco de audio silencioso no evita el throttling: [Chrome Developers](https://developer.chrome.com/blog/timer-throttling-in-chrome-88).
- Screen Wake Lock: Baseline desde marzo de 2025; se libera al ocultarse el documento o con batería baja, puede rechazarse en modo ahorro, y hay que volver a pedirlo en `visibilitychange`: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).
- Wake Lock en iOS: BCD fija soporte en Safari iOS 18.4 ([BCD WakeLock](https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json)). Antes fallaba en apps de pantalla de inicio; el bug de WebKit está resuelto, pero un mantenedor dejó dicho que parte del trabajo se sigue fuera del proyecto WebKit ([WebKit 254545](https://bugs.webkit.org/show_bug.cgi?id=254545)). Un derivado de caniuse aún dice que no funciona en modo PWA, probablemente desactualizado ([tabla](https://docs.w3cub.com/browser_support_tables/wake-lock)).

**iOS PWA**
- Web Push requiere iOS o iPadOS 16.4, app añadida a inicio con manifest `standalone` o `fullscreen`, y pedir permiso desde un gesto directo: [WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
- `Notification` queda indefinido fuera de una app de pantalla de inicio: [BCD Notification](https://github.com/mdn/browser-compat-data/blob/main/api/Notification.json).

**Android nativo: alarmas exactas**
- `SCHEDULE_EXACT_ALARM` nació en Android 12. En dispositivos con Android 14 o superior, una app recién instalada que apunte a Android 13 o superior lo tiene **denegado por defecto**, también tras restaurar copia. Sin permiso, `setExact`, `setExactAndAllowWhileIdle` y `setAlarmClock` lanzan `SecurityException`: [Android](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms).
- Excepción útil: un `setExact` con `OnAlarmListener` no requiere el permiso: [Android](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms).
- `USE_EXACT_ALARM` se concede al instalar y no se puede revocar, pero Play lo restringe a funcionalidad central. Fuentes en conflicto sobre el alcance: la guía de Android habla de apps de calendario o alarma ([Android](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)); la política de Play menciona apps de alarma **o temporizador** y calendario, con revisión y declaración ([Play Console](https://support.google.com/googleplay/android-developer/answer/16558241)).
- Doze aplica con el dispositivo sin cargar, quieto y con pantalla apagada durante un tiempo. Ignora wake locks, difiere alarmas estándar (incluido `setExact`) y `setAndAllowWhileIdle` y `setExactAndAllowWhileIdle` no pueden dispararse más de una vez cada 9 minutos por app. `setAlarmClock` dispara con normalidad y saca al sistema de Doze: [Android](https://developer.android.com/training/monitoring-device-state/doze-standby).
- Play prohíbe pedir directamente la exención de optimización de batería salvo que se afecte la función central: [Android](https://developer.android.com/training/monitoring-device-state/doze-standby).

**Plugin de notificaciones locales de Capacitor (v8)**
- Desde Android 12 las notificaciones no son exactas sin declarar `SCHEDULE_EXACT_ALARM`. `checkExactNotificationSetting()` y `changeExactNotificationSetting()` permiten leer el estado y abrir ajustes. Si el usuario revoca, la app se reinicia y se borran las notificaciones exactas: [Capacitor](https://capacitorjs.com/docs/apis/local-notifications).
- Desde v8.3.0: `isExactNotification` (por defecto `true`), `isExactMandatory` (por defecto `false`) y `ScheduleResult.warning` cuando cae a inexacta. `schedule()` pide permiso de notificación si falta (Android 13+): [Capacitor](https://capacitorjs.com/docs/apis/local-notifications).
- `allowWhileIdle: true` hereda el límite de una cada 9 minutos: [Capacitor](https://capacitorjs.com/docs/apis/local-notifications).
- El sonido del canal no se puede cambiar sin desinstalar: [Capacitor](https://capacitorjs.com/docs/apis/local-notifications).

**Android nativo: servicio en primer plano**
- Tipo `health`: descrito para "apps de fitness como rastreadores de ejercicio". Requiere `FOREGROUND_SERVICE_HEALTH` y al menos uno de: declarar `HIGH_SAMPLING_RATE_SENSORS`, o tener concedido `ACTIVITY_RECOGNITION` u otro permiso de salud: [Android](https://developer.android.com/develop/background-work/services/fgs/service-types).
- Tipo `shortService`: sin permiso específico, unos 3 minutos, ANR si no se detiene, extensión solo si la app es visible o exenta: [Android](https://developer.android.com/develop/background-work/services/fgs/service-types).
- Tipo `specialUse`: casos de uso revisados por Play. Todos los tipos se declaran en Play Console al apuntar a Android 14+: [Android](https://developer.android.com/develop/background-work/services/fgs/service-types).
- Android 14 permite al usuario descartar la notificación del servicio: [Capawesome](https://capawesome.io/docs/plugins/android-foreground-service/).
- El plugin de Capawesome solo lista los tipos `Location` y `Microphone`, y no aclara si el JS sigue corriendo: [Capawesome](https://capawesome.io/docs/plugins/android-foreground-service/).
- `WebView.pauseTimers()` pausa los temporizadores JS de todas las WebViews ([Microsoft Learn, espejo de la API](https://learn.microsoft.com/en-us/dotnet/api/android.webkit.webview.pausetimers?view=net-android-37.0)). Una guía de Capgo indica que al pasar a segundo plano en Capacitor Android la actividad se pausa, los timers de WebView se ralentizan y el proceso puede morir ([Capgo](https://capgo.app/blog/how-to-play-audio-in-the-background-in-capacitor/)). Un bug de GeckoView (otro motor) reporta timers detenidos con pantalla bloqueada pese al servicio ([Bugzilla](https://bugzilla.mozilla.org/show_bug.cgi?id=1810514)).
- Live Updates: una notificación promovida aparece en la pantalla de bloqueo y como chip de estado, con cuenta atrás nativa usando `setUsesChronometer` y `setChronometerCountDown`. Pide `POST_PROMOTED_NOTIFICATIONS` (no runtime) y `setRequestPromotedOngoing`. La guía cita "starting a workout" como ejemplo de actividad iniciada por el usuario, pero los fabricantes pueden añadir criterios y el usuario puede desactivarlo: [Android](https://developer.android.com/develop/ui/views/notifications/live-update).
- Fabricantes: dontkillmyapp puntúa con 5 (peor) a Huawei, Xiaomi, OnePlus y Samsung, 4 a Oppo y 3 a Vivo. Es una fuente comunitaria y no detalla el efecto sobre servicios en primer plano: [dontkillmyapp](https://dontkillmyapp.com/).

### Inferences
- Pila propuesta para Capacitor Android:
  1. Guardar `restEndsAt` absoluto en el almacén persistente y calcular el restante en cada render. Nunca decrementar un contador.
  2. Al iniciar el descanso, programar la alarma nativa. Sobre esa base, una notificación en curso con cronómetro nativo da la cuenta atrás sin JS.
  3. Con la app visible, usar Wake Lock y sonido o vibración.
  4. Al volver a primer plano, reconciliar con `restEndsAt` y cancelar la alarma si el usuario siguió antes.
- La vía más barata es `@capacitor/local-notifications` con `SCHEDULE_EXACT_ALARM` y flujo de permiso. La más robusta es un plugin propio en Kotlin: servicio `health` más notificación con cronómetro. Exige declaración en Play y código nativo, cosa que la app hasta ahora evita.
- Un descanso típico de 60 a 180 segundos con el teléfono recién bloqueado probablemente no llegue a Doze profundo, pero en una sesión larga con el móvil quieto en un banco sí podría. El tope de 9 minutos haría perder alertas si se usa `allowWhileIdle` en ese estado. Solo una prueba real lo resuelve (`adb shell dumpsys deviceidle force-idle`).
- `USE_EXACT_ALARM` es una apuesta de revisión: el temporizador de descanso es importante, pero difícil de defender como función central de un tracker. Conviene empezar con `SCHEDULE_EXACT_ALARM` y degradar con elegancia.
- PWA en Android y iOS: lo honesto es prometer el aviso solo con pantalla encendida. Mantener la pantalla activa con Wake Lock durante el descanso, y ofrecer Web Push de servidor como mejora opcional, sabiendo que en un sótano sin señal no llega. Además exige un programador de servidor, infraestructura que conviene justificar con datos antes de construirla.
- Riesgo de arquitectura: la documentación marca `server.url` como "not intended for use in production" ([Capacitor](https://capacitorjs.com/docs/config)), y es justo lo que usa el repo. Funciona, pero conviene saber que se está fuera de lo soportado oficialmente.

### Gaps
- No encontré cambios específicos de alarmas exactas en Android 15 ni 16. Lo documentado que hallé llega a la regla de Android 14. Tampoco confirmé el comportamiento por defecto en dispositivos con Android 13.
- No pude confirmar si un servicio en primer plano queda exento de las restricciones de Doze: la página consultada no lo aborda.
- No confirmé si `@capacitor/local-notifications` usa `setAlarmClock`, ni su demora real en modo inexacto para esperas de 90 segundos.
- La página de Live Updates no indica versión mínima de Android (recuerdo que es Android 16, sin verificar en la fuente).
- Sin fuente primaria actual sobre: comportamiento de timers y audio en iOS PWA con pantalla bloqueada, penalización de push silencioso en iOS (WebKit no lo aborda en su artículo), duración de vida de un service worker en Android como sostén de un temporizador.
- Sin datos medidos de fiabilidad en gamas bajas (Tecno, Xiaomi Redmi, Samsung A) para ninguna de estas vías.
- No verifiqué que el plugin de notificaciones funcione igual con la WebView cargando un origen remoto.

## Offline: durabilidad, sincronización y recuperación

### Takeaway
localStorage basta en tamaño para la sesión activa, pero su garantía de durabilidad es la más débil y Capacitor lo desaconseja para datos importantes. La mejora de mayor valor es llevar la bandeja de salida a IndexedDB con `durability: "strict"` y `persist()`, o a SQLite nativo. Background Sync no existe en WebView ni en iOS, así que la sincronización debe dispararse al abrir, reanudar o recuperar red.

### Cited Findings
- Capacitor: el sistema "reclamará local storage de las WebViews si el dispositivo va justo de espacio", por lo que localStorage debe usarse para datos pequeños y transitorios. IndexedDB tiene el mismo riesgo al menos en iOS; en Android se puede marcar como persistido. Para datos grandes recomienda SQLite; Preferences es nativo pero para poco volumen: [Capacitor](https://capacitorjs.com/docs/guides/storage).
- Límite de Web Storage: MDN se contradice en la misma página (10 MiB máximo y 5 MiB por tipo). Al superarlo salta `QuotaExceededError`: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- Cuotas: Chromium hasta 60% del disco; Safari (macOS 14+, iOS 17+) cerca del 60% por origen en navegadores y 15% en apps con WebView embebida; una app de pantalla de inicio recibe la cuota de navegador: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/).
- Desalojo: borra todo el origen de una vez, por LRU, bajo presión de espacio. Los orígenes persistentes se saltan. Safari con prevención de rastreo borra datos de orígenes sin interacción en 7 días de uso del navegador: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- `persist()`: Chromium y Safari aprueban o niegan sin diálogo según la interacción con el sitio. WebKit menciona como heurística si corre como app de pantalla de inicio. Google reporta que el desalojo es muy raro en sitios de visita frecuente: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/).
- Durabilidad de IndexedDB: desde Chrome 121 las transacciones `readwrite` son `relaxed` por defecto. El evento `complete` salta cuando los datos llegan al búfer del sistema, que se vacía aproximadamente cada pocos segundos. Se puede pedir `{ durability: "strict" }`: [Chrome Developers](https://developer.chrome.com/blog/indexeddb-durability-mode-now-defaults-to-relaxed/), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability).
- Background Sync: Chrome, Edge y Samsung sí; Safari, Safari iOS y Firefox no: [caniuse](https://caniuse.com/background-sync). WebView no, con bug abierto de implementación: [BCD SyncManager](https://github.com/mdn/browser-compat-data/blob/main/api/SyncManager.json).
- Periodic Background Sync exige PWA instalada, puntuación de interacción y red ya conocida, con frecuencia decidida por el navegador. No sirve para este caso: [Chrome Developers](https://developer.chrome.com/docs/capabilities/periodic-background-sync).
- Idempotencia: `Idempotency-Key` sigue como Internet-Draft activo (versión 08, 22 de octubre de 2026). Semántica: reintento tras completar devuelve respuesta consistente; 409 si el original sigue en curso; 422 si la clave se reutiliza con otro cuerpo; 400 si falta: [IETF](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/).
- UUIDv7 (RFC 9562, mayo de 2024): timestamp de 48 bits al inicio, ordenable sin parsear, mejor localidad de índice que v4 y generable sin coordinación: [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html). wger usa `uuid7` como clave de `WorkoutLog`: [wger](https://raw.githubusercontent.com/wger-project/wger/master/wger/manager/models/log.py).

### Inferences
- Falla silenciosa actual: si `localStorage.setItem` lanza una excepción, `workout-store.ts` guarda en memoria y el usuario sigue creyendo que está persistido. Debería avisar o, al menos, registrar el evento. El fallback tiene sentido para modo privado, no para cuota llena.
- Aunque IndexedDB tiene su propio riesgo, sus ventajas frente a localStorage son: API asíncrona que no bloquea el hilo en gamas bajas, transacciones, sin el tope de 5 MiB, y durabilidad estricta explícita. Para SET confirmado usar `strict`; para borrador de tecleo, `relaxed` o localStorage.
- Patrón de recuperación: registro de eventos por serie (`set_logged`, `set_edited`, `set_deleted`) con snapshot derivado, persistido en cada confirmación. Al abrir, si hay sesión activa no cerrada, ofrecer "Continuar" sin diálogo bloqueante, y marcar la hora real de fin con el último evento.
- Conflictos: una sesión la edita casi siempre un solo dispositivo, así que basta con última escritura gana por serie (`updated_at` y `device_id`) y tombstones para borrados. CRDT sería sobreingeniería. Hevy exige reenviar el entreno entero al actualizar ([cliente comunitario](https://www.mintlify.com/imalfect/hevy-http-mcp/architecture/hevy-client)); una API por serie reduce conflictos y hace que los reintentos pesen menos.
- Id generado en cliente con UUIDv7: el id de la serie y el de la sesión son a la vez clave primaria y clave de idempotencia. No hace falta esperar a que el draft sea RFC, basta un `upsert` por id.
- Disparadores de sincronización sin Background Sync: arranque, `visibilitychange` a visible, evento `online`, y tras cada serie con red. Reintentos con espera exponencial.
- Reloj: guardar `client_time` y `server_received_at`, porque los teléfonos de gama baja pueden tener la hora mal.

### Gaps
- Sin datos de campo sobre tasa de desalojo de WebView en Android de poco almacenamiento; la cifra de "muy raro" de Google es de sitios web, no de WebView.
- No confirmé si `navigator.storage.persist()` se concede dentro de una WebView de Capacitor. BCD la hereda de Chrome ([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/StorageManager.json)), pero Android puede comportarse distinto. Hay que probarlo.
- No confirmé cómo interactúan localStorage y el modo persistente, ni la existencia de pérdidas reales de localStorage tras un cierre forzado.
- Pendiente de prueba: arranque en frío en modo avión desde la app Android, dado que carga un origen remoto. Depende de que el service worker tenga la app en caché.

## Háptica y sonido

### Takeaway
En Android con Capacitor hay háptica útil; en iOS PWA no hay ninguna vía web. `navigator.vibrate` exige gesto de usuario, así que no sirve para avisar del fin de un descanso. El aviso con música debe ser una notificación nativa o sonido con ducking, siempre combinado con vibración.

### Cited Findings
- Vibration API: Safari desktop e iOS sin soporte; Firefox escritorio sin soporte desde 129; Chrome desde 30: [caniuse](https://caniuse.com/vibration). En Firefox Android está deshabilitada aunque devuelva `true`: [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json).
- **Desde Chrome 60 y WebView 60, `vibrate` requiere gesto de usuario; si no, devuelve `false`**: [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json).
- WebView requiere el permiso `VIBRATE` de Android para Vibration API: [Chrome Developers, 2024](https://developer.chrome.com/docs/webview?hl=ja).
- Capacitor Haptics v8: `impact`, `notification`, `vibrate(duration)` y `selectionStart/Changed/End`. Resuelve sin efecto en dispositivos sin vibrador. La página no habla del permiso `VIBRATE`: [Capacitor](https://capacitorjs.com/docs/apis/haptics).
- Audio con música en Android: desde Android 8 el sistema hace ducking automático cuando otra app pide `AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK`, y también cuando una notificación de audio toma el foco. No hay ducking si lo que suena es contenido hablado, como un podcast: [Android](https://developer.android.com/media/optimize/audio-focus).
- Apps con target Android 15 o superior solo pueden pedir foco de audio si son la app superior o tienen un servicio en primer plano; si no, reciben `AUDIOFOCUS_REQUEST_FAILED`. El repo usa target 36: [Android](https://developer.android.com/media/optimize/audio-focus).
- Si el sonido proviene de la página, reproducirse no cambia los throttling salvo que sea audible: [Chrome Developers](https://developer.chrome.com/blog/timer-throttling-in-chrome-88).

### Inferences
- Patrón para tocar una serie: `Haptics.impact(Light)` en Capacitor; `navigator.vibrate(10)` como respaldo en Chrome, que sí cumple la condición de gesto; nada en iOS, con confirmación visual fuerte.
- Fin de descanso con la app oculta: canal de notificación con sonido corto y patrón de vibración, ambos gestionados por el sistema. Así se resuelve también el ducking, sin escribir código de foco de audio.
- El canal es inmutable tras crearse: elegir bien el sonido y el id del canal desde el principio. Ofrecer dos canales (con sonido, solo vibración) permite que el usuario cambie sin reinstalar.
- En un gym ruidoso con audífonos el sonido no siempre se oye ni la vibración se siente si el teléfono está en un banco. Nada debe depender de un solo canal.

### Gaps
- No confirmé si `AudioSession` (`navigator.audioSession`) está disponible en iOS PWA ni si permite mezclar con música de otra app. Tampoco si Web Audio suena con iPhone bloqueado o con interruptor de silencio.
- No confirmé si el manifiesto del plugin Haptics añade `VIBRATE` al fusionarse. El manifiesto propio de la app no lo declara.
- Sin estudio sobre detección de vibración o alertas sonoras en gimnasios.

## Registro por voz

### Takeaway
La voz es viable como acelerador opcional pero no como vía principal: en Chrome Android requiere red, WebView es incierto, y la opción on-device nativa arranca en API 31 con disponibilidad variable. El análisis puede ser una gramática determinista con LLM como respaldo, cuyo costo es despreciable. No hay evidencia publicada de precisión en español con ruido de gym.

### Cited Findings
- Web Speech: reconocimiento en servidor por defecto, por lo que **no funciona sin conexión**: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API).
- `processLocally`, `phrases`, `available()` e `install()` permiten reconocimiento local y sesgo por contexto, pero BCD los marca desde Chrome 139 en escritorio y `version_added: false` en Chrome Android: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API), [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json).
- Soporte: Chrome Android, Samsung Internet y Safari iOS 14.5+ "parcial"; Firefox Android no: [caniuse](https://caniuse.com/speech-recognition).
- WebView: información en conflicto. BCD la hereda de Chrome Android ([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json)); un archivo fuente de Chromium sin fecha clara dice que el reconocimiento está soportado y la síntesis apagada ([Chromium](https://chromium.googlesource.com/chromium/src.git/+/4e1b7bc3/android_webview/lib/aw_main_delegate.cc)); un foro indica que falla en exportaciones Cordova pese a la detección positiva, también sin fecha ([Construct](https://www.construct.net/en/forum/construct-3/general-discussion-7/speechrecognition-broken-175463)).
- `SpeechRecognizer` de Android: "probablemente transmite audio a servidores remotos" y no está pensado para reconocimiento continuo por batería y datos. `createOnDeviceSpeechRecognizer` e `isOnDeviceRecognitionAvailable` existen desde API 31; `checkRecognitionSupport` y `triggerModelDownload` desde API 33; hay errores específicos como `ERROR_LANGUAGE_UNAVAILABLE`. Requiere `RECORD_AUDIO`: [Android](https://developer.android.com/reference/android/speech/SpeechRecognizer).
- Plugins Capacitor: `@capacitor-community/speech-recognition`, `@capgo/capacitor-speech-recognition` (dice usar el SpeechRecognizer on-device, Android 6+) y `@capawesome-team/capacitor-speech-recognition` (advierte que listar idiomas puede no resolver nunca y recomienda timeout). Android 13+ no expone la lista de idiomas: [Capgo](https://capgo.app/docs/plugins/speech-recognition/getting-started), [Capgo GitHub](https://github.com/Cap-go/capacitor-speech-recognition), [Capawesome](https://capawesome.io/docs/plugins/speech-recognition/).
- Ruido: en un estudio de 2025 con Whisper en javanés y sundanés, el WER sube al bajar el SNR y los modelos pequeños se degradan más; entrenar con ruido mitiga: [arXiv 2509.25878](https://arxiv.org/pdf/2509.25878). No es español ni ruido de gym.
- Whisper en español con audio limpio: 3,0% WER en FLEURS, según un blog de un proveedor que cita el paper ([Vexascribe](https://vexascribe.com/how-accurate-is-whisper)); un modelo afinado reporta 5,13% y advierte peor rendimiento con ruido extremo ([modelo](https://huggingface-proxy.pages.dev/HiTZ/whisper-large-es)).
- Precios Gemini por millón de tokens, nivel pago: `gemini-2.5-flash-lite` 0,10 USD entrada, 0,30 audio, 0,40 salida; `gemini-3.5-flash-lite` 0,30 entrada y audio, 2,50 salida. `gemini-2.5-flash` está deprecado y se redirigirá a `gemini-3.5-flash-lite` desde el 1 de diciembre de 2026: [Google AI](https://aistudio.google.com/docs/pricing).

### Inferences
- Costo estimado (suposición mía: 300 tokens de entrada y 40 de salida por frase): unos 0,00019 USD por frase con `gemini-3.5-flash-lite` y 0,00005 USD con `gemini-2.5-flash-lite`. Con 20 series por sesión y 12 sesiones al mes, 240 frases cuestan cerca de 0,05 USD o 0,01 USD por usuario al mes. El costo no es la barrera, lo son la latencia y la falta de red.
- Gramática determinista primero. "tres series de diez con sesenta" se resuelve con un patrón `(N series de)? R (repeticiones)? (con|a) P (kilos|libras)?`. Un diccionario cubre numerales ("dos y medio", "sesenta y dos y medio"), "por lado", "a cada lado", "barra", "al fallo", "última igual", "RPE ocho". Esto corre sin red, y el LLM entra solo si la gramática no resuelve.
- Ambigüedades a validar con usuarios reales: si "tres series" significa registrar tres o solo mencionar el plan; si "diez con sesenta" lleva unidad implícita (usar la unidad de la última serie del ejercicio); si la carga es total o por mancuerna.
- Interacción: pulsar para hablar, nunca escucha continua. Mostrar la interpretación con botón Deshacer antes de que salte al siguiente paso. Sin red, permitir el fallback a teclado sin frustración.
- Con la Vercel AI SDK ya en el repo (`ai` 7.0.163), salida estructurada con esquema estricto sería poco trabajo, pero el texto del usuario debe tratarse como dato no confiable.
- Opciones on-device como Whisper pequeño en WASM o nativo suenan caras para gamas bajas y los modelos pequeños son justo los que más sufren con ruido. No las priorizaría sin una medición.

### Gaps
- Sin estudio de precisión de reconocimiento de números en español en gimnasio, ni comparación Android SpeechRecognizer contra Whisper en ese contexto.
- No confirmé la disponibilidad del paquete on-device `es-CO` o `es-419` en gamas bajas, ni la compatibilidad de los plugins citados con Capacitor 8.6.
- No medí latencia ni precisión de LLM parseando estas frases. Es fácil de evaluar con un conjunto de frases reales, siguiendo el enfoque que ya usa el proyecto para evaluar reconocimiento de máquinas.
- Solo verifiqué precios de Gemini, no otros proveedores. No verifiqué el conteo de tokens por segundo de audio.

## Conteo automático de repeticiones

### Takeaway
No hay evidencia suficiente para sustituir la captura manual: los relojes tienen errores altos y muy dependientes del ejercicio, y la estimación de pose exige colocar el teléfono a unos 2 metros. El conteo automático solo tiene sentido como sugerencia editable en una fase posterior. Web Bluetooth tampoco está disponible en WebView.

### Cited Findings

**Relojes**

| Estudio | Dispositivo y muestra | Resultado |
|---|---|---|
| [Oberhofer et al. 2021, Sports](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8471343/fullTextXML) | Apple Watch 1.ª gen. con app StrengthControl; 30 adultos, 363 series | Reconocimiento 88,4%. Banca RMSE 1,36 (r 0,61), sentadilla 2,51 (r 0,24), peso muerto 2,57 (r 0,37), sobre unas 9 repeticiones reales |
| [Ziegler et al. 2023, IJES](https://digitalcommons.wku.edu/ijesab/vol14/iss3/143) | 4 Garmin (Instinct x2, Fenix 6 Pro, Vivoactive 3); 20 personas, circuito ligero | MAPE: sentadilla frontal 3,0-18,5%, zancada 44,5-67,0%, flexiones 12,5-67,5%, press 18,0-51,0%. Ninguno cumplió ambos umbrales; recomiendan conteo manual |
| [Lorenzetti y Huber 2018, ISBS](https://commons.nmu.edu/isbs/vol36/iss1/214) | App watchOS propia; 1 sujeto, 9 series | Error de conteo 0,92%. Piloto, sin valor general |
| [Atlas Wristband2, fiabilidad](https://experts.boisestate.edu/en/publications/test-retest-and-inter-monitor-reliability-of-the-atlas-activity-m/) | Monitor de muñeca | Concordancia de conteo 47,9%, mínimo 19,4% en elevación de talones |
| [Atlas Wristband2, validez](https://lida.sport-iat.de/ta/Record/4066446?lng=en) | 159 personas | Media de 11,0 repeticiones por ejercicio; la colocación y la velocidad influyen |

- Nota sobre Oberhofer: el resumen dice "preciso" para sentadilla y peso muerto porque no hubo diferencia de medias significativa, pero tienen el mayor RMSE y baja correlación. La banca aparece como "pobre" por sesgo de 0,6 repeticiones, pese a su menor RMSE. Las medias ocultan errores por serie. Usa hardware de 2015 y una app de terceros: [Oberhofer](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8471343/fullTextXML).

**Pose**
- JMIR mHealth 2026: 22 participantes, sentadillas y flexiones, 12 montajes de cámara, unas 1.320 repeticiones por ejercicio. La posición afecta significativamente; lo mejor fue vista diagonal o frontal a 180-200 cm: [JMIR](https://mhealth.jmir.org/2026/1/e82412/). No pude extraer las cifras de precisión.
- Healthcare 2026: MediaPipe BlazePose, cámara frontal a 30 fps en el dispositivo, 28,6 ms de inferencia, 95,8% de clasificación en 7 ejercicios, sin ensayo aleatorizado, con montaje inicial profesional. Cita ICC 0,91 y 0,94, cifras que se contradicen. No mide conteo de repeticiones: [Heo et al.](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12940220/fullTextXML).

**IMU del teléfono**
- `DeviceMotionEvent.requestPermission()` exige contexto seguro y gesto; MDN lo marca de disponibilidad limitada: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static). BCD lo da en Safari iOS desde 14.5: [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/DeviceMotionEvent.json).
- En WebView, Device Orientation consta como soportado desde v55; la página no habla de Device Motion: [Chrome Developers](https://developer.chrome.com/docs/webview?hl=ja).

**Wear OS (Health Services)**
- `DataType.REP_COUNT` y `REP_COUNT_TOTAL` existen: [Android](https://developer.android.com/reference/kotlin/androidx/health/services/client/data/DataType). `ExerciseType` incluye `BENCH_PRESS`, `SQUAT`, `DEADLIFT`, `LUNGE`, `LAT_PULL_DOWN`, `BARBELL_SHOULDER_PRESS`, `WEIGHTLIFTING` y `STRENGTH_TRAINING`: [Android](https://developer.android.com/reference/androidx/health/services/client/data/ExerciseType).
- Las capacidades varían por dispositivo y hay que consultarlas al arrancar. Solo un ejercicio activo por dispositivo entre todas las apps, y con pantalla apagada los datos llegan en lotes (por ejemplo cada 150 segundos): [Android](https://developer.android.com/health-and-fitness/health-services/active-data).

**Bluetooth y VBT**
- Web Bluetooth: Chrome Android desde 56 ([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/Bluetooth.json)); Samsung Internet desde 6.2; ni Safari iOS ni Firefox ([caniuse](https://caniuse.com/web-bluetooth)); **WebView no** ([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/Bluetooth.json)). Exige HTTPS, gesto, selector de dispositivo; `requestLEScan` sigue como futuro: [Chrome Developers](https://developer.chrome.com/docs/capabilities/bluetooth).
- Vitruve frente a GymAware: 14 varones, no válido para velocidad y potencia salvo pico de velocidad en Smith, aunque fiable entre sesiones: [PLOS ONE 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11500865/). El propio fabricante indica que el encoder nuevo usa Bluetooth: [Vitruve](https://vitruve.fit/?p=1701).

### Inferences
- Un conteo errado que obliga a corregir cuesta más que introducir el número. Con errores de 2 repeticiones sobre 10, la sugerencia solo aporta si se muestra como valor editable, jamás como dato silencioso, sobre todo porque alimenta la progresión de carga.
- Pose es incompatible con el contexto: requiere trípode o apoyo a 2 metros, encuadre estable y espacio libre, lo que no encaja con gimnasios llenos y teléfonos de gama baja. Serviría, en todo caso, para corrección de técnica grabada.
- IMU del teléfono: en el bolsillo no capta movimientos de brazo. Atarlo al brazo no es realista para este público. Para fondo se necesitaría servicio nativo con sensores. No es prioritario.
- VBT es un nicho para Colombia por el precio. La integración exigiría plugin BLE nativo y protocolos propietarios.
- La mejor ganancia inmediata no es contar sino **prellenar**: reps y carga de la última sesión o del plan, con un toque para confirmar.

### Gaps
- No encontré estudios revisados por pares sobre Apple Watch moderno, Galaxy Watch, Wear OS, Fitbit o Whoop para conteo de repeticiones de fuerza. Tampoco cifras de Garmin en cargas altas, porque el estudio usa mancuernas ligeras en circuito.
- No confirmé qué relojes Wear OS informan `REP_COUNT` en qué `ExerciseType`.
- Precisión numérica del estudio JMIR no recuperada (la página no se pudo leer). No hallé validación con móvil de conteo en pesos libres.
- No confirmé si Device Motion en Android requiere permiso en Chrome o WebView, ni si sigue activo con pantalla apagada.
- Sin SDK o API pública de Vitruve; no revisé otros encoders ni leí el estudio de VmaxPro.

## Wear OS con Capacitor y Health Connect

### Takeaway
Capacitor no corre en Wear OS: un reloj exige un módulo Kotlin aparte, inversión que no conviene al principio y que Live Updates puede cubrir parcialmente sin app de reloj. Health Connect sí admite series, repeticiones y peso mediante `ExerciseSegment`, pero peso, índice y RPE solo existen en la versión alpha del SDK, y el plugin instalado en el repo no escribe entrenos.

### Cited Findings

**Wear OS**
- Wear OS no tiene runtime de Capacitor; la vía es un módulo Wear nativo en el proyecto `android/`, con mismo application ID y firma, conectado por Data Layer. Sugiere minSdk 30 y solo funciona con teléfonos con Google Play Services; un reloj emparejado con iPhone no llega a la app: [Capgo](https://capgo.app/docs/plugins/watch/wear-os-app-setup/). Esta fuente es un proveedor del plugin, y su blog y documentación discrepan en la versión de `play-services-wearable` (20.0.1 frente a 18.2.0): [Capgo blog](https://capgo.app/blog/capacitor-wear-os-app/).
- Arquitectura recomendada por Google para ejercicio: actividad principal, servicio en primer plano con Ongoing Activity, Room para persistir y WorkManager para subir al final. Hay que manejar el fin forzado por otra app y la pérdida de permisos: [Android](https://developer.android.com/health-and-fitness/health-services/active-data).
- Live Updates se puentean a algunos relojes Wear OS conectados: [Android](https://developer.android.com/develop/ui/views/notifications/live-update).

**Health Connect: sesión realizada**
- `ExerciseSessionRecord` admite segmentos y vueltas, permiso `WRITE_EXERCISE`: [Android](https://developer.android.com/health-and-fitness/health-connect/data-types).
- `ExerciseSegment` lleva `startTime`, `endTime`, `segmentType`, `repetitions` (desde 1.1.0) y `weight`, `setIndex` y `rateOfPerceivedExertion` (referencia: desde 1.2.0-alpha06). `setIndex` se puede repetir para agrupar varios segmentos en una misma serie, y volver a 0 al cambiar de ejercicio: [Android](https://developer.android.com/reference/kotlin/androidx/health/connect/client/records/ExerciseSegment).
- Discrepancia de versión: la referencia dice alpha06, mientras las notas de versión apuntan a nuevos campos para ejercicio en 1.2.0-alpha03 (25 de marzo de 2026). La estable sigue siendo 1.1.0 (8 de octubre de 2025) y la última alpha es 1.2.0-alpha06 (26 de agosto de 2026): [Android](https://developer.android.com/jetpack/androidx/releases/health-connect).
- Hay 68 tipos de segmento, con cosas como `BENCH_PRESS`, `DEADLIFT`, `LAT_PULL_DOWN` y `WEIGHTLIFTING`, con curl y extensión por brazo solo en algunos casos. `isSegmentTypeCompatibleWithSessionType` valida combinaciones: [Android](https://developer.android.com/reference/kotlin/androidx/health/connect/client/records/ExerciseSegment).
- Valor del RPE: escala Borg CR10, 0 a 10: [Android](https://developer.android.com/reference/kotlin/androidx/health/connect/client/records/ExerciseSegment).

**Health Connect: sesión planificada**
- `PlannedExerciseSessionRecord`: comprobar `FEATURE_PLANNED_EXERCISE`, permisos `READ/WRITE_PLANNED_EXERCISE`. Estructura sesión, bloques (con repeticiones), pasos (fase, tipo de ejercicio, objetivos, `RepetitionsGoal`). `plannedExerciseSessionId` enlaza con la sesión real. El ejemplo publicado usa `HeartRateTarget`: [Android](https://developer.android.com/health-and-fitness/health-connect/features/training-plans).

**Plugin y políticas**
- `@capgo/capacitor-health`: `workouts` es de **solo lectura** con `queryWorkouts()`; `saveSample()` guarda muestras sueltas; sin segmentos, series ni planificado (README de la rama `main`): [Capgo](https://raw.githubusercontent.com/Cap-go/capacitor-health/main/README.md).
- Play exige declaración de tipos, política de privacidad y solicitar el mínimo. Prohíbe vender datos y usarlos para publicidad: [Play Console](https://support.google.com/googleplay/android-developer/answer/16558241).

### Inferences
- Secuencia de menor a mayor esfuerzo para el reloj: (1) notificación en curso con cronómetro que puede puentearse; (2) módulo Wear mínimo que muestre el descanso y confirme serie por Data Layer; (3) app de reloj con Health Services y `REP_COUNT`. Mi estimación, sin fuente: (2) son semanas para alguien con experiencia en Kotlin y Compose, y añade una superficie nativa de mantenimiento permanente a una base hoy centrada en la web.
- Exportación a Health Connect: requiere un plugin propio en Kotlin o un fork. Si se basa en 1.2.0-alpha, conviene compilar con feature flags y escribir el peso solo cuando esté soportado. Para el mínimo viable, con 1.1.0 estable sí se pueden escribir `repetitions` por segmento, sin peso.
- El modelo de segmentos exige tiempo de inicio y fin por serie. Si solo se guarda el momento de confirmación, hay que derivar `startTime`. Registrar `started_at` desde el principio evita inventarlo.
- Mapeo: una serie = un segmento; superserie = segmentos intercalados con `setIndex` compartido o secuencial; descanso = segmento `REST` opcional. El catálogo de ejercicios sin equivalente va a `WEIGHTLIFTING` u `OTHER_WORKOUT`, perdiendo nombre. Tipo de serie, carga por lado y asistencia no se pueden representar: Health Connect es una proyección con pérdida, no el modelo fuente.
- `PlannedExerciseSession` sirve para publicar programas a otras apps, pero el beneficio es bajo para un público que entrena con el propio teléfono. No lo priorizaría.

### Gaps
- No confirmé si el proveedor de Health Connect en Android 14, 15 y 16 persiste `weight`, `setIndex` y RPE en dispositivos actuales, ni qué apps los leen hoy.
- No confirmé en texto oficial que exista `WeightTarget` en `ExercisePerformanceTarget`: la guía solo muestra `HeartRateTarget`.
- No investigué Tiles en profundidad: no hallé guía específica para rutinas de fuerza.
- Sin datos de penetración de Wear OS en Colombia. No revisé requisitos de la ficha de Play para apps de reloj.

## Ergonomía de entrada numérica

### Takeaway
Usar `type="text"` con `inputmode="decimal"` y un parser que acepte coma y punto, nunca `type="number"`. La pantalla de una serie debe priorizar prellenado y confirmación de un toque, con objetivos de al menos 48 dp, aspirando a 10 mm o más, y deshacer en lugar de confirmar. No existe un benchmark independiente de velocidad en trackers: hay que medirlo.

### Cited Findings

**Coma decimal**
- `inputmode="decimal"` solo afecta al teclado; no determina qué separador se acepta. Chrome toma el separador del idioma del navegador y Firefox del atributo `lang`: [Just Eat Takeaway](https://medium.com/justeattakeaway-tech/solving-cross-browsers-localization-on-numeric-inputs-3f7aec57aaeb).
- Reportan que Chrome no deja escribir coma en `type="number"` y que el teclado sigue el idioma del teléfono, no el de la página: [Bugzilla 1253606](https://bugzilla.mozilla.org/show_bug.cgi?id=1253606), [Bugzilla 1576378](https://bugzilla.mozilla.org/show_bug.cgi?id=1576378).
- Fallos habituales al importar CSV: coma decimal, delimitadores, encabezados no ingleses: [RepStack](https://repstack.pages.dev/import/strong-csv/) (fuente comercial, resume la ayuda de Strong).

**Objetivos táctiles**
- WCAG 2.2 SC 2.5.8 (AA): mínimo 24×24 CSS px, o con separación suficiente; excepciones por equivalente, inline, agente de usuario y esencial: [W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Android: al menos 48×48 dp, "más grande es aún mejor": [Android](https://developer.android.com/guide/topics/ui/accessibility/apps).
- NN/g: mínimo físico 1×1 cm, basado en Parhi et al. 2006 (pulgar a una mano); huella del pulgar cerca de 2,5 cm según MIT Touch Lab; Fitts: objetivos pequeños tardan más: [NN/g 2019](https://www.nngroup.com/articles/touch-target-size/).
- Hoober: precisión de toque de 7 mm en el centro de la pantalla, 9 mm en bordes y 12 mm en esquinas, y preferencia por tocar en el centro: [UXmatters 2017](https://www.uxmatters.com/mt/archives/2017/07/design-for-fingers-touch-and-people-part-3.php), [Hoober](https://armadillo-grouper-76zf.squarespace.com/publications/designing-for-touch).
- Agarre (Hoober 2013, n=1.333 observaciones, 780 tocando pantalla): 49% una mano (67% pulgar derecho), 36% acunado, 15% dos manos. Los usuarios cambian de agarre cada pocos segundos. Limitaciones: solo espacios públicos, datos de 2013 con teléfonos más pequeños, y el propio autor admitió después que sus dibujos de alcance eran engañosos: [UXmatters](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php).

**Humedad**
- RainCheck (Tung et al., 2018, lluvia): el agua y los dedos mojados alteran la ubicación sensada porque el panel capacitivo no distingue el dedo de otro material conductor. Filtrar mejoró la precisión táctil un 47,9% y la selección bajó de 2,543 a 0,553 segundos. Indica el tamaño del problema, no mide sudor: [Tung et al.](https://faculty.washington.edu/wobbrock/pubs/icmi-18.02.pdf).

**Patrones**
- Steppers: adecuados cuando hay un valor frecuente y ajustes pequeños; texto si los valores son muy variables; un campo mixto permite ambos: [NN/g](https://www.nngroup.com/articles/input-steppers/).
- Deshacer frente a confirmar: las confirmaciones frecuentes se vuelven automáticas; deshacer protege mejor cuando es factible: [NN/g, revisado en agosto de 2026](https://www.nngroup.com/articles/confirmation-dialog/).
- Contraste: 4,5:1 para texto normal, 3:1 para texto grande: [Android](https://developer.android.com/guide/topics/ui/accessibility/apps).

**Velocidad**
- Una reseña atribuye a Strong entre 2 y 3 toques por serie y otras comparan cualitativamente; proceden de sitios con conflicto de interés y no describen el método: [Brace](https://brace-ai.pages.dev/reviews/strong/), [Setgraph](https://setgraph.app/ai-blog/hevy-vs-strong-app-comparison-2026), [LastLift](https://lastlift.pages.dev/articles/fastest-workout-tracker-apps/).

### Inferences
- Reps: stepper más campo directo. El rango es pequeño y la última serie es muy buen predictor. Carga: valor prellenado, botones de ajuste por incremento real (±2,5 kg, según el equipo), y campo directo o selector de discos.
- Teclado propio dentro de la página para reps y carga: ventajas claras frente al sistema (coma siempre consistente, botones grandes, sin saltos de layout, sin depender del idioma del teléfono). Coste: hay que resolver lector de pantalla y foco, y dar alternativa. Priorizaría primero prellenado y steppers, y teclado propio después de medir.
- Parser: `parse("62,5")` y `parse("62.5")` dan 62,5; guardar decimal canónico con punto; mostrar con `Intl.NumberFormat("es-CO")`. Probar con el móvil en inglés.
- Acción "Serie hecha" en la mitad baja y ancha de la pantalla, sin arrinconarla, pues las esquinas son lo más impreciso. Mínimo 56 a 64 dp con separación para compensar humedad, aunque el mínimo oficial sea 48 dp; números de al menos 24 a 32 sp con cifras tabulares.
- Autoguardado y deshacer: cada toque persiste al instante y muestra una barra "Deshacer" unos segundos. Sin diálogos salvo "Descartar entreno". Con UI optimista, el estado de sincronización se muestra discreto y global, no por serie.
- Dark como predeterminado en gym con poca luz, pero con opción de alto contraste para la luz solar (aspirar a 7:1 en la cifra principal). Evitar gestos de precisión como deslizar en filas (sudor) y separar las acciones destructivas de las primarias.
- Benchmark propio de lo que mide el éxito: segundos desde "fin de serie" hasta "serie guardada", tasa de error y correcciones. Prueba con una mano y dedos húmedos, en un teléfono de gama baja. Objetivo razonable a validar: menos de 3 segundos cuando se repite la serie anterior.

### Gaps
- No confirmé el comportamiento concreto de `es-CO` en teclados Android (Gboard, Samsung): si `inputmode="decimal"` muestra coma o punto, ni si depende del idioma del sistema. Requiere prueba en dispositivos.
- Sin estudio específico sobre sudor o guantes en pantallas capacitivas, ni sobre la interacción entre tamaño de objetivo y humedad. Sin estudios de legibilidad en gimnasios.
- No pude leer la página de Material 3 (sin contenido): uso la guía de Android. No verifiqué el texto de 2.5.5 Enhanced en la fuente, aunque recuerdo que pide 44×44 CSS px.
- Sin benchmark independiente de segundos por serie. Los datos de Hoober son de 2013 y no los hallé actualizados para los teléfonos actuales.

## Modelado de datos e interoperabilidad

### Takeaway
Ningún formato abierto es dominante. Los trackers revisados convergen en sesión, ejercicio y serie con objetivo y valor real; difieren en cómo modelan cadena de drop, lados y grupos. Conviene un modelo interno rico, con carga como se introdujo, y exportar a CSV estilo Strong y JSON OpenWeight como proyecciones.

### Cited Findings
- **wger** (`WorkoutLog`): clave `uuid7`; `date`; `exercise`, `routine`, `slot_entry`, `session`; `repetitions` y `repetitions_target` decimales; `repetitions_unit`; `weight` y `weight_target` decimal(6,2); `weight_unit`; `rir` y `rir_target` decimal(2,1); `rest` y `rest_target`; `iteration`; y **`next_log`, autorreferencia para encadenar series como dropsets**: [wger](https://raw.githubusercontent.com/wger-project/wger/master/wger/manager/models/log.py).
- **Liftosaur** (`src/types.ts`): `IHistoryEntry` con `sets`, `warmupSets` en lista separada y `superset` (string en la entrada); `ISet` con objetivo (`reps`, `minReps`, `weight`, `rpe`, `isAmrap`), reales (`completedReps`, `completedRepsLeft`, `completedWeight`, `completedRpe`), `isUnilateral`, `label`, `timestamp`, `isCompleted`, y temporizadores por serie (`timer`, `setTimer`, `completedSetTimer`). `IHistoryRecord` incluye `updatedAt`, `startTime`, `endTime` y `changes`: [Liftosaur](https://raw.githubusercontent.com/astashov/liftosaur/master/src/types.ts).
- **Hevy** (no pude leer la documentación oficial; datos de clientes comunitarios): `type` en `normal`, `warmup`, `dropset`, `failure`; `weight_kg`, `reps`, `rpe`; `superset_id` a nivel de ejercicio, no de serie: [SDK comunitario](https://jackecuyer.github.io/hevy-sdk/interfaces/WorkoutSet.html), [wrapper MCP](https://glama.ai/mcp/servers/diecoscai/hevy-mcp/tools/hevy_create_workout). La ayuda oficial explica los tipos: [Hevy](https://help.hevyapp.com/hc/en-us/articles/34896293707927-Set-Types-in-Hevy-Explained-Drop-Sets-Warm-Up-Sets-and-More).
- **Strong CSV**: sin documentación oficial encontrada. Una plantilla de terceros da `Date`, `Workout Name`, `Exercise Name`, `Set Order`, `Weight`, `Reps`, `RPE`, `Duration`, `Distance`, `Seconds`, `Notes`, `Workout Notes`, sin garantías: [RepStack](https://repstack.pages.dev/tools/strong-csv-template/). Hevy importa solo CSV de Strong y en inglés: [Hevy](https://help.hevyapp.com/hc/en-us/articles/38001424401943-How-to-Import-Strong-App-CSV-Files-and-Export-Your-Data-in-Hevy).
- **OpenWeight**: estándar abierto Apache-2.0 para programas, entrenos y registros, con esquema en openweight.dev y CLI que convierte Strong y Hevy: [listado](https://awesome.ecosyste.ms/projects/github.com%2Fradupana%2Fopenweight). No verifiqué el contenido del esquema.
- Alternativas: [OpenSet](https://github.com/getdiby/openset), [PWF](https://github.com/bcarlson/pwf) y [Open Workout Format](https://set-app.pages.dev/workout-format.html) (borrador en v0.1).
- **FitNotes**: permite exportar a CSV y existe un conversor, pero no confirmé las columnas: [fitnotes2fit](https://github.com/tihawk/fitnotes2fit).

### Inferences
Modelo sugerido (propuesta mía, sin fuente directa):

```
workout_set
  id                uuid7, generado en cliente, clave de idempotencia
  session_id, session_exercise_id, position
  set_kind          warmup | working | drop | backoff
  to_failure        boolean (no como tipo: una serie de trabajo o drop puede ir al fallo)
  reps              decimal, reps_left, reps_right (nulos salvo unilateral)
  load_entered      decimal, unidad kg | lb, exactamente lo tecleado
  load_basis        total | per_side | per_hand | bodyweight_added | assisted
  bar_weight_kg     opcional; bodyweight_kg snapshot si la carga depende del peso corporal
  load_kg_effective calculado y versionado, nunca fuente de verdad
  rpe, rir          decimales
  drop_of_set_id    apunta a la serie anterior de la cadena (al estilo next_log de wger, pero hacia atrás)
  started_at, completed_at, rest_target_s, rest_actual_s
  source            manual | prefill_confirmed | voice | watch
  updated_at, deleted_at, device_id

session_exercise
  group_id, group_kind (superset | circuit | giant), group_order
```

- Guardar lo tecleado evita errores de redondeo entre libras y kilos. Asistencia como base y no como carga negativa: separa "20 kg de asistencia" de "20 kg", y permite calcular carga neta con peso corporal.
- Registrar `source` permite excluir datos inciertos de voz o reloj en la progresión. Registrar `prefill_confirmed` distingue un dato real de un dato que se aceptó sin mirar.
- El `failure` de Hevy mezcla intensidad con tipo y un `drop` al fallo no se puede representar. Por eso se separa. Listas separadas de calentamiento, como en Liftosaur, complican reordenar: un solo enum es más simple.
- Exportar CSV en inglés, con punto decimal y coma como delimitador, según formato Strong, para poder migrar a otras apps. Guardar una versión localizada, si se quiere, para Excel en español, que espera coma decimal y punto y coma.
- Proyectar a Health Connect, con pérdida, y a OpenWeight. Incluir `schema_version` en cada exportación. Permitir exportar sin ser de pago es buena señal para un público que teme quedar atrapado.

### Gaps
- No pude leer la documentación oficial de Hevy (`api.hevyapp.com/docs` sin contenido) ni confirmar si exige plan Pro. Los nombres de campos proceden de terceros.
- Encabezados exactos, delimitador y formato de fecha de Strong sin confirmar: falta un archivo real exportado.
- No confirmé columnas de FitNotes ni el esquema real de OpenWeight, PWF u OpenSet.
- No revisé cómo modela `apps/web/src/lib/workout.ts` estos conceptos hoy, ni el coste de migración de la base de datos.
- Ninguna fuente compara estos modelos en la práctica; la propuesta es de diseño propio.

## Accesibilidad y privacidad

### Takeaway
Las necesidades del contexto de gym se solapan con las de accesibilidad: objetivos grandes, canales múltiples y poca precisión motora. En privacidad, los datos de entreno pueden rozar la categoría de salud según la Ley 1581, y la voz o el vídeo elevan el riesgo. Procesar en el dispositivo, pedir autorización explícita y separada, y no enviar audio por defecto es el camino.

### Cited Findings
- Android recomienda etiquetar por función, evitar redundancias y descripciones únicas en listas: [Android](https://developer.android.com/guide/topics/ui/accessibility/apps). Criterio útil para filas repetidas de serie.
- Objetivo mínimo, excepciones y contraste: ver [W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) y [Android](https://developer.android.com/guide/topics/ui/accessibility/apps).
- Colombia: la Ley 1581 de 2012 define como sensibles los datos que afectan la intimidad o pueden generar discriminación, incluyendo los relativos a la salud y los biométricos. El artículo 6 prohíbe tratarlos salvo excepciones, como la autorización explícita. La autorización es consentimiento previo, expreso e informado: [Ley 1581](https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_1581_2012.htm).
- Según prensa, la SIC ha señalado que no se puede condicionar un servicio a entregar datos biométricos: [Portafolio](https://www.portafolio.co/mis-finanzas/vivienda/legal-o-ilegal-esto-sucede-con-el-uso-de-biometria-en-los-conjuntos-residenciales-636749). Una nota cita la Resolución 16582 de 2025, que no leí: [Accounter](https://accounter.co/noticias/actualidad/asuntos-legales-realmente-es-necesario-tener-ese-dato-sensible).
- Voz: Web Speech suele enviar audio a un servicio ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)) y `SpeechRecognizer` "probablemente" también ([Android](https://developer.android.com/reference/android/speech/SpeechRecognizer)).
- Health Connect y sensores: uso limitado a funciones visibles, sin venta ni anuncios, mínimo necesario, política de privacidad y declaración. Datos de sensores corporales no pueden usarse para publicidad: [Play Console](https://support.google.com/googleplay/android-developer/answer/16558241).
- Desde el nivel API 36 se usan permisos granulares, por ejemplo `READ_HEART_RATE`, en lugar de `BODY_SENSORS`: [Android](https://developer.android.com/develop/background-work/services/fgs/service-types), [Play Console](https://support.google.com/googleplay/android-developer/answer/16558241).
- Micrófono: servicio de tipo `microphone` sujeto a uso en primer plano y a permiso runtime: [Android](https://developer.android.com/develop/background-work/services/fgs/service-types).
- Pose en dispositivo: el estudio de MediaPipe corre sin internet: [Heo et al.](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12940220/fullTextXML).

### Inferences
- **Durante el entreno:** todo aviso por al menos dos canales (visual, sonido, vibración). Con movilidad reducida o una mano ocupada, la voz es un valor añadido real, además de velocidad. El temporizador se actualiza en pantalla por segundo, pero con `aria-live` solo en hitos (30 s, 10 s, fin) para no saturar TalkBack o VoiceOver.
- Filas con nombre completo para lector de pantalla: "Serie 2, 10 repeticiones, 60 kilos, completada". Respetar `prefers-reduced-motion` y el tamaño de letra del sistema. Un teclado propio debe seguir siendo operable con TalkBack y dar alternativa al campo nativo. Ninguna acción puede depender solo de un gesto de deslizar.
- Pérdida cognitiva por fatiga: tras una serie pesada, la interfaz debe exigir poca memoria. Mostrar serie anterior y objetivo, con una sola decisión en pantalla.
- **Privacidad de voz:** no grabar ni guardar audio, solo el texto final y por decisión del usuario. Tratar la voz como opción, con aviso de que puede salir del dispositivo y hacia qué proveedor. El uso de un LLM añade otro encargado de tratamiento, y el aviso debe cubrirlo.
- **Clasificación de datos:** tratar registros de entreno, peso corporal, frecuencia cardiaca y RPE como sensibles por prudencia, aunque la carga levantada aislada no parezca dato de salud. El repo ya gestiona consentimiento y borrado local al cerrar sesión (`workoutStore.clear()`), base útil que habría que extender a IndexedDB y a la exportación.
- **Teléfono compartido:** los datos locales en texto plano en WebView son accesibles al que use el teléfono. Mostrar un temporizador en la pantalla de bloqueo o Live Update expone solo el descanso; el nombre del ejercicio y la carga no deberían aparecer en notificaciones públicas.
- Un conteo por cámara en un gimnasio captura a terceros. Debería quedar en el dispositivo, sin subir fotogramas, y advertir sobre grabar a otras personas.

### Gaps
- No hay criterio de la SIC sobre si los registros de entrenamiento son datos de salud. Requiere revisión de un abogado. Tampoco confirmé si la voz se considera dato biométrico cuando solo se transcribe. Las fuentes de SIC son secundarias, y el Decreto 1377 de 2013 no se revisó.
- No encontré investigación específica de accesibilidad para apps de fuerza ni uso de lectores de pantalla en gimnasios.
- No se revisaron las políticas de retención de datos de los proveedores de voz ni de LLM, ni las transferencias internacionales.
