# Arquitectura y Flujo de Procesos (FieldStats MVP)

Este documento detalla cómo los conceptos lógicos se traducen a funciones y lenguaje de programación en nuestro proyecto.

## 1. Seguridad: Hashing y Salting
**El Problema:** Guardar contraseñas como "123456" en texto plano en la base de datos (Excel/Sheets) significa que si alguien la ve, le roba la cuenta al usuario.
**¿Qué es el Hashing?** Es una función matemática (SHA-256) que transforma cualquier texto en una cadena de caracteres de longitud fija. "123456" siempre se convertirá en `8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92`. Es de "un solo sentido": no puedes hacer el proceso inverso para averiguar la contraseña original.
**¿Qué es el Salting?** Los hackers tienen listas precalculadas ("Rainbow Tables") de los hashes de contraseñas comunes. Para evitarlo, agregamos un texto secreto (el "Salt") a la contraseña antes de hashearla.

**Cómo funciona en nuestro código:**
- El usuario ingresa: `hola123`.
- Nuestro código le suma el Salt: `hola123GoetheFieldStats_2026_MVP!`.
- Se le aplica SHA-256 a ese texto combinado y se guarda en la Hoja `USUARIOS`.
- **Al Iniciar Sesión:** ¡Es exactamente como dedujiste! El sistema toma la contraseña que el usuario intenta ingresar, le pega el mismo texto Salt, le aplica SHA-256, y comprueba si el resultado coincide con lo que está en la hoja de cálculo. 

---

## 2. El Flujo de Registro (Workflow)

### A. Alta de Alumno (Por el Profesor)
- **Función frontend:** `guardarNuevoJugador()` (lee las cajas de texto de la pantalla).
- **Proceso:** Revisa si se ingresaron todos los datos obligatorios, incluyendo los deportes y el N° de camiseta para cada deporte.
- **Backend:** Llama a `registrarJugadorBackend(datos)`.
  1. Verifica que la camiseta no esté repetida para esa Categoría y ese Deporte específico.
  2. Crea la fila en `JUGADORES_GENERAL` (Tabla Maestra) con el DNI, Nombre, Apellido, Email y Fecha de Nacimiento.
  3. Crea una o más filas en `JUGADORES_DEPORTES` (Tabla Relacional) vinculando el DNI al Deporte (IDD), y calcula automáticamente la Categoría (Lógica a programar con tus fechas).

### B. Registro de Cuenta del Jugador (Crear Credenciales)
- **Función frontend:** `crearCuentaJugador()`.
- **Proceso:** El jugador entra a la Web App, pone su DNI, un Token secreto que le dio el profe (ej: `JUGADOR2026`) y su contraseña.
- **Backend:** Llama a `registrarCuentaJugador()`. Comprueba el Token. Si es correcto, le aplica el Hashing a la contraseña y guarda una nueva fila en la hoja `USUARIOS` con `Rol = jugador` y `Confirmado = Si`.

### C. Registro de Externos (Padres)
- **Función frontend:** `crearCuentaExterno()`.
- **Proceso:** Un padre entra, pone su email y crea su contraseña.
- **Backend:** Llama a `registrarExterno()`. Hashea la contraseña, guarda en `USUARIOS` con `Confirmado = No`.
- **El correo:** El backend usa `GmailApp.sendEmail()` para mandarle un correo al padre. El correo contiene un enlace especial (la URL de tu Web App + el texto `?confirmar=email@delpadre.com`).

### D. Confirmación por Enlace (doGet)
- **Función backend:** `doGet(e)`. Esta función es especial. Es la puerta de entrada de toda aplicación web en Apps Script.
- **Proceso:** Cuando alguien hace clic en un link, `doGet` revisa si en la URL hay una orden de confirmación (el texto `?confirmar=...`).
  - Si existe esa orden, va a la hoja `USUARIOS`, busca el email, y cambia el `No` por `Si`. Le muestra un mensaje HTML de éxito al padre y termina.
  - Si NO hay orden de confirmación, carga el sistema web normal (`index.html`).

---

## 3. Toma de Asistencia (Upsert)
- **Frontend:** Al profesor le aparece la lista de alumnos de ese deporte gracias a `obtenerJugadores()`. El profesor mueve los botones (sliders) y le da a Guardar (`guardarAsistencia()`).
- **Backend:** Llama a `guardarAsistenciaBD()`.
- **El patrón Upsert (Update or Insert):** Para evitar datos duplicados, antes de guardar, el código recorre la hoja `Asistencia` de abajo hacia arriba buscando si ya hay un registro con la misma `Fecha de Hoy` + `Este Deporte` + `Este DNI`.
  - Si **SÍ** lo encuentra: Cambia la columna "Asistió" de esa misma fila (Actualiza).
  - Si **NO** lo encuentra: Crea una fila nueva al final de la tabla (Inserta).
