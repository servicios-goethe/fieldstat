begin;

create function public.listar_usuarios_google()
returns table(usuario_id uuid,email text,nombre text,habilitado boolean)
language sql stable security definer set search_path = '' as $$
 select u.id,u.email,coalesce(p.nombre,u.raw_user_meta_data->>'full_name',''),coalesce(p.activo,false)
 from auth.users u join auth.identities i on i.user_id=u.id and i.provider='google'
 left join public.perfiles p on p.id=u.id
 where private.es_principal() and u.is_anonymous=false
 order by lower(u.email)
$$;

revoke all on function public.listar_usuarios_google() from public,anon,authenticated;
grant execute on function public.listar_usuarios_google() to authenticated;
commit;
