/**
 * Cómo usar cada máquina: indicaciones generales de ajuste y ejecución, con los
 * errores más comunes. Las redactó el equipo a partir de guías de uso habituales;
 * falta la revisión de un entrenador certificado antes de abrir a usuarios reales.
 * Cada máquina es distinta: lo primero es la placa de instrucciones que traiga.
 */
export type MachineGuide = { cues: string[]; mistakes: string[] };

const PRESS_SEAT = "Ajusta el asiento para que las manijas queden a la altura del pecho medio";

export const MACHINE_GUIDES: Record<string, MachineGuide> = {
  "sentadilla-hack": {
    cues: ["Apoya espalda y cadera contra el respaldo", "Coloca los pies a lo ancho de los hombros, en el centro de la plataforma", "Baja hasta donde mantengas la cadera pegada y sube empujando con todo el pie"],
    mistakes: ["Levantar los talones", "Dejar que las rodillas se vayan hacia adentro"],
  },
  "sentadilla-smith": {
    cues: ["Ajusta los topes de seguridad antes de empezar", "Coloca los pies un poco adelante de la barra", "Desbloquea la barra girándola y vuelve a bloquearla al terminar"],
    mistakes: ["No revisar los topes de seguridad", "Soltar la barra sin engancharla"],
  },
  "prensa-piernas": {
    cues: ["Apoya toda la espalda y la cadera en el respaldo", "Coloca los pies a lo ancho de los hombros", "Quita los seguros antes de bajar y ponlos al terminar"],
    mistakes: ["Despegar la cadera del asiento al bajar", "Bloquear las rodillas arriba"],
  },
  "extension-cuadriceps": {
    cues: ["Ajusta el respaldo para que la rodilla quede alineada con el eje de la máquina", "Coloca el rodillo sobre el tobillo, no sobre el pie", "Sube sin impulso y baja despacio"],
    mistakes: ["Lanzar el peso con impulso", "Levantar la cadera del asiento"],
  },
  "hip-thrust-maquina": {
    cues: ["Coloca el cinturón o la almohadilla sobre la cadera", "Ubica los pies para que la rodilla forme un ángulo cercano a 90 grados arriba", "Sube apretando glúteos y sin arquear la espalda baja"],
    mistakes: ["Arquear la espalda baja en lugar de extender la cadera", "Empujar con la punta de los pies"],
  },
  "curl-femoral-acostado": {
    cues: ["Alinea la rodilla con el eje de la máquina", "Ajusta el rodillo justo encima de los talones", "Mantén la cadera apoyada y baja despacio"],
    mistakes: ["Levantar la cadera al subir", "Soltar el peso de golpe al bajar"],
  },
  "curl-femoral-sentado": {
    cues: ["Alinea la rodilla con el eje de la máquina", "Baja el rodillo superior hasta que sujete los muslos", "Coloca el rodillo inferior detrás de los tobillos"],
    mistakes: ["Dejar flojo el rodillo de los muslos", "Separar la espalda del respaldo"],
  },
  "patada-gluteo-polea": {
    cues: ["Coloca la tobillera en la polea baja", "Apóyate en la máquina con el tronco un poco inclinado", "Lleva la pierna hacia atrás sin girar la cadera"],
    mistakes: ["Arquear la espalda baja", "Balancearse para mover más peso"],
  },
  "patada-gluteo-maquina": {
    cues: ["Ajusta la máquina para que la cadera quede alineada con el eje", "Apoya bien el tronco o los antebrazos", "Empuja hacia atrás con el talón y regresa despacio"],
    mistakes: ["Arquear la espalda baja", "Girar la cadera para llegar más lejos"],
  },
  "abduccion-maquina": {
    cues: ["Selecciona el rango inicial en un punto cómodo", "Coloca las almohadillas por fuera de las rodillas", "Abre sin impulso y cierra despacio"],
    mistakes: ["Empezar con demasiada apertura", "Soltar el peso al volver"],
  },
  "aduccion-maquina": {
    cues: ["Empieza con una apertura pequeña y auméntala con el tiempo", "Coloca las almohadillas por dentro de las rodillas", "Cierra sin impulso y abre despacio"],
    mistakes: ["Forzar la apertura desde la primera serie", "Inclinarse hacia adelante para cerrar"],
  },
  "pantorrilla-de-pie": {
    cues: ["Apoya la parte delantera del pie en el escalón", "Ajusta las hombreras para que las rodillas queden casi rectas", "Sube del todo, haz una pausa y baja despacio"],
    mistakes: ["Rebotar abajo", "Doblar las rodillas para ayudarte"],
  },
  "pantorrilla-sentado": {
    cues: ["Coloca la almohadilla sobre la parte baja de los muslos", "Apoya la parte delantera del pie", "Suelta el seguro, sube del todo y baja despacio"],
    mistakes: ["Rebotar abajo", "Olvidar poner el seguro al terminar"],
  },
  "press-pecho-maquina": {
    cues: [PRESS_SEAT, "Apoya espalda y cadera en el respaldo", "Empuja al frente sin encoger los hombros y regresa despacio"],
    mistakes: ["Encoger los hombros hacia las orejas", "Despegar la espalda del respaldo"],
  },
  "press-inclinado-maquina": {
    cues: ["Ajusta el asiento para que las manijas salgan a la altura de la parte alta del pecho", "Apoya espalda y cadera en el respaldo", "Empuja sin encoger los hombros y regresa despacio"],
    mistakes: ["Encoger los hombros", "Arquear mucho la espalda baja"],
  },
  "press-declinado-maquina": {
    cues: ["Ajusta el asiento para que las manijas queden a la altura de la parte baja del pecho", "Apoya bien la espalda", "Empuja sin bloquear los codos de golpe"],
    mistakes: ["Rebotar al final del recorrido", "Despegar la espalda"],
  },
  "press-banca-smith": {
    cues: ["Ajusta los topes para que atajen la barra por encima del pecho", "Ubica el banco para que la barra baje a la altura del pecho medio", "Desbloquea girando la barra y vuelve a bloquearla al terminar"],
    mistakes: ["No revisar los topes de seguridad", "Hacer rebotar la barra en el pecho"],
  },
  "pec-deck": {
    cues: ["Ajusta el asiento para que los brazos queden a la altura del pecho", "Ajusta el inicio para no sentir un estiramiento forzado", "Junta los brazos al frente y regresa despacio"],
    mistakes: ["Abrir más de lo cómodo para el hombro", "Separar la espalda del respaldo"],
  },
  "pajaros-maquina": {
    cues: ["Siéntate mirando hacia el respaldo, con el pecho apoyado", "Ajusta los brazos para empezar con ellos al frente", "Abre hacia atrás con los codos un poco doblados y regresa despacio"],
    mistakes: ["Despegar el pecho de la almohadilla", "Usar impulso del tronco"],
  },
  "cruce-poleas": {
    cues: ["Coloca las poleas a la altura que pida el ejercicio", "Da un paso al frente para mantener tensión", "Junta las manos delante del pecho con los codos un poco doblados"],
    mistakes: ["Convertirlo en un press doblando mucho los codos", "Dejar que el peso te lleve los brazos hacia atrás"],
  },
  "press-hombro-maquina": {
    cues: ["Ajusta el asiento para que las manijas queden a la altura de los hombros", "Apoya bien la espalda", "Empuja hacia arriba sin encoger los hombros y baja despacio"],
    mistakes: ["Arquear la espalda baja", "Bloquear los codos de golpe"],
  },
  "elevacion-lateral-maquina": {
    cues: ["Ajusta el asiento para que el hombro quede alineado con el eje", "Apoya los brazos en las almohadillas", "Sube hasta la altura de los hombros y baja despacio"],
    mistakes: ["Encoger los hombros al subir", "Usar impulso"],
  },
  "elevaciones-laterales-polea": {
    cues: ["Coloca la polea abajo", "Párate de lado, con la polea cruzando por delante del cuerpo", "Sube hasta la altura del hombro y baja despacio"],
    mistakes: ["Balancear el tronco", "Subir más arriba de los hombros con impulso"],
  },
  "face-pull": {
    cues: ["Coloca la polea a la altura de la cara con la cuerda", "Tira hacia la frente separando las manos", "Mantén los codos altos y regresa despacio"],
    mistakes: ["Inclinarse hacia atrás", "Bajar los codos y convertirlo en un remo"],
  },
  "dominadas-asistidas": {
    cues: ["Más peso significa más ayuda: empieza con bastante", "Sube a la plataforma con cuidado y agarra las barras", "Tira hasta acercar el pecho a las manos y baja despacio"],
    mistakes: ["Bajarte de la plataforma de golpe", "Encoger los hombros abajo"],
  },
  "jalon-pecho": {
    cues: ["Ajusta el sujetador para que los muslos queden firmes", "Agarra la barra un poco más ancho que los hombros", "Baja la barra al pecho, con el pecho alto y sin balancearte"],
    mistakes: ["Llevar la barra detrás de la nuca", "Inclinarse mucho hacia atrás con impulso"],
  },
  "jalon-agarre-estrecho": {
    cues: ["Ajusta el sujetador de los muslos", "Usa el agarre estrecho con las palmas enfrentadas", "Lleva el agarre al pecho y sube despacio"],
    mistakes: ["Balancear el tronco", "Soltar el peso de golpe arriba"],
  },
  "pullover-polea": {
    cues: ["Coloca la polea alta con barra o cuerda", "Inclínate un poco con los brazos casi rectos", "Baja el agarre hasta los muslos sin doblar los codos"],
    mistakes: ["Doblar los codos y convertirlo en un empuje de tríceps", "Arquear la espalda baja"],
  },
  "remo-polea-baja": {
    cues: ["Apoya los pies y dobla un poco las rodillas", "Siéntate erguido y tira del agarre hacia el abdomen", "Junta los omóplatos y regresa despacio"],
    mistakes: ["Balancear el tronco", "Redondear la espalda al regresar"],
  },
  "remo-maquina": {
    cues: ["Ajusta el asiento para que las manijas queden a la altura del pecho bajo", "Apoya el pecho en la almohadilla si la tiene", "Tira con los codos hacia atrás y regresa despacio"],
    mistakes: ["Despegar el pecho de la almohadilla", "Encoger los hombros"],
  },
  "remo-alto-maquina": {
    cues: ["Ajusta el asiento y el sujetador si lo tiene", "Agarra las manijas altas", "Tira hacia abajo y atrás con los codos y regresa despacio"],
    mistakes: ["Usar impulso del tronco", "Encoger los hombros"],
  },
  "remo-t": {
    cues: ["Apoya el pecho si la máquina lo permite", "Mantén la espalda recta y las rodillas un poco dobladas", "Tira hacia el abdomen y baja despacio"],
    mistakes: ["Redondear la espalda", "Levantar el tronco con impulso"],
  },
  "curl-predicador": {
    cues: ["Ajusta el asiento para que las axilas queden sobre el borde de la almohadilla", "Apoya los brazos por completo", "Sube sin levantar los codos y baja despacio"],
    mistakes: ["Soltar el peso abajo, con el codo totalmente recto y de golpe", "Levantar los codos de la almohadilla"],
  },
  "curl-biceps-maquina": {
    cues: ["Ajusta el asiento para que el codo quede alineado con el eje", "Apoya los brazos en la almohadilla", "Sube sin impulso y baja despacio"],
    mistakes: ["Levantar los codos", "Echar el tronco hacia atrás"],
  },
  "curl-polea": {
    cues: ["Coloca la polea abajo con barra o cuerda", "Mantén los codos pegados al cuerpo", "Sube sin balancearte y baja despacio"],
    mistakes: ["Balancear el tronco", "Adelantar los codos"],
  },
  "extension-triceps-polea": {
    cues: ["Coloca la polea alta con barra o cuerda", "Mantén los codos pegados al cuerpo", "Extiende hacia abajo y sube despacio"],
    mistakes: ["Separar los codos del cuerpo", "Echar el peso del cuerpo encima"],
  },
  "extension-triceps-tras-nuca": {
    cues: ["Coloca la polea baja si la usas", "Mantén los codos apuntando hacia arriba", "Extiende los brazos y baja despacio"],
    mistakes: ["Abrir los codos hacia los lados", "Arquear la espalda baja"],
  },
  "extension-triceps-maquina": {
    cues: ["Ajusta el asiento para que el codo quede alineado con el eje", "Apoya los brazos en las almohadillas", "Extiende sin impulso y regresa despacio"],
    mistakes: ["Levantar los hombros", "Separar la espalda del respaldo"],
  },
  "fondos-maquina": {
    cues: ["Ajusta el asiento para empezar con los codos a unos 90 grados", "Mantén los codos cerca del cuerpo", "Empuja hacia abajo y regresa despacio"],
    mistakes: ["Encoger los hombros", "Inclinarse mucho hacia adelante"],
  },
  "crunch-polea": {
    cues: ["Coloca la polea alta con cuerda", "Arrodíllate y sostén la cuerda junto a la cabeza", "Dobla el tronco acercando las costillas a la cadera"],
    mistakes: ["Tirar con los brazos", "Doblar solo desde la cadera"],
  },
  "crunch-maquina": {
    cues: ["Ajusta el asiento según la placa de la máquina", "Sujeta los agarres sin tirar con los brazos", "Acerca las costillas a la cadera y regresa despacio"],
    mistakes: ["Tirar con los brazos o el cuello", "Usar impulso"],
  },
  "giro-torso-maquina": {
    cues: ["Selecciona un rango de giro corto al inicio", "Apoya bien la espalda y sujeta las rodillas o el tronco según la máquina", "Gira despacio, sin impulso"],
    mistakes: ["Girar con impulso", "Usar un rango mayor al cómodo"],
  },
  "extension-espalda-maquina": {
    cues: ["Ajusta el respaldo para que la cadera quede alineada con el eje", "Sujeta el cinturón si la máquina lo trae", "Extiende hasta quedar recto, sin pasarte, y regresa despacio"],
    mistakes: ["Arquear de más al final", "Usar impulso"],
  },
  "pallof-press": {
    cues: ["Coloca la polea a la altura del pecho y párate de lado", "Sostén el agarre contra el pecho", "Extiende los brazos al frente sin dejar que te gire"],
    mistakes: ["Girar el tronco hacia la polea", "Estar demasiado cerca de la máquina"],
  },
  "sentadilla-pendulo": {
    cues: ["Apoya espalda y hombros en las almohadillas", "Coloca los pies en el centro de la plataforma", "Quita el seguro, baja controlando y sube empujando con todo el pie"],
    mistakes: ["Levantar los talones", "Olvidar poner el seguro al terminar"],
  },
  "sentadilla-palanca": {
    cues: ["Apoya los hombros en las almohadillas", "Coloca los pies a lo ancho de los hombros", "Baja controlando y sube empujando con todo el pie"],
    mistakes: ["Levantar los talones", "Dejar que las rodillas se vayan hacia adentro"],
  },
  "sentadilla-cinturon": {
    cues: ["Ajusta el cinturón a la cadera, no a la cintura", "Sube a la plataforma y quita el seguro", "Baja con el tronco erguido y sube empujando con todo el pie"],
    mistakes: ["Redondear la espalda abajo", "Dejar el cinturón flojo"],
  },
  "curl-femoral-de-pie": {
    cues: ["Alinea la rodilla con el eje de la máquina", "Apoya bien el muslo o la rodilla según el modelo", "Dobla la rodilla sin mover la cadera y baja despacio"],
    mistakes: ["Mover la cadera para ayudarte", "Soltar el peso de golpe"],
  },
  caminadora: {
    cues: ["Súbete a los lados de la banda y arranca a poca velocidad", "Engancha el cordón de seguridad si la máquina lo trae", "Sube la velocidad poco a poco"],
    mistakes: ["Sostenerse de las manijas todo el tiempo", "Subir sobre la banda ya en movimiento"],
  },
  "bicicleta-estatica": {
    cues: ["Ajusta el sillín a la altura de la cadera, de pie junto a la bici", "Con el pedal abajo, la rodilla debe quedar un poco doblada", "Empieza con poca resistencia"],
    mistakes: ["Sillín demasiado bajo", "Rebotar en el sillín"],
  },
  eliptica: {
    cues: ["Sube con la máquina quieta y agárrate de las manijas fijas", "Apoya todo el pie en los pedales", "Empieza con poca resistencia"],
    mistakes: ["Apoyarse del todo en las manijas", "Ir en puntas de pie"],
  },
  "remo-ergometro": {
    cues: ["Ajusta las correas sobre la parte ancha del pie", "Empuja primero con las piernas, después inclina el tronco y al final tira con los brazos", "Regresa en el orden contrario"],
    mistakes: ["Tirar con los brazos antes de empujar", "Redondear la espalda"],
  },
  escaladora: {
    cues: ["Sube con la máquina quieta y agárrate de las manijas", "Apoya todo el pie en cada escalón", "Empieza a poca velocidad"],
    mistakes: ["Apoyar todo el peso en las manijas", "Ir en puntas de pie"],
  },
  "esqui-ergometro": {
    cues: ["Párate con los pies a lo ancho de la cadera", "Tira con el tronco y los brazos hacia abajo, doblando un poco las rodillas", "Regresa arriba estirando el cuerpo"],
    mistakes: ["Tirar solo con los brazos", "Redondear la espalda"],
  },
};
