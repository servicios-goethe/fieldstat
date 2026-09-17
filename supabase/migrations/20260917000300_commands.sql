begin;
create function private.auditar() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into private.auditoria(actor_id,tabla,operacion,anterior,posterior)
 values(auth.uid(),tg_table_name,tg_op,
 case when tg_op<>'INSERT' then to_jsonb(old) end,
 case when tg_op<>'DELETE' then to_jsonb(new) end);
 return coalesce(new,old);
end $$;
do $$ declare tabla text; begin
 foreach tabla in array array['categorias','roles','rol_permisos','asignaciones_rol','perfiles','convocatorias'] loop
 execute format('create trigger auditar after insert or update or delete on public.%I for each row execute function private.auditar()',tabla);
 end loop;
end $$;

create function private.exigir_principal() returns void
language plpgsql security definer set search_path = '' as $$
begin
 -- Serializa antes de revalidar: una sesión en espera puede haber sido revocada.
 perform pg_advisory_xact_lock(17092026,1);
 if not private.es_principal() then raise exception 'No autorizado' using errcode='42501'; end if;
end $$;
create function private.proteger_administracion() returns void
language plpgsql security definer set search_path = '' as $$
begin
 if exists(select 1 from private.bootstrap) and not exists(
 select 1 from public.asignaciones_rol a join public.roles r on r.id=a.rol_id
 join public.perfiles p on p.id=a.perfil_id
 where r.codigo='administrador_principal' and r.activo and r.protegido and p.activo
 and a.deporte_id is null and a.plantel_id is null) then
 raise exception 'Debe quedar al menos un administrador principal activo' using errcode='23514';
 end if;
end $$;

-- Solo un operador de servidor puede invocarla. El email nunca lo decide el cliente.
create function public.inicializar_administrador(p_usuario uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare nombre_admin text;
begin
 perform pg_advisory_xact_lock(17092026,1);
 if exists(select 1 from private.bootstrap) then
 raise exception 'Administrador inicial ya configurado' using errcode='23505'; end if;
 if not private.identidad_google(p_usuario) or not exists(
 select 1 from auth.users where id=p_usuario and lower(email)='j.salas@goethe.edu.ar') then
 raise exception 'Se requiere identidad Google verificada del administrador designado' using errcode='42501'; end if;
 select coalesce(nullif(raw_user_meta_data->>'full_name',''),'Administrador principal') into nombre_admin
 from auth.users where id=p_usuario;
 insert into public.perfiles(id,nombre) values(p_usuario,nombre_admin)
 on conflict(id) do update set activo=true;
 insert into public.asignaciones_rol(perfil_id,rol_id)
 select p_usuario,id from public.roles where codigo='administrador_principal';
 insert into private.bootstrap(admin_id) values(p_usuario);
end $$;

create function public.guardar_categoria(p_id uuid,p_nombre text,p_orden integer,p_activo boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 if not private.tiene_permiso('categorias.gestionar') then raise exception 'No autorizado' using errcode='42501'; end if;
 if p_id is null then
 insert into public.categorias(nombre,orden,activo) values(btrim(p_nombre),p_orden,p_activo) returning id into resultado;
 else
 update public.categorias set nombre=btrim(p_nombre),orden=p_orden,activo=p_activo where id=p_id returning id into resultado;
 if not found then raise exception 'Categoría inexistente' using errcode='P0002'; end if;
 end if;
 return resultado;
end $$;

-- La administración de roles está reservada al principal en H1. Delegación de
-- permisos administrativos requiere flujo explícito; no se autoriza por nombre de rol.
create function public.guardar_rol(p_id uuid,p_codigo text,p_nombre text,p_activo boolean,p_permisos text[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 perform private.exigir_principal();
 if p_permisos is null then raise exception 'Indicar lista de permisos (puede estar vacía)' using errcode='22023'; end if;
 if exists(select 1 from unnest(p_permisos) v where v is null or not exists(select 1 from public.permisos where codigo=v)) then
 raise exception 'Permiso desconocido' using errcode='22023'; end if;
 if p_permisos && array['roles.gestionar','usuarios.gestionar']::text[] then
 raise exception 'Permisos reservados al administrador principal' using errcode='42501'; end if;
 if p_id is null then
 insert into public.roles(codigo,nombre,activo) values(p_codigo,btrim(p_nombre),p_activo) returning id into resultado;
 else
 if exists(select 1 from public.roles where id=p_id and protegido) then raise exception 'Rol protegido' using errcode='42501'; end if;
 update public.roles set codigo=p_codigo,nombre=btrim(p_nombre),activo=p_activo where id=p_id returning id into resultado;
 if not found then raise exception 'Rol inexistente' using errcode='P0002'; end if;
 end if;
 delete from public.rol_permisos where rol_id=resultado;
 insert into public.rol_permisos(rol_id,permiso) select resultado,v from (select distinct unnest(p_permisos) v) q;
 return resultado;
end $$;
create function public.habilitar_usuario(p_usuario uuid,p_nombre text,p_activo boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
 perform private.exigir_principal();
 if not private.identidad_google(p_usuario) then raise exception 'Identidad Google no verificada' using errcode='42501'; end if;
 insert into public.perfiles(id,nombre,activo) values(p_usuario,btrim(p_nombre),p_activo)
 on conflict(id) do update set nombre=excluded.nombre,activo=excluded.activo;
 perform private.proteger_administracion();
end $$;
create function public.asignar_rol(p_usuario uuid,p_rol uuid,p_deporte uuid default null,p_plantel uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 perform private.exigir_principal();
 if not exists(select 1 from public.roles where id=p_rol and activo)
 or not exists(select 1 from public.perfiles where id=p_usuario and activo)
 then raise exception 'Usuario o rol inactivo/inexistente' using errcode='22023'; end if;
 if (p_deporte is not null or p_plantel is not null) and exists(
 select 1 from public.rol_permisos rp join public.permisos p on p.codigo=rp.permiso
 where rp.rol_id=p_rol and p.ambito='global' and p.codigo<>'configuracion.leer') then
 raise exception 'Este rol requiere asignación global' using errcode='22023'; end if;
 insert into public.asignaciones_rol(perfil_id,rol_id,deporte_id,plantel_id)
 values(p_usuario,p_rol,p_deporte,p_plantel)
 on conflict(perfil_id,rol_id,deporte_id,plantel_id) do update set perfil_id=excluded.perfil_id
 returning id into resultado;
 return resultado;
end $$;
create function public.revocar_rol(p_asignacion uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform private.exigir_principal();
 delete from public.asignaciones_rol where id=p_asignacion;
 if not found then raise exception 'Asignación inexistente' using errcode='P0002'; end if;
 perform private.proteger_administracion();
end $$;

create function public.responder_convocatoria(p_convocatoria uuid,p_respuesta text,p_transporte text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.convocatorias; p public.partidos;
begin
 if not private.tiene_permiso('convocatorias.responder_propia') or not private.convocatoria_propia(p_convocatoria)
 then raise exception 'No autorizado' using errcode='42501'; end if;
 if p_respuesta is null or p_respuesta not in ('acepta','rechaza') then raise exception 'Respuesta inválida' using errcode='22023'; end if;
 -- Bloqueo partido antes que convocatoria, también para el futuro cierre/reprogramación.
 select pa.* into p from public.partidos pa join public.convocatorias co on co.partido_id=pa.id
 where co.id=p_convocatoria for update of pa;
 select * into c from public.convocatorias where id=p_convocatoria for update;
 if not c.convocado or p.estado<>'pendiente' or p.cierre_confirmacion<=clock_timestamp()
 then raise exception 'Convocatoria cerrada o retirada' using errcode='23514'; end if;
 if p_transporte is not null and length(p_transporte)>100 then raise exception 'Transporte demasiado largo' using errcode='22023'; end if;
 update public.convocatorias set respuesta=p_respuesta,transporte=nullif(btrim(p_transporte),''),respondido_en=clock_timestamp()
 where id=p_convocatoria;
end $$;

-- Invariantes de pertenencia complementarias a las FK compuestas.
create function private.validar_contexto() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_equipo uuid;
begin
 if tg_table_name='planteles' then
 if not exists(select 1 from public.equipos where id=new.equipo_id and es_propio) then
 raise exception 'El plantel debe pertenecer a un equipo propio' using errcode='23514'; end if;
 elsif tg_table_name='inscripciones' then
 if not exists(select 1 from public.planteles p join public.categorias c on c.id=p.categoria_id
 join public.temporadas t on t.id=p.temporada_id where p.id=new.plantel_id
 and (not new.activa or (p.activo and c.activo and t.activa))
 and new.desde between t.desde and t.hasta and (new.hasta is null or new.hasta<=t.hasta)) then
 raise exception 'Plantel/categoría/temporada inactivos o vigencia inválida' using errcode='23514'; end if;
 elsif tg_table_name='partidos' then
 select equipo_id into v_equipo from public.planteles where id=new.plantel_id;
 if v_equipo not in (new.local_id,new.visitante_id) then raise exception 'El equipo del plantel debe participar' using errcode='23514'; end if;
 elsif tg_table_name='eventos_partido' then
 if not exists(select 1 from public.partidos where id=new.partido_id and new.equipo_id in (local_id,visitante_id)) then
 raise exception 'Equipo ajeno al partido' using errcode='23514'; end if;
 elsif tg_table_name='autorizaciones' then
 if not exists(select 1 from public.convocatorias c join public.inscripciones i on i.id=c.inscripcion_id
 join public.responsables_jugadores r on r.jugador_id=i.jugador_id
 where c.id=new.convocatoria_id and r.responsable_id=new.responsable_id and r.activo) then
 raise exception 'Responsable sin vínculo verificado' using errcode='23514'; end if;
 end if;
 return new;
end $$;
do $$ declare tabla text; begin
 foreach tabla in array array['planteles','inscripciones','partidos','eventos_partido','autorizaciones'] loop
 execute format('create trigger validar_contexto before insert or update on public.%I for each row execute function private.validar_contexto()',tabla);
 end loop;
end $$;

revoke all on function public.inicializar_administrador(uuid) from public,anon,authenticated;
grant execute on function public.inicializar_administrador(uuid) to service_role;
revoke all on function private.auditar(),private.exigir_principal(),private.proteger_administracion(),private.validar_contexto() from public,anon,authenticated;
revoke all on function public.guardar_categoria(uuid,text,integer,boolean),
 public.guardar_rol(uuid,text,text,boolean,text[]), public.habilitar_usuario(uuid,text,boolean),
 public.asignar_rol(uuid,uuid,uuid,uuid),public.revocar_rol(uuid),public.responder_convocatoria(uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.guardar_categoria(uuid,text,integer,boolean),
 public.guardar_rol(uuid,text,text,boolean,text[]), public.habilitar_usuario(uuid,text,boolean),
 public.asignar_rol(uuid,uuid,uuid,uuid),public.revocar_rol(uuid),public.responder_convocatoria(uuid,text,text)
 to authenticated;
commit;
