begin;

create function public.reporte_asistencia_plantel(p_plantel_id uuid)
returns table(
 jugador_id uuid,
 nombre text,
 apellido text,
 entrenamientos_realizados bigint,
 presentes bigint,
 ausentes bigint,
 porcentaje numeric
) language sql stable security definer set search_path = '' as $$
 select j.id,j.nombre,j.apellido,
   count(distinct t.id) filter (where t.estado='realizado'),
   count(*) filter (where a.estado='presente'),
   count(*) filter (where a.estado='ausente'),
   case when count(distinct t.id)=0 then null
        else round(100.0 * count(*) filter (where a.estado='presente') / count(distinct t.id),2) end
 from public.inscripciones i
 join public.jugadores j on j.id=i.jugador_id
 left join public.asistencias a on a.inscripcion_id=i.id and a.plantel_id=p_plantel_id
 left join public.entrenamientos t on t.id=a.entrenamiento_id and t.plantel_id=p_plantel_id
 where i.plantel_id=p_plantel_id and i.activa
   and private.tiene_permiso('entrenamientos.leer',null,p_plantel_id)
 group by j.id,j.nombre,j.apellido
 order by j.apellido,j.nombre
$$;

create function public.reporte_partidos_plantel(p_plantel_id uuid)
returns table(
 partido_id uuid,
 inicio timestamptz,
 estado text,
 local_nombre text,
 visitante_nombre text,
 goles_local integer,
 goles_visitante integer
) language sql stable security definer set search_path = '' as $$
 select p.id,p.inicio,p.estado,el.nombre,ev.nombre,r.goles_local,r.goles_visitante
 from public.partidos p
 join public.equipos el on el.id=p.local_id
 join public.equipos ev on ev.id=p.visitante_id
 left join public.resultados r on r.partido_id=p.id
 where p.plantel_id=p_plantel_id
   and private.tiene_permiso('partidos.leer',p.deporte_id,p_plantel_id)
 order by p.inicio desc
$$;

revoke all on function public.reporte_asistencia_plantel(uuid),public.reporte_partidos_plantel(uuid) from public,anon,authenticated;
grant execute on function public.reporte_asistencia_plantel(uuid),public.reporte_partidos_plantel(uuid) to authenticated;
commit;
