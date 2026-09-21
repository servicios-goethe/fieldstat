begin;
create function public.listar_asignaciones_usuario(p_usuario uuid)
returns table(asignacion_id uuid,rol_id uuid,rol_nombre text)
language sql stable security definer set search_path = '' as $$
 select a.id,a.rol_id,r.nombre from public.asignaciones_rol a join public.roles r on r.id=a.rol_id
 where private.es_principal() and a.perfil_id=p_usuario order by r.nombre
$$;
revoke all on function public.listar_asignaciones_usuario(uuid) from public,anon,authenticated;
grant execute on function public.listar_asignaciones_usuario(uuid) to authenticated;
commit;
