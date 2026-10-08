# Plan de rediseño UX/UI de FieldStats

Estado: **plan aprobado para implementación incremental**.

Fuente: `design/design_handoff_fieldstats_ux/README.md`, `tokens.css`, `FieldStats UX Opciones.html` y las capturas del handoff. El HTML es una referencia visual e interactiva; no se copiará como código de producción.

## Objetivo

Reemplazar la experiencia actual, que monta casi todos los paneles en una única pantalla, por una aplicación orientada a tareas y rol:

- Docentes: acceder rápido a lo que tienen que resolver hoy.
- Alumnos: ver y responder convocatorias sin herramientas administrativas.
- Administradores: gestionar configuración y permisos desde una sección protegida.
- Todos: conservar el contexto de deporte, categoría y temporada sin mezclar datos.

El rediseño no cambia reglas de negocio, RPC, RLS, migraciones ni permisos. Cada etapa debe conservar los contratos existentes y validar los escenarios de H0 y H5.

## Decisiones visuales

- Sistema Modernist: fondo `#f3f2f2`, superficies `#eae9e9`, texto `#201e1d`, acento institucional `#006225`.
- Tipografía Archivo en pesos 400, 600 y 800.
- Radio 0 en controles y superficies; divisores de 1 px entre filas y 2 px entre secciones.
- Tarjetas planas, sin sombra, con borde superior verde de 2 px.
- Botones alineados a la izquierda y áreas táctiles mínimas de 44 px; acciones principales de 48 px.
- Foco visible con `outline` verde de 2 px.
- Tags para estado; no usar color como único indicador.

`tokens.css` será la fuente de tokens. Antes de incorporarlo hay que adaptar los nombres a `styles.css`, eliminar los radios/sombras actuales y evitar duplicar variables. La fuente remota de Google debe tener fallback y una decisión de carga documentada para conexiones lentas.

## Arquitectura UX objetivo

### Navegación por rol

Docente y administrador usarán un shell común:

- Operación: Hoy, Planteles y jugadores, Entrenamientos, Partidos.
- Reportes: Asistencia, Partidos y posiciones, Jugadores.
- Configuración: Usuarios y roles, Categorías, Deportes, Temporadas/sedes/equipos y Tipos de eventos.

Configuración sólo aparece con el permiso correspondiente. No depender únicamente de `isPrincipal` en frontend: la visibilidad debe derivarse de permisos ya validados por backend.

El alumno tendrá una vista reducida con sus convocatorias y resumen propio. No se montarán componentes docentes para un alumno.

- Escritorio: sidebar fija de 240 px y barra superior de contexto.
- Móvil: barra inferior fija con Hoy, Plantel, Partidos y Reportes; Configuración queda en el menú de usuario.
- Persistir la ruta completa en `sessionStorage`, extendiendo `fieldstats-section` sin volver a montar el dashboard ante `TOKEN_REFRESHED`.

### Contexto deportivo global

Crear `ContextoDeportivoProvider` con deporte, categoría y temporada. El contexto debe:

- Cargar sólo opciones visibles para el usuario.
- Exponer selección y cambio a listados, operación y reportes.
- Resetear dependencias inválidas al cambiar temporada/deporte.
- Reemplazar gradualmente los filtros locales de cada panel.
- Evitar mezclar temporadas (A19).

Durante la migración se mantendrán filtros locales como fallback hasta que cada pantalla consuma el contexto global.

## Etapas de implementación

### Etapa 0 — Base visual sin cambio de layout

Archivos principales: `src/styles.css`, `src/app/App.tsx`, `src/components/Modal.tsx`.

- Incorporar tokens y tipografía.
- Normalizar botones, inputs, selects, tablas, tags, mensajes, errores, loading y modales.
- Aplicar foco, contraste y tamaños táctiles.
- Mantener temporalmente la navegación actual para aislar regresiones visuales.

Aceptación: build exitoso, login y todos los formularios existentes conservan comportamiento, sin cambios de consultas.

### Etapa 1 — Shell, rutas y contexto

Archivos principales: `src/app/Dashboard.tsx`, nuevo `src/app/ContextoDeportivo.tsx`, nuevos componentes de navegación.

- Separar shell, sidebar/barra móvil y contenido de ruta.
- Resolver capacidades por rol/permisos.
- Implementar contexto deporte/categoría/temporada.
- Evitar montar los diez paneles simultáneamente.
- Conservar la sección al refrescar o renovar sesión.

Aceptación: docente, alumno y administrador ven sólo sus módulos; navegación móvil y escritorio funcionan; no hay acceso cruzado.

### Etapa 2 — Operación móvil: asistencia

Archivo principal: `src/features/operacion/Asistencia.tsx`.

- Encabezado con regreso a Hoy, contexto y contadores.
- Filas de alumnos con toggles P/A de 48 px.
- Estado sin registrar distinto de ausente.
- Progreso y footer fijo con “Marcar resto presentes” y guardado.
- Deshabilitar guardado si faltan alumnos, salvo decisión explícita del producto.
- Confirmar éxito sólo después de respuesta del servidor y proteger reintentos.

Aceptación: lista usable con una mano, sin duplicados ni falsos éxitos, y con estados de carga/error/reintento.

### Etapa 3 — Alumno: convocatorias

Archivo principal: `src/features/operacion/MisConvocatorias.tsx`.

- Tarjetas con rival, cuándo, dónde, plazo y estado.
- Toggles “Voy”/“No puedo” de 48 px.
- Ocultar edición después del cierre validado por servidor.
- Sección de anteriores y resumen personal.

Aceptación: el alumno sólo ve su información, puede responder dentro de plazo y recibe un estado claro después de guardar.

### Etapa 4 — Cierre de partido por pasos

Archivos principales: `CierrePartido.tsx`, `EventosPartido.tsx`.

- Unificar presencia, participación, goles y confirmación en un stepper.
- Filtrar participación y goleadores a presentes.
- Calcular marcador propio desde goles.
- Confirmación final con resumen y advertencia de auditoría.
- Mantener versión, idempotencia, motivo de corrección y permisos de backend.

Aceptación: partido completo de fútbol y handball, sin ausentes como goleadores/asistidores y sin cierre parcial ante error.

### Etapa 5 — Hoy y escritorio operativo

Nuevos componentes: `Hoy.tsx`, tabla de partidos y paneles de pendientes.

- Resumen de entrenamientos del día.
- Pendientes de asistencia, convocatorias y cierres.
- Estadísticas compactas con “Sin datos” cuando el denominador es cero.
- Tabla de partidos con estados y “—” para resultados pendientes.

Aceptación: un docente encuentra su próxima tarea sin recorrer paneles irrelevantes y un administrador puede revisar el estado general.

### Etapa 6 — Reportes y configuración

- Mover dashboards actuales al shell y hacer que consuman el contexto global.
- Mantener estados vacíos y filtros ya verificados.
- Reordenar configuración con la navegación protegida.
- Confirmar que las operaciones administrativas sólo aparecen para capacidades autorizadas.

Aceptación: reportes de asistencia/partidos conservan los resultados de H4 y la configuración no aparece para alumnos/docentes sin permiso.

### Etapa 7 — Validación y cierre visual

- Recorrido H5 completo en 390 px y escritorio.
- Teclado, foco, lector de pantalla básico, contraste y mensajes de error.
- Pruebas de reconexión, sesión vencida, doble clic y navegación atrás/adelante.
- Comparación contra las capturas del handoff.
- Build, pruebas SQL y benchmark sin regresiones.

## Mapeo de pantallas actuales

| Actual | Destino |
|---|---|
| `Dashboard.tsx` con paneles apilados | Shell + rutas + Hoy |
| `PlantelesJugadores.tsx` | Planteles y jugadores |
| `Asistencia.tsx` | Tomar asistencia móvil |
| `Partidos.tsx` | Tabla y alta de partidos |
| `Convocatorias.tsx` | Gestión docente de convocatorias |
| `MisConvocatorias.tsx` | Vista única del alumno |
| `CierrePartido.tsx` + `EventosPartido.tsx` | Stepper de cierre |
| `DashboardAsistencia.tsx` | Reportes / Asistencia |
| `DashboardPartidos.tsx` | Reportes / Partidos y posiciones |
| `configuracion/*.tsx` | Configuración protegida |

## Dependencias y riesgos

- El frontend actual identifica principalmente `isPrincipal`; para ocultar módulos por capacidad habrá que reutilizar una fuente de permisos ya validada, sin confiar en datos editables del cliente.
- El handoff menciona Lucide, pero el proyecto no tiene `lucide-react`; incorporarlo requiere una decisión de dependencia y revisión de bundle.
- El contexto global puede cambiar consultas y estados de carga; migrar pantalla por pantalla, con una ruta de compatibilidad.
- El HTML de diseño contiene datos ficticios y estados simulados; ningún texto o fixture del prototipo debe llegar a producción.
- El rediseño debe preservar todos los contratos Supabase y las pruebas SQL existentes.

## Orden de trabajo y entregables

Cada etapa se implementará en un commit/PR separado dentro de `joaco`, con build y pruebas relevantes antes de continuar. No iniciar el piloto H5 hasta completar al menos las etapas 0 a 3 y validar el recorrido móvil principal.
