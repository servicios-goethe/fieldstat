# FieldStats

MVP de gestión deportiva en Google Apps Script, con base Supabase en desarrollo.

La rama de trabajo es `joaco`. La aplicación existente (`code.gs` y HTML) sigue usando
Sheets; las migraciones nuevas todavía no están conectadas a sus pantallas.

- [Plan de producción](Docs/PLAN_PRODUCCION_FIELDSTATS.md)
- [Hito 0 y decisiones](Docs/HITO_0.md)
- [Hito 1: base, pruebas y acceso necesario](Docs/HITO_1.md)
- [Trazabilidad de las 19 tablas originales](Docs/H0_AJUSTES_MODELO.md)

## Base local

Requisitos: Node 24, npm y Docker funcionando.

```bash
npm ci
npm run db:start
npm run db:reset
npm run db:lint
npm run db:test
npm run db:types
```

`db:reset` borra y reconstruye **solo la base local de este proyecto**. No usarlo
para conservar datos de desarrollo. La configuración local no tiene proyecto
remoto vinculado, datos del MVP ni credenciales de Google. Los tests usan fixtures
ficticios dentro de una transacción que se revierte.

Los catálogos iniciales son las tres categorías confirmadas y roles/permisos de
sistema. No hay temporada elegida, alumnos, profesores ni administrador habilitado
automáticamente. El bootstrap remoto requiere identidad Google verificada.

Para detener los servicios: `npm run db:stop`.
