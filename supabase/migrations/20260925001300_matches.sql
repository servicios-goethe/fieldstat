begin;

-- Permisos de gestión del ciclo de partidos. Los docentes los reciben sin
-- ampliar su acceso fuera de los planteles/deportes asignados.
insert into public.permisos(codigo,descripcion,ambito) values
 ('partidos.gestionar','Crear y editar partidos del ámbito','deportivo'),
 ('convocatorias.gestionar','Gestionar convocatorias del ámbito','deportivo')
on conflict (codigo) do nothing;

insert into public.rol_permisos(rol_id,permiso)
select r.id,p.codigo
from public.roles r cross join public.permisos p
where r.codigo='docente' and p.codigo in ('partidos.gestionar','convocatorias.gestionar')
on conflict do nothing;

create function public.guardar_partido(
 p_id uuid,
 p_plantel_id uuid,
 p_deporte_id uuid,
 p_categoria_id uuid,
 p_temporada_id uuid,
 p_torneo_id uuid,
 p_fecha_id uuid,
 p_local_id uuid,
 p_visitante_id uuid,
 p_sede_id uuid,
 p_inicio timestamptz,
 p_cierre_confirmacion timestamptz,
 p_estado text,
 p_observaciones text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 if not private.tiene_permiso('partidos.gestionar',p_deporte_id,p_plantel_id)
 then raise exception 'No autorizado para gestionar partidos' using errcode='42501'; end if;
 if p_inicio is null or p_cierre_confirmacion is null or p_cierre_confirmacion > p_inicio
 then raise exception 'El cierre debe ser anterior al inicio' using errcode='22023'; end if;
 if p_estado is null or p_estado not in ('pendiente','finalizado','cancelado')
 then raise exception 'Estado de partido inválido' using errcode='22023'; end if;
 if p_id is null then
  insert into public.partidos(plantel_id,deporte_id,categoria_id,temporada_id,torneo_id,fecha_id,
    local_id,visitante_id,sede_id,inicio,cierre_confirmacion,estado,observaciones)
  values(p_plantel_id,p_deporte_id,p_categoria_id,p_temporada_id,p_torneo_id,p_fecha_id,
    p_local_id,p_visitante_id,p_sede_id,p_inicio,p_cierre_confirmacion,p_estado,nullif(btrim(p_observaciones),''))
  returning id into resultado;
 else
  update public.partidos set plantel_id=p_plantel_id,deporte_id=p_deporte_id,categoria_id=p_categoria_id,
    temporada_id=p_temporada_id,torneo_id=p_torneo_id,fecha_id=p_fecha_id,local_id=p_local_id,
    visitante_id=p_visitante_id,sede_id=p_sede_id,inicio=p_inicio,cierre_confirmacion=p_cierre_confirmacion,
    estado=p_estado,observaciones=nullif(btrim(p_observaciones),'') ,version=version+1
  where id=p_id returning id into resultado;
  if not found then raise exception 'Partido inexistente' using errcode='P0002'; end if;
 end if;
 return resultado;
end $$;

revoke all on function public.guardar_partido(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.guardar_partido(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,text) to authenticated;
commit;
