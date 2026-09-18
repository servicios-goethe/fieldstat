# FieldStats

Gestión deportiva en transición desde el MVP de Google Apps Script a una aplicación React con Supabase.

La rama de trabajo es `joaco`. La aplicación existente (`code.gs` y HTML) sigue usando
Sheets; las migraciones nuevas todavía no están conectadas a sus pantallas.

- [Plan de producción](Docs/PLAN_PRODUCCION_FIELDSTATS.md)
- [Hito 0 y decisiones](Docs/HITO_0.md)
- [Hito 1: base, pruebas y acceso necesario](Docs/HITO_1.md)
- [Hito 2: núcleo operativo](Docs/HITO_2.md)
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

## Aplicación web

Crear `.env.local` desde `.env.example` y completar la URL y anon key del proyecto Supabase.
La anon key es pública por diseño; no agregar nunca una service role key al frontend.

```bash
npm ci
npm run dev
```

Para verificar el build de producción:

```bash
npm run build
```
