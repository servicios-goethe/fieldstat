begin;
insert into public.permisos(codigo,descripcion,ambito) values
 ('configuracion.leer','Leer catálogos','global'),
 ('categorias.gestionar','Crear, editar y desactivar categorías','global'),
 ('roles.gestionar','Administrar perfiles de permisos','global'),
 ('usuarios.gestionar','Habilitar usuarios y asignar roles','global'),
 ('jugadores.leer','Consultar fichas del ámbito','deportivo'),
 ('jugadores.propios','Consultar la ficha y actividad propias','global'),
 ('planteles.leer','Consultar planteles del ámbito','deportivo'),
 ('entrenamientos.leer','Consultar entrenamientos del ámbito','deportivo'),
 ('partidos.leer','Consultar partidos del ámbito','deportivo'),
 ('convocatorias.leer','Consultar convocatorias del ámbito','deportivo'),
 ('convocatorias.responder_propia','Responder convocatoria propia','global'),
 ('estadisticas.leer','Consultar eventos del ámbito','deportivo'),
 ('familias.leer','Consultar vínculos familiares','deportivo'),
 ('autorizaciones.leer','Consultar autorizaciones del ámbito','deportivo');
insert into public.roles(codigo,nombre,protegido) values
 ('administrador_principal','Administrador principal',true),
 ('docente','Docente',false), ('alumno','Alumno',false);
insert into public.rol_permisos(rol_id,permiso)
 select r.id,p.codigo from public.roles r cross join public.permisos p where r.codigo='administrador_principal';
insert into public.rol_permisos(rol_id,permiso)
 select r.id,p.codigo from public.roles r cross join public.permisos p
 where r.codigo='docente' and p.codigo in
 ('configuracion.leer','jugadores.leer','planteles.leer','entrenamientos.leer','partidos.leer','convocatorias.leer','estadisticas.leer');
insert into public.rol_permisos(rol_id,permiso)
 select r.id,p.codigo from public.roles r cross join public.permisos p
 where r.codigo='alumno' and p.codigo in
 ('configuracion.leer','jugadores.propios','convocatorias.responder_propia');
-- Únicamente el catálogo solicitado; no se elige temporada ni se copian personas.
insert into public.categorias(nombre,orden) values ('Menores',1),('Cadetes',2),('Juveniles',3);

create function private.identidad_google(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.users u join auth.identities i on i.user_id=u.id
 where u.id=p_id and i.provider='google' and u.email_confirmed_at is not null
 and coalesce(i.identity_data->>'email_verified','false')='true'
 and lower(i.identity_data->>'email')=lower(u.email)
 and coalesce(u.is_anonymous,false)=false
 and (u.banned_until is null or u.banned_until < now()))
$$;
create function private.habilitado() returns boolean
language sql stable security definer set search_path = '' as $$
 select coalesce(auth.jwt()->'app_metadata'->>'provider','')='google'
 and private.identidad_google(auth.uid())
 and exists(select 1 from public.perfiles where id=auth.uid() and activo)
$$;
create function private.tiene_permiso(p_permiso text,p_deporte uuid default null,p_plantel uuid default null)
returns boolean language sql stable security definer set search_path = '' as $$
 select private.habilitado() and exists(
 select 1 from public.asignaciones_rol a
 join public.roles r on r.id=a.rol_id and r.activo
 join public.rol_permisos rp on rp.rol_id=r.id and rp.permiso=p_permiso
 where a.perfil_id=auth.uid() and (
 (a.deporte_id is null and a.plantel_id is null)
 or (a.plantel_id is not null and a.plantel_id=p_plantel)
 or (a.deporte_id is not null and a.deporte_id=coalesce(p_deporte,
    (select deporte_id from public.planteles where id=p_plantel)))
 -- Catálogos generales no sensibles, incluso para docentes de ámbito deportivo.
 or (p_permiso='configuracion.leer')
 ))
$$;
create function private.es_principal() returns boolean
language sql stable security definer set search_path = '' as $$
 select private.habilitado() and exists(select 1 from public.asignaciones_rol a
 join public.roles r on r.id=a.rol_id where a.perfil_id=auth.uid()
 and r.codigo='administrador_principal' and r.protegido and r.activo
 and a.deporte_id is null and a.plantel_id is null)
$$;
create function private.es_jugador_propio(p_jugador uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select private.tiene_permiso('jugadores.propios') and exists(
 select 1 from public.jugadores where id=p_jugador and perfil_id=auth.uid())
$$;
create function private.puede_leer_jugador(p_jugador uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select private.es_jugador_propio(p_jugador) or private.tiene_permiso('jugadores.leer') or exists(
 select 1 from public.inscripciones i where i.jugador_id=p_jugador
 and private.tiene_permiso('jugadores.leer',null,i.plantel_id))
$$;
create function private.plantel_propio(p_plantel uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.inscripciones i where i.plantel_id=p_plantel
 and private.es_jugador_propio(i.jugador_id))
$$;
create function private.puede_leer_partido(p_partido uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.partidos p where p.id=p_partido and
 (private.tiene_permiso('partidos.leer',p.deporte_id,p.plantel_id) or private.plantel_propio(p.plantel_id)))
$$;
create function private.convocatoria_propia(p_convocatoria uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.convocatorias c join public.inscripciones i on i.id=c.inscripcion_id
 where c.id=p_convocatoria and private.es_jugador_propio(i.jugador_id))
$$;
create function private.permiso_convocatoria(p_convocatoria uuid,p_permiso text) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.convocatorias c where c.id=p_convocatoria
 and private.tiene_permiso(p_permiso,null,c.plantel_id))
$$;
create function private.permiso_partido(p_partido uuid,p_permiso text) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.partidos p where p.id=p_partido
 and private.tiene_permiso(p_permiso,p.deporte_id,p.plantel_id))
$$;

-- Ninguna política de escritura directa: categorías, roles y respuestas se cambian
-- por RPC; los comandos deportivos se incorporarán con sus transacciones en H2/H3.
grant select on all tables in schema public to authenticated;
create policy perfiles_lectura on public.perfiles for select to authenticated
 using (private.habilitado() and (id=auth.uid() or private.es_principal()));
create policy roles_lectura on public.roles for select to authenticated
 using (private.es_principal() or private.tiene_permiso('roles.gestionar'));
create policy permisos_lectura on public.permisos for select to authenticated
 using (private.es_principal() or private.tiene_permiso('roles.gestionar'));
create policy rol_permisos_lectura on public.rol_permisos for select to authenticated
 using (private.es_principal() or private.tiene_permiso('roles.gestionar'));
create policy asignaciones_lectura on public.asignaciones_rol for select to authenticated
 using (private.habilitado() and (perfil_id=auth.uid() or private.es_principal()));
do $$ declare tabla text; begin
 foreach tabla in array array['deportes','categorias','equipos','sedes','temporadas','tipos_estadistica','tipos_sancion'] loop
 execute format('create policy catalogo_lectura on public.%I for select to authenticated using (private.tiene_permiso(''configuracion.leer''))',tabla);
 end loop;
end $$;
create policy equipo_contactos_lectura on public.equipo_contactos for select to authenticated using (private.es_principal());
create policy planteles_lectura on public.planteles for select to authenticated
 using (private.tiene_permiso('planteles.leer',deporte_id,id) or private.plantel_propio(id));
create policy jugadores_lectura on public.jugadores for select to authenticated using (private.puede_leer_jugador(id));
create policy datos_personales_lectura on public.jugador_datos_personales for select to authenticated using (private.puede_leer_jugador(jugador_id));
create policy inscripciones_lectura on public.inscripciones for select to authenticated
 using (private.tiene_permiso('jugadores.leer',null,plantel_id) or private.es_jugador_propio(jugador_id));
create policy responsables_lectura on public.responsables_jugadores for select to authenticated
 using (private.es_principal());
-- El acceso familiar queda cerrado hasta definir identidad y permisos específicos.
create policy entrenamientos_lectura on public.entrenamientos for select to authenticated
 using (private.tiene_permiso('entrenamientos.leer',null,plantel_id) or private.plantel_propio(plantel_id));
create policy asistencias_lectura on public.asistencias for select to authenticated
 using (private.tiene_permiso('entrenamientos.leer',null,plantel_id) or exists(
 select 1 from public.inscripciones i where i.id=inscripcion_id and private.es_jugador_propio(i.jugador_id)));
create policy torneos_lectura on public.torneos for select to authenticated
 using (private.tiene_permiso('partidos.leer',deporte_id) or exists(select 1 from public.planteles pl
 where pl.deporte_id=torneos.deporte_id and pl.categoria_id=torneos.categoria_id
 and pl.temporada_id=torneos.temporada_id and (private.plantel_propio(pl.id)
 or private.tiene_permiso('partidos.leer',pl.deporte_id,pl.id))));
create policy fechas_lectura on public.fechas for select to authenticated
 using (exists(select 1 from public.torneos t where t.id=torneo_id));
create policy torneo_equipos_lectura on public.torneo_equipos for select to authenticated
 using (exists(select 1 from public.torneos t where t.id=torneo_id));
create policy partidos_lectura on public.partidos for select to authenticated using (private.puede_leer_partido(id));
create policy resultados_lectura on public.resultados for select to authenticated using (private.puede_leer_partido(partido_id));
create policy convocatorias_lectura on public.convocatorias for select to authenticated
 using (private.tiene_permiso('convocatorias.leer',null,plantel_id) or private.convocatoria_propia(id));
create policy participaciones_lectura on public.participaciones for select to authenticated
 using (private.permiso_convocatoria(convocatoria_id,'convocatorias.leer') or private.convocatoria_propia(convocatoria_id));
create policy destacados_lectura on public.destacados for select to authenticated
 using (private.permiso_partido(partido_id,'estadisticas.leer') or private.convocatoria_propia(convocatoria_id));
create policy autorizaciones_lectura on public.autorizaciones for select to authenticated
 using (private.es_principal());
create policy cambios_lectura on public.cambios for select to authenticated
 using (private.permiso_partido(partido_id,'estadisticas.leer'));
-- No se exponen eventos completos de otros alumnos mientras se define R10.
create policy eventos_lectura on public.eventos_partido for select to authenticated
 using (private.permiso_partido(partido_id,'estadisticas.leer'));
create policy sanciones_lectura on public.sanciones for select to authenticated
 using (private.permiso_partido(partido_id,'estadisticas.leer') or private.convocatoria_propia(convocatoria_id));

revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.habilitado(), private.tiene_permiso(text,uuid,uuid),
 private.es_principal(), private.es_jugador_propio(uuid), private.puede_leer_jugador(uuid),
 private.plantel_propio(uuid), private.puede_leer_partido(uuid), private.convocatoria_propia(uuid),
 private.permiso_convocatoria(uuid,text), private.permiso_partido(uuid,text) to authenticated;
commit;
