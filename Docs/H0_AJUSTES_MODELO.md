# H0 — trazabilidad del diseño de BD recibido

Fecha: 2026-09-17. Rama: `joaco`. Fuente: [SQLFieldStatsDB.1.sql](SQLFieldStatsDB.1.sql). Este documento conserva el diseño recibido como referencia y explica su adaptación; no es una migración ejecutada.

## Decisiones incorporadas

- Sin importación de datos ni cuentas del MVP.
- Credenciales institucionales mediante **Google Workspace**, confirmado por el responsable.
- Administrador principal: **j.salas@goethe.edu.ar**, habilitado después de verificar identidad Google y vincularla a un usuario Auth estable.
- Pantalla de categorías; valores iniciales Menores, Cadetes y Juveniles.
- Configurador de perfiles/roles con permisos y ámbitos administrables.

Se propone Google OAuth mediante Supabase Auth para acceso institucional. El proveedor confirmado no exige por sí solo SAML; si TI establece ese requisito, se ajusta la integración. No se crean contraseñas locales ni se migran hashes. Alta de cuenta en Auth y habilitación funcional en FieldStats son pasos distintos: una identidad autenticada no recibe permisos automáticamente.

## Las 19 tablas y su destino

Los nombres de destino son propuestas de implementación PostgreSQL; no se eliminan funciones del diseño por cambiar nombres o separar responsabilidades.

| Tabla original | Adaptación prevista | Motivo y criterio de conservación |
|---|---|---|
| ROLES | `roles`, `permisos`, `rol_permisos`, `asignaciones_rol` | Nombres editables y nuevos roles sin cambiar código; permisos por acción y ámbito verificados en backend. |
| DEPORTES | `deportes` | Conserva catálogo y estado activo; referenciado por planteles, torneos y asignaciones. |
| CATEGORIAS | `categorias` | Añade orden/activo para configurador; ID estable y sin borrado si tiene referencias. |
| EQUIPOS | `equipos` | Conserva propios/rivales y contacto restringido. Plantel añade contexto deportivo/temporal. |
| SEDES | `sedes` | Conserva nombre/dirección; desactivación sin pérdida histórica. |
| USUARIOS | `auth.users`, `perfiles`, `jugadores`, datos personales restringidos y vínculos de responsables | Auth + Google administran identidad; desaparecen PASSWORD_HASH, SALT y tokens locales. Jugador puede existir sin cuenta; padre no se modela solo con texto de email. |
| USUARIO_DEPORTE | `inscripciones`, `planteles` y `asignaciones_rol` | Separa pertenencia deportiva del permiso docente. Conserva categoría, camiseta, sede y vigencia en el contexto correcto. |
| TORNEOS | `torneos`, temporada y reglas de puntuación | Conserva deporte/categoría/año; reglas explícitas, sin imponer puntuación de fútbol a todo deporte. |
| FECHAS | `fechas` | Conserva jornada y fecha, única por torneo/número; no confundir con instante de partido. |
| PARTIDOS | `partidos` | Conserva equipos, sede, estado, destacado y observaciones; agrega contexto/versión. Fecha de torneo opcional para amistosos. |
| RESULTADOS | `resultados` | FK correcta hacia partido y UNIQUE(partido_id); marcador no negativo, actualizado con cierre transaccional. |
| CONVOCATORIAS | `convocatorias` | Conserva transporte y respuesta; separa selección, confirmación y presencia. FK a inscripción elegible. |
| AUTORIZACIONES | `autorizaciones` | FK correcta hacia convocatoria; responsable verificado, versión del texto, fecha y evidencia privada. Validar el procedimiento institucional de firma antes de implementarlo. |
| TITULARES | `participaciones` o `titulares` referenciando convocatoria | Conserva titular/capitán/camiseta; captura si jugó para distinguirlo de haber sido convocado. La elección de tabla se fija en H1. |
| CAMBIOS | `cambios` | Conserva jugador entrante/saliente, período/minuto y motivo; ambos deben pertenecer al partido y cumplir reglas del deporte. |
| TIPOS_ESTADISTICA | `tipos_estadistica` | Catálogo vinculado a deporte y validaciones de evento. |
| ESTADISTICAS | `eventos_partido` | Conserva tipo, jugador, minuto y asistidor; admite evento de equipo cuando no corresponde autor individual. |
| TIPOS_SANCION | `tipos_sancion` | Conserva tipo y suspensión; vincular reglamento/deporte/alcance. |
| SANCIONES | `sanciones` | Conserva partido/jugador/minuto/motivo; relaciona evento disciplinario y cumplimiento sin contar dos veces la misma tarjeta. |

## Agregados necesarios para el MVP y los nuevos requisitos

| Agregado | Necesidad concreta |
|---|---|
| Temporadas y planteles | Categorías e inscripciones históricas estables; no mezclar años en reportes. |
| Entrenamientos y asistencias | Ya existen en MVP, pero faltan en el SQL recibido. Una fila por sesión/alumno. |
| Permisos y asignaciones de rol | Soporta el configurador solicitado; un rol nombrado no basta para autorizar operaciones. |
| Habilitaciones de identidad SSO | Vincula personas autorizadas con identidad Google verificada; no confía en datos editables desde cliente. |
| Vínculos responsables/jugadores | Autorizar consulta/firma por hijo, sin depender de email paterno libre. Acceso externo pendiente de definir. |
| Auditoría y versión de edición | Cambios de categorías, permisos y resultados trazables; control de concurrencia. |
| Reglas de categoría, si se automatiza | Extensión configurable por deporte/temporada; no se carga la fórmula actual como regla aprobada. |

## Correcciones que se mantienen

1. Tipos y defaults PostgreSQL: boolean, text, date/timestamptz, now() y claves generadas.
2. Invertir las FK de resultados y autorizaciones para que el hijo referencie al padre.
3. Eliminar lógica de credenciales propia; vincular la identidad verificada de Auth.
4. Corregir unicidad cuando intervienen NULL y establecer índices por FK/filtros necesarios.
5. Enforzar pertenencia al partido/plantel y estado válido al escribir, además de RLS por actor/ámbito.
6. Tratar el cierre/corrección del partido y la edición de permisos como operaciones consistentes; sin ventanas que dejen datos parciales o permitan quedarse sin administrador.

## Google Workspace: trabajo concreto para H1

1. Configurar aplicación de acceso Google en el entorno institucional, audiencia autorizada y redirects por ambiente; usar credenciales separadas donde corresponda.
2. Habilitar Google en Supabase Auth y verificar el callback esperado. Los secretos se configuran en el servicio, nunca en frontend ni en Git.
3. Configurar URL de FieldStats y redirects permitidos. Implementar acceso/cierre de sesión y errores de cuenta no habilitada; recuperación de credenciales se deriva a Google.
4. Validar token/identidad mediante Auth y la pertenencia institucional con atributos verificados del proveedor. El parámetro visual de dominio o un email enviado por el cliente no prueban pertenencia. La regla final de acceso no debe bloquear silenciosamente familias externas: ese colectivo queda sin habilitación hasta definir su acceso.
5. Inicializar el administrador designado de forma controlada y de una sola vez, vinculado a identidad verificada y UUID de Auth. No otorgar superadministrador a toda cuenta del dominio ni volver a asignarlo en cada login.
6. Asignar roles desde el configurador y verificar permisos vigentes en cada operación; revocación efectiva incluso con sesión ya abierta. Una cuenta Google autenticada sin asignación no accede a fichas deportivas.
7. Probar login válido, cuenta no habilitada, proveedor inválido, sesión vencida, baja de acceso FieldStats y cambios de rol. El cierre de sesión de FieldStats no promete cerrar la sesión global de Google.

Referencia oficial de implementación: [Supabase Auth con Google](https://supabase.com/docs/guides/auth/social-login/auth-google). Si la institución exige SAML: [SSO SAML para proyectos](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml). Este SSO es para usuarios de FieldStats; no configura el acceso del equipo al dashboard de Supabase.

H0 deja listo este mapa para H1. Los detalles de puntos, firma, sanciones, visibilidad y acceso familiar siguen pendientes; no impiden preparar la conversión del esquema ni los configuradores y no se consideran aprobados por defecto.
