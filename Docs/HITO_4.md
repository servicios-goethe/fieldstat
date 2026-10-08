# Hito 4: reportes y dashboards

Estado: **cerrado; verificado el 2026-10-07**.

Objetivo: transformar los datos operativos del Hito 3 en consultas útiles para docentes,
administración y jugadores, sin mostrar porcentajes engañosos cuando todavía no hay datos.

## Alcance

- Resumen por plantel y temporada.
- Asistencia por jugador y entrenamiento.
- Partidos jugados, resultados y eventos.
- Filtros por deporte, categoría, temporada y plantel.
- Estados vacíos explícitos: “sin entrenamientos”, “sin partidos” y “sin datos suficientes”.
- Respeto del ámbito del docente y de la privacidad del jugador.
- Consultas agregadas en el backend para evitar cargar miles de filas innecesariamente.

## Orden de implementación

1. ✅ Consultas agregadas y permisos de lectura.
2. ✅ Dashboard de asistencia.
3. ✅ Dashboard de partidos y resultados.
4. ✅ Filtros y estados vacíos.
5. ✅ Fixtures de fútbol y handball verificadas; 74 pruebas exitosas en Supabase local.
6. ✅ Benchmark local con 4.000 jugadores, 20 entrenamientos y 80.000 asistencias: 445,54 ms de ejecución SQL; transacción revertida.

## Criterio de cierre

- Los totales coinciden con los datos operativos.
- Un docente sólo ve sus planteles.
- Un jugador sólo ve sus propios datos personales y deportivos permitidos.
- Sin actividad no se muestra 0% ni 100% por defecto.
- Las consultas funcionan con datos vacíos y con múltiples planteles.
- El reporte de asistencia se mantiene por debajo del objetivo inicial de 2 segundos de SQL con el volumen de referencia probado.
