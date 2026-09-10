# Hito 0 — alcance, reglas e inventario

Estado: **iniciado; pendiente de validación funcional y acceso a datos**.

Fecha de inicio: 2026-09-10. Código de referencia: [`406ad535cbf94ffab7b222b95f7223fb0b9293ca`](https://github.com/servicios-goethe/fieldstat/tree/406ad535cbf94ffab7b222b95f7223fb0b9293ca). Plan general: [plan de producción](PLAN_PRODUCCION_FIELDSTATS.md).

El MVP está aprobado según el responsable del proyecto. Este hito fija qué comportamiento se conserva, qué correcciones necesita producción y qué información falta para construir el esquema definitivo. No reabre la aprobación del producto.

## Entregables y estado

| Entregable | Estado | Evidencia / condición pendiente |
|---|---|---|
| Matriz de paridad | Preparada desde código | Revisar contra la versión desplegada y confirmar alcance de extras. |
| Catálogo de reglas | Preparado; conflicto de categorías reproducido | Referente deportivo confirma resultados esperados. |
| Inventario técnico de hojas | Preparado | Cabeceras, volúmenes y calidad reales no observados. |
| Evaluación de calidad | Pendiente | Requiere copia de las hojas o acceso de lectura. |
| Responsables y capacidad | Pendiente | Asignar validación deportiva, custodia de datos y operación. |
| Acta de cierre | Pendiente | Resolver decisiones y adjuntar resultados del inventario real. |

## 1. Matriz de paridad

“Presente” significa localizado en el código, no validado en un despliegue. “Base” conserva el flujo aprobado; “corrección” establece una condición técnica de producción; “a decidir” no debe interpretarse como excluido ni comprometido.

| ID | Función | Evidencia en el MVP | Primera producción propuesta | Criterio de aceptación |
|---|---|---|---|---|
| F01 | Login de profesor y jugador | `verificarLogin`, `login` | Base + reemplazo por Auth | Identidad verificada, sesión expirable y cierre real; sin credencial fija. |
| F02 | Activación de alumno | `registrarCuentaJugador` | Base con invitación individual | Solo titular habilita su cuenta; ficha deportiva independiente del login. |
| F03 | Registro externo/padres | `registrarExterno`; `screen-externo` es placeholder | A decidir: portal familiar | No publicar un botón que solo diga “en desarrollo”; vínculo con hijo verificado si se habilita. |
| F04 | Alta de jugador multideporte | `registrarJugadorBackend` | Base | Alta íntegra o rechazo íntegro; jugador único y varias inscripciones. |
| F05 | Editar y dar de baja jugador | No se localizaron operaciones de edición/baja | Corrección operativa propuesta | Corregir datos y desactivar inscripción preservando historial y auditoría. |
| F06 | Categoría y camiseta | `calcularCategoria`, validación al registrar | Base con regla corregida | Categoría por temporada; casos C01–C07; unicidad de camiseta según R04. |
| F07 | Tomar asistencia | `guardarAsistenciaBD`, `iniciarTomaAsistencia` | Base | Guardado por sesión; reintento no duplica; alumno sin cuenta puede figurar. |
| F08 | Crear partidos por categoría | `crearPartidosBD` | Base | IDs distintos para dos encuentros del mismo día; local/visitante correctos. |
| F09 | Convocar y marcar titular | `guardarConvocatoriaBD` | Base | Solo docentes habilitados; titular pertenece a convocatoria vigente. |
| F10 | Responder convocatoria | `obtenerMisConvocatorias`, `responderConvocatoria` | Base | Alumno responde la propia; pendiente/aceptada/rechazada diferenciadas. |
| F11 | Consultar confirmaciones | Segunda definición de `obtenerJugadoresParaConvocatoria` | Base | Docente ve respuestas actuales sin confundirlas con asistencia real. |
| F12 | Registrar goles/asistencias/resultado | `guardarPartidoFinalizadoBD` | Base + cierre transaccional | Una operación completa; reintentos y doble clic no duplican eventos. |
| F13 | Corregir resultado finalizado | `finalizarPartido` borra y vuelve a guardar | Base + auditoría | Fallo conserva la versión anterior; corrección con motivo y control de versión. |
| F14 | Estadísticas personales | `obtenerEstadisticasJugadorCompleto` | Base con métricas corregidas | Filtros por deporte/temporada; sin datos se muestra “sin datos”, no 100%. |
| F15 | Fixture, posiciones y ranking | `obtenerPartidosDashboard`, `obtenerTablaPosiciones`, `obtenerRankingJugadores` | Base con alcance explícito | No mezclar temporadas ni presentar tabla parcial como torneo completo. |
| F16 | Recuperación y administración de accesos | No localizadas | Corrección operativa | Recuperación probada, roles gestionados por admin y permisos por ámbito. |
| F17 | Asistencia real a partido y participación | El MVP aproxima partidos jugados por convocatoria | Corrección de métrica; captura a validar | Distinguir convocado, confirmado, presente y jugó; histórico desconocido conservado. |
| F18 | Transporte y autorización familiar | Diseño SQL/propuesta; no flujo localizado | A decidir | Si se incluye: vínculo verificado, evidencia versionada y acceso privado. |
| F19 | Tarjetas, sanciones y cumplimiento | Diseño SQL/propuesta; no flujo localizado | A decidir | Reglas por deporte y alcance de suspensión, sin doble cómputo de eventos. |
| F20 | Cambios, minutos y destacado | Diseño SQL/propuesta; no flujo localizado | A decidir | Definir captura; destacado asignado por profesor según propuesta existente. |
| F21 | Boletín/exportación | Propuesta funcional; no flujo localizado | A decidir | Formato, destinatarios y datos visibles definidos antes de construir. |
| F22 | Offline completo, idiomas, múltiples colegios | Propuesta contiene ideas y supuestos | A decidir; no requisito confirmado | Definir compromiso real; dominio inicial propuesto Goethe/español. |

No se agrega un backend Express por inercia del documento anterior: Auth, RLS y RPC pueden cubrir el núcleo. El objetivo de este hito es acordar comportamiento y datos, no imponer un framework nuevo al MVP.

## 2. Registro de decisiones

| ID | Tema | Evidencia / propuesta inicial | Quién confirma | Estado |
|---|---|---|---|---|
| R01 | Primera salida | Paridad del MVP + correcciones; F18–F22 sin compromiso asumido | Responsable del proyecto | Consultado; pendiente |
| R02 | Institución y deportes | Goethe, fútbol DEP1 y handball DEP2 presentes en UI | Responsable del proyecto | Propuesta |
| R03 | Categoría | Documento usa escolaridad y corte julio; función infiere con año actual | Referente deportivo | Conflicto abierto |
| R04 | Camiseta | Actualmente única por deporte/categoría; propuesta por plantel y temporada entre activos | Referente deportivo | Pendiente |
| R05 | Torneos y puntos | Código aplica victoria 3, empate 1; sin temporada/torneo en hoja | Referente deportivo | Pendiente para cada deporte |
| R06 | Partidos jugados | Actualmente finalizados con convocatoria; propuesta participación efectiva | Referente deportivo | Pendiente de definición y captura |
| R07 | Asistencia % | Actualmente registros presentes / registros del alumno; sin filas devuelve 100% | Referente deportivo | Propuesta: sesiones elegibles no canceladas, distinguir sin registro y ausencia |
| R08 | Alta sin cuenta | El código oculta alumnos no activados del plantel | Responsable del proyecto | Propuesta: inscripción independiente de Auth |
| R09 | Confirmación | Alumno responde; no hay fecha límite explícita | Referente deportivo | Definir cierre, cambios de respuesta y quién registra presencia |
| R10 | Privacidad de reportes | Panel externo incompleto; estadísticas personales y profesor presentes | Responsable institucional | Definir datos visibles para alumno, familia y público |
| R11 | Acceso a alumnos sin email | No se verificó calidad/completitud de correos | Responsable institucional | Propuesta: ficha sin cuenta y responsable verificado si corresponde |
| R12 | Datos y calendario | Fechas heterogéneas; año actual altera cálculo de categoría | Referente deportivo + custodio de datos | Propuesta: temporada explícita; zona America/Argentina/Buenos_Aires |
| R13 | Equipo y operación | Documento menciona taller y varios roles, sin disponibilidad actual | Responsable del proyecto | Confirmar horas semanales, administrador institucional y soporte |
| R14 | Objetivos de servicio | Volumen/concurrencia/conectividad desconocidos | Responsable del proyecto | Medir antes de cerrar presupuesto y cronograma |

Registrar cada resolución con fecha, persona, decisión y evidencia. Las propuestas no son aprobaciones. No se requiere contestar todas las filas de una vez: primero R01, R03 y acceso a datos; el resto se resuelve con el referente durante H0.

## 3. Categorías: discrepancia reproducida

Se ejecutó la función original `calcularCategoria` en Node, aislada con `node:vm` y con el reloj fijado por temporada, sin acceder a servicios de Google. Las fechas de prueba se construyeron por componentes para evitar ambigüedad de parseo. Esto caracteriza el comportamiento existente, no establece la regla correcta.

| Caso | Nacimiento | Temporada | Resultado del código | Esperado en documento | Estado |
|---|---|---|---|---|---|
| C01 | 13/08/2008 | 2022 | Cadetes | Menores | Conflicto |
| C02 | 13/08/2008 | 2023 | Cadetes | Cadetes | Coincide |
| C03 | 13/08/2008 | 2024 | Juveniles | Cadetes | Conflicto |
| C04 | 13/08/2008 | 2025 y 2026 | Juveniles | Juveniles | Coincide |
| C05 | 08/03/2009 | 2022 y 2023 | Menores | Menores | Coincide |
| C06 | 08/03/2009 | 2024 y 2025 | Cadetes | Cadetes | Coincide |
| C07 | 08/03/2009 | 2026 | Juveniles | Juveniles | Coincide |

Fuente de los esperados: `Docs/Años para ver categoria.md`. No asumir que el documento está correcto: el referente debe resolver la contradicción. Añadir casos de 30 de junio/1 de julio, alumno recursante/adelantado, fecha inválida y cambio de temporada. La propuesta es guardar escolaridad/temporada o cohortes aprobadas y no recalcular el pasado con el reloj actual.

## 4. Inventario de hojas esperado desde el código

Este inventario es estructural. **Cantidad de filas, calidad y nombres reales de cabeceras siguen pendientes**. Las columnas siguientes expresan orden usado por el código; algunas cabeceras se crean explícitamente y otras se infieren de `appendRow`. No confundir una hoja vacía con una que todavía no fue inspeccionada.

| Hoja | Columnas en orden | Clave lógica esperada | Controles para el snapshot real |
|---|---|---|---|
| USUARIOS | ID_Usuario, PasswordHash, Rol, Confirmado, Activado, Email | ID_Usuario; revisar emails compartidos | Roles, cuentas huérfanas, flags, emails vacíos/duplicados. Excluir PasswordHash del material de análisis. |
| JUGADORES_GENERAL | ID/DNI, Nombre, Apellido, Email, FNac, Colegio | DNI | DNI texto, duplicados, fechas inválidas, correos ausentes, alumnos repetidos. |
| JUGADORES_DEPORTES | IDJ, ID/DNI, IDD, Categoria, NumeroCamiseta | IDJ (DNI-deporte) | FK al jugador, deportes/categorías desconocidos, camisetas repetidas. |
| PARTIDOS | IDP, Local, Visitante, Deporte, Categoria, Fecha, Hora, GolesLocal, GolesVisitante, Estado | IDP | IDs repetidos, fechas ambiguas, marcador inválido, nombres de rivales inconsistentes. |
| CONVOCATORIAS | IDP, ID_Jugador, Convocado, Titular, Confirmado | IDP + ID_Jugador | FK a partido/jugador; duplicados; titular sin convocatoria; respuesta a no convocado. |
| ESTADISTICAS_PARTIDOS | IDP, ID_Goleador, ID_Asistidor | No hay ID de evento; preservar fila de origen | FK; goleador/asistidor; conciliación de goles; no deduplicar filas iguales automáticamente. |
| Asistencia | Fecha, IDD, ID_Jugador, Nombre, Asistió | Fecha + IDD + ID_Jugador en MVP | Fechas, duplicados, FK, normalización de sí/no; no hay hora/categoría/sesión explícitas. |
| DEPORTES | IDD, Nombre, Temporada según DATABASE_SCHEMA.md | IDD, a revisar | Existe en documentación, pero no se encontró lectura desde code.gs; comprobar existencia real. |

También listar hojas adicionales aunque no aparezcan en código. El esquema propuesto en `DATABASE_SCHEMA.md` difiere de las escrituras actuales: estadísticas no son columnas agregadas Goles/Asistencias; convocatorias usan DNI en segunda columna; asistencia se llama `Asistencia`. La copia desplegada podría haber evolucionado; verificar versión antes de diseñar el importador.

### Procedimiento de relevamiento

1. Custodio genera copia fechada y de solo lectura; registra fecha/hora/zona, hojas incluidas y versión desplegada de Apps Script. No modificar el MVP operativo.
2. Mantener datos personales fuera de Git. Para revisión inicial sirven cabeceras, conteos y muestra anonimizada consistente entre hojas. Los valores originales para migración se custodian aparte.
3. Registrar por hoja: total de filas sin cabecera, filas vacías, claves distintas, claves repetidas, referencias huérfanas, fechas inválidas y rango temporal. No exportar contraseñas ni hashes.
4. Normalizar en una copia de trabajo: DNI como texto, `Si`/`Sí`/`No`/vacío por semántica, fechas con formato explícito. Conservar original y número de fila para resolver excepciones.
5. Distinguir duplicado técnico de evento legítimo. Dos goles con igual goleador/asistidor pueden ser correctos; dos partidos con igual ID necesitan resolución humana si sus referencias son ambiguas.
6. Comparar resultados por partido con goles cargados de Goethe; no exigir eventos de goles rivales que el MVP nunca capturó. Registrar diferencia y explicación por partido.
7. Confirmar el alcance temporal a migrar, qué cuenta como dato de prueba y qué excepciones se aceptan. No descartar datos sin criterio documentado.
8. Completar el [registro de inventario](H0_INVENTARIO.csv) con valores reales y adjuntar un informe agregado sin identificadores personales.

`PENDIENTE` en el CSV no equivale a cero; `NO_APLICA` requiere explicación. En Git solo se guardan conteos y notas sin DNI, nombres, correos ni enlaces privados a exportaciones.

## 5. Recorridos de validación con el referente

Ejecutar en copia del MVP desplegado o entorno de pruebas; registrar resultado observado y esperado. No cargar datos de prueba en la planilla operativa.

| ID | Recorrido | Qué confirmar |
|---|---|---|
| V01 | Alta de alumno con fútbol y handball | Datos mínimos, categoría, camiseta y comportamiento antes de activar cuenta. |
| V02 | Tomar lista de entrenamiento | Categorías que comparten sesión; corregir asistencia; sesión cancelada; falta de conexión. |
| V03 | Crear dos partidos el mismo día | Categoría, rival, localía y manejo de IDs; confirmar amistosos y torneos. |
| V04 | Convocar → responder → consultar | Quién responde; fecha límite; cambios; diferencia entre confirmar y asistir. |
| V05 | Cargar resultado y corregirlo | Goles propios/rivales, asistencia opcional, errores, responsabilidad de corregir. |
| V06 | Ver estadísticas de temporada | Participación real, denominadores, tabla parcial y resultados sin datos. |
| V07 | Acceder como alumno/profesor/externo | Visibilidad deseada y permisos; no tomar el placeholder externo como módulo completo. |
| V08 | Cerrar sesión y recuperar acceso | Operación esperada para alumnos sin correo y administración de docentes. |

## 6. Criterios de cierre del hito

- [x] Repositorio y commit de referencia identificados.
- [x] Matriz de funciones y evidencia del código preparada.
- [x] Inventario estructural preparado.
- [x] Discrepancia de categorías reproducida y registrada.
- [ ] Alcance de F01–F22 resuelto: incluido, fase posterior o fuera de alcance, con responsable y fecha.
- [ ] Referente deportivo designado; R03–R09 resueltas con ejemplos verificables.
- [ ] Copia/lectura de datos disponible y versión desplegada contrastada con repositorio.
- [ ] Inventario real completado; anomalías cuantificadas y criterio de resolución acordado.
- [ ] Roles, privacidad y alumnos sin email definidos (R10–R11).
- [ ] Responsables, disponibilidad del equipo y objetivos operativos documentados.
- [ ] Acta breve de cierre con pendientes no bloqueantes y alcance entregado a H1.

Próxima acción dependiente de información: validar alcance y casos C01/C03 con el referente, y completar conteos desde una copia real. Mientras tanto, esta documentación permite preparar contratos y revisión del modelo, sin fijar en SQL reglas todavía contradictorias.
