-- Identidades totalmente ficticias; ROLLBACK evita persistir fixtures o el bootstrap.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
create function pg_temp.uid(text) returns uuid language sql immutable as $$select md5($1)::uuid$$;
create function pg_temp.login(who text, provider text default 'google') returns void
language plpgsql as $$begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.uid(who),'role','authenticated',
 'app_metadata',jsonb_build_object('provider',provider))::text,true);
end$$;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
select pg_temp.uid(v),'authenticated','authenticated',
 case when v='admin' then 'j.salas@goethe.edu.ar' else v||'@example.invalid' end,
 now(),'{"provider":"google","providers":["google"]}'::jsonb,jsonb_build_object('full_name','Test '||v)
from unnest(array['admin','prof_f','prof_h','alumno1','alumno2','sin_rol','no_google','admin2']) v;
insert into auth.identities(id,user_id,provider_id,provider,identity_data)
select gen_random_uuid(),id,id::text,'google',jsonb_build_object('sub',id::text,'email',email,'email_verified',true)
from auth.users where id in (select pg_temp.uid(v) from unnest(array['admin','prof_f','prof_h','alumno1','alumno2','sin_rol','admin2']) v);

select is((select count(*) from public.categorias),3::bigint,'Tres categorías iniciales');
select is((select count(*) from public.jugadores),0::bigint,'Sin personas del MVP ni seeds productivos');
select is((select count(*) from pg_tables where schemaname in ('public','private') and not rowsecurity),0::bigint,'RLS en todas las tablas de aplicación');
select ok(not has_function_privilege('anon','public.guardar_categoria(uuid,text,integer,boolean)','execute'),'Anon no puede ejecutar comandos');
select ok(not has_function_privilege('authenticated','public.inicializar_administrador(uuid)','execute'),'Bootstrap no es accesible al cliente');
select ok(not has_table_privilege('authenticated','public.roles','update'),'Sin modificación directa de roles');
select ok(not has_table_privilege('authenticated','public.partidos','insert'),'Sin inserción deportiva directa antes de RPC transaccionales');
select ok(not has_table_privilege('anon','public.jugadores','select'),'Anon sin grant de datos');
select is((select count(*) from public.asignaciones_rol),0::bigint,'No existe admin implícito');

set local role service_role;
select throws_ok($$select public.inicializar_administrador(pg_temp.uid('prof_f'))$$,'42501',null,'Email distinto no reclama admin');
select lives_ok($$select public.inicializar_administrador(pg_temp.uid('admin'))$$,'Bootstrap Google verificado del designado');
select throws_ok($$select public.inicializar_administrador(pg_temp.uid('admin'))$$,'23505',null,'Bootstrap no se repite');
reset role;

insert into public.perfiles(id,nombre)
select pg_temp.uid(v),'Test '||v from unnest(array['prof_f','prof_h','alumno1','alumno2','sin_rol','no_google','admin2']) v;
insert into public.deportes(id,codigo,nombre) values
 (pg_temp.uid('futbol'),'futbol','Fútbol'),(pg_temp.uid('handball'),'handball','Handball');
insert into public.equipos(id,nombre,es_propio) values
 (pg_temp.uid('goethe'),'Equipo propio ficticio',true),(pg_temp.uid('rival'),'Rival ficticio',false),
 (pg_temp.uid('tercero'),'Tercero ficticio',false);
insert into public.temporadas(id,nombre,desde,hasta) values
 (pg_temp.uid('temporada'),'Temporada test','2026-01-01','2099-12-31');
insert into public.planteles(id,equipo_id,deporte_id,categoria_id,temporada_id)
select pg_temp.uid(v),pg_temp.uid('goethe'),pg_temp.uid(case when v='pf' then 'futbol' else 'handball' end),
 (select id from public.categorias where nombre='Cadetes'),pg_temp.uid('temporada') from unnest(array['pf','ph']) v;
insert into public.jugadores(id,perfil_id,nombre,apellido) values
 (pg_temp.uid('j1'),pg_temp.uid('alumno1'),'Alumno','Uno'),
 (pg_temp.uid('j2'),pg_temp.uid('alumno2'),'Alumno','Dos'),
 (pg_temp.uid('j3'),null,'Sin','Cuenta');
insert into public.jugador_datos_personales(jugador_id,dni,nacimiento) values
 (pg_temp.uid('j1'),'10000001','2010-01-01'),(pg_temp.uid('j2'),'10000002','2010-01-02');
insert into public.inscripciones(id,jugador_id,plantel_id,camiseta,desde) values
 (pg_temp.uid('i1'),pg_temp.uid('j1'),pg_temp.uid('pf'),1,'2026-01-01'),
 (pg_temp.uid('i2'),pg_temp.uid('j2'),pg_temp.uid('ph'),1,'2026-01-01'),
 (pg_temp.uid('i3'),pg_temp.uid('j3'),pg_temp.uid('pf'),2,'2026-01-01');
insert into public.asignaciones_rol(perfil_id,rol_id,deporte_id)
select pg_temp.uid(v),(select id from public.roles where codigo='docente'),
 pg_temp.uid(case when v='prof_f' then 'futbol' else 'handball' end) from unnest(array['prof_f','prof_h']) v;
insert into public.asignaciones_rol(perfil_id,rol_id)
select pg_temp.uid(v),(select id from public.roles where codigo='alumno') from unnest(array['alumno1','alumno2']) v;
insert into public.partidos(id,plantel_id,deporte_id,categoria_id,temporada_id,local_id,visitante_id,inicio,cierre_confirmacion)
select pg_temp.uid(v),pg_temp.uid(case when v='p1' then 'pf' else 'ph' end),
 pg_temp.uid(case when v='p1' then 'futbol' else 'handball' end),
 (select id from public.categorias where nombre='Cadetes'),pg_temp.uid('temporada'),
 pg_temp.uid('goethe'),pg_temp.uid('rival'),now()+interval '2 days',now()+interval '1 day'
from unnest(array['p1','p2']) v;
insert into public.convocatorias(id,partido_id,inscripcion_id,plantel_id) values
 (pg_temp.uid('c1'),pg_temp.uid('p1'),pg_temp.uid('i1'),pg_temp.uid('pf')),
 (pg_temp.uid('c2'),pg_temp.uid('p2'),pg_temp.uid('i2'),pg_temp.uid('ph'));
insert into public.entrenamientos(id,plantel_id,inicio) values (pg_temp.uid('e1'),pg_temp.uid('pf'),now()),(pg_temp.uid('e2'),pg_temp.uid('pf'),now()+interval '1 hour');
insert into public.asistencias(entrenamiento_id,inscripcion_id,plantel_id) values (pg_temp.uid('e1'),pg_temp.uid('i1'),pg_temp.uid('pf'));

-- Integridad relacional: estas pruebas usan al propietario para aislar constraints de RLS.
select throws_ok($$insert into public.resultados values(pg_temp.uid('inexistente'),1,0)$$,'23503',null,'Resultado no puede existir sin partido');
select lives_ok($$insert into public.resultados values(pg_temp.uid('p1'),1,0)$$,'FK resultado apunta al padre');
select throws_ok($$insert into public.resultados values(pg_temp.uid('p1'),2,0)$$,'23505',null,'Un resultado por partido');
select throws_ok($$update public.resultados set goles_local=-1 where partido_id=pg_temp.uid('p1')$$,'23514',null,'Marcadores no negativos');
select throws_ok($$insert into public.convocatorias(partido_id,inscripcion_id,plantel_id) values(pg_temp.uid('p1'),pg_temp.uid('i2'),pg_temp.uid('pf'))$$,'23503',null,'Convocatoria no cruza planteles');
select throws_ok($$insert into public.asistencias values(pg_temp.uid('e1'),pg_temp.uid('i2'),pg_temp.uid('pf'),'presente')$$,'23503',null,'Asistencia no cruza planteles');
select lives_ok($$insert into public.asistencias values(pg_temp.uid('e2'),pg_temp.uid('i1'),pg_temp.uid('pf'),'presente')$$,'Dos sesiones el mismo día no colisionan');
select throws_ok($$update public.inscripciones set camiseta=1 where id=pg_temp.uid('i3')$$,'23505',null,'Camiseta activa única por plantel');
select throws_ok($$insert into public.participaciones(convocatoria_id,presente,jugo) values(pg_temp.uid('c1'),false,true)$$,'23514',null,'Ausente no puede figurar como participante');
select throws_ok($$update public.partidos set visitante_id=local_id where id=pg_temp.uid('p1')$$,'23514',null,'Local distinto de visitante');
select throws_ok($$insert into public.asignaciones_rol(perfil_id,rol_id) select pg_temp.uid('alumno1'),id from public.roles where codigo='alumno'$$,'23505',null,'NULL no permite duplicar asignación global');
select throws_ok($$insert into public.autorizaciones(convocatoria_id,responsable_id,version_texto,aceptado_en) values(pg_temp.uid('c1'),pg_temp.uid('alumno2'),'v1',now())$$,'23514',null,'Autorización requiere vínculo verificado');

set local role authenticated;
select pg_temp.login('prof_f');
select is((select count(*) from public.jugadores),2::bigint,'Profesor fútbol ve solo sus jugadores, incluido sin cuenta');
select is((select count(*) from public.jugador_datos_personales),1::bigint,'No ve DNI de handball');
select is((select count(*) from public.partidos),1::bigint,'Profesor fútbol no ve partidos handball');
select is((select count(*) from public.categorias),3::bigint,'Profesor con ámbito deportivo ve catálogo');
select throws_ok($$select public.guardar_categoria(null,'Nueva',4,true)$$,'42501',null,'Docente no administra categorías sin permiso');
select throws_ok($$select public.guardar_rol(null,'intruso','Intruso',true,array['roles.gestionar'])$$,'42501',null,'Docente no crea roles para escalar');
select throws_ok($$select public.asignar_rol(pg_temp.uid('prof_f'),(select id from public.roles limit 1))$$,'42501',null,'Docente no se asigna roles');
select throws_ok($$select public.responder_convocatoria(pg_temp.uid('c1'),'acepta',null)$$,'42501',null,'Profesor no suplanta respuesta del alumno');
select throws_ok($$update public.convocatorias set respuesta='acepta'$$,'42501',null,'Nadie evita RPC con UPDATE directo');

select pg_temp.login('alumno1');
select is((select count(*) from public.jugadores),1::bigint,'Alumno ve solo su ficha');
select is((select count(*) from public.inscripciones),1::bigint,'Alumno ve solo su inscripción');
select is((select count(*) from public.convocatorias),1::bigint,'Alumno ve solo su convocatoria');
select lives_ok($$select public.responder_convocatoria(pg_temp.uid('c1'),'acepta','propio')$$,'Respuesta propia autorizada');
select is((select respuesta from public.convocatorias where id=pg_temp.uid('c1')),'acepta','Respuesta persistida');
select throws_ok($$select public.responder_convocatoria(pg_temp.uid('c2'),'acepta',null)$$,'42501',null,'Alumno no responde por otro');
select throws_ok($$select public.responder_convocatoria(pg_temp.uid('c1'),'inventada',null)$$,'22023',null,'Respuesta validada en servidor');
select throws_ok($$update public.perfiles set activo=false where id=pg_temp.uid('alumno1')$$,'42501',null,'Alumno no cambia habilitación');
reset role;
update public.partidos set cierre_confirmacion=now()-interval '1 minute' where id=pg_temp.uid('p1');
set local role authenticated;
select pg_temp.login('alumno1');
select throws_ok($$select public.responder_convocatoria(pg_temp.uid('c1'),'rechaza',null)$$,'23514',null,'Plazo se valida en servidor');
select pg_temp.login('sin_rol');
select is((select count(*) from public.jugadores),0::bigint,'Google autenticado sin rol no ve datos');
select is((select count(*) from public.categorias),0::bigint,'Sin habilitación funcional no hay catálogo');
select pg_temp.login('no_google');
select ok(not private.habilitado(),'Email declarado no basta sin identidad Google');
select pg_temp.login('admin','email');
select ok(not private.habilitado(),'Credencial ajena a Google no activa permisos');
select pg_temp.login('admin');
select ok(private.es_principal(),'Principal verificado reconocido');
select lives_ok($$select public.guardar_categoria(null,'Prueba',9,true)$$,'Administrador configura categorías');
select throws_ok($$select public.guardar_categoria(null,' cadetes ',9,true)$$,'23505',null,'Nombre de categoría normalizado único');
select lives_ok($$select public.guardar_categoria((select id from public.categorias where nombre='Prueba'),'Prueba editada',10,false)$$,'Categoría editable y desactivable');
select throws_ok($$select public.guardar_rol((select id from public.roles where codigo='administrador_principal'),'administrador_principal','Otro',false,array[]::text[])$$,'42501',null,'Rol principal protegido');
select throws_ok($$select public.habilitar_usuario(pg_temp.uid('admin'),'Admin',false)$$,'23514',null,'No desactiva último administrador');
select throws_ok($$select public.revocar_rol((select id from public.asignaciones_rol where perfil_id=pg_temp.uid('admin')))$$,'23514',null,'No revoca último administrador');
select lives_ok($$select public.guardar_rol(null,'editor_categorias','Editor categorías',true,array['categorias.gestionar','configuracion.leer'])$$,'Crear perfil configurable');
select lives_ok($$select public.asignar_rol(pg_temp.uid('prof_f'),(select id from public.roles where codigo='editor_categorias'))$$,'Asignar permiso adicional');
select throws_ok($$select public.asignar_rol(pg_temp.uid('prof_h'),(select id from public.roles where codigo='editor_categorias'),pg_temp.uid('handball'),null)$$,'22023',null,'Permiso administrativo requiere ámbito global');
select pg_temp.login('prof_f');
select lives_ok($$select public.guardar_categoria(null,'Desde rol nuevo',11,true)$$,'Nuevo rol habilita solo su acción');
select throws_ok($$select public.guardar_rol(null,'otro','Otro',true,array[]::text[])$$,'42501',null,'Editor categorías no administra roles');
select pg_temp.login('admin');
select lives_ok($$select public.revocar_rol(a.id) from public.asignaciones_rol a join public.roles r on r.id=a.rol_id where a.perfil_id=pg_temp.uid('prof_f') and r.codigo='editor_categorias'$$,'Revocar rol');
select pg_temp.login('prof_f');
select throws_ok($$select public.guardar_categoria(null,'Sin permiso',12,true)$$,'42501',null,'Revocación efectiva con el mismo JWT');
select pg_temp.login('admin');
select lives_ok($$select public.asignar_rol(pg_temp.uid('admin2'),(select id from public.roles where codigo='administrador_principal'))$$,'Agregar segundo administrador');
select lives_ok($$select public.revocar_rol((select id from public.asignaciones_rol where perfil_id=pg_temp.uid('admin')))$$,'Transferir administración sin dejarla vacía');
select ok(not private.es_principal(),'Privilegio no se repone después de revocar');
reset role;
select ok((select count(*)>0 from private.auditoria where tabla='roles'),'Ediciones de roles auditadas');
select ok((select count(*)>0 from private.auditoria where tabla='convocatorias'),'Respuestas auditadas');
select ok((select activo from public.perfiles where id=pg_temp.uid('admin')),'Fallo de desactivación fue atómico');
set local role anon;
select throws_ok($$select * from public.jugadores$$,'42501',null,'Anon no lee fichas');
select throws_ok($$select public.responder_convocatoria(pg_temp.uid('c1'),'acepta',null)$$,'42501',null,'Anon no ejecuta RPC');
reset role;
select * from finish();
rollback;
