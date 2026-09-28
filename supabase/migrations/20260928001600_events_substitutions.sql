begin;

create function public.guardar_evento_partido(
 p_partido_id uuid,
 p_codigo text,
 p_nombre text,
 p_convocatoria_id uuid,
 p_asistidor_convocatoria_id uuid,
 p_equipo_id uuid,
 p_periodo integer,
 p_minuto integer,
 p_motivo text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid; v_deporte uuid; v_tipo uuid;
begin
 select deporte_id into v_deporte from public.partidos where id=p_partido_id;
 if v_deporte is null then raise exception 'Partido inexistente' using errcode='P0002'; end if;
 if not private.permiso_partido(p_partido_id,'partidos.gestionar') then raise exception 'No autorizado para registrar eventos' using errcode='42501'; end if;
 if exists(select 1 from public.partidos where id=p_partido_id and estado<>'pendiente') then raise exception 'El partido ya está cerrado' using errcode='23514'; end if;
 insert into public.tipos_estadistica(deporte_id,codigo,nombre) values(v_deporte,lower(btrim(p_codigo)),btrim(p_nombre))
 on conflict (deporte_id,codigo) do update set nombre=excluded.nombre returning id into v_tipo;
 insert into public.eventos_partido(partido_id,deporte_id,tipo_id,convocatoria_id,asistidor_convocatoria_id,equipo_id,periodo,minuto,motivo)
 values(p_partido_id,v_deporte,v_tipo,p_convocatoria_id,p_asistidor_convocatoria_id,p_equipo_id,p_periodo,p_minuto,nullif(btrim(p_motivo),'')) returning id into resultado;
 return resultado;
end $$;

create function public.guardar_cambio(
 p_partido_id uuid,
 p_sale_convocatoria_id uuid,
 p_entra_convocatoria_id uuid,
 p_periodo integer,
 p_minuto integer,
 p_motivo text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 if not private.permiso_partido(p_partido_id,'partidos.gestionar') then raise exception 'No autorizado para registrar cambios' using errcode='42501'; end if;
 if exists(select 1 from public.partidos where id=p_partido_id and estado<>'pendiente') then raise exception 'El partido ya está cerrado' using errcode='23514'; end if;
 if not exists(select 1 from public.convocatorias where id=p_sale_convocatoria_id and partido_id=p_partido_id and convocado)
 or not exists(select 1 from public.convocatorias where id=p_entra_convocatoria_id and partido_id=p_partido_id and convocado)
 then raise exception 'Las convocatorias no pertenecen al partido' using errcode='23514'; end if;
 insert into public.cambios(partido_id,sale_convocatoria_id,entra_convocatoria_id,periodo,minuto,motivo)
 values(p_partido_id,p_sale_convocatoria_id,p_entra_convocatoria_id,p_periodo,p_minuto,nullif(btrim(p_motivo),'')) returning id into resultado;
 return resultado;
end $$;

revoke all on function public.guardar_evento_partido(uuid,text,text,uuid,uuid,uuid,integer,integer,text),public.guardar_cambio(uuid,uuid,uuid,integer,integer,text) from public,anon,authenticated;
grant execute on function public.guardar_evento_partido(uuid,text,text,uuid,uuid,uuid,integer,integer,text),public.guardar_cambio(uuid,uuid,uuid,integer,integer,text) to authenticated;
commit;
