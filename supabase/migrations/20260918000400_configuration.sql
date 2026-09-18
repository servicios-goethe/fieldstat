begin;

-- Los catálogos institucionales se modifican sólo por comandos auditados.
create function public.guardar_deporte(p_id uuid,p_codigo text,p_nombre text,p_activo boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 perform private.exigir_principal();
 if p_id is null then
  insert into public.deportes(codigo,nombre,activo) values(lower(btrim(p_codigo)),btrim(p_nombre),p_activo) returning id into resultado;
 else
  update public.deportes set codigo=lower(btrim(p_codigo)),nombre=btrim(p_nombre),activo=p_activo where id=p_id returning id into resultado;
  if not found then raise exception 'Deporte inexistente' using errcode='P0002'; end if;
 end if;
 return resultado;
end $$;

create function public.guardar_temporada(p_id uuid,p_nombre text,p_desde date,p_hasta date,p_activa boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 perform private.exigir_principal();
 if p_desde is null or p_hasta is null or p_hasta<p_desde then raise exception 'Rango de temporada inválido' using errcode='22023'; end if;
 if p_id is null then
  insert into public.temporadas(nombre,desde,hasta,activa) values(btrim(p_nombre),p_desde,p_hasta,p_activa) returning id into resultado;
 else
  update public.temporadas set nombre=btrim(p_nombre),desde=p_desde,hasta=p_hasta,activa=p_activa where id=p_id returning id into resultado;
  if not found then raise exception 'Temporada inexistente' using errcode='P0002'; end if;
 end if;
 return resultado;
end $$;

create function public.guardar_sede(p_id uuid,p_nombre text,p_direccion text,p_activa boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 perform private.exigir_principal();
 if p_id is null then
  insert into public.sedes(nombre,direccion,activo) values(btrim(p_nombre),nullif(btrim(p_direccion),''),p_activa) returning id into resultado;
 else
  update public.sedes set nombre=btrim(p_nombre),direccion=nullif(btrim(p_direccion),''),activo=p_activa where id=p_id returning id into resultado;
  if not found then raise exception 'Sede inexistente' using errcode='P0002'; end if;
 end if;
 return resultado;
end $$;

create function public.guardar_equipo(p_id uuid,p_nombre text,p_es_propio boolean,p_activo boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 perform private.exigir_principal();
 if p_id is null then
  insert into public.equipos(nombre,es_propio,activo) values(btrim(p_nombre),p_es_propio,p_activo) returning id into resultado;
 else
  update public.equipos set nombre=btrim(p_nombre),es_propio=p_es_propio,activo=p_activo where id=p_id returning id into resultado;
  if not found then raise exception 'Equipo inexistente' using errcode='P0002'; end if;
 end if;
 return resultado;
end $$;

revoke all on function public.guardar_deporte(uuid,text,text,boolean),public.guardar_temporada(uuid,text,date,date,boolean),public.guardar_sede(uuid,text,text,boolean),public.guardar_equipo(uuid,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.guardar_deporte(uuid,text,text,boolean),public.guardar_temporada(uuid,text,date,date,boolean),public.guardar_sede(uuid,text,text,boolean),public.guardar_equipo(uuid,text,boolean,boolean) to authenticated;
commit;
