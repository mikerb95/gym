# Registro de series y repeticiones en apps líderes: matriz de funciones y análisis de UX (corte: 5 de noviembre de 2026)

**Cómo leer estas notas.** Cada dato lleva una marca de evidencia y un enlace:

- **[O]** = página oficial del desarrollador abierta y leída (centro de ayuda, documentación, web de producto o ficha de App Store). Las fichas son autodeclaradas: no prueban que la función se comporte bien.
- **[S]** = página (casi siempre oficial) vista solo como resumen del buscador, en general porque la apertura directa devolvió 403. Es el caso de los centros de ayuda de Hevy y Fitbod. Hay que tratarlo como probable, no como leído. En Fitbod, además, el resumen no siempre permite fijar el artículo exacto: las claves [fb-dec] y [fb-int] apuntan al artículo o sección más probable.
- **[V]** = afirmación de un desarrollador sobre un rival (Hevy sobre Strong, Boostcamp sobre terceros, etc.). Tiene sesgo comercial.
- **[T]** = terceros (reseñas, foros, opiniones de usuarios en la tienda, sitios SEO). Se avisa cuando son de baja autoridad.

**Límites del método.** No se probó ninguna app en un dispositivo. Los conteos de toques son inferencias a partir de los flujos documentados, no mediciones. Las páginas se leyeron con un extractor automático, así que las citas textuales conviene revisarlas antes de reproducirlas. Los precios son de la tienda de EE. UU. en USD, salvo indicación. Las fichas de App Store dan la fecha sin año; se asume 2026 por la secuencia de versiones. La ausencia de una función en la documentación no prueba que no exista: por eso esos casos van en "Gaps" y no como hechos.

**Claves de fuentes usadas en las tablas:**

[hv-track]: https://www.hevyapp.com/features/track-workouts/
[hv-prog]: https://www.hevyapp.com/features/exercise-programming-options/
[hv-set]: https://www.hevyapp.com/features/workout-settings/
[hv-la]: https://www.hevyapp.com/features/live-activity/
[hv-mus]: https://www.hevyapp.com/features/sets-per-muscle-group-per-week/
[hv-cmp]: https://www.hevyapp.com/compare/strong/
[hv-as]: https://apps.apple.com/us/app/hevy-gym-log-workout-tracker/id1458862350
[hv-types]: https://help.hevyapp.com/hc/en-us/articles/34896293707927-Set-Types-in-Hevy-Explained-Drop-Sets-Warm-Up-Sets-and-More
[hv-rpe]: https://help.hevyapp.com/hc/en-us/articles/34490600233111
[hv-pro]: https://help.hevyapp.com/hc/en-us/articles/35119778922263-Hevy-Pro-Subscription-How-to-get-Pro-and-What-Does-It-Include
[hv-cap]: https://help.hevyapp.com/hc/en-us/articles/34896183826455-Hevy-Set-Limit-Explained-Why-Workouts-and-Routines-Have-a-150-Set-Cap
[hv-imp]: https://help.hevyapp.com/hc/en-us/articles/38001424401943-How-to-Import-Strong-App-CSV-Files-and-Export-Your-Data-in-Hevy
[hv-hc]: https://help.hevyapp.com/hc/en-us/articles/36957110114455-Health-Connect-Not-Receiving-Hevy-Data-Here-s-How-to-Fix-It
[hv-ah]: https://help.hevyapp.com/hc/en-us/articles/36957445562775-Hevy-Not-Syncing-to-Apple-Health-Step-by-Step-Troubleshooting-Guide
[hv-down]: https://help.hevyapp.com/hc/en-us/articles/38279350428695-What-will-happen-to-my-account-if-I-switch-from-Pro-to-the-free-version
[hv-rev]: https://cellphoneplans.androidauthority.com/CellPhones/Apps/hevy-app-review
[hv-reddit]: https://redlib.groet-infra.nl/r/Hevy/new
[st-as]: https://apps.apple.com/co/app/id464254577
[st-web]: https://www.strong.app/
[st-first]: https://help.strongapp.io/article/229-my-first-workout
[st-rest]: https://help.strongapp.io/article/231-rest-timer
[st-tags]: https://help.strongapp.io/article/166-set-tags
[st-plate]: https://help.strongapp.io/article/169-plate-calculator
[st-warm]: https://help.strongapp.io/article/171-warm-up-calculator
[st-rpe]: https://help.strongapp.io/article/230-about-rpe
[st-sync]: https://help.strongapp.io/article/210-live-sync
[st-edit]: https://help.strongapp.io/article/249-how-do-i-edit-a-past-workout
[st-wcat]: https://help.strongapp.io/category/129-apple-watch
[st-lcat]: https://help.strongapp.io/category/165-logging-a-workout
[mf-web]: https://macrofactor.com/workouts/
[mf-types]: https://help.macrofactorapp.com/en/articles/317-logging-different-types-of-sets
[mf-lr]: https://help.macrofactorapp.com/en/articles/378-can-i-log-different-weights-or-reps-for-each-side-of-my-body
[mf-sp]: https://help.macrofactorapp.com/en/articles/305-understanding-and-using-smart-progressions
[mf-ar]: https://macrofactor.com/annual-report-2026/
[mf-sub]: https://help.macrofactorapp.com/en/articles/393-how-macrofactor-subscriptions-and-bundles-work
[mf-per]: https://help.macrofactorapp.com/en/articles/389-how-can-i-customize-periodization-rir-reps-and-sets-for-the-exercises-in-my-program
[mf-feed]: https://macrofactor.com/feed/
[fb-as]: https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543
[fb-edit]: https://help.fitbod.me/hc/en-us/articles/360006335593-Editing-Workouts-in-Fitbod
[fb-dec]: https://help.fitbod.me/hc/en-us/articles/43489869175063-How-does-Fitbod-decide-my-sets-reps-and-weight
[fb-int]: https://help.fitbod.me/hc/en-us/sections/35305345636375-Integrations
[fb-wear]: https://help.fitbod.me/hc/en-us/articles/4406074415383-WearOS-on-Android
[fb-sens]: https://www.sensai.fit/blog/fitness-app-pricing-free-tier-comparison
[bc-pro]: https://www.boostcamp.app/pro
[bc-mus]: https://www.boostcamp.app/features/muscle-tracker
[bc-feat]: https://boostcamp.app/features
[bc-rpe]: https://www.boostcamp.app/best/rpe-rir
[bc-hevy]: https://www.boostcamp.app/vs/hevy
[jf-as]: https://apps.apple.com/us/app/jefit-workout-plan-gym-tracker/id449810000
[jf-el]: https://www.jefit.com/elite
[lf-docs]: https://www.liftosaur.com/docs/liftoscript
[lf-old]: https://www.liftosaur.com/docs/docs.html
[lf-as]: https://apps.apple.com/app/id1661880849
[lf-sens]: https://www.sensai.fit/blog/liftosaur-review
[lf-cmp]: https://www.sensai.fit/blog/boostcamp-vs-hevy-vs-liftosaur-2026
[ap-guide]: https://alphaprogression.com/en/blog/alpha-progression-guide
[ap-as]: https://apps.apple.com/us/app/gym-workout-alpha-progression/id1462277793
[sg-as]: https://apps.apple.com/us/app/setgraph-workout-tracker/id1209781676
[fn-as]: https://apps.apple.com/us/app/fitnotes-2-gym-workout-log/id1538896016
[rc-as]: https://apps.apple.com/us/app/repcount-gym-workout-tracker/id594982044
[rc-fol]: https://apps.appfollow.io/ios/repcount-gym-workout-tracker/594982044?country=us
[dm-as]: https://apps.apple.com/us/app/id1073943857
[dm-w]: https://dr-muscle.com/apple-watch-app/
[gb-as]: https://apps.apple.com/us/app/id650113307
[gb-nz]: https://apps.apple.com/nz/app/id650113307?l=en-au
[ly-as]: https://apps.apple.com/is/app/id6443740936?l=en-gb
[ly-ai]: https://www.lyfta.app/ai-instructions
[ly-vs]: https://www.lyfta.app/vs/hevy-vs-strong
[g-rec]: https://www8.garmin.com/manuals/webhelp/GUID-C2B794A7-F2FB-456B-B090-69C0111C43CB/EN-US/GUID-E46EDB3B-A02B-42C5-8FF5-AAD914F354C0.html
[g-venu]: https://www8.garmin.com/manuals-apac/webhelp/venu33s/EN-SG/GUID-6BF5E04F-FB0C-4750-BA50-00F4732C88F6-9402.html
[pmc]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8471343
[isbs]: https://commons.nmu.edu/isbs/vol36/iss1/214
[sm-forum]: https://eu.community.samsung.com/t5/wearables/the-good-the-bad-the-ugly/m-p/6324290/highlight/true
[sm-mha]: https://www.myhealthyapple.com/a-complete-guide-to-weightlifting-and-strength-training-using-the-samsung-galaxy-watch
[sm-ep]: https://exercisepick.com/what-setting-in-the-samsung-watch-for-weightlifting/
[wr]: https://thewearify.com/?p=123329
[ai-wb]: https://www.analyticsinsight.net/amp/story/news/workout-buddy-on-apple-watch-the-future-of-personalized-fitness
[tr]: https://techradar.com/health-fitness/smartwatches/im-sick-of-my-apple-watchs-workout-app-lacking-this-key-fitness-feature-but-a-new-apple-watch-ultra-4-rumor-suggests-it-could-finally-catch-up-with-apps-like-smartgym
[pr]: https://apps.apple.com/us/app/-/id1548577496
[rv]: https://apps.apple.com/ar/app/repvault-pro/id6756327244
[gy]: https://forums.appleinsider.com/discussion/comment/2999867/
[ss]: https://appshunter.io/ios/app/repflow-workout-tracker/id6741197124
[el]: https://apps.apple.com/app/elevus/id6760205476
[eh]: https://apps.apple.com/app/echolift/id6757499671
[ll]: https://apps.apple.com/us/app/id6752257498
[gg]: https://apps.apple.com/us/app/the-gym-genius/id6743663195
[mx]: https://apps.apple.com/us/app/id6753816458
[barb]: https://barbend.com/news/latest-meta-analysis-training-frequency-for-hypertrophy/

*(Las definiciones anteriores son enlaces Markdown de referencia: al renderizar, cada [clave] de las tablas apunta a su URL. En texto plano se resuelven en esta misma lista.)*

## Flujo y toques para registrar una serie; precarga de valores; sesión anterior en línea; teclado y stepper; gestos; deshacer

### Takeaway
La base del mercado es una fila por serie con columna "anterior" y una casilla de completar que dispara el descanso. La diferencia real está en de dónde sale la precarga (última sesión, misma rutina o motor de progresión) y en el teclado propio con accesos a placas y RPE. Ningún desarrollador documenta un deshacer explícito ni publica conteos de toques.

### Cited Findings

| App | Flujo documentado | Precarga y sesión anterior | Teclado, gestos | Ev. |
|---|---|---|---|---|
| Hevy | Marcar serie como completada inicia el descanso; "+ Add Set"; "Finish" arriba a la derecha ([hv-track]) | Al añadir un ejercicio ya hecho se rellenan series, peso y reps previos; columna PREVIOUS; ajuste: último rendimiento global o solo de la misma rutina ([hv-track], [hv-set]) | Botón "Calculator" sobre el teclado; deslizar a la izquierda borra la serie ([hv-track]) | O |
| Strong | Introducir peso y reps, tocar la casilla ([st-first]) | La ayuda no describe precarga ni columna anterior ([st-first]) | Botón de placas a la derecha del teclado ([st-plate]); botón RPE en el teclado al estar en la celda de reps ([st-rpe]); deslizar para borrar; arrastrar el nombre para reordenar ([st-first]) | O |
| MacroFactor Workouts | Introducir peso y reps, marcar completada ([mf-types]) | "Initial log fill": precarga desde Smart Progression o desde el último registro ([mf-sp]) | Barra de acciones bajo el título con botón L/R ([mf-lr]) y varita de progresión ([mf-sp]) | O |
| Alpha Progression | Pantalla centrada en el ejercicio actual, con fila de miniaturas y estado de cada ejercicio ([ap-guide]) | Series anteriores y notas siempre visibles; recomendación en burbuja azul ([ap-guide]) | Selector de peso con valores sugeridos o teclado ([ap-guide]) | O |
| Setgraph | "Fast set logging" ([sg-as]) | Deslizar para replicar series anteriores; orden cronológico o inverso; historial filtrable por peso o reps, con tiempo de descanso entre series ([sg-as]) | Gesto de replicar ([sg-as]) | O |
| FitNotes 2 | Registro de peso, reps, distancia y tiempo ([fn-as]) | Copiar series previas al añadir el ejercicio ([fn-as]) | Calculadora de placas que sigue a la siguiente serie ([fn-as]) | O |
| RepCount | Rellenado con la última sesión; números de la vez anterior por serie, gratis ([rc-as]) | Historial del ejercicio dentro del entreno solo en Premium ([rc-as]) | Sin detalle | O |
| GymBook | Quick-Log y selectores prellenados, con rendimiento previo también en el Watch ([gb-as]) | Sí ([gb-as]); "Workout Matrix" como vista general de la sesión ([gb-nz]) | Selectores | O |
| Lyfta | Sets, reps, peso, RPE, notas ([ly-as]) | Peso y reps previos visibles durante el entreno ([ly-as]) | Sin detalle | O |
| Fitbod | [Pantalla de detalle](https://help.fitbod.me/hc/en-us/articles/29486697282711-Exercise-Details-Screen-Sets-Reps-and-Weight-Fields-Explained) con campos de series, reps y peso (solo título) | Valores desde el motor de recomendación ([fb-dec]) | Sin leer | S |
| JEFIT, Boostcamp, Liftosaur, Dr. Muscle | Sin flujo paso a paso obtenido | Liftosaur: definido por el programa ([lf-docs]) | Sin detalle | Parcial |

- Reglas de contexto del estado anterior: Hevy deja elegir si "anterior" significa la última vez en cualquier contexto o en esta rutina, y llama a la segunda opción más precisa ([hv-track], O). Es un detalle pequeño con mucho efecto en quien hace variantes del mismo ejercicio en distintos días.
- Pantalla despierta: Hevy tiene "Keep Awake During Workout" ([hv-set], O).
- Scroll asistido: "Smart Superset Scrolling" salta al siguiente ejercicio de la superserie al completar ([hv-set], O).
- Cronómetro por serie: "Inline Timer" de Hevy añade inicio y pausa por serie en la columna TIME ([hv-set], O).
- Métrica por serie: Alpha muestra e1RM, e10RM o volumen en cada fila ([ap-guide], O). Strong tiene "Focus Metric", con artículo propio que no se leyó ([st-lcat], título solo).
- Registro fuera de la app: en Hevy se pueden marcar series desde la Live Activity sin desbloquear ([hv-la], O). Es el camino más corto documentado sin abrir la app.

### Inferences
- Mejor caso teórico: un toque por serie (la casilla) cuando se acepta el valor precargado. Es inferencia desde la documentación, no medición. Si cambian peso y reps suben a unos 4 a 6 toques en una interfaz con teclado numérico.
- El gesto de "replicar serie" de Setgraph y el marcado desde pantalla bloqueada de Hevy son las dos ideas de velocidad más claras para copiar.

### Gaps
- No hay conteos publicados de toques ni pruebas independientes de velocidad. Hace falta una prueba con dispositivo y cronómetro.
- **Deshacer:** ningún documento leído describe un deshacer tras completar o borrar una serie. No se puede concluir que no exista.
- **Steppers (+/-):** ninguna fuente abierta describe el diseño de stepper en teléfono. Solo aparece "Button Repeat" del Watch de Strong ([st-as], O), sin explicar. Comprobar en dispositivo.
- Si tocar la casilla acepta el valor fantasma o exige confirmarlo no está documentado para ninguna app.

## Tipos de serie y cómo se modela cada uno

### Takeaway
Calentamiento, normal, fallo y drop son la base en casi todas. Las diferencias reales aparecen en myo-reps, lado izquierdo/derecho y agrupación de entradas dentro de una misma serie, donde MacroFactor tiene el modelo documentado más rico. Tempo como campo estructurado no apareció en ninguna app.

### Cited Findings

| Tipo | Hevy | Strong | MacroFactor | Alpha | Liftosaur | Otras |
|---|---|---|---|---|---|---|
| Calentamiento | Etiqueta al tocar el número; ajuste si cuenta en estadísticas ([hv-set], O) | Etiqueta; excluido de gráficas y métricas ([st-tags], O) | Tipo W ([mf-types], O) | Pro, escalado por ejercicio, peso, reps y experiencia ([ap-guide], O) | `warmup: 1x5 45lb, 1x3 80%`, % sobre la primera serie efectiva ([lf-docs], O) | JEFIT, Lyfta, RepCount, FitNotes: sí ([jf-as], [ly-as], [rc-as], [fn-as], O) |
| Fallo | Se anota la última rep completada ([hv-types], S) | N reps con etiqueta = se intentó la N+1; 1RM fallido = 0 reps ([st-tags], O) | Tipo F, fallo técnico, RIR 0 ([mf-types], O) | Sin detalle | Por script | JEFIT, Lyfta: etiqueta ([jf-as], [ly-as], O) |
| Drop | Tipo propio; el descanso no arranca si la siguiente es drop ([hv-types], S) | Etiqueta ([st-tags], O) | **Una serie con varias entradas agrupadas** ([mf-types], O) | Calculado desde la última serie efectiva, sin descanso ([ap-guide], O) | Por script | RepCount: Premium ([rc-as], O); Setgraph: multisets ([sg-as], O); Boostcamp: gratis ([bc-pro], O) |
| Myo-reps | No documentado | No documentado | Tipo M, entradas agrupadas ([mf-types], O) | Sin detalle | Por script | Ninguna otra confirmada |
| Rest-pause | No documentado | No documentado | Vía Myo ([mf-types], O) | Sin detalle | Por script | Dr. Muscle: lo prescribe el motor ([dm-as], O) |
| AMRAP | No documentado como tipo | No documentado | No documentado | Sin detalle | Bandera por serie ([lf-old], O) | RepCount: máximo de reps en tiempo fijo y objetivo de reps en tiempo ([rc-as], O); FitNotes: temporizador AMRAP ([fn-as], O) |
| Superserie y circuito | Menú de tres puntos, más de 2 ejercicios ([hv-track], O) | Agrupación y circuitos ([st-lcat], título; [st-as], O) | Superseries ([mf-web], O) | Superseries ([ap-guide], O) | `auto` para EMOM y Tabata ([lf-docs], O) | RepCount: Premium ([rc-as], O); GymBook: usuarios lo piden ([gb-as], T) |
| Izq./der. | **Sin función confirmada**; usuarios se quejan ([hv-reddit], T) | No documentado | **Botón L/R, cada lado independiente** ([mf-lr], O) | Sin detalle | Por script | Ninguna otra confirmada |
| Peso corporal, lastrado, asistido | Página propia no lo cubre ([hv-prog], O) | Asistido ([st-as], O) | Sin detalle | Sin detalle | "Is assisting?" y "Bodyweight for Bar"; `weights = bodyweight +/- ...` ([lf-docs], O) | RepCount: asistido y lastrado ([rc-as], O) |
| Bandas | Sin detalle | Sin detalle | Sin detalle | Sin detalle | Sin detalle | Fitbod: ajuste de banda por serie en Watch ([fb-int], S) |
| Tiempo y distancia | Duración; sin RPE en estas series ([hv-prog], O) | Duración ([st-as], O) | Cardio básico ([mf-ar], O) | Sin detalle | Timer de serie `60s\|30s`, `+` cuenta hacia arriba ([lf-docs], O) | FitNotes: los cuatro campos ([fn-as], O); RepCount: cargas (peso, distancia, duración) ([rc-as], O); Fitbod: distancia, duración, resistencia, inclinación ([fb-int], S) |
| Parciales | Sin detalle | Sin detalle | Sí ([mf-web], O) | Sin detalle | Sin detalle | Setgraph: reps parciales ([sg-as], O) |

- Definición de fallo: Hevy y Strong coinciden en no contar la rep fallida en el número registrado ([hv-types], S; [st-tags], O). MacroFactor lo modela de otra forma, como RIR 0 ([mf-types], O).
- Convención de mancuernas: a falta de campo propio se recomienda anotar el peso de una mancuerna y las reps por lado, de forma constante ([guía de terceros](https://steady-rocks.pages.dev/blog/how-to-track-unilateral-exercises), T de baja autoridad). Otras apps publican su propia ayuda sobre esto, lo que apunta a que es una duda habitual ([Moves](https://intercom.help/moves-app/en/articles/9627435-do-i-log-weight-per-hand-or-combined-weight-for-an-exercise), [JEFIT Q&A](https://jefit.com/q&a/113791673/FitInMy50s/how-do-y’all-record-the-weight-per-set-when-using-dumbbells--for-example-if-i-do-bench-press-curls), T).
- Límite técnico: Hevy tope de 150 series por entreno o rutina, también en Pro ([hv-cap], S).

### Inferences
- Modelar drop y myo como "una serie con N entradas" (MacroFactor) es superior a filas sueltas con etiqueta: no infla el conteo de series ni distorsiona el descanso. Hevy resuelve lo segundo con una excepción puntual del temporizador.
- La pregunta "peso por mancuerna o total" y su efecto en el volumen sigue sin un modelo limpio y documentado por las líderes.

### Gaps
- Tempo: ninguna fuente muestra un campo estructurado. El temporizador de serie de Liftosaur es lo más cercano, y no es tempo.
- Hevy peso corporal, lastrado y asistido: la página leída no lo cubre y el centro de ayuda no se pudo abrir.
- Cómo afectan las entradas L/R de MacroFactor al volumen y a la progresión: su artículo no lo dice ([mf-lr], O).
- JEFIT, Boostcamp, Fitbod, Dr. Muscle: no se obtuvo el modelo fino por tipo de serie.

## RPE y RIR: cuándo se pregunta, escala, opcionalidad y uso

### Takeaway
En los registradores puros, RPE es opcional y decorativo: se guarda pero no cambia nada. Solo alimenta decisiones en apps con motor (MacroFactor, Dr. Muscle, Liftosaur por script, Alpha Pro). Dar RIR como opcional y que el sistema siga funcionando sin él es lo habitual en las apps con mejor documentación.

### Cited Findings

| App | Escala | Cómo se pregunta | Opcional | Uso | Plan |
|---|---|---|---|---|---|
| Hevy | 6 a 10 ([hv-rpe], S) | Columna al activar el ajuste; desactivado por defecto ([hv-set], O; [hv-rpe], S) | Sí | Registro | Sin indicación de pago en lo leído |
| Strong | 6 a 10 con medios puntos; tabla RPE a RIR ([st-rpe], O) | Botón en el teclado al editar reps ([st-rpe], O) | Se puede retirar el valor; no lo declara | Registro | No indicado |
| MacroFactor | RIR | Objetivo por programa; registro; opciones por ejercicio ([mf-per], [mf-sp], O) | Sin confirmar | Entrada de Smart Progression ([mf-sp], O) | Suscripción |
| Alpha Progression | RIR con medios puntos (1,5) ([ap-guide], O) | Por plan o entreno ([ap-guide], O) | Sí; recomendaciones funcionan sin él ([ap-guide], O) | Recomendaciones | Pro ([ap-guide], O) |
| Fitbod | RIR; 4+ "muy fácil", típico de calentamiento ([fb-dec], S) | Sin detalle | Sí; sigue ajustando con series, reps y peso ([fb-dec], S) | Recomendaciones | Suscripción |
| Liftosaur | `RPE[n]` objetivo, `completedRPE[n]` real, `rpeMultiplier(reps, rpe)` para reps 1-24 y RPE 1-10 ([lf-old], O) | Solo si la serie lleva "Log RPE" ([lf-old], O) | Por serie | Programable | No indicado |
| Boostcamp | RPE y RIR | Sin detalle | Sin detalle | Registro | Gratis ([bc-pro], O) |
| Dr. Muscle | "RIR-based RPE" ([dm-as], O) | Sin detalle | Sin detalle | Motor | Suscripción |
| FitNotes 2 | RPE/RIR ([fn-as], O) | Sin detalle | Sin detalle | Registro | Todo gratis salvo tope de entrenos ([fn-as], O) |
| Lyfta | RPE ([ly-as], O) | Sin detalle | Sin detalle | Registro | Gratis |

- Hevy recomienda dejar el RPE en blanco cuando no tiene sentido, como en calentamientos ([hv-rpe], S).
- Conflicto: Boostcamp dice que Alpha exige Premium para el análisis RPE/RIR ([bc-rpe], V); Alpha lo confirma ([ap-guide], O).
- MacroFactor lista "Granular RIR Control" entre lo planeado en personalización ([mf-ar], O).

### Inferences
- Pedir el esfuerzo por defecto en cada serie casi no se ve. Hevy y Liftosaur requieren activarlo; Alpha lo hace por plan. Pedirlo solo en la última serie efectiva parece una mejora razonable, pero no encontré datos que lo respalden.
- Unificar internamente RIR y RPE es trivial con la tabla de Strong ([st-rpe], O). Elegir uno de cara al usuario es decisión de producto.

### Gaps
- No se encontraron datos sobre cuánta gente usa RPE/RIR ni sobre la fiabilidad del autoinforme en estas apps.
- Las reglas numéricas de cómo RIR altera la carga en MacroFactor no se publican ([mf-sp], O).

## Temporizador de descanso: autoarranque, valores por ejercicio, notificación, pantalla de bloqueo, Live Activities, Android

### Takeaway
El autoarranque por serie completada es base. Live Activity y Dynamic Island ya son también base en iOS (Strong lo añadió en agosto de 2026). En Android casi todo se documenta solo como "notificación": no hay evidencia pública de cómo se implementa ni de su fiabilidad frente al ahorro de batería.

### Cited Findings

| App | Autoarranque | Valores | Bloqueo / Live Activity | Android | Otros |
|---|---|---|---|---|---|
| Hevy | Sí, al completar ([hv-track], O) | Por ejercicio y predeterminado global; sin preajuste por serie ([hv-track], O; [hv-cmp], V) | Live Activity gratis, +/-15 s, saltar, marcar series ([hv-la], O) | Equivalente: requiere notificaciones de bloqueo, globo y emergentes ([hv-la], O) | Sonidos y volumen separados para timer, check y PR ([hv-set], O) |
| Strong | Sí, 2:00 por defecto ([st-rest], O) | Por ejercicio; distinto para calentamiento y efectivas ([st-rest], O) | Live Activity y Dynamic Island desde v6.5.0, 12 de agosto ([st-as], O) | La ayuda cubre Android; notificación no descrita ([st-rest], O) | Pantalla completa opcional para ajustar o saltar ([st-rest], O) |
| Alpha | Sí, con alarma ([ap-guide], O) | Por tipo de ejercicio, con excepción por ejercicio; ajuste puntual sin cambiar el valor base ([ap-guide], O) | Live Activity iOS ([ap-guide], O) | "Live notifications" ([ap-guide], O) | **Sigue contando tras cero** para mostrar el descanso total ([ap-guide], O) |
| MacroFactor | Sin detalle | Personalizable ([mf-web], O) | Live Activities con registro y descanso ([mf-ar], O) | Sin detalle | Avisos sonoros añadidos en 2026 ([mf-ar], O) |
| Setgraph | Sin detalle | Sin detalle | Bloqueo y Dynamic Island; aviso "Next Set Due" ([sg-as], O) | Solo iOS confirmado | Timers en la barra de pestañas de iOS 27 ([sg-as], O) |
| FitNotes 2 | Sí, según reseñas ([fn-as], T) | Omitir descanso en la última serie ([search, FitNotes](https://apps.apple.com/us/app/id1538896016), S) | Bloqueo con "siguiente serie" ([fn-as], O) | Android no verificado | EMOM, AMRAP y Tabata ([fn-as], O) |
| RepCount | Opcional desde 10.5.1 ([rc-as], O) | Simple | Bloqueo y Dynamic Island ([rc-as], O) | Sin detalle | Quejas de que no siempre suena ([rc-fol], T) |
| GymBook | Sin detalle | Primario y secundario ([gb-as], O) | Live Activity del entreno ([gb-as], O) | No hay app Android confirmada | Estilo gráfico y a pantalla completa ([gb-as], O) |
| JEFIT | Sin detalle | Por ejercicio; cronómetro o cuenta atrás ([jf-as], O) | En bloqueo del Watch ([jf-as], O) | Sin detalle | Reseñas: se congela en el Watch ([jf-as], T) |
| Liftosaur | Sin detalle | `90s`, `setTimer\|restTimer`, `\|?` conserva el predeterminado; `auto` avanza solo ([lf-docs], O) | Sin detalle | Notificaciones de descanso en Premium ([lf-sens], T) | Notificaciones de pago, si se confirma, son rareza |
| Fitbod | Cuenta atrás ([fb-as], T) | Sin detalle | Sin detalle | Sin detalle | **Watch: al atenuarse la pantalla el temporizador se pausa y puede no avisar** ([fb-int], S) |

- Hevy: si la siguiente serie es drop, el descanso no arranca ([hv-types], S). Es una regla por tipo de serie poco común.
- Excepciones por tipo de serie documentadas: la regla de drop de Hevy, los valores separados de Strong para calentamiento y efectivas ([st-rest], O) y la omisión en la última serie de FitNotes 2 ([FitNotes](https://apps.apple.com/us/app/id1538896016), S).

### Inferences
- Lo mínimo competitivo: autoarranque, valor por ejercicio, +/-15 s, saltar, y notificación audible con el teléfono bloqueado.
- La falla descrita en Fitbod muestra por qué el temporizador debe calcular con hora de fin (timestamp) y no con un contador en primer plano. Es inferencia de ingeniería, no algo que documente ninguna app.
- Para una PWA (si es el caso de apps/web), el descanso en segundo plano y el bloqueo son el punto más débil frente a estas apps nativas. Conviene verificarlo con el stack real del proyecto.

### Gaps
- **Android:** no encontré documentación de ninguna app sobre servicio en primer plano, exenciones de batería, alarmas exactas ni Live Updates de Android 16. Hevy describe un widget propio y no aclara la API ([hv-la], O).
- Comportamiento con Modo Concentración de iOS o volumen en silencio: sin fuente.
- MacroFactor Android y Boostcamp: sin detalle del temporizador en bloqueo.

## Calculadora de placas, calentamiento, unidades, incrementos por equipo e inventario de gimnasio

### Takeaway
Calculadoras de placas y calentamiento son base, pero varias las cobran. La distinción real está en el inventario por gimnasio que restringe qué pesos recomienda el motor: MacroFactor y Alpha lo tienen bien resuelto, y Liftosaur da la versión programable.

### Cited Findings

| App | Placas | Calentamiento | Unidades | Inventario e incrementos | Plan |
|---|---|---|---|---|---|
| Hevy | Barra, barra corta, EZ; no mancuernas ([hv-set], O) | Por %, fórmula editable, redondeo de placas y mancuernas ([hv-set], O) | KG o LB en ajustes ([hv-prog], O) | Sin inventario confirmado; "Gym Profiles" de v3.2.4 es social ([hv-as], O) | Placas gratis ([hv-cmp], V) |
| Strong | Barra y máquina, tipo de barra por ejercicio; no en Watch ([st-plate], O) | Barra, mancuerna, máquina; fórmulas editables; no en Watch ([st-warm], O) | Mezcla de lb y kg ([st-as], O) | Sin detalle | **Ambas Pro** ([st-plate], [st-warm], O) |
| MacroFactor | Según placas y barras disponibles ([mf-web], O) | "Warm-up improvements" ([mf-ar], O) | Sin detalle | **Perfiles de gimnasio por entreno**; 250+ equipos; Plate Stack AI para máquinas de pin ([mf-web], [mf-ar], O) | Suscripción |
| Alpha | Muestra el siguiente peso alcanzable más bajo si el exacto no se puede ([ap-guide], O) | Escalado por ejercicio y experiencia ([ap-guide], O) | **Sobrescribible por equipo o ejercicio** ([ap-guide], O) | **Por gimnasio: mín, máx, intervalo**; barra y placas ([ap-guide], O) | Todo Pro ([ap-guide], O) |
| Liftosaur | Placas por lado (Premium, [lf-sens], T) | Bloque `warmup:` ([lf-docs], O) | Unidades en el valor (`1lb`, `3kg`), conversión al cambiar ajustes ([lf-old], O) | "Available Equipment" redondea; `increment(w)` y `decrement(w)`; bar con peso corporal; equipo asistido ([lf-old], [lf-docs], O) | Editor gratis |
| FitNotes 2 | **Perfiles por gimnasio, varias barras** ([fn-as], O) | Series de calentamiento ([fn-as], O) | Sin detalle | Por gimnasio ([fn-as], O) | Gratis con tope |
| Boostcamp | 10 usos gratis, luego Pro ([bc-pro], O) | Plantillas gratis; "unlimited warm-up sets" Pro ([bc-pro], O) | Sin detalle | Sin detalle | Mixto |
| Setgraph | "Smart Plates" ([sg-as], O) | Sin detalle | Sin detalle | Sin detalle | Pro sin detallar |
| GymBook | Sin detalle | Ajustes separados ([gymbook, ficha VC](https://apps.apple.com/vc/app/id650113307?l=en-gb), S) | Métrico o imperial ([gb-as], O) | "Your gym" oculta ejercicios sin equipo ([gb-as], O) | Pro parcial |
| Fitbod | Sin detalle | Sin detalle | Sin detalle | Sin leer | Suscripción |

- Smart Progression de MacroFactor avisa cuando el equipo limita la recomendación: icono amarillo en la varita y opción "Fix" ([mf-sp], O). Es el mejor caso documentado de honestidad sobre incrementos imposibles.

### Inferences
- Cobrar la calculadora de placas (Strong) o limitarla a 10 usos (Boostcamp) deja espacio para darla gratis, como Hevy.
- Las máquinas de pin, con pilas no estándar, solo están abordadas con Plate Stack AI. La cuestión de unidades por máquina, común en gimnasios con equipos mixtos en lb y kg, parece menos cubierta que la de barra. Alpha es la única con override por equipo documentado.

### Gaps
- Unidad por ejercicio en Hevy, Fitbod, JEFIT: no confirmada.
- Incrementos en mancuernas fijas de gimnasio y microplacas: sin detalle fuera de Alpha y Liftosaur.

## Sugerencias de progresión: reglas, cómo se muestran y cómo se aceptan; Liftoscript

### Takeaway
Hay tres familias: reglas opacas (MacroFactor, Alpha, Fitbod, Dr. Muscle, JEFIT, Boostcamp), programa declarativo editable (Liftosaur) y sin motor documentado en lo leído (Strong, RepCount, FitNotes, Lyfta; Hevy solo con Hevy Trainer). Liftoscript es la única con reglas totalmente inspeccionables. En lo leído, solo MacroFactor documenta qué pasa cuando la sugerencia falla por restricción del equipo.

### Cited Findings

**Comparativa**

| App | Reglas públicas | Cómo se muestra | Cómo se acepta | Plan |
|---|---|---|---|---|
| MacroFactor | Basado en reglas, no IA generativa; rendimiento, objetivos RIR y rango de reps ([mf-web], [mf-sp], O); progresión Static, Linear, Reverse Linear y Undulating ([mf-ar], O) | Varita en la barra de acciones; amarillo si hay restricción ([mf-sp], O) | Se precarga vía "Initial log fill"; "Fix" lista alternativas ([mf-sp], O) | Pago |
| Alpha | Rendimiento pasado, sesión actual, pesos disponibles; sube reps antes del salto y baja tras sesiones flojas ([ap-guide], O) | Burbuja azul por serie efectiva ([ap-guide], O) | No documentado ([ap-guide], O) | Pro |
| Fitbod | Series, reps y peso completados; RIR opcional ([fb-dec], S) | Valores en el entreno generado | Editar lo real; las ediciones reajustan el futuro ([fb-edit], S) | Pago |
| Dr. Muscle | Actualiza tras cada serie y entreno; DUP, deload y rest-pause ([dm-as], O) | Sin detalle | Sin detalle | Pago |
| JEFIT | Adaptive Plan con sugerencias de peso y reps ([jf-as], O); nota si el peso se mantiene (v17.3.3) ([jf-as], O) | Nota visible | Sin detalle | Elite |
| Boostcamp | Auto Progression desde series registradas ([bc-pro], O) | Sin detalle | Sin detalle | Pro |
| Hevy | Hevy Trainer: programa y guía según experiencia, objetivos y equipo ([hv-as], O) | Sin detalle | Sin detalle | Pro |
| Liftosaur | **Texto ejecutable, ver abajo** | Cambios de estado en el Playground ([lf-old], O) | Automático tras el entreno ([lf-as], O) | Gratis el motor ([lf-sens], T) |

Opciones de MacroFactor: "Expand Rep Range" amplía el rango si cambiar el peso no basta, y "Weight Match" prefiere el peso de la serie anterior ([mf-sp], O). No hay recomendaciones hasta que haya registros ([mf-sp], O).

**Liftoscript en detalle** (fuente: [lf-docs], O; se leyeron 100.000 de 121.150 caracteres. [lf-old] es la documentación anterior, con el concepto de Finish Day Script)

- Progresión lineal: `lp(increase, increaseAttempts, currentAttempt, decrease, decreaseAttempts, currentDecreaseAttempt)`. `lp(5lb)` sube 5 lb tras 1 éxito; `lp(5lb, 2, 1, 10lb, 3)` sube tras 2 éxitos (ya lleva 1) y baja 10 lb tras 3 fallos; `lp(5%)` en porcentaje.
- Doble progresión: `dp(5lb, 8, 12)`. Las reps suben hasta el máximo, luego sube el peso y las reps vuelven al mínimo.
- Por suma: `sum(30, 5lb)`, añade peso cuando el total de reps supera el umbral.
- A medida: `custom()` con script entre `{~ ... ~}`; se reutiliza con `{ ...Exercise }`.
- `update: custom()` corre antes de las series (`setIndex == 0`) y cada vez que se toca una serie, y puede reescribir `weights`, `reps`, `minReps`, `RPE`, `timers`, `numberOfSets`, `amraps`, `logrpes`, `askweights`. No puede cambiar series ya completadas ni leer estado del programa. Permite autorregulación dentro de la sesión.
- Estado: `custom(attempt: 0, increment: 5lb)`, accesible como `state.attempt`. Se sobrescribe por ejercicio al reutilizar: `custom(increment: 10lb) { ...Bench Press }`. Con `+` en el nombre (`shouldBumpWeight+: 0`) la app pregunta al usuario tras la última serie.
- Variables de lectura: `weights[n]`/`w[n]`, `reps[n]`/`r[n]`, `completedReps[n]`/`cr[n]`, `RPE[n]`, `completedRPE[n]`, `day`, `week`, `dayInWeek`, `numberOfSets`/`ns`. Lectura y escritura: `rm1`, compartido entre programas ([lf-old], O).
- Funciones: `calculate1RM` (Epley sin ajustar), `calculateTrainingMax` (90% de Epley), `increment`, `decrement`, `floor`, `ceil`, `round`, `sum`, `min`, `max`, `rpeMultiplier` ([lf-old], O).
- Ejemplo clásico con deload tras 3 fallos ([lf-old], O):
  ```
  if (completedReps[1] >= reps[1]) {
    state.weight = state.weight + 5lb
    state.failures = 0
  } else {
    state.failures = state.failures + 1
  }
  if (state.failures > 2) {
    state.weight = state.weight - 15lb
    state.failures = 0
  }
  ```
- Asistido: `Pull Up, Leverage Machine / 3x8 50lb / update: custom() {~ if (setIndex == 0) { weights = bodyweight - originalWeights[ns] } ~} / progress: lp(-5lb)` ([lf-docs], O). Muestra cómo modela el asistido como peso corporal menos carga, y una progresión negativa.
- Etiquetas entre ejercicios: `id: tags(1, 100)` y `state[101].rating = 10` ([lf-docs], O).
- Ecosistema: la ficha dice que es "la única app de entrenamiento programable" ([lf-as], O); API y servidor MCP para asistentes de IA en Premium ([lf-sens], T).

### Inferences
- `lp`, `dp` y `sum` son una taxonomía compacta y copiable como reglas predefinidas sin exponer lenguaje alguno. La combinación de esa capa simple con un "Fix" a la MacroFactor no aparece junta en ninguna app revisada.
- La variable preguntada con `+` es un buen patrón: pregunta al usuario solo cuando la regla la necesita, en vez de pedir RPE en cada serie.
- La barrera de Liftoscript es la curva de aprendizaje. Sirve de referencia de expresividad, no de interfaz para un usuario general.

### Gaps
- Fórmulas numéricas de MacroFactor, Alpha, Fitbod y Dr. Muscle: ninguna se publica.
- Si las apps explican en la interfaz por qué recomiendan cada cambio: solo hay indicios parciales (nota de JEFIT, advertencias de MacroFactor).

## Historial y analítica: gráficas por ejercicio, tipos de PR, mapas de calor, exclusión de calentamientos, conteo fraccional

### Takeaway
Gráfica por ejercicio y e1RM son base, y suelen estar detrás del pago o limitadas en tiempo. Boostcamp es la única con conteo fraccional documentado (1 y 0,5), con calentamientos y series saltadas excluidos. Hevy ofrece un interruptor único de "contar calentamientos" que recalcula el histórico.

### Cited Findings

| App | Por ejercicio | PR | Volumen por músculo | Calentamientos | Plan |
|---|---|---|---|---|---|
| Hevy | Gráficas; PR en vivo al completar ([hv-track], O) | Notificación en vivo ([hv-set], O) | Series por grupo muscular, por semana, mes o año ([hv-mus], O); primario y secundario en custom ([hv-mus], O) | **Interruptor; recalcula series, volumen y PR pasados** ([hv-set], O) | Gratis 3 meses; Pro total ([hv-mus], O) |
| Strong | e1RM, volumen ([st-as], O) | Personal records ([st-as], O) | Heat map ([st-web], O) | **Siempre excluidos** ([st-tags], O) | Pro ([st-web], O; [hv-cmp], V) |
| Boostcamp | Mejor serie, e1RM y 1RM real, volumen máximo de serie, mejor marca de 1 a 12 reps ([bc-pro], O) | Insignias y tablero gratis ([bc-pro], O) | **Fraccional: press banca = 1 pecho + 0,5 tríceps; mapa, radar, tabla** ([bc-mus], O) | **Excluidos, también saltadas** ([bc-mus], O) | Tracker Pro; vista en el entreno 10 usos gratis ([bc-mus], O) |
| MacroFactor | Volumen y progreso por músculo ([mf-web], O) | Sin detalle | Tracker ([mf-web], O); fraccional no mencionado | Sin detalle | Pago |
| Alpha | Gráficas Pro; récords gratis ([ap-guide], O) | Récords ([ap-guide], O) | Evaluaciones Pro ([ap-guide], O) | "No se registran como efectivas" ([ap-guide], O) | Mixto |
| JEFIT | e1RM automático ([jf-as], O) | Sin detalle | Series semanales por músculo, mapa y recuperación ([jf-as], O) | Sin detalle | Elite |
| RepCount | e1RM, volumen, PR por rango de reps ([rc-as], O) | **Por rango de reps** | Sin detalle | Sin detalle | Premium |
| Setgraph | e1RM ([sg-as], O) | PR y récords de volumen ([sg-as], O) | Recuperación muscular ([sg-as], O) | Etiquetas de serie ([sg-as], O) | Pro sin detalle |
| FitNotes 2 | Gráficas, % 1RM ([fn-as], O) | Automáticos ([fn-as], O) | Sin detalle | Excluir de estadísticas por ejercicio ([fn-as], O) | Gratis con tope |
| GymBook | Líneas, radar, mapa ([gb-as], O; [gymbook, ficha VC](https://apps.apple.com/vc/app/id650113307?l=en-gb), S) | Sin detalle | Radar y mapa de calor (S) | Sin detalle | Pro parcial |
| Lyfta | e1RM, comparación de sesiones ([ly-as], O) | PR ([ly-as], O) | Estándares de fuerza Premium ([ly-ai], O) | Sin detalle | Premium en lo profundo |
| Liftosaur | Gráficas Premium ([lf-sens], T) | Sin detalle | Vistas de músculo, Week Insights Premium ([lf-sens], T) | Sin detalle | Premium |
| Fitbod | Sin leer | Sin leer | [Weekly Set Targets](https://help.fitbod.me/hc/en-us/articles/24739986755223-Weekly-Set-Targets) (solo título); modelo de recuperación ([sensai](https://www.sensai.fit/blog/fitbod-review-2026), T) | RIR 4+ como calentamiento ([fb-dec], S) | Pago |

- Fórmula de e1RM publicada: Liftosaur usa Epley ([lf-old], O). Ninguna otra de las leídas la declara.
- Base científica del fraccional: el metaanálisis de Pelland y colaboradores (2024) contó el trabajo indirecto como media serie y predijo mejor la hipertrofia, según [BarBend][barb], T. No se leyó el original.
- Sin rango personalizado de fechas en Hevy, ni en Pro ([hv-mus], O).

### Inferences
- El conteo fraccional con una matriz ejercicio-músculo editable y explicable sigue siendo diferenciador. Boostcamp lo cobra.
- El interruptor global de Hevy recalcula mucho de golpe. Un calentamiento mal etiquetado puede alterar PR, y parece no haber ajuste por ejercicio. Strong evita el dilema al excluir siempre. Lo más simple es excluir por defecto y mostrar por qué.

### Gaps
- Hevy: si secundarios cuentan como serie entera o media: su página no lo dice ([hv-mus], O).
- Comparación de fórmulas de e1RM entre apps y qué reps máximas admiten: sin datos.

## Editar pasados, recuperación tras un fallo, offline, conflictos de sincronización, importar y exportar, Apple Health y Health Connect

### Takeaway
Editar el pasado y exportar a CSV son base, aunque RepCount cobra la exportación. Importar es mucho más desigual: Lyfta y FitNotes 2 son los importadores más abiertos, y Strong y MacroFactor no importan historial. Recuperación tras fallo y resolución de conflictos no están documentadas por nadie, lo que convierte ese punto en la mayor incógnita.

### Cited Findings

| App | Editar pasado | Offline | Importar | Exportar | Salud |
|---|---|---|---|---|---|
| Hevy | Hay artículo sobre registrar entrenos pasados ([título](https://help.hevyapp.com/hc/en-us/articles/35687878672663-Tutorial-Log-Previous-Workouts-and-Import-CSV), S); edición sin confirmar | Sí ([hv-as], O) | **Solo CSV directo de Strong**, en inglés y kg; fusiona por fecha; rutinas no pasan; no coincidencias se vuelven custom; reversible; una importación activa ([hv-imp], S) | CSV ([hv-cmp], V) | HealthKit salida ([hv-as], O); Health Connect ([hv-hc], S); lo registrado con la sincronización rota no aparece de forma retroactiva ([hv-ah], S) |
| Strong | "En cualquier momento" ([st-edit], O) | Sin detalle | **Ninguna** ([hv-cmp], V) | CSV a Notas o correo ([st-as], O) | Apple Health ([st-as], O); Health Connect sin confirmar |
| MacroFactor | Entreno suelto manual ([mf-web], O); changelog del entreno ([mf-ar], O); edición sin detalle | Sin detalle | **Sin historial de otras apps**; hoja de cálculo con nombres exactos ([mf-web], O) | Sí ([mf-web], O) | Apple Health escritura ([mf-ar], O) |
| Alpha | Añadir pasados a mano ([ap-guide], O) | Sin detalle | **Ninguna** ([ap-guide], O) | CSV gratis de planes, historial, custom, medidas ([ap-guide], O) | Sin detalle |
| Fitbod | Tab Log, series, reps, peso, añadir o borrar ejercicios ([fb-edit], S) | Sin detalle | Sin detalle | Sin confirmar | Apple Health y Health Connect, lectura de actividad ([fb-int], S) |
| Lyfta | Sin detalle | Sin detalle | **Hevy, Strong, Fitbod, Boostcamp, JEFIT, FitNotes** ([ly-ai], O; coincidencia de nombres manual a veces, [ly-vs], V) | CSV ([ly-ai], O) | Apple Health, Health Connect, Garmin, Fitbit ([ly-ai], O) |
| FitNotes 2 | Editar series en Watch ([fn-as], O); resto sin detalle | Sin cuenta, copia en iCloud ([fn-as], O) | **CSV de Hevy, Fitbod, Strong, IronGAINS, HeavySet, Liftin, WeightFit; JSON y texto** ([fn-as], O) | CSV y formato FitNotes ([fn-as], O) | HealthKit ([fn-as], O) |
| GymBook | Sin detalle | iCloud ([gb-as], O) | Sin detalle | **XML, CSV, copia de base de datos** ([gb-as], O) | Apple Health, Strava ([gb-as], O) |
| RepCount | Sin detalle | Sí; sync iPhone y Android ([rc-as], O) | Sin detalle | **CSV es Premium** ([rc-as], O) | Apple Health ([rc-as], O) |
| Setgraph | Sin detalle | Sin detalle | Sin detalle | CSV desde Cuenta, v26.3.0 ([sg-as], O) | Sync bidireccional Salud y Fitness ([sg-as], O) |
| Liftosaur | Sin detalle | Sync entre dispositivos ([lf-as], O) | Importador directo solo de Hevy ([lf-sens], T) | Gratis ([lf-sens], T) | Sin detalle |

- **Recuperación:** reseñas de RepCount con fallos que pierden el entreno ([rc-fol], T); corrección de un fallo al salir con el temporizador abierto (v10.6.1) ([rc-as], O). FitNotes 2: reseña que acusa duraciones infladas al reanudar ([fn-as], T). Strong: arreglos de congelación con historiales grandes (v6.3.3) ([st-as], O). Hevy guarda al reconectar el Wear OS ([hv-rev], T).
- **Sincronización:** Strong tiene un artículo titulado "creating Duplicate Workouts" ([st-wcat], O, título solo). Es indicio de duplicados entre Watch y teléfono, no de un mecanismo descrito. Live Sync gasta más batería del Watch ([st-sync], O).
- **Conflicto en Strong:** la ayuda dice que un mismo entreno se sigue a la vez en iPhone y Watch ([st-sync], O). Una reseña de la ficha afirma que el teléfono y el reloj no pueden correr un entreno a la vez ([st-as], T). Puede depender de si Live Sync está activo. Sin resolver.
- **Conflicto en Hevy:** Lyfta dice que Hevy importa CSV de Hevy, Strong y FitNotes ([ly-vs], V). La ayuda de Hevy solo admite Strong ([hv-imp], S). Prima la oficial.
- Hevy recomienda no usar "Borrar datos" al diagnosticar Health Connect, porque puede eliminar datos de la app ([hv-hc], S). Eso sugiere estado local no sincronizado, aunque es inferencia.

### Inferences
- El CSV de Strong es el formato puente de facto, porque Hevy, FitNotes 2 y Lyfta lo aceptan. Importar Strong y Hevy desde el día uno es una necesidad y parece barato en proporción a lo que retiene. Importar con mapeo de ejercicios difuso y reversible es lo que elimina la objeción.
- El importador de Hevy exige inglés y kg ([hv-imp], S). Es una limitación concreta para un mercado hispanohablante: Strong en español exporta nombres traducidos, lo que obligaría a cambiar el idioma antes. Un importador que acepte exportaciones en español tendría valor directo en Colombia.
- No documentar recuperación ni conflictos no significa que falten, pero sí que ningún competidor lo usa como argumento. Un guardado local tras cada serie, y su comunicación explícita, es un argumento libre.

### Gaps
- **Nadie publica su modelo de resolución de conflictos** (último en escribir, fusión por serie, etc.), y mi búsqueda sobre recuperación de Hevy y Strong no dio resultados específicos.
- Ninguna ficha aclara si el entreno en curso sobrevive a un cierre forzado. Hay que probarlo.
- Esquema exacto de columnas de los CSV de Strong y Hevy: no leído. Conviene obtener archivos reales de muestra.
- Health Connect en Strong, Alpha, JEFIT, Boostcamp, MacroFactor Android: sin confirmar.

## Apps de reloj, voz, foto o IA, y conteo automático de repeticiones

### Takeaway
Apple Watch es casi base en las grandes; Wear OS es mucho más raro (Hevy, Lyfta y Fitbod lo tienen). La voz y la foto están casi solo en apps nuevas pequeñas, con pocas señales de tracción. El conteo automático de repeticiones no tiene validación independiente para productos comerciales actuales, y Garmin reconoce sus límites en su propio manual.

### Cited Findings

**Relojes**

| App | Apple Watch | Wear OS | Límites conocidos |
|---|---|---|---|
| Hevy | Series, descanso, terminar, FC ([hv-as], O); iniciar rutina, RPE, tipo de serie, PR ([hv-cmp], V) | Sí, sync en vivo ([hv-rev], T) | Superseries se crean en el teléfono ([hv-cmp], V); rutinas no se crean en reloj ([hv-rev], T) |
| Strong | Con o sin iPhone ([st-as], O); iniciar vacío, reordenar, crear superseries ([hv-cmp], V) | No ([hv-cmp], V) | Sin placas ni calculadora de calentamiento en reloj ([st-plate], [st-warm], O); duplicados ([st-wcat], título) |
| Fitbod | Compañero; registrar, ajustar reps, peso, distancia, resistencia, banda; hasta 9 series por ejercicio ([fb-int], S) | Sí, artículo no legible ([fb-wear], S) | **Iniciar y guardar requieren iPhone; temporizador pausado al atenuar** ([fb-int], S) |
| JEFIT | Sync en vivo, FC, calorías, bloqueo ([jf-as], O) | Sin confirmar | Elite: "unlimited watch workouts" ([jf-el], O); congelaciones según reseñas ([jf-as], T) |
| MacroFactor | Iniciar, objetivos, peso, RIR, descanso, asimétricos, drop, myo; **beta** en el informe anual ([mf-ar], O) | Explorando, sin promesa ([mf-ar], O) | Estado actual poco claro: el feed dice que salió y sigue en desarrollo ([mf-feed], S) |
| Liftosaur | Binario watchOS 10.6+ ([lf-as], O); Premium; completa series y descanso, no edita ([lf-cmp], T) | Sin confirmar | Reseña: no marcar series ([lf-as], T). Conflicto, quizá versión antigua |
| Setgraph | Sesiones con FC y complicación, v27.0.0 ([sg-as], O) | No | Sin detalle |
| FitNotes 2 | Editar series y descanso, complicación ([fn-as], O) | No confirmado | watchOS 10+ |
| GymBook | Registro en la muñeca ([gb-as], O) | No | Sin detalle |
| Lyfta | watchOS 10.6+ ([ly-as], O) | Sí ([ly-ai], O) | Sin detalle |
| Alpha | **Ninguno, en hoja de ruta** ([ap-guide], O) | **Ninguno, en hoja de ruta** ([ap-guide], O) | Live Activity como sustituto |
| RepCount | **No** ([rc-as], O); usuarios lo piden ([rc-fol], T) | No confirmado | Sin Watch |
| Dr. Muscle | **Alpha en 2025** ([dm-w], O); ficha no lo menciona ([dm-as], O) | Sin confirmar | Estado incierto |
| Boostcamp | **Contradictorio:** la mayoría de sus páginas dicen que no ([bc-hevy], O), otra dice que sí ([bc-feat], O) | Sin confirmar | Sin resolver; la URL de App Store probada dio 404 |

**Conteo automático**

- Garmin, oficial: cuenta por defecto, se muestra tras al menos 4 reps, cuenta cuando el brazo con el reloj vuelve al inicio, las piernas pueden no contarse, y se puede editar reps y peso al entrar en descanso ([g-rec], [g-venu], S del manual).
- Apple, estudios: un prototipo de watchOS logró 0,92% de error en conteo y 3,5% en reconocimiento, en solo 9 series y 5 ejercicios ([isbs], S). En 2021, el mismo grupo reconoció el ejercicio correcto en 88,4% de 363 series, con conteo preciso en sentadilla y peso muerto ([pmc], S). Son prototipos de investigación, no apps comerciales.
- Apple, nativo: un medio poco fiable dice que Workout Buddy de watchOS 26 cuenta reps ([ai-wb], T). No lo encontré confirmado por Apple, y lo trato como dudoso. TechRadar habla de un rumor de registro de series y reps ([tr], T, solo un extracto legible). Estado real en watchOS 27: sin confirmar.
- Apps de terceros con conteo en Watch: PowerReps ([pr], O), RepVault Pro ([rv], O). Gymatic: "hit or miss" en una reseña de 2017 ([gy], T).
- Samsung: guías de terceros de baja autoridad dicen que algunos modelos cuentan reps, con exactitud variable, y que el entrenamiento de fuerza se inicia a mano ([sm-ep], [sm-mha], T). En el foro de Samsung, un usuario da 95% en Watch 5 Pro y otro afirma errores en cada serie sin poder corregirlos al terminar ([sm-forum], T). Un sitio afirma que Garmin supera al Galaxy Watch Ultra ([wr], T, baja autoridad).

**Voz, foto e IA**

- Grandes: ninguna de las apps de la lista ofrece voz o foto de forma documentada en lo leído. Hevy tiene plugin de ChatGPT (título en [índice de funciones](https://www.hevyapp.com/features/), O); Liftosaur API y MCP ([lf-sens], T). MacroFactor usa Plate Stack AI, pero solo para pilas de máquinas ([mf-ar], O).
- Voz: Superset, reps, series y peso hablados durante el descanso ([ss], tienda agregada, S); EchoLift, voz en el dispositivo, sin cuenta, $4,99 pago único ([eh], S); Liftly ([ll], S); Elevus, voz Premium ([el], S).
- Foto: The Gym Genius convierte fotos de cuadernos, pizarras y capturas de otras apps ([gg], S); Max AI se centra en foto ([mx], S).

### Inferences
- Nadie ha resuelto el Watch como dispositivo independiente y completo con paridad total: cada ficha lista excepciones. Wear OS es el hueco más evidente en plataforma.
- La voz parece encajar en el descanso, no durante la serie. Importar desde foto o pizarra es más útil para migrar cuadernos que para el registro diario.
- El conteo automático no debería ser la vía principal: no hay validación independiente en comerciales, las piernas fallan por mecánica y corregir cuesta más que escribir. Como sugerencia editable tras la serie (modelo Garmin) es razonable.

### Gaps
- **No existe ningún estudio comparativo independiente entre Apple, Samsung y Garmin** en lo que encontré.
- No hay documentación oficial de Samsung sobre el conteo de reps en Galaxy Watch8.
- Wear OS de Hevy y Fitbod: no se pudo leer la ayuda. El detalle de compatibilidad quedó cortado.
- Retención o tracción de las apps de voz: sin datos; varias tienen pocas valoraciones, y W8Log aparece archivada desde mayo de 2026 ([búsqueda, W8Log](https://apps.apple.com/app/id6744664977), S).

## Monetización: qué limita cada plan y precios publicados

### Takeaway
El registro ilimitado gratis es hoy el suelo en las apps de seguimiento puras. Lo que se cobra es analítica, plantillas y progresión. Los límites duros en el registro (FitNotes 2 con 12 entrenos, Setgraph) son la excepción. MacroFactor y Dr. Muscle solo ofrecen prueba (Fitbod parece igual, con fuentes en conflicto), y al año cuestan entre 3 y 17 veces lo que Hevy Pro.

### Cited Findings

| App | Gratis | Se paga | Mensual | Anual | Vitalicio | Ev. |
|---|---|---|---|---|---|---|
| Hevy | Ilimitado, 4 rutinas, 7 ejercicios custom, 3 meses de estadísticas ([hv-pro], S; [hv-cmp], V). Live Activity y placas gratis ([hv-la], O; [hv-cmp], V) | Rutinas y custom ilimitados, historial total, Hevy Trainer ([hv-as], O) | $2,99 (segunda línea $3,99) | $23,99 | $74,99 | O ([hv-as]) |
| Strong | Ilimitado, 3 rutinas ([st-as], O) | Rutinas, placas, calentamiento ([st-plate], [st-warm], O); gráficas ([hv-cmp], V) | $4,99 | $29,99 | $99,99 ([hv-cmp], V) | O ([st-as]). Colombia: mes COP 13.900; año COP 69.900 a 87.900; "Forever" COP 399.900 o 499.900, sin mapa claro ([st-as]) |
| Fitbod | **Prueba** ([fb-as], O); gratis real en conflicto: 3 entrenos o 7 días ([fb-sens], T competidor) | Todo | $12,99 o $15,99 | $79,99 o $95,99 | No visto | O, sin saber cuál rige ([fb-as]) |
| Boostcamp | Tracker, RPE, descanso, PR, superseries; placas 10 usos ([bc-pro], O) | Auto Progression, gráficas por ejercicio, Muscle Tracker, placas ilimitadas ([bc-pro], O) | $14,99 | $59,99 | No, según su web ([V](https://boostcamp.app/vs/strong)) | O ([bc-pro]) |
| JEFIT | Rutinas, 1.400+ ejercicios, registro, comunidad ([jf-el], O) | Planes, analítica, Adaptive AI, "unlimited watch workouts" ([jf-el], [jf-as], O) | $12,99 | $69,99 | No visto | O |
| Liftosaur | Registro, historial, importar y exportar, 61 programas ([lf-sens], T) | Placas, gráficas, vistas de músculo, notificaciones, Watch, API/MCP ([lf-sens], T) | $4,99 | $39,99 | $99,99 | O precios ([lf-as]); reparto T |
| Alpha | Registro ilimitado, planes manuales, 795 ejercicios, descanso, récords, CSV, sin anuncios ([ap-guide], O) | Generador, recomendaciones, gráficas, gimnasios, RIR, periodización, placas y calentamiento ([ap-guide], O) | $12,99 | $79,99 (14 días, solo anual) | No visto | O, septiembre de 2026 ([ap-guide], [ap-as]) |
| Setgraph | Sin especificar ([sg-as], O) | "Unlimited access" ([sg-as], O) | $4,99 | $29,99 (etiquetado "Pro Membership"; sin confirmar que sea anual) | $199,99 | O |
| FitNotes 2 | **Todo, con 12 entrenos guardados** ([fn-as], O) | Quitar tope ([fn-as], O) | "Unlimited Use" $1,99 | $14,99 | $44,99 | O, inferido el mapeo por importe |
| RepCount | Ilimitado, last-time por serie ([rc-as], O) | e1RM, gráficas, PR, superseries, drop, CSV ([rc-as], O) | $4,99 o $6,99 | $29,99 o $39,99 | No visto | O, sin etiquetar; mapeo inferido |
| MacroFactor Workouts | Prueba de 7 días ([mf-web], O) | Todo | $11,99 | $71,99 ($47,99 semestral) | No visto | O. Paquete con nutrición $89,99/año desde enero de 2026 ([mf-sub], S) |
| Dr. Muscle | Prueba sin pago ([dm-as], O) | Todo | $49,99 (descripción: $48,99) | $399,99 | No visto | O |
| GymBook | Algunas funciones ([gb-as], O) | Pro ([gb-as], O) | $1,99 | $8,99 | $22,99 (NZ: Platinum $14,99) | O |
| Lyfta | Rutinas ilimitadas, sin anuncios ([ly-as], O) | Insights, histórico completo, programas expertos ([ly-as], O) | Diez precios sin etiquetar, $6,99 a $79,99 ([ly-as], O) | | | O, sin mapa |

- Hevy conserva las rutinas excedentes al degradar el plan ([hv-down], S). Boostcamp mantiene los datos ([bc-pro], O). Alpha conserva gimnasios extra, pero solo deja usar el activo ([ap-guide], O).
- JEFIT tiene precios heredados de $6,99 y $39,99 ([registro de IAP](https://www.apppricinglab.com/iap/apple/449810000), T). Los comparadores que dan $6,99 están desactualizados.

### Inferences
- Dentro de lo verificado, Hevy es la más barata entre las grandes de suscripción, y GymBook y FitNotes 2 son las más baratas en absoluto.
- Para Colombia el dato importante es que el precio en COP ya existe en App Store para Strong (mes aprox. COP 13.900). Sirve como referencia inicial de precio local, pero solo vi esa tienda.
- Cobrar por el registro no parece viable: casi todos lo dan gratis. El espacio para cobrar está en progresión, analítica y coach. Coincide con la monetización mixta del proyecto.

### Gaps
- Google Play no se pudo leer. Los precios de Android podrían variar.
- Reparto exacto de Liftosaur solo por reseña de un competidor (SensAI, que no pude abrir, solo su resumen).
- Precio vigente de Fitbod: la ficha lista ambos importes, sin indicar cuál corresponde a usuarios nuevos.

## Qué distingue a cada app y dónde nadie lo hace bien

### Takeaway
Cada líder gana por un ángulo específico y deja huecos fuera de él. Los huecos más sólidos son: identidad de ejercicio y lados y cargas (mancuernas, izq./der.), recuperación y sincronización demostrables, Wear OS y Android de primera clase, importación tolerante a idioma, y progresión explicable con vía simple.

### Cited Findings

| App | Distintivo más claro | Debilidad documentada |
|---|---|---|
| Hevy | Precio bajo, social, Wear OS, Live Activity con marcado de series gratis ([hv-la], O; [hv-as], O) | Solo importa Strong, en inglés y kg ([hv-imp], S); quejas de unilaterales ([hv-reddit], T) |
| Strong | Simplicidad, Watch sin iPhone, tags con exclusión clara ([st-as], [st-tags], O) | Placas y calentamiento de pago, 3 rutinas, sin Wear OS ([st-plate], O; [hv-cmp], V). Reseñas Colombia: diseño viejo, botones pequeños, malas traducciones al español ([st-as], T) |
| Fitbod | Generador con recuperación y variedad de campos en Watch ([fb-int], S) | Watch dependiente del iPhone, temporizador frágil ([fb-int], S) |
| Boostcamp | Biblioteca de programas, fraccional ([bc-mus], [bc-pro], O) | Fragmentación de límites por usos (10), Watch contradictorio ([bc-hevy], [bc-feat], O) |
| JEFIT | Analítica, 1.400+ con vídeo, cadenas de intervalos ([jf-as], O) | Reseñas de errores en Watch y rutinas ([jf-as], T) |
| Liftosaur | Lenguaje programable, API y MCP ([lf-docs], O; [lf-sens], T) | Curva de aprendizaje (inferencia) |
| Alpha Progression | Registro centrado en el ejercicio actual, incrementos por gimnasio, overrides por equipo ([ap-guide], O) | Sin Watch ni Wear OS, sin importación ([ap-guide], O) |
| MacroFactor Workouts | L/R, myo como grupo, perfiles, Fix, Plate Stack AI ([mf-lr], [mf-types], [mf-sp], [mf-ar], O) | Sin importar historial, sin plan gratis, Watch en beta ([mf-web], [mf-ar], O) |
| Setgraph | Velocidad como argumento (sin prueba independiente), replicar con gesto, historial filtrable ([sg-as], O) | Tope gratis opaco ([sg-as], O) |
| FitNotes 2 | Importador más amplio, sin cuenta, gimnasios en placas ([fn-as], O) | 12 entrenos gratis, duración inflada al reanudar ([fn-as], O, T) |
| RepCount | Tipos por reloj (reps en tiempo, cargas) ([rc-as], O) | Superseries y drop de pago, sin Watch ([rc-as], O) |
| Dr. Muscle | Motor por serie, rest-pause ([dm-as], O) | El más caro; Watch sin confirmar ([dm-as], [dm-w], O) |
| GymBook | Opción vitalicia barata ($22,99) y exportación XML ([gb-as], O); las reseñas valoran que no tenga red social ([gb-as], T) | Usuarios piden superseries y drop ([gb-as], T); solo iOS en lo visto |
| Lyfta | Importa de seis apps, 5.000+ ejercicios, Wear OS y web ([ly-ai], O) | Precios opacos en tienda ([ly-as], O) |

**Otras apps de interés en 2026, sin análisis profundo:** RIRLift, comparada con Hevy para Apple Watch ([gainframe](https://gainframe.app/blog/rirlift-vs-hevy/), T); Symmetry, que según Hevy importa de más apps ([hevy](https://www.hevyapp.com/compare/symmetry/), V); Caliber ([jefit](https://www.jefit.com/blog/jefit-vs-caliber), V); Gravl y SensAI como rivales de Fitbod ([sensai](https://www.sensai.fit/blog/gravl-vs-fitbod-2026), T); y las de voz citadas antes. Para ninguna se verificó el flujo de registro.

### Inferences
Ordenado de más a menos sólido según la evidencia, con la advertencia de que "nadie documenta" no equivale a "nadie lo hace":

1. **Mancuernas, unilateral y peso total frente a por lado.** Solo MacroFactor documenta L/R, y ni siquiera aclara el efecto sobre el volumen. Evidencia media: documentación más quejas de usuarios.
2. **Confianza de los datos.** Nadie documenta recuperación tras fallo ni conflictos; hay reseñas y artículos de duplicados. Evidencia media por silencio, y hay que comprobarlo en dispositivo.
3. **Android y Wear OS de primera.** Pocas apps tienen Wear OS, Alpha y Strong no; casi nadie documenta bien el temporizador en Android. Evidencia media.
4. **Importación tolerante a idioma.** Exigencia de inglés y kg en Hevy. Evidencia alta en lo que respecta a Hevy, y relevante en Colombia.
5. **Progresión explicable y corregible.** Combinar taxonomía `lp`/`dp`/`sum`, autoregulación y "Fix". Nadie la junta. Evidencia alta en lo documentado, inferencia sobre valor.
6. **Conteo fraccional abierto y gratis, con matriz editable.** Boostcamp lo cobra; otras no lo documentan. Evidencia media.
7. **Modelo de serie agrupada para drop y myo.** MacroFactor lo tiene y casi nadie más. Evidencia media.
8. **Tempo estructurado.** No aparece, pero la demanda tampoco está demostrada. Evidencia baja, y no lo priorizaría.
9. **Deshacer explícito.** No documentado en ninguna. Evidencia baja, requiere comprobar en dispositivo.

La base mínima para igualar: una fila por serie con anterior en línea; casilla con autoarranque de descanso; calentamiento, normal, fallo y drop; superseries; descanso por ejercicio y Live Activity con notificación fiable; placas y calentamiento con perfil de equipo; e1RM y PR; edición de pasados; CSV de entrada y salida; offline; Salud y Health Connect; y Apple Watch.

### Gaps
- Todo lo anterior necesita verificación manual con dispositivo: conteo de toques, deshacer, steppers, cierre forzado en plena serie y sincronización con dos dispositivos sin red.
- **No se pudieron abrir** los centros de ayuda de Hevy y Fitbod (403), Google Play de FitNotes (página vacía), `sensai.fit` y `deepwiki.com`. Lo que viene de esas fuentes es resumen de búsqueda.
- **FitNotes original de Android:** no verificado. Las notas de FitNotes cubren FitNotes 2 (iOS, Ginger Technologies), que importa la base de datos del original ([fn-as], O).
- **Android en general:** casi toda la verificación es de App Store. Paridad y precios en Android quedan sin confirmar.
- Un corte del 5 de noviembre de 2026 no garantiza vigencia: Hevy, Strong, Setgraph y JEFIT publicaron versiones en las últimas semanas.
