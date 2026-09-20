begin;

create function public.guardar_plantel(
 p_id uuid,p_equipo_id uuid,p_deporte_id uuid,p_categoria_id uuid,p_temporada_id uuid,p_sede_id uuid,p_activo boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 perform private.exigir_principal();
 if p_id is null then
  insert into public.planteles(equipo_id,deporte_id,categoria_id,temporada_id,sede_id,activo)
  values(p_equipo_id,p_deporte_id,p_categoria_id,p_temporada_id,p_sede_id,p_activo) returning id into resultado;
 else
  update public.planteles set equipo_id=p_equipo_id,deporte_id=p_deporte_id,categoria_id=p_categoria_id,temporada_id=p_temporada_id,sede_id=p_sede_id,activo=p_activo where id=p_id returning id into resultado;
  if not found then raise exception 'Plantel inexistente' using errcode='P0002'; end if;
 end if;
 return resultado;
end $$;

create function public.guardar_jugador(
 p_id uuid,p_nombre text,p_apellido text,p_dni text,p_nacimiento date,p_email text,p_telefono text,p_plantel_id uuid,p_camiseta integer,p_desde date
) returns uuid language plpgsql security definer set search_path = '' as $$
declare jugador uuid; inicio date;
begin
 perform private.exigir_principal(); inicio := coalesce(p_desde,current_date);
 if p_id is null then
  insert into public.jugadores(nombre,apellido) values(btrim(p_nombre),btrim(p_apellido)) returning id into jugador;
  insert into public.jugador_datos_personales(jugador_id,dni,nacimiento,email_contacto,telefono) values(jugador,btrim(p_dni),p_nacimiento,nullif(btrim(p_email),''),nullif(btrim(p_telefono),''));
 else
  jugador := p_id;
  update public.jugadores set nombre=btrim(p_nombre),apellido=btrim(p_apellido) where id=jugador;
  update public.jugador_datos_personales set dni=btrim(p_dni),nacimiento=p_nacimiento,email_contacto=nullif(btrim(p_email),''),telefono=nullif(btrim(p_telefono),'') where jugador_id=jugador;
 end if;
 if p_plantel_id is not null then
  insert into public.inscripciones(jugador_id,plantel_id,camiseta,desde) values(jugador,p_plantel_id,p_camiseta,inicio)
  on conflict (jugador_id,plantel_id) do update set camiseta=excluded.camiseta,desde=excluded.desde,activa=true;
 end if;
 return jugador;
end $$;

revoke all on function public.guardar_plantel(uuid,uuid,uuid,uuid,uuid,uuid,boolean),public.guardar_jugador(uuid,text,text,text,date,text,text,uuid,integer,date) from public,anon,authenticated;
grant execute on function public.guardar_plantel(uuid,uuid,uuid,uuid,uuid,uuid,boolean),public.guardar_jugador(uuid,text,text,text,date,text,text,uuid,integer,date) to authenticated;
commit;
