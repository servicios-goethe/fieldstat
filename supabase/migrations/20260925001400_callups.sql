begin;

create function public.guardar_convocatoria(
 p_id uuid,
 p_partido_id uuid,
 p_inscripcion_id uuid,
 p_convocado boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid; v_plantel uuid;
begin
 select plantel_id into v_plantel from public.partidos where id=p_partido_id;
 if v_plantel is null then raise exception 'Partido inexistente' using errcode='P0002'; end if;
 if not private.tiene_permiso('convocatorias.gestionar',null,v_plantel)
 then raise exception 'No autorizado para gestionar convocatorias' using errcode='42501'; end if;
 if exists(select 1 from public.partidos where id=p_partido_id and estado<>'pendiente')
 then raise exception 'El partido no admite cambios de convocatoria' using errcode='23514'; end if;
 if not exists(select 1 from public.inscripciones where id=p_inscripcion_id and plantel_id=v_plantel and activa)
 then raise exception 'La inscripción no pertenece al plantel o está inactiva' using errcode='23514'; end if;
 if p_id is null then
  insert into public.convocatorias(partido_id,inscripcion_id,plantel_id,convocado)
  values(p_partido_id,p_inscripcion_id,v_plantel,p_convocado)
  on conflict (partido_id,inscripcion_id) do update set convocado=excluded.convocado
  returning id into resultado;
 else
  update public.convocatorias set convocado=p_convocado where id=p_id and partido_id=p_partido_id returning id into resultado;
  if not found then raise exception 'Convocatoria inexistente' using errcode='P0002'; end if;
 end if;
 return resultado;
end $$;

revoke all on function public.guardar_convocatoria(uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.guardar_convocatoria(uuid,uuid,uuid,boolean) to authenticated;
commit;
