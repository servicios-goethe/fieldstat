# H0 — especificación funcional para la primera producción

Fecha: 2026-09-17. Rama de trabajo: `joaco`. Estado: **decisiones del responsable incorporadas; detalles operativos propuestos donde se indica**.

Complementa la [matriz de paridad y decisiones](HITO_0.md) y el [plan de producción](PLAN_PRODUCCION_FIELDSTATS.md). El código analizado sigue siendo `406ad535cbf94ffab7b222b95f7223fb0b9293ca`; los commits posteriores revisados son documentación. No se volvió a descargar la planilla ni se ejecutaron operaciones sobre el MVP.

## 1. Alcance de trabajo y decisiones confirmadas

Confirmado por el responsable: MVP aprobado, producción sin importar datos/cuentas, trabajo exclusivamente en `joaco`, acceso por SSO con Google Workspace, administrador principal `j.salas@goethe.edu.ar`, configurador de perfiles/roles y pantalla de categorías con Menores, Cadetes y Juveniles como valores iniciales.

El diseño recibido es [SQLFieldStatsDB.1.sql](SQLFieldStatsDB.1.sql), con 19 tablas. Se conserva como base de alcance y se retira la propuesta de postergar automáticamente sus módulos. El [mapa de ajustes](H0_AJUSTES_MODELO.md) muestra qué se conserva, qué cambia por PostgreSQL/SSO y qué se agrega para cubrir el MVP y los configuradores pedidos. No hace falta volver a enviar ese diseño.

Se contemplan jugadores, planteles, asistencia, torneos/fechas, partidos, convocatorias/transporte/autorizaciones, titularidad, cambios, estadísticas y sanciones. La existencia de tablas no resuelve por sí sola todos los comportamientos de esos módulos: su detalle queda registrado como pendiente sin excluirlos. Boletín, offline completo, idiomas y otras instituciones no quedan automáticamente confirmados por el SQL.

Los flujos existentes se mantienen con permisos y transacciones; se agregan las pantallas de administración solicitadas. El login de producción es institucional: no se implementa contraseña propia, token de activación compartido ni recuperación local de contraseña. La recuperación corresponde al proveedor SSO.

## 2. Conceptos que debe representar la BD

| Concepto | Definición y regla propuesta |
|---|---|
| Cuenta | Identidad institucional verificada por SSO que puede iniciar sesión. No es requisito para que un alumno figure en un plantel. |
| Jugador | Ficha deportiva única. El DNI es texto restringido, no la clave pública de la ficha. Mantener nombre, apellido y nacimiento; email de acceso solo si hay cuenta. |
| Temporada | Período deportivo explícito. Elegirla no cambia registros de temporadas previas. Año inicial pendiente. |
| Equipo | Goethe o rival. Se registra independientemente de la cuenta de cualquier alumno. |
| Plantel | Equipo propio + deporte + categoría + temporada. Propuesta inicial: uno por esa combinación; si hay planteles A/B se agrega identificador antes de H1. |
| Inscripción | Vincula jugador a plantel y guarda vigencia y camiseta. Baja cierra vigencia; no borra partidos ni asistencias anteriores. |
| Entrenamiento | Sesión con fecha/hora y plantel. Dos sesiones en un día son registros distintos. |
| Convocatoria | Selección docente para un partido. No prueba confirmación, presencia ni participación. |
| Respuesta | Pendiente, acepta o rechaza; la registra el alumno de esa convocatoria. |
| Presencia | Dato verificado por docente: sin registrar, presente o ausente. |
| Participación | Jugó o no jugó, registrada por docente al cerrar partido; antes del cierre puede quedar sin registrar. No se deduce de una respuesta. |
| Evento de gol | Un gol del partido; permite asistidor opcional. El marcador rival puede capturarse agregado sin mantener sus jugadores. |
| Resultado | Marcador del encuentro. Un partido pendiente no tiene resultado deportivo; no mostrarlo como empate 0–0. |

Usar referencias explícitas para relaciones. La camiseta es un atributo de inscripción/participación, no de la ficha general. Un jugador en dos deportes puede tener camisetas distintas.

## 3. Permisos propuestos

Un rol no se asigna desde un formulario público ni desde metadatos editables por el alumno. Los permisos se evalúan con identidad verificada y asignación vigente, aun si el cliente invoca la operación fuera de la pantalla habitual.

| Operación | Administrador | Profesor asignado | Alumno | Sin sesión |
|---|---|---|---|---|
| Catálogos y roles | Gestiona | Consulta catálogos necesarios | Consulta catálogos de su contexto | Sin acceso |
| Datos personales del jugador | Gestiona | Solo alumnos de planteles asignados | Consulta propia ficha permitida | Sin acceso |
| Alta/edición/baja deportiva | Gestiona | En su ámbito, con validación global de duplicado | Sin permiso | Sin acceso |
| Entrenamientos y asistencia | Gestiona | En su ámbito | Consulta propios registros | Sin acceso |
| Partido y convocatoria | Gestiona | En su ámbito | Consulta sus convocatorias | Sin acceso |
| Respuesta a convocatoria | Corrección auditada excepcional | Consulta | Responde la propia | Sin acceso |
| Presencia, participación y resultado | Gestiona | En su ámbito | Sin permiso de escritura | Sin acceso |
| Estadísticas personales | Consulta | En su ámbito | Solo propias | Sin acceso |
| Fixture y resultados de equipo | Consulta | En su ámbito | De deportes/temporadas habilitados | Sin acceso |
| Ranking individual de terceros | Consulta | En su ámbito | Pendiente de R10; propuesta inicial sin acceso | Sin acceso |

La matriz representa perfiles iniciales propuestos; los permisos se gestionan en el configurador solicitado. Requiere validar R10 antes del lanzamiento. No se propone un dashboard público de datos personales. El módulo de autorizaciones necesita vínculo verificado y una matriz propia para responsables; no hereda permisos docentes. Sigue pendiente cómo acceden responsables que no tengan identidad institucional.

Al agregar un alumno que ya existe fuera del ámbito docente, la operación debe resolver la inscripción sin devolver datos personales de otros planteles. El docente no puede cambiar correo de acceso, roles ni asignaciones por editar una ficha deportiva. Un docente con varios deportes debe tener asignaciones explícitas para cada uno.

## 4. Flujos y reglas para implementar

### Jugadores y planteles — F04–F06, R03–R04, R08

El docente registra ficha e inscripción como una unidad. Si alguna inscripción falla, no queda un alta parcial. DNI repetido identifica una ficha existente; la operación no crea una segunda. Camiseta: propuesta de unicidad por plantel entre inscripciones activas, dejando sin asignar hasta conocerla si el referente lo permite. Una baja deportiva no elimina la cuenta ni la ficha, y un alta nueva en otra temporada no modifica la inscripción anterior.

La regla automática de categoría continúa abierta: no convertir la fórmula actual en regla definitiva. Propuesta: conservar categoría asignada por temporada y registrar la regla/versión aplicada. Para excepciones, guardar quién autorizó y motivo. Fecha de nacimiento inválida no se transforma silenciosamente en Cadetes. Usar escolaridad real solo si el referente confirma que determina categoría; no asumirla únicamente por edad. El configurador y la asignación manual permiten avanzar sin activar la fórmula contradictoria.

### Entrenamientos — F07, R07

El docente crea sesión y un padrón de inscripciones elegibles según vigencia en esa fecha. La propuesta inicial usa un plantel por sesión; si el entrenamiento reúne varios, se debe decidir si se crean sesiones vinculadas o una sesión con varios planteles antes de fijar el esquema.

Estados: `programado → realizado` o `programado → cancelado`. Reprogramar conserva identidad; no simula una asistencia nueva. Pasar a realizado exige completar asistencia de todos los integrantes del padrón o resolver explícitamente las excepciones. Los valores sin registrar no equivalen a ausencia. Corregir una sesión realizada exige permiso y motivo; no reconstruye retroactivamente el padrón con el plantel de hoy.

Porcentaje propuesto: presentes / sesiones realizadas con padrón y asistencia completa en las que el alumno era elegible, dentro del filtro de temporada/plantel. Canceladas y programadas quedan fuera. Si el denominador es cero, mostrar “sin datos”. Si se habilitan ausencias justificadas, resolver su denominador con el referente antes de implementarlas.

### Partidos y convocatorias — F08–F11, R05–R06, R09

Partido con plantel, local, visitante, inicio y sede opcional; local distinto de visitante. Torneo opcional para amistosos. Dos encuentros del mismo plantel y fecha son posibles: UUID identifica cada uno.

Estados propuestos: `pendiente → finalizado` o `pendiente → cancelado`. Reprogramar cambia fecha/hora manteniendo ID y deja auditoría. No hace falta estado “en vivo” para cargar después del partido. Si la carga en vivo se vuelve requisito, se agrega antes de H3.

El docente publica convocatoria; cada alumno seleccionado queda con respuesta pendiente. El alumno puede cambiar su respuesta hasta el cierre de confirmación. Propuesta inicial: cierre al inicio del partido; el docente puede adelantarlo. Siempre se valida el plazo del lado servidor. Reprogramar luego de respuestas recibidas debe marcar que la confirmación requiere revisión y conservar la respuesta previa en auditoría, para no asumir aceptación de la nueva fecha.

Retirar una convocatoria impide nuevas respuestas y elimina la condición de titular para ese encuentro, conservando auditoría. Volver a convocar requiere nueva confirmación. Titularidad no significa que el alumno asistió. Antes del cierre final, el docente registra presencia y participación de cada convocado vigente: un presente puede no haber jugado; un ausente no puede figurar como participante ni goleador.

### Resultados y correcciones — F12–F13

El marcador propio se obtiene de goles registrados; el rival puede ingresarse agregado. Cada gol propio tiene goleador habilitado y asistidor opcional distinto del goleador. Para autogol rival, permitir un gol a favor sin jugador de Goethe y con motivo explícito; no asignarlo artificialmente a un alumno. Si se requiere admitir goles sin autor conocido, el referente debe definir cómo cerrar esa excepción.

Cerrar exige marcador no negativo, datos de participación completos y coherencia de goleadores/asistidores con el partido. Una sola transacción guarda resultado, eventos, participación y estado. El cierre lleva identificador de operación y versión del partido: repetir la misma solicitud no vuelve a sumar, y un segundo editor con versión anterior recibe conflicto en lugar de sobrescribir.

Una corrección finalizada incluye motivo y nueva versión, reemplaza el conjunto necesario de forma atómica y conserva auditoría. Los permisos de escritura directa no deben permitir saltar ese control. Una falla deja intacto el resultado anterior.

### Reportes — F14–F15

Los filtros de deporte/categoría/temporada son explícitos. Un partido jugado individual es un encuentro finalizado con `jugó = sí`; no una convocatoria aceptada. Goles y asistencias provienen de eventos de encuentros finalizados. Los promedios solo se calculan con denominador mayor a cero.

Posiciones: computar únicamente partidos del torneo seleccionado; reglas de victoria/empate/derrota y desempate configuradas por torneo. El 3/1/0 del MVP no se generaliza automáticamente a handball. Cuando se cargan solo los partidos de Goethe, mostrar “tabla parcial de partidos registrados”. Amistosos pueden aparecer en fixture/estadísticas según filtro, pero no sumar puntos a un torneo.

## 5. Escenarios de aceptación listos para H1–H4

Estos son casos para implementar y ejecutar, **no resultados de pruebas ya realizadas**. Usar identidades ficticias: administrador A, profesor F (fútbol), profesor H (handball), alumno J1, alumno J2 y jugador J3 sin cuenta; planteles PF/PH y temporadas T1/T2. Ningún dato se toma de la planilla real.

| Caso | Preparación y acción | Resultado esperado propuesto | Hito |
|---|---|---|---|
| A01 | F solicita datos de PH por API | Denegado; no devuelve datos personales | H1 |
| A02 | J1 cambia el ID de una respuesta para apuntar a J2 | Denegado; convocatoria de J2 intacta | H1 |
| A03 | J1 intenta actualizar su rol o el dueño de su ficha | Denegado | H1 |
| A04 | Solicitud sin sesión intenta leer jugadores o escribir resultado | Denegado | H1 |
| A05 | F intenta inscribir dos deportes y falla una validación | No queda ninguna escritura parcial | H2 |
| A06 | Crear dos inscripciones activas con la misma camiseta en PF | Rechazo según R04; la misma camiseta en PH puede ser válida | H2 |
| A07 | J3 no tiene cuenta; F abre plantel y toma asistencia | J3 figura y puede ser registrado | H2 |
| A08 | Dar de baja a J1 y consultar una sesión anterior | Preserva padrón y asistencia histórica; no aparece en nueva sesión posterior a la baja | H2 |
| A09 | Crear dos sesiones PF el mismo día y guardar cada lista | Asistencias independientes, sin sobrescritura por fecha | H2 |
| A10 | Sesión sin registros, cancelada y realizada completa | Solo la última aporta al porcentaje; sin denominador muestra “sin datos” | H2/H4 |
| A11 | Crear dos partidos PF el mismo día | Dos IDs y convocatorias independientes | H3 |
| A12 | J1 responde luego del cierre de confirmación | Denegado aunque el navegador muestre un formulario viejo | H3 |
| A13 | Reprogramar partido ya confirmado | Se identifica que debe reconfirmar; respuesta previa auditable | H3 |
| A14 | Retirar a J1 de convocatoria; intenta responder o quedar titular | Operación denegada; no figura como titular vigente | H3 |
| A15 | J1 aceptó, pero docente registra ausencia | No suma partido jugado ni puede tener gol/asistencia | H3/H4 |
| A16 | Reintentar dos veces el mismo cierre | Un resultado y un conjunto de eventos | H3 |
| A17 | Dos docentes editan la misma versión de partido | Una operación gana; la otra recibe conflicto recuperable | H3 |
| A18 | Interrumpir corrección tras iniciar escritura | Se conserva íntegramente versión anterior | H3 |
| A19 | Cambiar filtro T1/T2 | No mezcla partidos, planteles ni categorías de temporadas | H4 |
| A20 | Registrar solo partidos de Goethe y ver posiciones | Tabla identificada como parcial; puntos según torneo | H4 |
| A21 | Instalar base nueva y entrar como administrador | Catálogos iniciales; cero datos MVP y cero fixtures productivos | H1/H4 |
| A22 | Cerrar sesión y reutilizar la interfaz abierta | No permite nuevas operaciones autenticadas sin sesión válida | H2 |
| A23 | Error de red al guardar y posterior reintento | No anuncia éxito antes de confirmación; reintento no duplica | H2/H3 |
| A24 | Dar de alta jugador sin identidad SSO | Mantiene ficha sin cuenta; no inventa correo ni comparte credenciales | H2 |
| A25 | Identidad SSO no habilitada intenta entrar | No recibe datos deportivos ni rol administrativo; queda sin acceso funcional | H1/H2 |
| A26 | Autenticación legítima del administrador designado | Alta controlada del privilegio inicial, vinculada a identidad verificada; no basta enviar su email desde cliente | H1 |
| A27 | Administrador crea un rol, asigna permisos y ámbito a un usuario | Interfaz y API respetan exactamente esos permisos; rol sin permisos no habilita operaciones | H1/H2 |
| A28 | Se revoca un permiso con sesión abierta | Siguiente operación protegida lo rechaza sin esperar al próximo login | H1/H2 |
| A29 | Intento de quitar/desactivar el último administrador principal | Rechazo atómico; no se pierde administración por dos cambios simultáneos | H1/H2 |
| A30 | Editar nombre u orden de una categoría utilizada | ID y vínculos se conservan; listados reflejan configuración | H2 |
| A31 | Desactivar categoría con registros históricos | No admite nuevas inscripciones; historial consultable; no hay borrado en cascada | H1/H2 |
| A32 | Login con proveedor no configurado o identidad no validada | No inicia acceso autorizado ni permite reclamar administrador por email | H1/H2 |

Categorías: completar C01–C07 del Hito 0 con los resultados validados. Agregar C08 (30/6 y 1/7 de un mismo año), C09 (escolaridad diferente para igual fecha de nacimiento), C10 (fecha inválida) y C11 (abrir temporada futura sin alterar la anterior). C08/C09 no tienen esperado automático hasta resolver R03; C10 debe rechazar entrada inválida y C11 preservar historial.

## 6. Preparación del arranque nuevo

| Dato/configuración | Propuesta o estado | Responsable de definir |
|---|---|---|
| Institución | Goethe; confirmar si hay otra institución en primera salida | Responsable del proyecto |
| Deportes | Fútbol y handball, según MVP | Referente deportivo |
| Categorías | Menores, Cadetes y Juveniles confirmadas; pantalla de edición solicitada; regla automática pendiente | Administrador / referente deportivo |
| Temporada de inicio | Pendiente; no asumir 2026 por la fecha de este documento | Referente deportivo |
| Zona horaria | America/Argentina/Buenos_Aires, propuesta | Responsable institucional |
| Equipos/sedes | Goethe más rivales/sedes cargados desde la app según necesidad | Administrador |
| Torneos | Dar de alta con reglas confirmadas; permitir amistosos sin torneo | Referente deportivo |
| Administrador | `j.salas@goethe.edu.ar`, designado por el responsable el 2026-09-17 | Administrador principal |
| Profesores y ámbitos | Identidades SSO habilitadas y roles/permisos/ámbitos desde configurador | Administrador |
| Alumnos | Altas nuevas; no importación | Profesor/administrador |
| Capacidad | Cantidad de docentes/alumnos, pico simultáneo y disponibilidad del equipo pendientes | Responsable del proyecto |

No pedir credenciales por chat ni publicarlas en documentos. Las cuentas se vinculan a identidad SSO verificada cuando exista el ambiente; habilitar una persona en FieldStats no crea ni modifica su contraseña institucional.

## 7. Configuradores solicitados

### Categorías

Pantalla “Configuración → Categorías”: listar, crear, editar nombre/orden y desactivar. Valores iniciales confirmados: Menores, Cadetes y Juveniles. Un ID estable mantiene los vínculos aunque cambie el nombre. Las categorías usadas no se borran; una desactivación impide nuevas asignaciones y conserva consultas históricas. Validar nombre no vacío y duplicados normalizados.

Esta pantalla configura el catálogo. No equivale a aprobar una fórmula de asignación por nacimiento. Hasta validar esa regla, propuesta operativa: el docente/administrador elige la categoría de la inscripción por temporada; un cambio conserva trazabilidad. Una futura pantalla de reglas por deporte/temporada debe mostrar vista previa antes de aplicarlas y nunca reclasificar silenciosamente temporadas cerradas.

### Perfiles, roles y permisos

Pantalla “Configuración → Perfiles y roles”: crear/editar/desactivar roles, elegir permisos de un catálogo de acciones, asignar roles a usuarios SSO y limitar ámbito global/deporte/plantel según permiso. Mostrar permisos efectivos del usuario antes de guardar. Los nuevos nombres de rol no requieren cambiar código; nuevos tipos de acción sí requieren implementación y controles de backend.

Tablas propuestas: `roles`, `permisos`, `rol_permisos`, `asignaciones_rol`. Permisos de administración separados: `roles.gestionar`, `usuarios.asignar_roles`, `categorias.gestionar`, además de los deportivos. El administrador principal inicial tiene control; toda modificación queda auditada. Evitar escalada por asignación propia o por otorgar ámbitos fuera de la autoridad del actor. Proteger al último administrador principal y resolver permisos desde BD en operaciones protegidas, para no depender de un JWT desactualizado.

### SSO y alta del administrador inicial

Proveedor confirmado: Google Workspace. Se prepara Google OAuth con Supabase Auth para el acceso institucional; si TI exige SAML, se adapta esa integración. No confundir el acceso a FieldStats con el SSO para entrar al dashboard administrativo de Supabase. Una cuenta autenticada debe estar habilitada y tener permisos de FieldStats.

Preparar registro de habilitación para `j.salas@goethe.edu.ar`. Asignar privilegio una sola vez desde servidor, después de comprobar la identidad en el proveedor configurado y enlazar su identificador estable con `auth.users.id`. Un email declarado por el navegador o un sufijo de dominio no bastan para reclamar ese rol. Logins posteriores no deben reponer un rol revocado. Guardar secretos del proveedor fuera de Git y conservar auditoría de la inicialización.

Fuentes oficiales para seleccionar la integración: [SSO SAML de proyectos](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml) y [acceso con Google](https://supabase.com/docs/guides/auth/social-login/auth-google). La configuración concreta de Google y redirects por ambiente queda para H1.

## 8. Estado de cierre y paso a H1

Resuelto en esta sesión: diseño de BD recibido y ubicado, catálogo inicial de categorías y pantalla de configuración, acceso SSO, identidad del administrador principal y configurador de perfiles/roles. Se prepararon 32 escenarios de aceptación; no se ejecutaron como pruebas de una implementación nueva.

Pendiente de infraestructura: acceso de configuración a Google Workspace/Cloud y Supabase para conectar el proveedor confirmado. Pendiente funcional: permisos de visibilidad para alumnos/familias, canal de acceso de responsables externos, reglas deportivas parametrizadas, entrenamiento con uno o varios planteles y detalle de autorizaciones/sanciones. Temporada y volumen inicial siguen por definir; no bloquean la conversión estructural del SQL.

H1 puede avanzar con las 19 entidades trazadas, las correcciones conocidas y las tablas de configuración/SSO, sin inventar la regla de categorías ni habilitar políticas amplias. H0 no se declara cerrado mientras falten las definiciones funcionales de su acta; los pendientes deben quedar trazados a los módulos afectados, sin detener diseño independiente.
