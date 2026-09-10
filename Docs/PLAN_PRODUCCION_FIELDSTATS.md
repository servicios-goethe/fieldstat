# FieldStats: plan de migración y lanzamiento

Fecha: 10 de septiembre de 2026. Base revisada: snapshot de `main` de servicios-goethe/fieldstat descargado mediante la API de GitHub. Alcance: análisis estático de los cuatro archivos de aplicación y los siete documentos disponibles. No se accedió a la planilla real, al despliegue de Apps Script ni a un proyecto Supabase. Las observaciones sobre código están verificadas en archivos; la calidad de los datos y la configuración del despliegue quedan pendientes de inspección.

## Decisión recomendada

Conservar los flujos y la identidad visual del MVP aprobado. Reemplazar la persistencia en Sheets y la autenticación artesanal; modularizar el frontend por funcionalidad. Implementar PostgreSQL, Auth y, si se incluyen documentos, Storage en Supabase. No trasladar literalmente el SQL existente ni volver a validar el producto desde cero.

Primera producción: Goethe, fútbol y handball, profesores, alumnos y administración; padres con acceso únicamente a alumnos vinculados si ese portal integra el alcance comprometido. El diseño debe admitir nuevas temporadas y deportes sin copiar pantallas o tablas. La expansión comercial a múltiples colegios puede quedar fuera del primer lanzamiento; si ya hay otra institución comprometida, incorporar aislamiento por institución antes de crear el esquema.

“100% operativo” debe significar que el alcance acordado supera criterios verificables de funcionamiento, seguridad, migración y recuperación. No significa ausencia garantizada de errores.

## Hallazgos concretos

| Prioridad | Evidencia | Consecuencia y trabajo necesario |
|---|---|---|
| P0 | `code.gs:57–76`: login con una credencial de profesor fija como alternativa | Eliminar ese acceso y retirar el endpoint legado al cortar. No trasladar credenciales del MVP a producción. |
| P0 | `code.gs:49–53`, `78–98`, `3–20`: SHA-256 con salt compartido, token de activación compartido y confirmación por email en URL | Sustituir por Supabase Auth, invitaciones individuales, vencimiento y recuperación. No importar estos hashes como contraseñas de Auth. |
| P0 | `registrarJugadorBackend`, `guardarConvocatoriaBD`, `responderConvocatoria` y `guardarPartidoFinalizadoBD` no verifican identidad ni permisos | El DNI y los IDs recibidos del navegador no acreditan autorización. Aplicar RLS y comprobación de actor en cada operación. La exposición efectiva del MVP depende del despliegue, que no se inspeccionó. |
| P0 | `funciones.html:460–477`: borrar estadísticas y luego guardar en otra llamada; `code.gs:459–487`: cambia resultado antes de insertar eventos | Una falla puede perder estadísticas o dejar resultados incompletos. Cierre/corrección transaccional e idempotente. |
| P1 | `code.gs:159–203`: escribe jugador antes de terminar validaciones de todos los deportes | Un error deja altas parciales. Validar y guardar como una unidad. |
| P1 | `code.gs:342–357`: ID construido con deporte, categoría y fecha | Dos partidos de la misma categoría en un día colisionan. Usar UUID; conservar el ID antiguo solo para trazabilidad. |
| P1 | `code.gs:360` y `423`: dos definiciones de `obtenerJugadoresParaConvocatoria` | Una definición reemplaza la otra. Unificar contrato e implementación. |
| P1 | `code.gs:206–243`: plantel condicionado a cuenta activada | Se confunden inscripción deportiva y acceso a la app. Un jugador debe poder ser convocado y tener asistencia aun sin cuenta. |
| P1 | `code.gs:122–157` y documento de categorías | Categoría dependiente del año actual, fecha inválida asignada a Cadetes y discrepancias en ejemplos históricos. Regla explícita por temporada y escolaridad, con casos aprobados y excepciones registradas. |
| P1 | `obtenerRankingJugadores`, `obtenerEstadisticasJugadorCompleto` | Convocado no equivale a haber jugado. Separar convocatoria, confirmación, presencia y participación. No inventar participación histórica. |
| P1 | `obtenerTablaPosiciones` | Mezcla temporadas al filtrar solo deporte/categoría; fija puntos 3/1/0. Configurar reglas de torneo. Si solo hay encuentros de Goethe, presentar tabla parcial, no clasificación completa del torneo. |
| P1 | `funciones.html`: interpolación de nombres y otros valores en `innerHTML` | Riesgo de inyección de HTML. Usar renderizado escapado o `textContent`; probar entradas maliciosas. |
| P2 | Frontend global de 824 líneas; backend de 1.084; lecturas completas de hojas y errores convertidos en listas vacías | Separar módulos, tipar contratos, paginar y distinguir vacío de error. No se encontraron manifiesto de dependencias, pruebas ni CI en el snapshot. |

La documentación no es una descripción exacta del almacenamiento actual: `DATABASE_SCHEMA.md` propone una estructura de estadísticas agregadas, pero el código escribe un registro por gol con goleador/asistidor. El importador debe seguir las cabeceras y datos reales, no solo ese documento.

## Correcciones al diseño de BD

El archivo `Docs/SQLFieldStatsDB.1.sql` es una buena enumeración de entidades, pero no una migración lista para Supabase.

1. Traducir `NVARCHAR` a `text`/`varchar`, `BIT` a `boolean`, `DATETIME` a `timestamptz` donde representa instantes, `GETDATE()` a `now()` y `VARCHAR(MAX)` a `text`. Para cumpleaños usar `date`. Adoptar nombres `snake_case` sin comillas y PK generadas.
2. Invertir dos FK incorrectas: `resultados.partido_id → partidos.id` y `autorizaciones.convocatoria_id → convocatorias.id`. Mantener unicidad en el hijo. Actualmente las FK obligan al padre a referenciar al hijo y no aseguran el vínculo correcto del hijo.
3. Eliminar credenciales, salt y tokens de la tabla de usuarios de negocio. Auth administra cuentas; perfiles y jugadores conservan datos de dominio.
4. Separar roles de inscripciones. Un profesor puede administrar un deporte sin categoría; un alumno puede participar sin cuenta. Evitar una única fila que mezcle ambos casos.
5. Agregar temporadas, planteles por deporte/categoría/temporada y sesiones de entrenamiento con sus asistencias. Evitar recalcular categorías históricas al cambiar de año.
6. Permitir amistosos sin fecha de torneo. El partido debe tener contexto deportivo explícito; si se vincula a una fecha, validar consistencia de torneo/deporte/categoría/temporada.
7. Agregar restricciones de estados, marcadores no negativos, local distinto de visitante y relaciones de pertenencia: convocado, goleador, asistidor, titular y jugador destacado deben corresponder al partido y al plantel habilitado.
8. Revisar unicidad con columnas opcionales: un índice UNIQUE compuesto no evita todos los duplicados cuando incluye NULL. Usar índices parciales o una estructura sin ese campo opcional en la clave de negocio.
9. No duplicar tarjetas entre estadísticas y sanciones como hechos independientes: el evento disciplinario es la fuente; las suspensiones y su cumplimiento se vinculan a él.

Modelo objetivo propuesto:

| Grupo | Tablas y relaciones principales |
|---|---|
| Identidad | `perfiles(id → auth.users.id)`; `jugadores(id UUID, perfil_id nullable unique, ...)`; datos personales sensibles separados del perfil visible. Borrar una cuenta no debe borrar trayectoria deportiva. |
| Permisos | `roles_globales(perfil_id, rol)` y `asignaciones_profesor(perfil_id, deporte_id, categoria_id opcional)` administradas por personal autorizado. |
| Familias | `responsables_jugadores(responsable_id, jugador_id, estado, verificado_por)`; varios responsables y hermanos. El email paterno no sustituye el vínculo validado. |
| Catálogos | `deportes`, `categorias`, `temporadas`, `equipos`, `sedes`, `reglas_categoria`. |
| Planteles | `planteles(deporte_id, categoria_id, temporada_id, equipo_id)`; `inscripciones(jugador_id, plantel_id, camiseta, desde, hasta, activo)`. Unicidad por jugador/plantel; camiseta única entre inscripciones activas si la regla institucional lo exige. |
| Competición | `torneos`, `torneo_equipos`, `fechas`, `partidos`, `resultados(partido_id unique)`. Planteles y equipos son conceptos distintos; un colegio puede tener varios planteles. |
| Convocatorias | `convocatorias(partido_id, inscripcion_id, convocado, respuesta, asistencia_real, transporte)` con unicidad por partido/inscripción. Respuesta pendiente no equivale a rechazo. |
| Participación | `participaciones(convocatoria_id unique, titular, capitan, camiseta, jugo)` y `cambios`. Validar pertenencia, períodos y reglas del deporte. |
| Estadística | `tipos_estadistica` por deporte y `eventos_partido(partido_id, jugador_id nullable, tipo_id, periodo, minuto nullable, asistidor_id nullable, equipo_id, origen)`. Admitir gol rival sin padrón individual y minutos históricos desconocidos. |
| Disciplina | `tipos_sancion`, `sanciones(evento_id, alcance, cantidad)` y cumplimiento si la suspensión está en el lanzamiento. |
| Entrenamientos | `entrenamientos(plantel_id, inicio, sede_id, estado)` y `asistencias(entrenamiento_id, inscripcion_id, estado)`, UNIQUE por sesión/inscripción. Permite dos sesiones el mismo día. |
| Autorizaciones | `autorizaciones(convocatoria_id, responsable_id, version_texto, aceptado_en, documento_path)`; evidencia y archivo privado. No asumir que una imagen de firma constituye por sí sola un proceso válido para el colegio. |
| Operación | `auditoria`, `importaciones`, `mapeo_legacy` y claves de idempotencia. Si hay notificaciones, bandeja de envíos con reintentos y deduplicación. |

Para entidades editables: `created_at`, `updated_at`, actor y versión para detectar conflictos. Restringir borrados de datos históricos; desactivar catálogos y registrar correcciones. Indexar FK y filtros frecuentes; medir antes de agregar índices indiscriminadamente.

## Refactor del código

Recomiendo una aplicación web modular en TypeScript. Como opción de implementación: React con Vite para componentes y reutilización de las pantallas existentes, sin necesidad inicial de SSR. La elección es arquitectónica; puede mantenerse DOM nativo modular si el equipo todavía no domina React. No es necesario sumar microservicios ni un ORM para este alcance.

Estructura propuesta:

```text
src/
  app/                 # navegación y sesión
  features/            # jugadores, asistencia, partidos, convocatorias, reportes
  domain/              # reglas puras de categoría, resultado y participación
  data/                # cliente Supabase y repositorios tipados
  components/          # formularios, listas, errores y carga
supabase/
  migrations/
  tests/
  functions/           # invitaciones, envíos y operaciones privilegiadas
  seed.sql             # únicamente datos ficticios
scripts/import/        # extracción normalizada y conciliación
tests/e2e/
```

Reutilizar CSS y flujos aprobados; extraer componentes sin un rediseño visual integral. Sustituir `google.script.run` módulo a módulo con contratos definidos. Mantener el MVP como referencia de comportamiento durante la construcción, sin implementar escrituras simultáneas en ambas bases.

Lecturas y CRUD sencillo: cliente Supabase sujeto a RLS. Operaciones que afectan varias tablas: funciones SQL/RPC transaccionales. Invitaciones de Auth, secretos y envío de correo: código de servidor. La clave pública puede estar en el navegador; las claves secretas y `service_role` nunca. Una función de servidor debe verificar actor y alcance antes de usar privilegios elevados.

Contratos críticos:

- `registrar_jugador`: valida el lote completo y crea jugador/inscripciones en una transacción; la invitación posterior puede reintentarse sin repetir el alta.
- `guardar_asistencia`: upsert por sesión/inscripción, valida plantel y permisos.
- `responder_convocatoria`: obtiene actor de la sesión; solo cambia respuesta/transporte propios, o del hijo verificado. No permite cambiar partido, alumno ni asistencia real.
- `cerrar_partido`: verifica rol, versión esperada y clave idempotente; bloquea el partido, valida marcador/eventos, guarda todo y cierra en la misma transacción. Dos cierres simultáneos no deben duplicar goles.
- `corregir_partido`: mismo control, motivo obligatorio y auditoría de antes/después; una falla conserva la versión previa completa.

Las funciones privilegiadas deben restringir `EXECUTE`, fijar `search_path` y usar nombres calificados. Preferir ejecución con permisos del llamante cuando alcanza. No permitir eludir el cierre mediante escrituras directas en las tablas que protege.

## Paso a paso para desarrollar Supabase

Estos pasos son el procedimiento de implementación; no se ejecutaron sobre una cuenta remota y este documento no contiene el DDL completo listo para producción.

### 1. Preparar ambientes y responsables

Crear bajo la cuenta institucional dos proyectos: `fieldstats-staging` y `fieldstats-prod`; desarrollo local con CLI y Docker. Registrar región, responsables, dominio, acceso de recuperación y presupuesto. Elegir región considerando ubicación de usuarios y tratamiento institucional de datos. Verificar el plan contratado y sus límites antes del lanzamiento.

### 2. Inicializar herramientas en el repositorio de desarrollo

En la futura rama de implementación, con Node y Docker instalados:

```bash
npm install --save-dev supabase
npx supabase init
npx supabase start
npx supabase migration new catalogos_e_identidad
npx supabase migration new planteles_y_competicion
npx supabase migration new convocatorias_eventos_y_asistencia
npx supabase migration new permisos_y_operaciones
```

Guardar versiones en lockfile. Escribir en esos archivos el esquema corregido. Cada tabla expuesta debe nacer con RLS y grants restrictivos; el último archivo completa políticas operativas y RPC. Mantener esquemas de importación y datos internos fuera de la API expuesta.

### 3. Escribir restricciones y seeds

Crear primero catálogos, luego jugadores/planteles, competición y tablas dependientes. Usar UUID para entidades y `legacy_id` o tabla de equivalencias para importar. Insertar deportes/categorías reales en una migración de catálogos; usar `seed.sql` para fixtures ficticios, no alumnos reales.

Ejemplos de restricciones a implementar: UNIQUE de resultado/partido y sesión/jugador; CHECK de marcador no negativo; FK del resultado hacia partido. Las reglas entre varias tablas necesitan claves compuestas o validación transaccional, no un CHECK que pretenda consultar otras filas.

### 4. Configurar autenticación

Configurar URL principal, redirects de staging/producción y recuperación de contraseña. Usar invitaciones a correos verificados como política inicial, con alta deportiva independiente del acceso. Si un alumno no tiene correo propio, mantener su ficha sin login y habilitar al responsable validado; no crear emails inventados.

Vincular el UUID de Auth a `perfiles`; asignar el primer administrador por un procedimiento controlado del servidor. Ningún registro público puede autoasignarse profesor/admin. Desactivar la exposición pública del alta si no se necesita. Configurar SMTP propio y probar entrega, expiración y recuperación con cuentas de prueba. Los hashes del MVP no se reutilizan: los usuarios establecen nueva contraseña mediante invitación/recuperación.

Supabase documenta la separación entre Auth y las tablas de perfiles: [gestión de usuarios](https://supabase.com/docs/guides/auth/managing-user-data).

### 5. Implementar permisos antes de conectar pantallas

| Actor | Lectura | Escritura |
|---|---|---|
| Sin sesión | Solo información expresamente publicada y sin datos personales | Ninguna |
| Alumno | Su ficha permitida, convocatorias y estadísticas; resultados institucionales habilitados | Su respuesta y campos expresamente editables |
| Responsable | Datos autorizados de hijos con vínculo verificado | Respuestas/autorizaciones habilitadas de esos hijos |
| Profesor | Planteles y datos necesarios de su ámbito | Asistencias, convocatorias, partidos y estadísticas de su ámbito |
| Administrador | Gestión institucional | Catálogos, permisos y correcciones auditadas |

RLS restringe filas; no basta para limitar columnas. Separar datos sensibles y usar grants de columnas o RPC específicos para actualización. Aplicar `USING` y `WITH CHECK` según operación; bloquear autoasignación de roles. Las vistas de reportes deben preservar permisos, por ejemplo con `security_invoker`, y devolver solo campos autorizados. Probar con usuarios reales de prueba, no únicamente desde SQL Editor con privilegios administrativos. Referencia: [RLS y grants](https://supabase.com/docs/guides/database/postgres/row-level-security).

### 6. Agregar transacciones y pruebas de base

Implementar los contratos críticos anteriores y pruebas SQL de integridad, permisos y concurrencia. Casos obligatorios: alumno A intenta responder por B; profesor de fútbol modifica handball; responsable sin vínculo lee ficha; cliente intenta asignarse rol; doble cierre de partido; falla a mitad de corrección; segunda importación del mismo lote.

```bash
npx supabase db reset
npx supabase db lint
npx supabase test db
```

`db reset` en este procedimiento recrea exclusivamente la base local y borra sus datos. No usarlo contra producción. Primero deben existir las pruebas SQL y sus fixtures. Referencia: [migraciones](https://supabase.com/docs/guides/local-development/database-migrations).

### 7. Storage y autorizaciones, si integran el lanzamiento

Crear bucket privado, límites de tamaño/tipo y políticas por vínculo familiar/ámbito docente. Guardar rutas de objetos; generar enlaces temporales luego de autorizar al solicitante. Probar vencimiento y acceso cruzado. Versionar texto aceptado y registrar quién aceptó y cuándo. Validar con el colegio qué evidencia requiere su procedimiento antes de sustituir autorizaciones actuales.

### 8. Desplegar a staging

```bash
npx supabase login
npx supabase link --project-ref REF_STAGING
npx supabase db push --dry-run
npx supabase db push
npx supabase gen types typescript --linked > src/data/database.types.ts
```

Crear previamente `src/data`. Autenticarse por el flujo de CLI, sin guardar tokens en Git. Revisar el proyecto vinculado antes de ejecutar cambios. Cargar fixtures y configurar Auth/SMTP/Storage por ambiente: las migraciones SQL no configuran automáticamente todos los servicios. Referencia: [gestión de ambientes](https://supabase.com/docs/guides/deployment/managing-environments).

### 9. Migrar Sheets con conciliación

Exportar todas las hojas con acceso autorizado y preservar un snapshot fechado. Inventariar cabeceras, tipos, filas, IDs duplicados y fechas. Nunca subir exportaciones con DNI/emails a Git.

| Origen real esperado | Destino y tratamiento |
|---|---|
| `JUGADORES_GENERAL` | Jugadores y datos personales. DNI como texto normalizado, con conflictos separados para revisión. |
| `USUARIOS` | Enlaces a fichas y futuras invitaciones; no hashes, salt ni token global. Verificar emails antes de invitar. |
| `JUGADORES_DEPORTES` | Planteles e inscripciones por temporada; preservar equivalencia de IDJ. |
| `PARTIDOS` | Equipos, partidos y resultados. Temporada desde fecha validada. Torneo desconocido queda sin asignación, no inventado. |
| `CONVOCATORIAS` | Conservar por separado convocado, titular y confirmado. Sin evidencia, asistencia/participación quedan desconocidas. |
| `ESTADISTICAS_PARTIDOS` | Un evento por fila de gol real. Minuto desconocido = NULL; goles rivales pueden existir solo como marcador agregado. |
| `Asistencia` | Sesión por fecha/deporte/contexto recuperable y asistencias. Si faltan categoría u horario, registrar contexto histórico desconocido sin inventar sesiones. |

Importar primero a staging privada. Normalizar `Si`/`Sí`/`No`/vacío; parsear fechas de manera explícita y convertir horarios usando la zona del colegio, propuesta `America/Argentina/Buenos_Aires`. Separar rechazos con motivo y fila de origen. Si hay IDs de partido ambiguos, resolver antes de vincular sus estadísticas. No deduplicar eventos solo por goleador/asistidor: un jugador puede marcar varios goles iguales.

El importador debe ser idempotente por snapshot/hoja/fila y equivalencias, con informe de insertados, actualizados, rechazados y huérfanos. Conciliar jugadores únicos, inscripciones, convocatorias, asistencias, resultados, goles y asistencias por partido/jugador/deporte. Toda diferencia debe quedar resuelta o documentada con aceptación del responsable de datos.

No imponer a datos históricos una precisión que nunca se capturó. Para encuentros nuevos, exigir reglas completas al cierre; para históricos, distinguir marcador agregado de eventos detallados.

### 10. Conectar y validar la app

Migrar en orden: sesión → planteles → entrenamientos → partidos/convocatorias → carga de resultados → dashboards. Manejar sesión vencida, falta de permisos, error y vacío por separado. Añadir estados de guardado y recuperación del borrador ante mala conexión; reintentos con idempotencia. El modo offline completo requiere alcance propio si el piloto demuestra que es necesario.

Pruebas de categorías con 30/6, 1/7, año de temporada, fechas inválidas y casos del documento. E2E de alta → convocatoria → respuesta → asistencia → cierre → dashboard, tanto fútbol como handball. En estadísticas, verificar denominadores de asistencia y significado de partidos jugados.

### 11. Preparar producción y recuperación

Reproducir en producción las mismas migraciones probadas; configurar secretos separados, dominio/HTTPS, SMTP, redirects y observabilidad. Publicar una versión candidata contra la base productiva antes de invitar usuarios. CI debe ejecutar compilación, tipos, pruebas de dominio, RLS y flujos críticos; una falla bloquea el despliegue.

Verificar backups según el plan y ensayar restauración. Los backups de base no incluyen el contenido de archivos de Storage: respaldarlos por separado si existen autorizaciones. Propuesta de objetivos a validar: RPO de 24 horas y RTO de 4 horas; si perder una jornada no es aceptable, reducir RPO y elegir mecanismo/plan acorde. Referencias: [checklist de producción](https://supabase.com/docs/guides/deployment/going-into-prod) y [backups](https://supabase.com/docs/guides/platform/backups).

### 12. Ejecutar el corte

Anunciar ventana; detener escrituras del MVP; exportar snapshot final; importar y conciliar; ejecutar prueba breve en producción; habilitar acceso; mantener Sheets como archivo de consulta restringida. Evitar dos fuentes activas de escritura.

Antes de admitir escrituras nuevas se puede volver al MVP restaurando su acceso. Después del corte, no volver sin reconciliar datos nuevos: detener escrituras, exportar lo producido desde el corte y aplicar el procedimiento de recuperación ensayado. Preferir corregir hacia adelante cuando sea seguro. Una reversión de frontend no implica revertir automáticamente la BD.

## Hitos de ejecución

Estimaciones orientativas para un desarrollador full stack con disponibilidad sostenida, referente docente y apoyo de QA/operación. No son un compromiso de calendario; se ajustan luego del inventario de datos. Dependencia secuencial H0 → H1 → H2 → H3 → H4 → H5 → H6 → H7.

| Hito | Esfuerzo estimado | Entregable | Criterio para cerrar |
|---|---|---|---|
| H0: alcance y datos | 2–3 días | Matriz de paridad del MVP, datos inventariados, reglas de categorías y permisos | Responsable docente confirma ejemplos y qué funcionalidades documentadas son obligatorias para salir. |
| H1: base y seguridad | 4–6 días | Modelo PostgreSQL, migraciones, Auth, RLS y ambientes | Base reproducible desde cero; todas las pruebas de acceso permitido/denegado pasan. |
| H2: núcleo operativo | 5–8 días | Sesión, jugadores, planteles, asistencia y catálogos | Un profesor gestiona su plantel sin depender de la activación de alumnos; sin altas parciales. |
| H3: ciclo de partido | 5–8 días | Partidos, convocatorias, respuestas, titularidad, eventos y cierre | Flujo completo en dos deportes; concurrencia, reintentos y correcciones no pierden ni duplican datos. |
| H4: reportes y migración | 4–6 días | Dashboards por temporada, importador, conciliación e histórico | Totales coinciden con origen o diferencias documentadas; importación repetida no duplica. |
| H5: piloto | 5–10 días calendario | Uso por docentes y alumnos representativos en entrenamientos y partidos reales | Cero defectos críticos/altos abiertos; flujo móvil y conexión real validados. |
| H6: producción | 2–3 días | Dominio, monitoreo, recuperación, manuales y corte | Restauración ensayada, datos finales conciliados, cuentas y permisos verificados. |
| H7: estabilización | 5 días calendario | Seguimiento diario, correcciones y transferencia operativa | Sin incidentes críticos pendientes; responsable puede administrar usuarios y atender incidencias. |

Orden de magnitud: 7–10 semanas calendario con esa disponibilidad y alcance central, incluyendo piloto y estabilización. Si el equipo trabaja por horas de taller, recalcular por capacidad efectiva. Autorizaciones completas, sanciones con cumplimiento, boletín exportable y offline completo pueden extenderlo; no asumir que están implementados porque aparecen en la propuesta.

Backlog obligatorio a clasificar en H0: ABM completo de jugadores (el código revisado muestra alta, no un ABM completo), baja deportiva, recuperación de cuenta, roles, transporte, autorizaciones, sanciones, cambios, destacado, exportación y notificaciones. Para cada uno: obligatorio en primera producción o fase posterior explícita. La paridad del MVP aprobado es el piso, no una excusa para omitir funcionalidades ya comprometidas.

## Condiciones de lanzamiento

- Funcionales: todos los recorridos obligatorios pasan en móvil; fechas, categorías, resultados e históricos tienen significado validado por el docente.
- Seguridad: ninguna operación permite acceso cruzado; no hay secretos en frontend/repositorio; roles no son autoeditables; el backend legado deja de admitir escrituras al finalizar el corte.
- Datos: cero huérfanos y duplicados no explicados; conciliación aceptada; cuentas separadas de fichas deportivas.
- Robustez: doble clic, reconexión, sesión vencida y edición simultánea tienen resultados previsibles; nunca se muestra “guardado” ante una falla.
- Rendimiento: medir en red representativa y con al menos el doble del pico concurrente observado. Objetivo inicial propuesto: p95 menor a 2 segundos para operaciones comunes, excluyendo reportes pesados; ajustar en H0 con volumen real.
- Operación: alertas de errores de app, RPC fallidas, correo e importación; logs sin DNI ni credenciales; recuperación y contacto de soporte documentados.
- Adopción: administrador y docente pueden ejecutar tareas habituales con una guía breve; mensajes de invitación y primer ingreso probados antes de enviarlos a la comunidad.

La próxima unidad ejecutable es H0 y luego H1: convertir el modelo corregido en migraciones completas y pruebas RLS. No hace falta cambiar las pantallas para empezar ese trabajo.
