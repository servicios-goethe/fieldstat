# Hito 3: ciclo de partido

Estado: **implementado; pendiente de aceptación final**.

## Entregado

- Alta y listado de partidos por plantel, rival, sede, fecha y estado.
- Convocatorias de inscripciones activas del plantel.
- Respuesta propia del jugador con aceptación, rechazo y transporte.
- Titularidad, capitanía, presencia y participación.
- Resultado y cierre transaccional del partido.
- Eventos configurables por deporte desde Configuración.
- Registro de eventos con jugador, equipo, minuto y motivo.
- Registro de cambios entre jugadores convocados.
- Bloqueo de modificaciones después del cierre.
- Permisos de docentes limitados al ámbito asignado y permisos globales corregidos para el administrador.

## Aceptación pendiente

1. Repetir el flujo completo con fútbol y handball.
2. Verificar que un docente no pueda operar otro plantel.
3. Verificar que una cuenta no vinculada a un jugador no pueda responder convocatorias ajenas.
4. Repetir guardados con doble clic y confirmar que no se dupliquen convocatorias, resultados ni participaciones.
5. Confirmar que eventos y cambios quedan bloqueados luego del cierre.

El Hito 4 comienza después de esta aceptación: reportes, dashboards y estados vacíos.

## Checklist de prueba punta a punta

### Preparación

- [ ] Crear o confirmar un deporte de prueba de fútbol.
- [ ] Crear o confirmar un deporte de prueba de handball.
- [ ] Crear un equipo propio y un equipo rival para cada deporte.
- [ ] Crear una sede y una temporada activa.
- [ ] Crear un plantel activo por deporte.
- [ ] Crear al menos dos jugadores por plantel.
- [ ] Crear una segunda inscripción para comprobar que la ficha puede participar en más de un plantel.
- [ ] Confirmar que las cuentas de prueba Google estén habilitadas y tengan el rol esperado.
- [ ] Vincular una cuenta de jugador a una ficha deportiva para probar la respuesta propia.

### Partido y convocatoria

- [ ] Ingresar como docente con ámbito asignado.
- [ ] Crear un partido pendiente con fecha, rival, sede e inicio válidos.
- [ ] Confirmar que el cierre de confirmación sea anterior al inicio.
- [ ] Verificar que el partido aparezca en el listado con sus datos.
- [ ] Convocar dos jugadores del plantel.
- [ ] Retirar una convocatoria y volver a convocarla.
- [ ] Intentar convocar un jugador de otro plantel y confirmar que el backend lo rechace.
- [ ] Ingresar como jugador vinculado y verificar que sólo aparezca su convocatoria.
- [ ] Responder “Acepto” con transporte.
- [ ] Responder “Rechazo” en otra convocatoria.
- [ ] Confirmar que el docente vea las respuestas actualizadas.
- [ ] Intentar responder desde una cuenta no vinculada y confirmar que sea rechazado.

### Participación, eventos y cambios

- [ ] Marcar un jugador como titular.
- [ ] Marcar un capitán.
- [ ] Marcar presencia y participación efectiva.
- [ ] Crear un evento desde un tipo configurado por el administrador.
- [ ] Verificar que el docente no pueda inventar un código de evento libre.
- [ ] Registrar un evento con jugador, equipo, minuto y motivo.
- [ ] Registrar un cambio entre dos jugadores convocados.
- [ ] Confirmar que los campos de evento y cambio sean independientes.
- [ ] Confirmar que el historial muestre eventos y cambios guardados.

### Resultado y cierre

- [ ] Registrar goles local y visitante.
- [ ] Cerrar el partido.
- [ ] Confirmar que el resultado permanezca visible.
- [ ] Confirmar que el partido cambie a `finalizado`.
- [ ] Intentar modificar participación, evento, cambio o resultado después del cierre.
- [ ] Confirmar que todas esas operaciones sean rechazadas por el backend.

### Seguridad y consistencia

- [ ] Ingresar como docente de otro ámbito y confirmar que no vea ni modifique el partido.
- [ ] Confirmar que un docente no vea Configuración.
- [ ] Confirmar que sólo el administrador pueda configurar tipos de eventos.
- [ ] Hacer doble clic en convocar y confirmar que no se duplique la convocatoria.
- [ ] Hacer doble clic al guardar resultado y confirmar que no se duplique.
- [ ] Repetir el recorrido completo con fútbol y handball.
- [ ] Registrar cualquier fallo con usuario, partido, hora, pantalla y mensaje visible.
