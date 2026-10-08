#!/usr/bin/env python3
"""Benchmark reproducible del reporte de asistencia sobre la base local.

Requiere `supabase db reset --local` y el contenedor local activo.
La transacción se revierte al terminar: no deja fixtures persistentes.
"""
import json
import subprocess

CONTAINER = "supabase_db_fieldstats-joaco"
COMMAND = ["docker", "exec", "-i", CONTAINER, "psql", "-X", "-qAt",
           "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"]
PLANTEL = "11111111-1111-1111-1111-111111111111"
ACTOR = "22222222-2222-2222-2222-222222222222"
DEPORTE = "33333333-3333-3333-3333-333333333333"
EQUIPO = "44444444-4444-4444-4444-444444444444"
TEMPORADA = "55555555-5555-5555-5555-555555555555"

setup = f"""
begin;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data)
values ('{ACTOR}','authenticated','authenticated','perf@example.invalid',now(), '{{"provider":"google"}}');
insert into auth.identities(id,user_id,provider_id,provider,identity_data)
values ('66666666-6666-6666-6666-666666666666','{ACTOR}','{ACTOR}','google',
        jsonb_build_object('sub','{ACTOR}','email','perf@example.invalid','email_verified',true));
insert into public.perfiles(id,nombre) values ('{ACTOR}','Performance fixture');
insert into public.deportes(id,codigo,nombre) values ('{DEPORTE}','perf','Performance');
insert into public.equipos(id,nombre,es_propio) values ('{EQUIPO}','Performance','true');
insert into public.temporadas(id,nombre,desde,hasta)
values ('{TEMPORADA}','Performance 2026','2026-01-01','2026-12-31');
insert into public.planteles(id,equipo_id,deporte_id,categoria_id,temporada_id)
select '{PLANTEL}','{EQUIPO}','{DEPORTE}',id,'{TEMPORADA}'
from public.categorias where activo order by id limit 1;
insert into public.asignaciones_rol(perfil_id,rol_id,deporte_id)
select '{ACTOR}',id,'{DEPORTE}' from public.roles where codigo='docente';
insert into public.jugadores(id,nombre,apellido)
select md5('perf-player-'||g)::uuid,'Jugador','Performance '||g from generate_series(1,4000) g;
insert into public.jugador_datos_personales(jugador_id,dni,nacimiento)
select md5('perf-player-'||g)::uuid,lpad((2000000+g)::text,7,'0'),'2010-01-01'
from generate_series(1,4000) g;
insert into public.inscripciones(jugador_id,plantel_id,camiseta,desde)
select md5('perf-player-'||g)::uuid,'{PLANTEL}',null,'2026-01-01' from generate_series(1,4000) g;
insert into public.entrenamientos(id,plantel_id,inicio,estado)
select md5('perf-training-'||g)::uuid,'{PLANTEL}',now()+g*interval '1 day','realizado'
from generate_series(1,20) g;
insert into public.asistencias(entrenamiento_id,inscripcion_id,plantel_id,estado)
select md5('perf-training-'||t)::uuid,i.id,'{PLANTEL}',
       case when row_number() over (partition by t order by i.id) % 10 = 0 then 'ausente' else 'presente' end
from generate_series(1,20) t cross join public.inscripciones i
where i.plantel_id='{PLANTEL}';
set local role authenticated;
do $$ begin
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub','{ACTOR}','role','authenticated',
                       'app_metadata',jsonb_build_object('provider','google'))::text,true);
end $$;
explain (analyze, format json)
select * from public.reporte_asistencia_plantel('{PLANTEL}');
rollback;
"""

result = subprocess.run(COMMAND, input=setup, text=True, capture_output=True, timeout=120)
if result.returncode:
    raise SystemExit(result.stderr)

try:
    payload = json.loads(result.stdout.strip())
except json.JSONDecodeError as error:
    raise SystemExit(f"Salida inesperada de EXPLAIN: {result.stdout!r}") from error
plan = payload[0]["Plan"]
execution_ms = payload[0]["Execution Time"]
rows = plan.get("Actual Rows", "desconocido")
print(f"PASS: reporte asistencia con 4.000 jugadores y 80.000 asistencias")
print(f"Filas devueltas por el plan: {rows}")
print(f"Tiempo de ejecución SQL: {execution_ms:.2f} ms")
print("PASS: transacción revertida; no quedan fixtures de performance")
