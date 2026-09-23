begin;
create function public.inscribir_jugador_por_dni(p_dni text,p_plantel_id uuid,p_camiseta integer,p_desde date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare jugador uuid;
begin
 perform private.exigir_principal();
 select j.id into jugador from public.jugadores j join public.jugador_datos_personales d on d.jugador_id=j.id where d.dni=btrim(p_dni) and j.activo;
 if jugador is null then raise exception 'No existe un jugador activo con ese DNI' using errcode='P0002'; end if;
 insert into public.inscripciones(jugador_id,plantel_id,camiseta,desde) values(jugador,p_plantel_id,p_camiseta,coalesce(p_desde,current_date))
 on conflict (jugador_id,plantel_id) do update set camiseta=excluded.camiseta,desde=excluded.desde,activa=true;
 return jugador;
end $$;
revoke all on function public.inscribir_jugador_por_dni(text,uuid,integer,date) from public,anon,authenticated;
grant execute on function public.inscribir_jugador_por_dni(text,uuid,integer,date) to authenticated;
commit;
