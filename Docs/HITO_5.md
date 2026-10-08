# Hito 5: piloto

Estado: **iniciado**.

Objetivo: validar FieldStats con usuarios representativos y eventos deportivos reales o controlados antes de habilitar producción. El piloto se ejecuta sobre staging, con cuentas y datos separados de producción.

## Criterios de entrada

- [x] Hitos 1 a 4 cerrados.
- [x] Build de producción validado.
- [x] Google SSO operativo en staging.
- [x] Roles de administrador, docente y alumno configurables.
- [x] Migraciones remotas al día.
- [ ] Catálogos del piloto confirmados: deportes, categorías, temporadas, sedes y equipos.
- [ ] Participantes definidos: administrador, al menos un docente de fútbol, un docente de handball y alumnos representativos.
- [ ] Fecha y eventos del piloto acordados.

## Participantes y datos

Usar cuentas Google institucionales de prueba o participantes autorizados. No copiar datos de la planilla MVP ni usar credenciales compartidas. Registrar únicamente los datos necesarios para el piloto y eliminar los datos de prueba al finalizar.

Roles mínimos:

| Rol | Validación principal |
|---|---|
| Administrador | Catálogos, usuarios, roles y permisos |
| Docente de fútbol | Plantel, entrenamientos, asistencia, convocatorias y partidos de fútbol |
| Docente de handball | Mismo recorrido, limitado a handball |
| Alumno | Acceso propio, respuesta de convocatorias y privacidad |

## Recorrido funcional de aceptación

### Preparación administrativa

- [ ] Ingresar con `j.salas@goethe.edu.ar`.
- [ ] Confirmar categorías, deportes, temporada, sedes y equipos.
- [ ] Habilitar los docentes y verificar sus roles/ámbitos.
- [ ] Crear planteles de fútbol y handball.
- [ ] Crear alumnos e inscribirlos en sus planteles.

### Fútbol

- [ ] El docente de fútbol sólo ve sus planteles.
- [ ] Crear un entrenamiento y marcar presentes/ausentes.
- [ ] Crear un partido con rival, sede y cierre de confirmación.
- [ ] Convocar al menos dos alumnos.
- [ ] Responder una convocatoria como alumno y verificar que el docente vea la respuesta.
- [ ] Registrar titulares, capitán, presencia y participación.
- [ ] Registrar al menos un gol y un cambio.
- [ ] Cerrar el partido con resultado.
- [ ] Verificar dashboard de asistencia y dashboard de partidos.

### Handball

- [ ] Repetir el recorrido con el docente de handball.
- [ ] Confirmar que el docente de handball no pueda leer ni modificar fútbol.
- [ ] Verificar reportes con un plantel sin entrenamientos o sin partidos.

### Alumno y sesión

- [ ] El alumno sólo ve su ficha, sus inscripciones y sus convocatorias.
- [ ] El alumno puede aceptar o rechazar dentro del plazo.
- [ ] Una convocatoria vencida no admite cambios.
- [ ] Cerrar y volver a abrir la pestaña conserva la sección actual.
- [ ] Sesión vencida vuelve al login sin mostrar datos protegidos.
- [ ] Probar móvil y escritorio.
- [ ] Probar conexión normal y una reconexión breve.

## Registro diario del piloto

Para cada sesión registrar fecha, usuario/rol, dispositivo, red, flujo ejecutado, resultado y evidencia. No incluir DNI, tokens ni credenciales en capturas o tickets.

| Fecha | Rol | Deporte | Flujo | Resultado | Defecto/evidencia |
|---|---|---|---|---|---|
| | | | | | |

Prioridad de defectos:

- **Crítico:** acceso cruzado, pérdida o corrupción de datos, imposibilidad de iniciar sesión.
- **Alto:** un flujo obligatorio no se puede completar o muestra información incorrecta.
- **Medio:** workaround claro, sin pérdida de datos.
- **Bajo:** presentación, textos o mejoras menores.

## Criterio de salida

- [ ] Cero defectos críticos o altos abiertos.
- [ ] Ningún docente accede al deporte o plantel equivocado.
- [ ] No hay datos duplicados ni operaciones confirmadas ante errores.
- [ ] Los recorridos de fútbol y handball pasan en móvil.
- [ ] Las consultas comunes mantienen p95 menor a 2 segundos en la red representativa.
- [ ] Administrador y docentes pueden operar sin asistencia técnica continua.
- [ ] Se documentan pendientes de H6 y una fecha de corte propuesta.

El cierre del Hito 5 requiere la aprobación explícita del responsable deportivo y del administrador principal. El piloto no habilita escrituras en producción por sí solo.
