-- H1: estructura PostgreSQL. Las escrituras deportivas compuestas se habilitan
-- mediante RPC transaccionales en H2/H3; no se exponen como CRUD libre.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;
revoke create on schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete restrict,
  nombre text not null check (length(btrim(nombre)) between 1 and 150),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[a-z][a-z0-9_]{1,49}$'),
  nombre text not null check (length(btrim(nombre)) between 1 and 100),
  activo boolean not null default true,
  protegido boolean not null default false
);
create table public.permisos (
  codigo text primary key,
  descripcion text not null,
  ambito text not null check (ambito in ('global','deportivo'))
);
create table public.rol_permisos (
  rol_id uuid not null references public.roles(id) on delete restrict,
  permiso text not null references public.permisos(codigo) on delete restrict,
  primary key (rol_id, permiso)
);
create table public.deportes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null check (length(btrim(nombre)) between 1 and 80),
  activo boolean not null default true
);
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) between 1 and 80),
  orden integer not null default 0 check (orden >= 0),
  activo boolean not null default true
);
create unique index categorias_nombre_normalizado on public.categorias (lower(btrim(nombre)));
create table public.equipos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) between 1 and 150),
  es_propio boolean not null default false,
  activo boolean not null default true
);
-- Contactos separados: un alumno puede leer el fixture sin leer teléfonos/emails.
create table public.equipo_contactos (
  equipo_id uuid primary key references public.equipos(id) on delete restrict,
  contacto text, telefono text, email text
);
create table public.sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) between 1 and 150),
  direccion text,
  activo boolean not null default true
);
create table public.temporadas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  desde date not null,
  hasta date not null,
  activa boolean not null default true,
  check (hasta >= desde)
);
create table public.planteles (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references public.equipos(id),
  deporte_id uuid not null references public.deportes(id),
  categoria_id uuid not null references public.categorias(id),
  temporada_id uuid not null references public.temporadas(id),
  sede_id uuid references public.sedes(id),
  activo boolean not null default true,
  unique (equipo_id, deporte_id, categoria_id, temporada_id),
  unique (id, deporte_id, categoria_id, temporada_id)
);
create table public.asignaciones_rol (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id),
  rol_id uuid not null references public.roles(id),
  deporte_id uuid references public.deportes(id),
  plantel_id uuid references public.planteles(id),
  check (not (deporte_id is not null and plantel_id is not null)),
  unique nulls not distinct (perfil_id, rol_id, deporte_id, plantel_id)
);
create table public.jugadores (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid unique references public.perfiles(id),
  nombre text not null check (length(btrim(nombre)) between 1 and 100),
  apellido text not null check (length(btrim(apellido)) between 1 and 100),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.jugador_datos_personales (
  jugador_id uuid primary key references public.jugadores(id),
  dni text not null unique check (dni ~ '^[0-9]{7,10}$'),
  nacimiento date not null,
  email_contacto text,
  telefono text
);
create table public.inscripciones (
  id uuid primary key default gen_random_uuid(),
  jugador_id uuid not null references public.jugadores(id),
  plantel_id uuid not null references public.planteles(id),
  camiseta integer check (camiseta between 0 and 999),
  desde date not null,
  hasta date,
  activa boolean not null default true,
  check (hasta is null or hasta >= desde),
  unique (jugador_id, plantel_id),
  unique (id, plantel_id)
);
create unique index inscripciones_camiseta_activa on public.inscripciones (plantel_id, camiseta)
  where activa and camiseta is not null;
create table public.responsables_jugadores (
  responsable_id uuid not null references public.perfiles(id),
  jugador_id uuid not null references public.jugadores(id),
  verificado_por uuid not null references public.perfiles(id),
  verificado_en timestamptz not null default now(),
  activo boolean not null default true,
  primary key (responsable_id, jugador_id)
);
create table public.entrenamientos (
  id uuid primary key default gen_random_uuid(),
  plantel_id uuid not null references public.planteles(id),
  inicio timestamptz not null,
  sede_id uuid references public.sedes(id),
  estado text not null default 'programado' check (estado in ('programado','realizado','cancelado')),
  unique (id, plantel_id)
);
create table public.asistencias (
  entrenamiento_id uuid not null,
  inscripcion_id uuid not null,
  plantel_id uuid not null,
  estado text not null default 'sin_registrar' check (estado in ('sin_registrar','presente','ausente')),
  primary key (entrenamiento_id, inscripcion_id),
  foreign key (entrenamiento_id, plantel_id) references public.entrenamientos(id, plantel_id),
  foreign key (inscripcion_id, plantel_id) references public.inscripciones(id, plantel_id)
);
create table public.torneos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  deporte_id uuid not null references public.deportes(id),
  categoria_id uuid not null references public.categorias(id),
  temporada_id uuid not null references public.temporadas(id),
  puntos_victoria integer check (puntos_victoria >= 0),
  puntos_empate integer check (puntos_empate >= 0),
  puntos_derrota integer check (puntos_derrota >= 0),
  activo boolean not null default true,
  unique (id, deporte_id, categoria_id, temporada_id),
  check ((puntos_victoria is null and puntos_empate is null and puntos_derrota is null)
    or (puntos_victoria is not null and puntos_empate is not null and puntos_derrota is not null))
);
create table public.torneo_equipos (
  torneo_id uuid not null references public.torneos(id),
  equipo_id uuid not null references public.equipos(id),
  primary key (torneo_id, equipo_id)
);
create table public.fechas (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references public.torneos(id),
  numero integer not null check (numero > 0),
  fecha date not null,
  unique (torneo_id, numero),
  unique (id, torneo_id)
);
create table public.partidos (
  id uuid primary key default gen_random_uuid(),
  plantel_id uuid not null,
  deporte_id uuid not null,
  categoria_id uuid not null,
  temporada_id uuid not null,
  torneo_id uuid,
  fecha_id uuid,
  local_id uuid not null references public.equipos(id),
  visitante_id uuid not null references public.equipos(id),
  sede_id uuid references public.sedes(id),
  inicio timestamptz not null,
  cierre_confirmacion timestamptz not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','finalizado','cancelado')),
  observaciones text,
  version integer not null default 1 check (version > 0),
  check (local_id <> visitante_id),
  check (fecha_id is null or torneo_id is not null),
  check (cierre_confirmacion <= inicio),
  foreign key (plantel_id, deporte_id, categoria_id, temporada_id)
    references public.planteles(id, deporte_id, categoria_id, temporada_id),
  foreign key (torneo_id, deporte_id, categoria_id, temporada_id)
    references public.torneos(id, deporte_id, categoria_id, temporada_id),
  foreign key (fecha_id, torneo_id) references public.fechas(id, torneo_id),
  unique (id, plantel_id),
  unique (id, deporte_id)
);
create table public.resultados (
  partido_id uuid primary key references public.partidos(id),
  goles_local integer not null check (goles_local >= 0),
  goles_visitante integer not null check (goles_visitante >= 0)
);
create table public.convocatorias (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null,
  inscripcion_id uuid not null,
  plantel_id uuid not null,
  convocado boolean not null default true,
  respuesta text not null default 'pendiente' check (respuesta in ('pendiente','acepta','rechaza','reconfirmar')),
  transporte text,
  respondido_en timestamptz,
  foreign key (partido_id, plantel_id) references public.partidos(id, plantel_id),
  foreign key (inscripcion_id, plantel_id) references public.inscripciones(id, plantel_id),
  unique (partido_id, inscripcion_id),
  unique (id, partido_id)
);
create table public.participaciones (
  convocatoria_id uuid primary key references public.convocatorias(id),
  titular boolean not null default false,
  capitan boolean not null default false,
  camiseta integer check (camiseta between 0 and 999),
  presente boolean,
  jugo boolean,
  check (jugo is not true or presente is true)
);
create table public.destacados (
  partido_id uuid primary key references public.partidos(id),
  convocatoria_id uuid not null,
  motivo text,
  foreign key (convocatoria_id, partido_id) references public.convocatorias(id, partido_id)
);
create table public.autorizaciones (
  id uuid primary key default gen_random_uuid(),
  convocatoria_id uuid not null unique references public.convocatorias(id),
  responsable_id uuid not null references public.perfiles(id),
  version_texto text not null,
  documento_path text,
  aceptado_en timestamptz not null,
  ip_firma inet,
  evidencia text
);
create table public.cambios (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references public.partidos(id),
  sale_convocatoria_id uuid not null,
  entra_convocatoria_id uuid not null,
  periodo integer not null check (periodo > 0),
  minuto integer not null check (minuto >= 0),
  motivo text,
  check (sale_convocatoria_id <> entra_convocatoria_id),
  foreign key (sale_convocatoria_id, partido_id) references public.convocatorias(id, partido_id),
  foreign key (entra_convocatoria_id, partido_id) references public.convocatorias(id, partido_id)
);
create table public.tipos_estadistica (
  id uuid primary key default gen_random_uuid(),
  deporte_id uuid not null references public.deportes(id),
  codigo text not null,
  nombre text not null,
  unique (deporte_id, codigo),
  unique (id, deporte_id)
);
create table public.eventos_partido (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null,
  deporte_id uuid not null,
  tipo_id uuid not null,
  convocatoria_id uuid,
  asistidor_convocatoria_id uuid,
  equipo_id uuid not null references public.equipos(id),
  periodo integer check (periodo > 0),
  minuto integer check (minuto >= 0),
  motivo text,
  check (asistidor_convocatoria_id is null or
    (convocatoria_id is not null and asistidor_convocatoria_id <> convocatoria_id)),
  foreign key (partido_id, deporte_id) references public.partidos(id, deporte_id),
  foreign key (tipo_id, deporte_id) references public.tipos_estadistica(id, deporte_id),
  foreign key (convocatoria_id, partido_id) references public.convocatorias(id, partido_id),
  foreign key (asistidor_convocatoria_id, partido_id) references public.convocatorias(id, partido_id),
  unique (id, partido_id)
);
create table public.tipos_sancion (
  id uuid primary key default gen_random_uuid(),
  deporte_id uuid not null references public.deportes(id),
  nombre text not null,
  partidos_suspension integer not null check (partidos_suspension >= 0),
  unique (deporte_id, nombre),
  unique (id, deporte_id)
);
create table public.sanciones (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null,
  deporte_id uuid not null,
  convocatoria_id uuid not null,
  tipo_id uuid not null,
  evento_id uuid unique,
  minuto integer check (minuto >= 0),
  motivo text,
  foreign key (partido_id, deporte_id) references public.partidos(id, deporte_id),
  foreign key (convocatoria_id, partido_id) references public.convocatorias(id, partido_id),
  foreign key (tipo_id, deporte_id) references public.tipos_sancion(id, deporte_id),
  foreign key (evento_id, partido_id) references public.eventos_partido(id, partido_id)
);
create table private.auditoria (
  id bigint generated always as identity primary key,
  actor_id uuid,
  tabla text not null,
  operacion text not null,
  anterior jsonb,
  posterior jsonb,
  registrado_en timestamptz not null default now()
);
create table private.bootstrap (
  singleton boolean primary key default true check (singleton),
  admin_id uuid not null references public.perfiles(id),
  creado_en timestamptz not null default now()
);

-- Políticas/grants se completan en la migración siguiente. Desde el nacimiento,
-- ninguna tabla tiene acceso implícito para clientes.
do $$ declare t record; begin
  for t in select schemaname,tablename from pg_tables where schemaname in ('public','private') loop
    if t.tablename not like 'spatial_%' then
      execute format('alter table %I.%I enable row level security',
        t.schemaname,t.tablename);
    end if;
  end loop;
end $$;
revoke all on all tables in schema public, private from anon, authenticated;
revoke all on all sequences in schema public, private from anon, authenticated;
grant all on all tables in schema public, private to service_role;
grant usage, select on all sequences in schema private to service_role;

-- Índices de acceso y FK que no quedan cubiertos por una PK/UNIQUE inicial.
create index asignaciones_perfil on public.asignaciones_rol(perfil_id);
create index asignaciones_por_rol on public.asignaciones_rol(rol_id);
create index planteles_contexto on public.planteles(deporte_id,categoria_id,temporada_id);
create index inscripciones_plantel on public.inscripciones(plantel_id);
create index entrenamientos_plantel_inicio on public.entrenamientos(plantel_id,inicio);
create index asistencias_inscripcion on public.asistencias(inscripcion_id);
create index partidos_contexto_inicio on public.partidos(plantel_id,estado,inicio);
create index partidos_torneo on public.partidos(torneo_id);
create index convocatorias_inscripcion on public.convocatorias(inscripcion_id);
create index eventos_por_partido on public.eventos_partido(partido_id);
create index eventos_convocatoria on public.eventos_partido(convocatoria_id);
create index sanciones_partido on public.sanciones(partido_id);
commit;
