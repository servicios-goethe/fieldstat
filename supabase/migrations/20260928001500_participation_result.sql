begin;

create function public.guardar_participacion(
 p_convocatoria_id uuid,
 p_titular boolean,
 p_capitan boolean,
 p_presente boolean,
 p_jugo boolean,
 p_camiseta integer
) returns void language plpgsql security definer set search_path = '' as $$
declare v_partido uuid;
begin
 select partido_id into v_partido from public.convocatorias where id=p_convocatoria_id and convocado;
 if v_partido is null then raise exception 'Convocatoria inexistente o no convocada' using errcode='P0002'; end if;
 if not private.permiso_partido(v_partido,'convocatorias.gestionar')
 then raise exception 'No autorizado para gestionar participación' using errcode='42501'; end if;
 if exists(select 1 from public.partidos where id=v_partido and estado<>'pendiente')
 then raise exception 'El partido ya está cerrado' using errcode='23514'; end if;
 insert into public.participaciones(convocatoria_id,titular,capitan,presente,jugo,camiseta)
 values(p_convocatoria_id,p_titular,p_capitan,p_presente,p_jugo,p_camiseta)
 on conflict (convocatoria_id) do update set titular=excluded.titular,capitan=excluded.capitan,
 presente=excluded.presente,jugo=excluded.jugo,camiseta=excluded.camiseta;
end $$;

create function public.guardar_resultado(
 p_partido_id uuid,
 p_goles_local integer,
 p_goles_visitante integer
) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not private.permiso_partido(p_partido_id,'partidos.gestionar')
 then raise exception 'No autorizado para cerrar este partido' using errcode='42501'; end if;
 if p_goles_local is null or p_goles_local < 0 or p_goles_visitante is null or p_goles_visitante < 0
 then raise exception 'El resultado no puede ser negativo' using errcode='22023'; end if;
 if exists(select 1 from public.partidos where id=p_partido_id and estado='cancelado')
 then raise exception 'No se puede cerrar un partido cancelado' using errcode='23514'; end if;
 insert into public.resultados(partido_id,goles_local,goles_visitante)
 values(p_partido_id,p_goles_local,p_goles_visitante)
 on conflict (partido_id) do update set goles_local=excluded.goles_local,goles_visitante=excluded.goles_visitante;
 update public.partidos set estado='finalizado',version=version+1 where id=p_partido_id;
end $$;

revoke all on function public.guardar_participacion(uuid,boolean,boolean,boolean,boolean,integer),public.guardar_resultado(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.guardar_participacion(uuid,boolean,boolean,boolean,boolean,integer),public.guardar_resultado(uuid,integer,integer) to authenticated;
commit;
