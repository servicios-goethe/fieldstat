begin;

-- Las migraciones de partidos agregaron permisos después de sembrar el rol
-- administrador. Completar sus permisos globales de forma idempotente.
insert into public.rol_permisos(rol_id,permiso)
select r.id,p.codigo
from public.roles r cross join public.permisos p
where r.codigo='administrador_principal'
  and p.codigo in ('partidos.gestionar','convocatorias.gestionar')
on conflict do nothing;

commit;
