# Hito 0 — alcance, reglas e inventario

Estado: **iniciado; pendiente de validación funcional; referencia de planilla verificada**.

Actualización 2026-09-17, rama `joaco`: preparada la [especificación funcional para primera producción](H0_ESPECIFICACION_FUNCIONAL.md), con permisos por rol, estados de entrenamiento/partido, métricas, procedimiento de alta inicial y 32 escenarios de aceptación. Incorpora las decisiones de SSO, administrador principal y configuradores recibidas el 2026-09-17; los detalles restantes se distinguen como propuestas. No describe comportamiento ya implementado.

Fecha de inicio: 2026-09-10. Código de referencia: [`406ad535cbf94ffab7b222b95f7223fb0b9293ca`](https://github.com/servicios-goethe/fieldstat/tree/406ad535cbf94ffab7b222b95f7223fb0b9293ca). Plan general: [plan de producción](PLAN_PRODUCCION_FIELDSTATS.md).

El MVP está aprobado según el responsable del proyecto. Este hito fija qué comportamiento se conserva, qué correcciones necesita producción y qué información falta para construir el esquema definitivo. No reabre la aprobación del producto.

Decisión del responsable, 2026-09-10: **arrancar producción desde cero; no importar datos ni cuentas del MVP**. La planilla compartida se revisó como referencia de estructura. Esta decisión elimina el inventario de calidad y la conciliación histórica como requisitos de cierre; no resuelve por sí sola las reglas deportivas ni el alcance de módulos.

## Entregables y estado

| Entregable | Estado | Evidencia / condición pendiente |
|---|---|---|
| Matriz de paridad | Preparada desde código y diseño SQL | Conservar las 19 entidades como base; ver mapa de ajustes y completar detalle operativo. |
| Catálogo de reglas | Categorías iniciales y configurador confirmados | Regla automática no confirmada; propuesta de asignación manual hasta validarla. |
| Especificación funcional | Preparada el 2026-09-17 | Propuesta de permisos, flujos, métricas y estados; pendiente de validar alcance y reglas. |
| Casos de aceptación | 32 escenarios definidos | Preparados para implementación en H1–H4; todavía no ejecutados. |
| Inventario técnico de hojas | Completado como referencia | Ocho hojas verificadas mediante exportación XLSX; cabeceras y conteos abajo. |
| Evaluación de calidad para migración | No aplica | El responsable confirmó que no se importarán datos del MVP. |
| Responsables y capacidad | Administrador principal definido | j.salas@goethe.edu.ar; referente deportivo, temporada y capacidad pendientes. |
| Acta de cierre | Pendiente | Resolver reglas/alcance y definir catálogos y procedimiento de alta inicial. |

## 1. Matriz de paridad

“Presente” significa localizado en el código, no validado en un despliegue. “Base” conserva el flujo aprobado; “corrección” establece una condición técnica de producción; “a decidir” no debe interpretarse como excluido ni comprometido.

| ID | Función | Evidencia en el MVP | Primera producción propuesta | Criterio de aceptación |
|---|---|---|---|---|
| F01 | Login de profesor y jugador | `verificarLogin`, `login` | SSO institucional confirmado | Identidad verificada, sesión expirable y cierre real; sin credencial fija. |
| F02 | Activación de alumno | `registrarCuentaJugador` | Vinculación a identidad SSO | Solo titular habilita su cuenta; ficha deportiva independiente del login. |
| F03 | Registro externo/padres | `registrarExterno`; `screen-externo` es placeholder | A decidir: portal familiar | No publicar un botón que solo diga “en desarrollo”; vínculo con hijo verificado si se habilita. |
| F04 | Alta de jugador multideporte | `registrarJugadorBackend` | Base | Alta íntegra o rechazo íntegro; jugador único y varias inscripciones. |
| F05 | Editar y dar de baja jugador | No se localizaron operaciones de edición/baja | Corrección operativa propuesta | Corregir datos y desactivar inscripción preservando historial y auditoría. |
| F06 | Categoría y camiseta | `calcularCategoria`, validación al registrar | Catálogo configurable confirmado; automatización por validar | Categoría por temporada; casos C01–C07; unicidad de camiseta según R04. |
| F07 | Tomar asistencia | `guardarAsistenciaBD`, `iniciarTomaAsistencia` | Base | Guardado por sesión; reintento no duplica; alumno sin cuenta puede figurar. |
| F08 | Crear partidos por categoría | `crearPartidosBD` | Base | IDs distintos para dos encuentros del mismo día; local/visitante correctos. |
| F09 | Convocar y marcar titular | `guardarConvocatoriaBD` | Base | Solo docentes habilitados; titular pertenece a convocatoria vigente. |
| F10 | Responder convocatoria | `obtenerMisConvocatorias`, `responderConvocatoria` | Base | Alumno responde la propia; pendiente/aceptada/rechazada diferenciadas. |
| F11 | Consultar confirmaciones | Segunda definición de `obtenerJugadoresParaConvocatoria` | Base | Docente ve respuestas actuales sin confundirlas con asistencia real. |
| F12 | Registrar goles/asistencias/resultado | `guardarPartidoFinalizadoBD` | Base + cierre transaccional | Una operación completa; reintentos y doble clic no duplican eventos. |
| F13 | Corregir resultado finalizado | `finalizarPartido` borra y vuelve a guardar | Base + auditoría | Fallo conserva la versión anterior; corrección con motivo y control de versión. |
| F14 | Estadísticas personales | `obtenerEstadisticasJugadorCompleto` | Base con métricas corregidas | Filtros por deporte/temporada; sin datos se muestra “sin datos”, no 100%. |
| F15 | Fixture, posiciones y ranking | `obtenerPartidosDashboard`, `obtenerTablaPosiciones`, `obtenerRankingJugadores` | Base con alcance explícito | No mezclar temporadas ni presentar tabla parcial como torneo completo. |
| F16 | Recuperación y administración de accesos | No localizadas | Corrección operativa | Recuperación en proveedor SSO; configurador de roles/permisos/ámbitos administrado por admin. |
| F17 | Asistencia real a partido y participación | El MVP aproxima partidos jugados por convocatoria | Corrección de métrica; captura a validar | Distinguir convocado, confirmado, presente y jugó; captura efectiva desde el inicio de producción. |
| F18 | Transporte y autorización familiar | Diseño SQL/propuesta; no flujo localizado | Conservado en diseño base; detallar flujo | Si se incluye: vínculo verificado, evidencia versionada y acceso privado. |
| F19 | Tarjetas, sanciones y cumplimiento | Diseño SQL/propuesta; no flujo localizado | Conservado en diseño base; detallar reglas | Reglas por deporte y alcance de suspensión, sin doble cómputo de eventos. |
| F20 | Cambios, minutos y destacado | Diseño SQL/propuesta; no flujo localizado | Conservado en diseño base; detallar captura | Definir captura; destacado asignado por profesor según propuesta existente. |
| F21 | Boletín/exportación | Propuesta funcional; no flujo localizado | A decidir | Formato, destinatarios y datos visibles definidos antes de construir. |
| F22 | Offline completo, idiomas, múltiples colegios | Propuesta contiene ideas y supuestos | A decidir; no requisito confirmado | Definir compromiso real; dominio inicial propuesto Goethe/español. |

No se agrega un backend Express por inercia del documento anterior: Auth, RLS y RPC pueden cubrir el núcleo. El objetivo de este hito es acordar comportamiento y datos, no imponer un framework nuevo al MVP.

## 2. Registro de decisiones

| ID | Tema | Evidencia / propuesta inicial | Quién confirma | Estado |
|---|---|---|---|---|
| R01 | Primera salida | Diseño SQL recibido como base + paridad del MVP; no se postergan automáticamente sus entidades | Responsable del proyecto | Referencia reafirmada 2026-09-17; detalle de flujos pendiente |
| R02 | Institución y deportes | Goethe, fútbol DEP1 y handball DEP2 presentes en UI | Responsable del proyecto | Propuesta |
| R03 | Categoría | Menores, Cadetes y Juveniles; pantalla para editar categorías | Responsable del proyecto | Catálogo/configurador confirmados 2026-09-17; fórmula automática pendiente |
| R04 | Camiseta | Actualmente única por deporte/categoría; propuesta por plantel y temporada entre activos | Referente deportivo | Pendiente |
| R05 | Torneos y puntos | Código aplica victoria 3, empate 1; sin temporada/torneo en hoja | Referente deportivo | Pendiente para cada deporte |
| R06 | Partidos jugados | Actualmente finalizados con convocatoria; propuesta participación efectiva | Referente deportivo | Pendiente de definición y captura |
| R07 | Asistencia % | Actualmente registros presentes / registros del alumno; sin filas devuelve 100% | Referente deportivo | Propuesta: sesiones elegibles no canceladas, distinguir sin registro y ausencia |
| R08 | Alta sin cuenta | El código oculta alumnos no activados del plantel | Responsable del proyecto | Propuesta: inscripción independiente de Auth |
| R09 | Confirmación | Alumno responde; no hay fecha límite explícita | Referente deportivo | Definir cierre, cambios de respuesta y quién registra presencia |
| R10 | Privacidad de reportes | Panel externo incompleto; estadísticas personales y profesor presentes | Responsable institucional | Definir datos visibles para alumno, familia y público |
| R11 | Identidad | Credenciales por Google Workspace SSO; ficha deportiva puede existir sin identidad de acceso | Responsable del proyecto | SSO con Google Workspace confirmado 2026-09-17; acceso de familias pendiente |
| R12 | Datos y calendario | Fechas heterogéneas; año actual altera cálculo de categoría | Referente deportivo + custodio de datos | Propuesta: temporada explícita; zona America/Argentina/Buenos_Aires |
| R13 | Equipo y operación | Administrador principal j.salas@goethe.edu.ar | Responsable del proyecto | Administrador confirmado 2026-09-17; referente deportivo, capacidad y soporte pendientes |
| R14 | Objetivos de servicio | Volumen/concurrencia/conectividad futuros desconocidos; conteos del MVP no representan carga esperada | Responsable del proyecto | Medir antes de cerrar presupuesto y cronograma |
| R15 | Datos iniciales | Producción desde cero; no importar registros ni cuentas del MVP | Responsable del proyecto | **Confirmado 2026-09-10**, instrucción en conversación |

| R16 | Perfiles/roles | Configurador para crear roles y administrar permisos/asignaciones | Responsable del proyecto | Confirmado 2026-09-17 |

Registrar cada resolución con fecha, persona, decisión y evidencia. Las propuestas no son aprobaciones. No se requiere contestar todas las filas de una vez: el proveedor SSO confirmado es Google Workspace; los pendientes deportivos se resuelven con el referente durante H0. Ver [ajustes al diseño recibido](H0_AJUSTES_MODELO.md).

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

## 4. Estructura real del MVP verificada

Se revisó una exportación XLSX de la planilla compartida por el responsable el 2026-09-10. Se leyeron nombres de hojas, cabeceras y conteos agregados; no se realizó una auditoría de calidad ni se importaron registros a BD. El archivo de datos no forma parte del repositorio.

Los conteos incluyen filas posteriores a la cabecera con alguna celda con valor; no equivalen a entidades únicas ni validan consistencia. No se usa esta muestra para estimar volumen productivo.

| Hoja | Cabeceras verificadas, en orden | Filas con valores sin cabecera |
|---|---|---:|
| USUARIOS | ID_Usuario, PasswordHash, Rol, Confirmado, Activado, Email | 10 |
| Asistencia | Fecha, IDD, ID_Jugador, Nombre, Asistio | 17 |
| JUGADORES_GENERAL | ID, Nombre, Apellido, eMail, Fnac, Colegio | 9 |
| JUGADORES_DEPORTES | IDJ, ID_Jugador, IDD, Categoria, Camiseta | 11 |
| PARTIDOS | IDP, Local, Visitante, Deporte, Categoria, Fecha, Hora, GolesLocal, GolesVisitante, Estado | 12 |
| EQUIPOS | IDEQUIPO, Nombre | 2 |
| CONVOCATORIAS | IDP, ID_Jugador, Convocado, Titular, Confirmado | 17 |
| ESTADISTICAS_PARTIDOS | IDP, ID_Goleador, ID_Asistidor | 9 |

`DEPORTES`, mencionada en el documento anterior, no figura como hoja en esta exportación. Sí existe `EQUIPOS`, que no aparecía en el inventario esperado. Confirmar los catálogos iniciales sin copiarlos automáticamente.

Las estadísticas reales contienen una fila por gol con goleador/asistidor; no hay columnas de minuto ni estadísticas agregadas como propone `DATABASE_SCHEMA.md`. Asistencia no guarda sesión, horario ni categoría. El nuevo modelo debe capturar estos conceptos cuando el alcance lo requiera, sin intentar reconstruir el pasado.

El [registro de inventario](H0_INVENTARIO.csv) queda como referencia estructural completada, no como tarea de limpieza pendiente. No se publican DNI, emails, nombres de jugadores, hashes ni registros de partidos.

### Arranque desde cero

1. Definir temporada de inicio y catálogos mínimos: deportes, categorías, sedes, equipos y reglas aplicables.
2. Habilitar como administrador a j.salas@goethe.edu.ar mediante identidad SSO verificada y asignar perfiles/permisos a docentes nuevos.
3. Dar de alta jugadores/inscripciones desde la app; no trasladar cuentas ni registros de la planilla.
4. Cargar fixtures ficticios exclusivamente en desarrollo/staging; producción comienza sin historial del MVP y sin fixtures.
5. Validar pantallas vacías y el primer flujo de alta → asistencia/convocatoria → partido → estadísticas.
6. Acordar desde qué fecha/evento se usa Supabase y retirar el MVP de la operación en ese momento. Conservar la planilla sin modificarla; no se solicita ni se ejecuta su eliminación.

No se necesita exportación final, ETL, `legacy_id`, conciliación ni resolución de duplicados históricos. Las migraciones SQL de esquema siguen siendo parte de H1.

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
- [x] Inventario estructural contrastado con las ocho hojas reales.
- [x] Decisión R15 registrada: producción sin importar datos ni cuentas del MVP.
- [x] Discrepancia de categorías reproducida y registrada.
- [x] Propuesta funcional, matriz de permisos y escenarios de aceptación preparados en `joaco`.
- [ ] Alcance de F01–F22 resuelto: incluido, fase posterior o fuera de alcance, con responsable y fecha.
- [ ] Referente deportivo designado; R03–R09 resueltas con ejemplos verificables.
- [x] Lectura de planilla disponible y estructura revisada como referencia.
- [ ] Versión desplegada contrastada con repositorio para validar paridad funcional.
- [x] Inventario de calidad/conciliación histórica retirado del alcance por R15.
- [x] Administrador principal designado y SSO con Google Workspace confirmado.
- [x] Categorías iniciales y configuradores de categorías/perfiles solicitados.
- [ ] Temporada, otros catálogos y habilitación SSO inicial definidos.
- [ ] Roles, privacidad y alumnos sin email definidos (R10–R11).
- [ ] Responsables, disponibilidad del equipo y objetivos operativos documentados.
- [ ] Acta breve de cierre con pendientes no bloqueantes y alcance entregado a H1.

Próxima acción: preparar la conexión de Google Workspace y completar los detalles funcionales del diseño recibido. La regla automática de categorías permanece sin aprobar; propuesta operativa de asignación manual mientras se valida. Definir catálogos y temporada iniciales. El acceso a la planilla y la migración del histórico ya no bloquean H0. Esta documentación permite preparar contratos y revisión del modelo sin fijar en SQL reglas todavía contradictorias.
