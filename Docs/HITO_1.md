# Hito 1 — base Supabase

Fecha: 2026-09-17. Rama: `joaco`. Alcance de esta entrega: base local reproducible,
restricciones, RLS y primeros comandos de configuración. No crea un proyecto remoto,
no conecta las pantallas del MVP y no activa Google OAuth real.

## Implementado

- Tres migraciones versionadas: estructura, permisos/lecturas y comandos de administración.
- Las 19 tablas originales trazadas a PostgreSQL; se añaden temporadas, planteles,
  entrenamientos/asistencias, identidad separada, permisos, auditoría y bootstrap.
- Categorías iniciales: Menores, Cadetes y Juveniles. No se elige temporada, se copian
  datos del MVP ni se crea el administrador automáticamente.
- PK UUID, FK compuestas para impedir convocatoria/asistencia de otro plantel,
  resultado dependiente de partido, autorizaciones dependientes de convocatoria,
  marcadores no negativos y unicidad de camisetas activas por plantel.
- RLS en todas las tablas de aplicación; sin acceso anónimo. Los alumnos ven ficha,
  inscripción, asistencia y convocatoria propias; docentes, su ámbito.
- Identidades Google verificadas + perfil activo + rol/asignación: no basta tener
  cuenta Auth ni enviar un email desde el navegador.
- Configuradores mediante RPC: categorías, roles, habilitación de usuarios,
  asignación/revocación de roles. Son backend; las pantallas se construyen en H2.
- Protección serializada del último administrador y revocación de permiso efectiva
  en la siguiente operación, aun con el mismo JWT.
- Respuesta propia a convocatoria por RPC, con validación de plazo y estado.
- Auditoría privada de cambios en categorías, roles, permisos, perfiles y respuestas.
- Pruebas pgTAP con fixtures ficticios y rollback; workflow CI sin secretos remotos.

## Límites explícitos

H1 no implementa alta deportiva multitabla, cierre/corrección de partido, cálculo de
estadísticas, ciclo de entrenamientos ni pantallas. Las escrituras deportivas directas
están denegadas; sus RPC transaccionales se agregan en H2/H3. Un administrador autenticado
tampoco puede saltar esas operaciones mediante escrituras REST a las tablas.

Eventos, cambios y sanciones tienen integridad referencial, pero la validación completa
de reglas por deporte/participación y el cumplimiento de suspensiones todavía no están
implementados. Que exista una tabla no significa que el módulo esté operativo.

Los datos familiares/documentos y los eventos individuales de terceros no se abren a
alumnos. El portal familiar y sus permisos requieren las decisiones pendientes de H0.
Storage está deshabilitado localmente; no hay bucket de autorizaciones ni firma operativa.

La fórmula de categorías del MVP no se copia: la categoría se asigna al plantel y queda
vinculada a la temporada. Automatizar esa asignación requiere regla validada.

En H1, crear/asignar roles está reservado al administrador principal; los permisos
`roles.gestionar` y `usuarios.gestionar` no se pueden agregar a un rol personalizado.
Sí se pueden crear perfiles para las otras acciones disponibles y asignarles ámbitos.
Delegar administración de roles requiere un flujo adicional de delegación controlada.

Cada entrenamiento pertenece a un plantel en esta primera estructura. Si el referente
confirma sesiones conjuntas con varios planteles, se ajusta el esquema antes de H2.
Los límites actuales de DNI (7–10 dígitos) y camiseta (0–999) deben validarse en H0;
son restricciones técnicas iniciales, no una regla institucional confirmada.

## Reproducir localmente

Node 24, Docker y npm. Ejecutar desde la raíz del repositorio:

```bash
npm ci
npm run db:start
npm run db:reset
npm run db:lint
npm run db:test
npm run db:types
```

`db:reset` incluye `--local` y elimina datos locales. No usarlo como comando de despliegue.
La base no carga seeds. Los tests insertan identidades ficticias directamente en Auth
solo dentro de una transacción de prueba que se revierte; no simulan una autenticación
Google real ni envían correos. No ejecutar estos fixtures sobre un proyecto remoto.

Puertos locales: API 55321, PostgreSQL 55322 y Studio 55323. Proyecto Docker:
`fieldstats-joaco`. `private` no está expuesto en la API; todos sus helpers definen
`search_path` y grants explícitos. Los datos personales no están en el repositorio.

El workflow `.github/workflows/database.yml` reconstruye base, ejecuta lint/pgTAP y
comprueba que los tipos generados coincidan. Sus resultados remotos deben revisarse
en GitHub; agregar el workflow no garantiza por sí solo que Actions esté habilitado.

## Qué necesitamos para staging

1. **Proyecto Supabase institucional vacío**, propuesto `fieldstats-staging`, con
   PostgreSQL compatible con la versión local (17). Compartir el Project Reference
   o la URL del dashboard, no contraseña ni service key. Confirmar región y titular
   institucional antes de crear recursos facturables.
2. **Acceso autorizado** a ese proyecto mediante Supabase CLI (`npx supabase login`)
   o conexión de herramienta. Si lo administrás vos, podés autenticar la CLI localmente;
   no copiar el token al chat ni al repositorio.
3. **Acceso de administración a Google Cloud/Workspace** para crear un cliente OAuth
   web institucional, fijar audiencia permitida y autorizar el callback que informe
   Supabase. Las credenciales se cargan directamente en el proveedor Auth de Supabase.
4. **URL de la futura app de pruebas** para registrar redirects exactos. Para desarrollo
   local usamos `http://localhost:5173/auth/callback`; no es un dominio productivo.
5. Completar temporada, deportes/sedes iniciales y docentes habilitados cuando se
   empiece el alta operativa. No hace falta una exportación del MVP.

## Aplicar las migraciones a un proyecto de pruebas vacío

Después de probar localmente y verificar que el identificador corresponde a staging:

```bash
npx supabase login
npx supabase link --project-ref REF_STAGING
npx supabase db push --dry-run
npx supabase db push
```

No ejecutar `db reset --linked`. Si staging ya contiene tablas o datos, detener el
procedimiento y revisar su esquema antes de aplicar estas migraciones iniciales.
No publicar automáticamente a producción desde CI.

El SQL no configura por sí solo Google, redirects ni la audiencia del cliente OAuth.
En Supabase Auth habilitar Google, configurar Client ID/secret y deshabilitar acceso
por email/contraseña y proveedores no utilizados. Mantener la creación de identidades
OAuth necesaria para el primer ingreso; una identidad nueva queda sin perfil/permisos
hasta habilitarla. Restringir audiencia en Google conforme a la política institucional.

Para probar Google localmente, reemplazar los valores vacíos en `[auth.external.google]`
por `env("SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID")` y
`env("SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET")`, habilitar ese proveedor y guardar los
valores únicamente en `.env` (ignorado por Git). El callback de Google debe coincidir
con la URL exacta del servicio Auth local o remoto. Reiniciar servicios tras modificarlo.

## Habilitar al administrador principal

1. `j.salas@goethe.edu.ar` inicia sesión legítimamente con el proveedor Google configurado.
2. Un operador autorizado verifica su UUID en Auth. La función comprueba identidad
   Google, email verificado y coincidencia con el correo designado.
3. Desde SQL Editor autenticado como operador o una herramienta segura de servidor:

```sql
-- Sustituir por el UUID real verificado; no invocar desde el navegador.
select public.inicializar_administrador('UUID_VERIFICADO_DE_AUTH'::uuid);
```

Solo `service_role`/operador tiene acceso al bootstrap; el navegador no recibe esa clave.
La inicialización queda registrada y no se repite ni vuelve a conceder roles revocados.
La administración futura usa la sesión real del principal y RPC autorizadas.

El perfil activo de FieldStats es independiente del ciclo de vida de Google. Desactivar
un usuario en FieldStats retira su acceso a datos inmediatamente; no se implementó una
sincronización automática de bajas desde Workspace. Probar el procedimiento institucional
de bajas, sesiones y recuperación antes del lanzamiento.

## Evidencia y pendientes de salida

Verificación local ejecutada el 2026-09-17 con Supabase CLI `2.117.0` y PostgreSQL
local `17.6`: migraciones desde cero, `db lint`, 68 pruebas pgTAP, dos pruebas de
concurrencia y generación de tipos TypeScript pasaron. La generación de tipos emitió
una advertencia interna de listeners de Node, pero terminó con código 0 y produjo el
archivo esperado; no representa un error de esquema ni de permisos.

Para cerrar H1 de extremo a extremo faltan proyecto staging, Google real, primer login
verificado y prueba de permisos contra la API remota. H2 construirá las pantallas y RPC
operativas que consumen esta base.

Referencias: [migraciones Supabase](https://supabase.com/docs/guides/local-development/database-migrations),
[pruebas de BD](https://supabase.com/docs/guides/database/testing),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y
[Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google).
