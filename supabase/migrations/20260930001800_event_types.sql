begin;

create function public.guardar_tipo_estadistica(
 p_id uuid,
 p_deporte_id uuid,
 p_codigo text,
 p_nombre text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare resultado uuid;
begin
 perform private.exigir_principal();
 if p_id is null then
  insert into public.tipos_estadistica(deporte_id,codigo,nombre)
  values(p_deporte_id,lower(btrim(p_codigo)),btrim(p_nombre)) returning id into resultado;
 else
  update public.tipos_estadistica set deporte_id=p_deporte_id,codigo=lower(btrim(p_codigo)),nombre=btrim(p_nombre)
  where id=p_id returning id into resultado;
  if not found then raise exception 'Tipo de evento inexistente' using errcode='P0002'; end if;
 end if;
 return resultado;
end $$;

revoke all on function public.guardar_tipo_estadistica(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.guardar_tipo_estadistica(uuid,uuid,text,text) to authenticated;
commit;
