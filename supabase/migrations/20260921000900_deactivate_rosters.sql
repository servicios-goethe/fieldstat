begin;
create function public.desactivar_jugador(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 perform private.exigir_principal();
 if not exists(select 1 from public.jugadores where id=p_id) then raise exception 'Jugador inexistente' using errcode='P0002'; end if;
 update public.jugadores set activo=false where id=p_id;
 update public.inscripciones set activa=false where jugador_id=p_id;
end $$;
create function public.desactivar_inscripcion(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 perform private.exigir_principal();
 update public.inscripciones set activa=false where id=p_id;
 if not found then raise exception 'Inscripción inexistente' using errcode='P0002'; end if;
end $$;
create function public.desactivar_plantel(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 perform private.exigir_principal();
 update public.planteles set activo=false where id=p_id;
 if not found then raise exception 'Plantel inexistente' using errcode='P0002'; end if;
end $$;
revoke all on function public.desactivar_jugador(uuid),public.desactivar_inscripcion(uuid),public.desactivar_plantel(uuid) from public,anon,authenticated;
grant execute on function public.desactivar_jugador(uuid),public.desactivar_inscripcion(uuid),public.desactivar_plantel(uuid) to authenticated;
commit;
