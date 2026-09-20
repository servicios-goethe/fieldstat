begin;

create function public.guardar_entrenamiento(p_id uuid,p_plantel_id uuid,p_inicio timestamptz,p_sede_id uuid,p_estado text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 if not private.tiene_permiso('entrenamientos.leer',null,p_plantel_id) then raise exception 'No autorizado' using errcode='42501'; end if;
 if p_estado not in ('programado','realizado','cancelado') then raise exception 'Estado inválido' using errcode='22023'; end if;
 if p_id is null then
  insert into public.entrenamientos(plantel_id,inicio,sede_id,estado) values(p_plantel_id,p_inicio,p_sede_id,p_estado) returning id into resultado;
 else
  update public.entrenamientos set plantel_id=p_plantel_id,inicio=p_inicio,sede_id=p_sede_id,estado=p_estado where id=p_id returning id into resultado;
  if not found then raise exception 'Entrenamiento inexistente' using errcode='P0002'; end if;
 end if;
 return resultado;
end $$;

create function public.guardar_asistencia(p_entrenamiento_id uuid,p_inscripcion_id uuid,p_plantel_id uuid,p_estado text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not private.tiene_permiso('entrenamientos.leer',null,p_plantel_id) then raise exception 'No autorizado' using errcode='42501'; end if;
 if p_estado not in ('sin_registrar','presente','ausente') then raise exception 'Estado inválido' using errcode='22023'; end if;
 insert into public.asistencias(entrenamiento_id,inscripcion_id,plantel_id,estado)
 values(p_entrenamiento_id,p_inscripcion_id,p_plantel_id,p_estado)
 on conflict (entrenamiento_id,inscripcion_id) do update set estado=excluded.estado,plantel_id=excluded.plantel_id;
end $$;

revoke all on function public.guardar_entrenamiento(uuid,uuid,timestamptz,uuid,text),public.guardar_asistencia(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.guardar_entrenamiento(uuid,uuid,timestamptz,uuid,text),public.guardar_asistencia(uuid,uuid,uuid,text) to authenticated;
commit;
