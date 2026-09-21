begin;
drop function public.listar_usuarios_google();
create function public.listar_usuarios_google()
returns table(usuario_id uuid,email text,nombre text,habilitado boolean,roles text[])
language sql stable security definer set search_path = '' as $$
 select u.id,u.email,coalesce(p.nombre,u.raw_user_meta_data->>'full_name',''),coalesce(p.activo,false),
 coalesce(array_agg(r.nombre order by r.nombre) filter (where r.id is not null),'{}'::text[])
 from auth.users u join auth.identities i on i.user_id=u.id and i.provider='google'
 left join public.perfiles p on p.id=u.id
 left join public.asignaciones_rol a on a.perfil_id=u.id
 left join public.roles r on r.id=a.rol_id and r.activo
 where private.es_principal() and u.is_anonymous=false
 group by u.id,u.email,p.nombre,p.activo,u.raw_user_meta_data
 order by lower(u.email)
$$;
revoke all on function public.listar_usuarios_google() from public,anon,authenticated;
grant execute on function public.listar_usuarios_google() to authenticated;
commit;
