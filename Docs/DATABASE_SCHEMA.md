# Arquitectura de Base de Datos - FieldStats

Este documento define la estructura de las hojas de Google Sheets para el sistema, siguiendo los principios de bases de datos relacionales propuestos.

## Regla de Oro: Los datos crecen hacia ABAJO, no hacia los LADOS.
En lugar de crear una hoja nueva por cada deporte (`ConvocatoriaDEP1`, `ConvocatoriaDEP2`, etc.), usamos una **única hoja** con una columna `IDD`. Si mañana agregas Volley (DEP3), no tienes que crear hojas nuevas ni cambiar el código, ¡solo agregas filas!

---

### 1. Tablas Maestras (Definen las entidades principales)

**Hoja: `DEPORTES`**
| IDD (PK) | Nombre   | Temporada |
|----------|----------|-----------|
| DEP1     | Fútbol   | 2026      |
| DEP2     | Handball | 2026      |

**Hoja: `JUGADORES_GENERAL`**
*(Lista maestra de alumnos en el colegio)*
| ID (PK)   | Nombre | Apellido | eMail | FNac | Colegio |
|-----------|--------|----------|-------|------|---------|
| 50123456  | Juani  | Muñoz    | ...   | ...  | Goethe  |
| 40123456  | Noah   | Bussi    | ...   | ...  | Goethe  |

*(Nota: Usar el DNI como ID es suficiente, no hace falta concatenar DNI+Email).*

---

### 2. Tablas Relacionales (Unen alumnos con deportes)

**Hoja: `JUGADORES_DEPORTES`**
*(Qué deportes juega cada alumno. Reemplaza a las hojas JUGADORESDEP1, DEP2, etc)*
| IDJ (PK)      | ID (Jugador) | IDD (Deporte) | Categoria | NumeroCamiseta |
|---------------|--------------|---------------|-----------|----------------|
| 50123456-DEP1 | 50123456     | DEP1          | Cadete    | 5              |
| 50123456-DEP2 | 50123456     | DEP2          | Cadete    | 12             |
| 40123456-DEP1 | 40123456     | DEP1          | Cadete    | 10             |

---

### 3. Tablas de Eventos y Estadísticas (Crecerán constantemente)

**Hoja: `PARTIDOS`**
| IDP (PK)      | IDD  | Fecha      | Hora  | Categoria | Rival | Resultado |
|---------------|------|------------|-------|-----------|-------|-----------|
| PAR-260506-01 | DEP1 | 06/05/2026 | 14:00 | Cadete    | Oakhill | Pendiente |

**Hoja: `CONVOCATORIAS`**
*(Quiénes van al partido y cómo empiezan)*
| IDP           | IDJ           | Convocado | Titular | MinutoEntrada |
|---------------|---------------|-----------|---------|---------------|
| PAR-260506-01 | 50123456-DEP1 | Sí        | Sí      | 0             |
| PAR-260506-01 | 40123456-DEP1 | Sí        | No      | 45            |

**Hoja: `ESTADISTICAS_PARTIDOS`**
*(Todo lo que ocurre durante el partido)*
| IDP           | IDJ           | Goles | Asistencias | Amarillas | Rojas |
|---------------|---------------|-------|-------------|-----------|-------|
| PAR-260506-01 | 50123456-DEP1 | 2     | 1           | 0         | 0     |
| PAR-260506-01 | 40123456-DEP1 | 0     | 1           | 1         | 0     |

**Hoja: `ASISTENCIA_ENTRENAMIENTO`**
*(Lo que ya programamos)*
| Fecha      | IDD  | IDJ           | Asistió |
|------------|------|---------------|---------|
| 06/05/2026 | DEP1 | 50123456-DEP1 | Sí      |

---

## ¿Cómo armamos el Podio Global (Dashboard)?
Dado que la tabla `JUGADORES_GENERAL` tiene el nombre base (Juani Muñoz), el sistema web simplemente hace esto:
1. Agarra el ID de Juani (50123456).
2. Busca en `ESTADISTICAS_PARTIDOS` todos los goles que tengan `IDJ` que empiecen con `50123456-DEP1` (Suma Goles de Fútbol).
3. Busca en la misma hoja los que empiecen con `50123456-DEP2` (Suma Goles de Handball).
4. Pinta la tabla final.
