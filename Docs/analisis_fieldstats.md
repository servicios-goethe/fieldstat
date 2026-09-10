# 🔍 Análisis FieldStats — Tarea 1

## 1. ESTRUCTURA DE DATOS (Google Sheets)

### Hojas existentes y su rol

| Hoja | Columnas reales (en el código) | Rol |
|------|-------------------------------|-----|
| `USUARIOS` | `[0] ID_Usuario (DNI/email)` · `[1] PasswordHash` · `[2] Rol` · `[3] Confirmado` · `[4] Activado` · `[5] Email` | Auth de jugadores, profesores y externos |
| `JUGADORES_GENERAL` | `[0] DNI` · `[1] Nombre` · `[2] Apellido` · `[3] Email` · `[4] FNac` · `[5] Colegio` | Lista maestra de alumnos |
| `JUGADORES_DEPORTES` | `[0] IDJ (DNI-DEP#)` · `[1] DNI` · `[2] IDD` · `[3] Categoria` · `[4] NumeroCamiseta` | Qué deportes juega cada alumno |
| `PARTIDOS` | `[0] IDP` · `[1] Local` · `[2] Visitante` · `[3] Deporte` · `[4] Categoria` · `[5] Fecha` · `[6] Hora` · `[7] GolesLocal` · `[8] GolesVisitante` · `[9] Estado` | Partidos agendados |
| `CONVOCATORIAS` | `[0] IDP` · `[1] ID_Jugador (DNI)` · `[2] Convocado (Si/No)` · `[3] Titular (Si/No)` | Quiénes van a cada partido |
| `ESTADISTICAS_PARTIDOS` | `[0] IDP` · `[1] ID_Goleador (DNI)` · `[2] ID_Asistidor (DNI)` | Un registro por gol |
| `Asistencia` | `[0] Fecha` · `[1] IDD` · `[2] ID_Jugador` · `[3] Nombre` · `[4] Asistió (Sí/No)` | Asistencia a entrenamientos |

> **Dato clave**: `CONVOCATORIAS` guarda el DNI crudo del jugador (no el IDJ `DNI-DEP#`).
> `ESTADISTICAS_PARTIDOS` también usa el DNI crudo. Esto es consistente.

---

## 2. FUNCIONES BACKEND (Code.gs)

### Ya implementadas y funcionales

| Función | Qué hace | Usada por |
|---------|----------|-----------|
| `verificarLogin()` | Login con hash SHA-256 | Login screen |
| `registrarJugadorBackend()` | Alta de alumno en GENERAL + DEPORTES + USUARIOS | Profesor |
| `obtenerJugadores(dep, cat?)` | Lista jugadores activados por deporte | Asistencia, Convocatoria |
| `guardarAsistenciaBD()` | UPSERT de asistencia a entrenamiento | Asistencia |
| `obtenerPartidosFiltrados(dep, estado)` | Partidos por deporte y estado | Convocatoria, Goles |
| `crearPartidosBD()` | Crea partidos por categoría | Partidos |
| `guardarConvocatoriaBD()` | UPSERT de convocatoria | Convocatoria |
| `guardarPartidoFinalizadoBD()` | Guarda resultado + goles | Wizard de goles |
| `obtenerDashboardAdmin(dep)` | Partidos finalizados con stats por jugador | ❌ Sin pantalla |
| `obtenerEstadisticasJugador(dni)` | Stats completas de un jugador | ❌ Sin pantalla |
| `obtenerMisConvocatorias(dni)` | Convocatorias pendientes del jugador | ❌ Sin pantalla |

### Lo que devuelve cada función de dashboard

**`obtenerDashboardAdmin(deporteIDD)`** → `Array` de partidos finalizados:
```js
[{
  idp: "PAR-DEP1-Cadetes-20260506",
  label: "Goethe 2 - 1 Rival (06/05/2026)",
  stats: {
    "12345678": { nombre: "Juan Muñoz", goles: 2, asistencias: 1 },
    "87654321": { nombre: "Pedro López", goles: 0, asistencias: 0 }
  }
}]
```

**`obtenerEstadisticasJugador(dni)`** → Objeto con resumen:
```js
{
  partidosJugados: 5,
  golesTotales: 3,
  asistenciasTotales: 2,
  promedioGoles: "0.60",
  historial: ["Goethe 2 - 1 Rival (06/05/2026)", ...]
}
```

**`obtenerMisConvocatorias(dni)`** → `Array` de partidos pendientes:
```js
[{
  idp: "PAR-DEP1-Cadetes-20260601",
  label: "Goethe vs Rival - 01/06/2026 14:00",
  titular: true
}]
```

---

## 3. ESTADO DE CADA FUNCIONALIDAD PENDIENTE

### A. Dashboard del Profesor (`obtenerDashboardAdmin`)
- **Backend**: ✅ 100% implementado
- **Frontend**: ❌ Pantalla faltante — el botón dice `alert('en desarrollo')`
- **Datos disponibles**: goles, asistencias, por partido, por jugador
- **Lo que falta**: pantalla `screen-dashboard-admin` + función JS que llame a `obtenerDashboardAdmin`

### B. Dashboard de Estadísticas del Jugador (`obtenerEstadisticasJugador`)
- **Backend**: ✅ 100% implementado
- **Frontend**: ❌ Sin pantalla — botón dice `alert('en desarrollo')`
- **Datos disponibles**: partidos jugados, goles, asistencias, promedio, historial
- **Lo que falta**: pantalla `screen-mis-stats` + función JS + saber el DNI del jugador logueado

### C. Mis Convocatorias del Jugador (`obtenerMisConvocatorias`)
- **Backend**: ✅ 100% implementado
- **Frontend**: ❌ Sin pantalla — botón dice `alert('en desarrollo')`
- **Datos disponibles**: partidos pendientes donde está convocado + si es titular
- **Lo que falta**: pantalla `screen-mis-convocatorias` + función JS + DNI del jugador

### D. Dashboard General (vista pública)
- **Backend**: ⚠️ Parcial — `obtenerDashboardAdmin` puede usarse, pero no hay función para ranking cruzado de deportes
- **Frontend**: ❌ Sin pantalla
- **Lo que falta**: backend agregado + pantalla `screen-dashboard-general`

---

## 4. BUGS CRÍTICOS DETECTADOS

### 🔴 BUG 1: El DNI del jugador NO se guarda en sesión
**Archivo**: `funciones.html`
**Problema**: Cuando un jugador hace login, el backend devuelve `{ success: true, role: 'jugador', dni: "12345678" }`.
Sin embargo, el frontend en `login()` solo usa `r.role` para navegar y **descarta `r.dni`**. No hay variable global que guarde el DNI del jugador logueado.

**Consecuencia directa**: Las funciones `obtenerEstadisticasJugador(dni)` y `obtenerMisConvocatorias(dni)` no tienen con qué llamarse. Las 3 funcionalidades pendientes del jugador están bloqueadas por este bug.

**Fix mínimo (2 líneas)**:
```js
// Agregar variable global
let dniJugadorActual = '';

// En el handler de login(), capturar el DNI:
if (r.role === 'jugador') {
  dniJugadorActual = r.dni; // ← ESTO FALTA
  navigateTo('screen-jugador');
}
```

### 🟡 BUG 2: `obtenerJugadores()` filtra por activación (bloquea al profesor)
**Archivo**: `Code.gs` línea 186-188
**Problema**: Solo incluye jugadores con `Activado === 'Si'`. Si el alumno no activó su cuenta web, el profesor no puede convocarlo ni tomarle asistencia.
**Fix**: Remover el filtro de activación para uso del profesor. El profesor debe ver a todos los jugadores registrados por él, sin importar si activaron o no su cuenta de portal.

### 🟡 BUG 3: `calcularCategoria()` siempre retorna "Cadetes"
**Archivo**: `Code.gs` línea 122
**Problema**: La categoría hardcodeada afecta el filtrado de convocatorias por partido.
Si un partido es de "Menores" pero todos los jugadores están en "Cadetes", el plantel de convocatoria aparece vacío.

### 🟠 BUG 4: `ejecutarGuardadoFinal()` referencia `r` en lugar de `res`
**Archivo**: `funciones.html` línea 342
**Problema**: En el catch del error, se usa `r.msg` pero el parámetro del callback se llama `res`. Esto hace que al fallar el guardado final de un partido, la app no muestre el mensaje de error sino que tire un error de JS.
```js
// ACTUAL (roto):
.withSuccessHandler(res => { if (res.success) {...} else alert(r.msg); })
// CORRECTO:
.withSuccessHandler(res => { if (res.success) {...} else alert(res.msg); })
```

---

## 5. MAPA DE DEPENDENCIAS PARA LOS 4 DASHBOARDS

```
LOGIN
  └── r.dni → dniJugadorActual [BUG 1 sin resolver]
        │
        ├── Mis Convocatorias → obtenerMisConvocatorias(dniJugadorActual) ✅ backend listo
        ├── Mis Estadísticas → obtenerEstadisticasJugador(dniJugadorActual) ✅ backend listo
        └── Dashboard General → necesita agregación cruzada (⚠️ backend parcial)

PROFESOR
  └── Dashboard Admin → obtenerDashboardAdmin(dep) ✅ backend listo
        └── Pantalla faltante en index.html + función JS en funciones.html
```

---

## 6. PRIORIDAD DE TRABAJO (según impacto y esfuerzo)

| # | Funcionalidad | Esfuerzo | Impacto | Backend | Frontend |
|---|--------------|----------|---------|---------|----------|
| 1 | Fix BUG 1 (guardar DNI) | 🟢 5 min | 🔴 Crítico | ✅ | ❌ |
| 2 | Dashboard Profesor | 🟢 Bajo | 🔴 Alto | ✅ | ❌ |
| 3 | Mis Convocatorias | 🟢 Bajo | 🟡 Medio | ✅ | ❌ |
| 4 | Mis Estadísticas | 🟢 Bajo | 🟡 Medio | ✅ | ❌ |
| 5 | Dashboard General | 🟡 Medio | 🟡 Medio | ⚠️ | ❌ |
| 6 | Fix activación (BUG 2) | 🟢 Bajo | 🔴 Crítico | ❌ | ✅ |

**Recomendación para el equipo**: El BUG 1 (guardar DNI) es prerequisito compartido para las funcionalidades 3 y 4. La persona a cargo debe aplicar ese fix primero.
