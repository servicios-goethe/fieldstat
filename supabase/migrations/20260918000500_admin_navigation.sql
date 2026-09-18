begin;

create function public.es_administrador_principal() returns boolean
language sql stable security definer set search_path = '' as $$
 select private.es_principal()
$$;

revoke all on function public.es_administrador_principal() from public,anon;
grant execute on function public.es_administrador_principal() to authenticated;
commit;
