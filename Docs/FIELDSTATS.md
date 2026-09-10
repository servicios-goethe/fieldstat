 

**FIELDSTATS**

*Plataforma de Gestión Deportiva para Colegios K-12*

| PROPUESTA DE NEGOCIO Versión 1.0  —  Abril 2026 |
| :---: |

 

| Proyecto | FieldStats — App de Gestión Deportiva |
| :---- | :---- |
| **Institución** | Colegio Goethe (Deutsche Schule) |
| **Equipo** | Taller Fullstack — Programación K12 |
| **Versión** | MVP 1.0 |
| **Fecha** | Abril 2026 |
| **Confidencialidad** | Documento de uso interno — no distribuir |

 

 

# **1\. Resumen Ejecutivo**

FieldStats es una plataforma web responsive diseñada para digitalizar y simplificar la gestión deportiva en colegios K-12. Nace como respuesta directa a un problema concreto identificado en el Colegio Goethe: los profesores de educación física gestionan convocatorias, estadísticas y seguimiento de jugadores a través de planillas de papel, grupos de WhatsApp y hojas de cálculo dispersas, lo que genera pérdida de información, ineficiencia operativa y falta de visibilidad histórica del rendimiento de los alumnos.

 

| Propuesta de Valor Central •        Digitalizamos en una sola plataforma todo el ciclo de gestión deportiva intercolegial. •        Reducimos el tiempo administrativo de los profesores en más de un 70%. •        Proveemos datos históricos y estadísticas en tiempo real para decisiones más inteligentes. •        Habilitamos una comunicación transparente con padres y alumnos sobre convocatorias y rendimiento. |
| :---- |

 

El producto apunta inicialmente al mercado de colegios privados bilingües en Argentina, con un primer cliente ancla (Colegio Goethe) y una arquitectura escalable para replicar el modelo en otras instituciones similares.

 

# **2\. El Problema**

## **2.1 Contexto**

El fútbol intercolegial K-12 involucra múltiples categorías (de kínder hasta clase 12\) que compiten cada fin de semana desde marzo hasta mayo. Cada partido genera datos de convocatoria, asistencia, estadísticas individuales (goles, asistencias, tarjetas) y necesidades logísticas (transporte, autorización de padres). Actualmente, toda esta información se gestiona de forma fragmentada y manual.

 

## **2.2 Problemas Identificados (Validados con el cliente)**

Entrevistamos a Hernán, profesor referente del área deportiva del colegio. Estos son los problemas que confirmó:

 

| Problema | Descripción | Impacto |
| :---- | :---- | :---- |
| Estadísticas post-partido | Los profes recopilan goles, asistencias y sanciones por grupos de WhatsApp. Al cierre de año, deben revisar mensajes de WhatsApp de enero para armar el balance. | CRÍTICO |
| Sin registro de asistencia a entrenamientos | Hernán no toma lista en los entrenamientos extra del martes y viernes. Sin ese dato, no puede evaluar compromiso ni justificar decisiones de titularidad. | CRÍTICO |
| Imposibilidad de comparar evolución histórica | No existe forma práctica de ver la curva de progreso de un alumno a lo largo de los años. | ALTO |
| Transparencia hacia los padres | La pregunta '¿por qué no convocan a mi hijo?' no tiene una respuesta objetiva y documentada. | ALTO |
| Gestión de espacios en primaria | Los alumnos de primaria rompen la cancha y generan conflictos en los recreos por falta de segmentación de espacios. | MEDIO |
| Sin visibilidad nocturna de la cancha | La cancha no tiene iluminación adecuada. Hernán identificó que un reflector a control remoto cambiaría la dinámica de entrenamiento. | MEDIO |

 

## **2.3 Soluciones Actuales Insuficientes**

•        Excel y Google Sheets: usados para comparación puntual, no en tiempo real.

•        Papel y libreta: útiles para exterior, pero no digitalizan el dato.

•        WhatsApp: canal de comunicación, no de gestión estructurada de datos.

•        Ninguna herramienta integra convocatoria \+ estadística \+ historial \+ comunicación.

 

# **3\. La Solución — FieldStats**

## **3.1 Descripción del Producto**

FieldStats es un sistema web responsive (mobile-first) que centraliza toda la gestión deportiva de un colegio en una sola plataforma. Está diseñado con el principio rector de minimizar la cantidad de taps necesarios para completar cada tarea, reduciendo la fricción al máximo para que los profesores lo adopten sin resistencia.

 

## **3.2 Módulos del MVP**

 

| Módulo | Descripción |
| :---- | :---- |
| Gestión de Jugadores | Alta, baja y modificación (ABM) de jugadores con datos completos: nombre, apellido, fecha de nacimiento, DNI, email, número de camiseta, posición, categoría asignada automáticamente por fecha de nacimiento. |
| Gestión de Partidos | Registro de partidos con fecha, hora, categoría, equipos (local/visitante) y resultado. ID único generado automáticamente. |
| Convocatorias | Generación de lista de convocados por partido. Registro de: titular/suplente, asistencia confirmada, permiso de padres firmado y método de transporte. |
| Estadísticas por Partido | Carga de goles (con minuto), asistencias, tarjetas amarillas y rojas por jugador por partido. |
| Jugador Destacado | El profesor asigna el jugador destacado del partido según su criterio (superación personal, no necesariamente rendimiento estadístico). |
| Dashboard de Estadísticas | Ranking por deporte: goles, asistencias, tarjetas. Evolución histórica individual. Vistas por categoría y por jugador. |
| Boletín Deportivo | Resumen exportable/imprimible con los highlights del partido para comunicación institucional. |

 

## **3.3 Modelo de Datos (Estructura base validada)**

La arquitectura de datos fue diseñada y parcialmente implementada en la fase de anteproyecto:

 

| Entidad | Campos |
| :---- | :---- |
| Jugadores | Nombre, Apellido, FNac, DNI, eMail, Número, Colegio, Categoría (asignada por regla lógica sobre FNac) |
| Partidos Jugados | ID, Fecha, Hora, Categoría, Local, Visitante, GolesL, GolesV |
| Convocados | ID (compuesto), IDPartido, DNI, Titular, Asistió, Permiso |
| Estadísticas por Partido | IDPartido, DNI, Goles, Tarjeta Roja, Tarjeta Amarilla, Asistencias |
| JugadoresyPartido | Tabla relacional pivot (en desarrollo) |

 

*Nota técnica: El ID de partido es un identificador compuesto (Fecha \+ Categoría \+ Local \+ Visitante) que garantiza unicidad sin necesidad de un autonumérico externo.*

 

# **4\. Análisis de Mercado**

## **4.1 Mercado Objetivo**

El mercado principal son los colegios privados bilingües o de alta gestión deportiva en Argentina y Latinoamérica. Se estima que en el Gran Buenos Aires existen más de 200 colegios privados con programas deportivos intercolegiales activos. A nivel regional, el mercado potencial supera los 2.000 establecimientos.

 

## **4.2 Segmentación**

| Segmento | Perfil | Tamaño est. |
| :---- | :---- | :---- |
| Primario (Año 1\) | Colegios alemanes y bilingües del AMBA. Alta disposición al pago, procesos deportivos organizados, base de alumnos mediana-grande. | \~30 colegios |
| Secundario (Año 2\) | Colegios privados con programa deportivo intensivo (fútbol, básquet, handball). | \~200 colegios |
| Terciario (Año 3+) | Colegios privados en capitales latinoamericanas (Santiago, Montevideo, Bogotá). | 2.000+ colegios |

 

## **4.3 Competencia**

| Competidor | Tipo | Debilidad frente a FieldStats |
| :---- | :---- | :---- |
| TIMBO (timbo.futbol) | Plataforma de gestión de fútbol amateur/infantil. | No especializado en colegios K-12. No incluye módulo de asistencia a entrenamientos ni historial pedagógico. |
| FEMEBAL (femebal.com) | Plataforma federativa de básquet. | Orientada a federaciones, no a gestión intra-escolar. |
| Excel / Google Sheets | Herramienta genérica. | Sin integración, sin acceso móvil en campo, sin automatización. |
| WhatsApp | Mensajería. | No es una base de datos. Información no estructurada ni recuperable. |

 

| Ventaja Competitiva de FieldStats •        Única solución diseñada específicamente para el contexto K-12 con gestión de convocatorias \+ estadísticas \+ asistencia a entrenamientos. •        Diseño orientado al profesor de campo: mobile-first, mínimo de taps, funcional sin conexión estable. •        Business Intelligence pedagógico: los datos sirven no solo para lo deportivo, sino para justificar decisiones ante padres y dirección. •        Posibilidad de expansión a otras disciplinas (handball, básquet, atletismo) con la misma arquitectura. |
| :---- |

 

# **5\. Modelo de Negocio**

## **5.1 Estrategia de Monetización**

Se propone un modelo Freemium con tres niveles, diseñado para reducir la barrera de adopción inicial y escalar hacia contratos institucionales:

 

| Plan | Incluye | Precio | Target |
| :---- | :---- | :---- | :---- |
| FREE | 1 equipo / 1 deporte / hasta 30 jugadores. Sin historial histórico. Dashboard básico. | AR$0 / mes | Adquisición y prueba de concepto |
| PRO | Equipos ilimitados, todos los deportes, historial completo, boletín exportable, soporte prioritario. | AR$15.000 / mes por colegio | Colegios con programa deportivo activo |
| ENTERPRISE | Multi-sede, integración con sistema de gestión escolar, API personalizada, capacitación on-site. | A convenir (AR$30.000+) | Redes de colegios y grupos educativos |

 

## **5.2 Proyección Financiera (Año 1\)**

| Periodo | Colegios | Ingresos estimados | Hito |
| :---- | :---- | :---- | :---- |
| Q1 (Apr–Jun 2026\) | Colegio Goethe (piloto gratuito) | 0 | Validación y feedback |
| Q2 (Jul–Sep 2026\) | 3 colegios PRO | AR$45.000/mes | Primeros ingresos reales |
| Q3 (Oct–Dic 2026\) | 8 colegios PRO | AR$120.000/mes | Escala inicial |
| Q4 (Ene–Mar 2027\) | 15 colegios PRO \+ 1 ENTERPRISE | AR$255.000/mes | Primer contrato grande |

 

*Nota: Proyección conservadora. Los valores en pesos están sujetos a contexto inflacionario. Se recomienda cotizar en dólares para contratos anuales.*

 

## **5.3 Estructura de Costos (MVP)**

•        Desarrollo: Equipo de estudiantes del taller (costo \= tiempo de aprendizaje).

•        Infraestructura: Hosting en Vercel/Railway (free tier para MVP). Costo cero en fase piloto.

•        Base de datos: PostgreSQL o Firebase (free tier para hasta 500 usuarios).

•        Dominio y SSL: \~AR$5.000/año.

•        Marketing: Presentación directa en colegios de la red Goethe (costo cero, alto impacto).

 

# **6\. Plan de Producto y Tecnología**

## **6.1 Stack Tecnológico Propuesto**

| Capa | Tecnología | Justificación |
| :---- | :---- | :---- |
| Frontend | React.js \+ Tailwind CSS | Web responsive, mobile-first. Rápido de desarrollar con componentes reutilizables. |
| Backend | Node.js \+ Express | API REST. Familiar para el equipo del taller fullstack. |
| Base de Datos | PostgreSQL (via Supabase) | Relacional, ideal para el modelo de datos definido. Supabase ofrece autenticación y dashboard gratis. |
| Autenticación | Supabase Auth / JWT | Roles: Admin (colegio), Profe, Alumno (futuro), Padre (futuro). |
| Deploy | Vercel (frontend) \+ Railway (backend) | Free tier suficiente para MVP. Deploy automático desde GitHub. |
| Control de versiones | GitHub | Flujo de trabajo con branches por módulo. |

 

## **6.2 Roles del Equipo**

| Rol | Responsabilidad |
| :---- | :---- |
| Product Manager (PM) | Define prioridades, gestiona el backlog, mantiene comunicación con el cliente (Hernán y otros profes). |
| UX/UI Designer | Diseña mockups en Figma. Garantiza que cada flujo sea web responsive y minimice taps. |
| Frontend Developer | Implementa la interfaz en React. Consume la API. |
| Backend Developer | Desarrolla la API REST, define el schema de la base de datos, gestiona autenticación. |
| QA / Tester | Prueba cada funcionalidad antes del release. Puede ser rotativo dentro del equipo. |

 

## **6.3 Roadmap**

| Fase | Fecha | Entregables |
| :---- | :---- | :---- |
| Fase 0 — Investigación | Abr 2026 (completada) | Entrevistas con clientes, definición de MVP, validación de modelo de datos. |
| Fase 1 — Diseño | Abr–May 2026 | Mockup web responsive en Figma. Revisión con Hernán. Aprobación del cliente. |
| Fase 2 — MVP Backend | May–Jun 2026 | Implementación de ABM de jugadores, partidos, convocados y estadísticas básicas. |
| Fase 3 — MVP Frontend | Jun–Jul 2026 | Interfaces funcionales para carga de datos y dashboard básico. |
| Fase 4 — Piloto | Ago–Sep 2026 | Deploy en producción. Uso real por parte de Hernán con el equipo de fútbol. |
| Fase 5 — Iteración | Oct 2026+ | Feedback del piloto, ajustes y nuevas funcionalidades (asistencia a entrenamientos, boletín). |

 

# **7\. Validación con el Cliente**

## **7.1 Entrevistas Realizadas**

Se realizó una entrevista de discovery con Hernán, profesor de educación física del Colegio Goethe, utilizando un cuestionario estructurado desarrollado en el taller. Los hallazgos más relevantes:

 

| Insights Clave de la Entrevista con Hernán •        Verde absoluto al proyecto. Confirmó todos los problemas identificados y mostró entusiasmo genuino. •        La funcionalidad más urgente: registro de asistencia a los entrenamientos extra (martes y viernes). •        El balance anual hoy requiere revisar mensajes de WhatsApp de enero. Es el pain point más fuerte. •        Quiere una pantalla o impresiones con ranking deportivo visible en el colegio (goles, asistencias, jugador destacado). •        No quiere que los alumnos voten al jugador destacado. El criterio debe ser exclusivamente del profesor. •        Le interesó la idea del análisis de video (cross). Una cámara fija quedó descartada, pero un alumno interesado en periodismo deportivo podría cubrir los partidos. •        Prefiere el celular para tomar lista al aire libre. Tablets no funcionaron en el pasado. •        La funcionalidad offline es deseable pero no crítica para el lanzamiento. |
| :---- |

 

## **7.2 Próximos Pasos de Validación**

•        Entrevistar a Agustín y Luqui (otros profes de deporte del colegio).

•        Presentar el mockup web responsive a Hernán para feedback antes de comenzar el desarrollo.

•        Validar el tema del inventario deportivo (conos, vallas, pelotas) como funcionalidad futura.

•        Confirmar requisito de bilingüismo (español / alemán) en la interfaz.

 

# **8\. Riesgos y Mitigaciones**

| Riesgo | Nivel | Mitigación |
| :---- | :---- | :---- |
| Baja adopción por parte de los profesores | MEDIO | Diseño UX ultra-simple, mínimo de taps. Capacitación inicial on-site. Piloto con un profe campeón (Hernán). |
| Privacidad de datos de menores (DNI, mail) | ALTO | Roles y permisos claros. Datos sensibles encriptados. Cumplimiento con Ley 25.326 de Protección de Datos Personales. |
| Falta de conectividad en la cancha | MEDIO | Diseño offline-first para el módulo de asistencia. Sincronización posterior al conectarse. |
| Complejidad técnica del equipo estudiante | MEDIO | Foco en MVP. Uso de BaaS (Supabase) para reducir carga de backend. Revisión semanal con el profesor del taller. |
| Escalabilidad a otros colegios | BAJO | Arquitectura multi-tenant desde el inicio (campo 'Colegio' en el modelo de datos ya está presente). |

 

# **9\. Próximos Pasos Inmediatos**

 

| \# | Acción | Fecha límite |
| :---- | :---- | :---- |
| 1 | Presentar esta propuesta a Hernán, Agustín y Luqui para validación final. | Semana del 21 de abril |
| 2 | Asignar roles del equipo (PM, UX/UI, Frontend, Backend). | Semana del 21 de abril |
| 3 | Iniciar diseño de mockup web responsive en Figma. | 28 de abril — 12 de mayo |
| 4 | Definir el schema definitivo de la base de datos. | 30 de abril |
| 5 | Configurar repositorio en GitHub con estructura de proyecto. | 30 de abril |
| 6 | Primera demo funcional (ABM de jugadores \+ lista de partidos). | 30 de mayo |
| 7 | Revisión con el cliente del mockup y ajustes. | 15 de mayo |

 

| *FieldStats — Donde cada jugada cuenta.* Taller Fullstack — Colegio Goethe — 2026 |
| :---: |

   
