#!/usr/bin/env python3
"""Pruebas de dos sesiones contra el contenedor LOCAL fijo, nunca contra staging.
Requiere una base recién reseteada. Limpia únicamente sus fixtures al terminar.
"""
import json
import subprocess
import time
import uuid

CONTAINER = 'supabase_db_fieldstats-joaco'
COMMAND = ['docker', 'exec', '-i', CONTAINER, 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres']
a, b = str(uuid.uuid4()), str(uuid.uuid4())
ids = f"'{a}'::uuid,'{b}'::uuid"


def sql(statement):
    result = subprocess.run(COMMAND, input=statement, text=True, capture_output=True, timeout=20)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return result.stdout.strip()


def claims(user):
    value = json.dumps({'sub': user, 'role': 'authenticated', 'app_metadata': {'provider': 'google'}})
    return f"set local role authenticated; select set_config('request.jwt.claims','{value}',true);"


def race(actor_a, actor_b, operation_a, operation_b, expected_error):
    worker = subprocess.Popen(COMMAND, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    second = None
    try:
        worker.stdin.write("begin; set application_name='fieldstats_h1_race';" + claims(actor_a) +
                           'select pg_advisory_xact_lock(17092026,1); select pg_sleep(2);' + operation_a + '; commit;')
        worker.stdin.close()
        worker.stdin = None
        for _ in range(30):
            held = sql("select exists(select 1 from pg_locks l join pg_stat_activity s on s.pid=l.pid "
                       "where s.application_name='fieldstats_h1_race' and l.locktype='advisory' and l.granted)")
            if held == 't':
                break
            time.sleep(0.05)
        else:
            raise AssertionError('La primera sesión no adquirió el bloqueo')
        second = subprocess.Popen(COMMAND, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        second.stdin.write('begin;' + claims(actor_b) + operation_b + '; commit;')
        second.stdin.close()
        second.stdin = None
        _, err_a = worker.communicate(timeout=15)
        _, err_b = second.communicate(timeout=15)
        assert worker.returncode == 0, err_a
        assert second.returncode != 0 and expected_error in err_b, err_b
    finally:
        for process in (worker, second):
            if process and process.poll() is None:
                process.kill()
                process.communicate()


# Evita mezclar la prueba con usuarios reales o una base de trabajo existente.
assert sql('select count(*) from public.perfiles') == '0', 'Ejecutar db:reset local antes de esta prueba'
assert sql('select count(*) from private.bootstrap') == '0', 'La base local ya fue inicializada'
try:
    sql(f"""begin;
    insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data)
    select id,'authenticated','authenticated',id::text||'@example.invalid',now(),'{{"provider":"google"}}'::jsonb
    from unnest(array[{ids}]) id;
    insert into auth.identities(id,user_id,provider_id,provider,identity_data)
    select gen_random_uuid(),id,id::text,'google',jsonb_build_object('sub',id::text,'email',email,'email_verified',true)
    from auth.users where id in ({ids});
    insert into public.perfiles(id,nombre) select id,'Concurrency fixture' from auth.users where id in ({ids});
    insert into public.asignaciones_rol(perfil_id,rol_id)
    select u.id,r.id from auth.users u cross join public.roles r
    where u.id in ({ids}) and r.codigo='administrador_principal';
    insert into private.bootstrap(admin_id) values('{a}'); commit;""")
    def revoke(user):
        return f"select public.revocar_rol(id) from public.asignaciones_rol where perfil_id='{user}'"
    race(a, b, revoke(a), revoke(b), 'Debe quedar al menos un administrador')
    assert sql('select count(*) from public.asignaciones_rol') == '1'
    print('PASS: dos revocaciones simultáneas conservan un administrador')
    sql(f"insert into public.asignaciones_rol(perfil_id,rol_id) select '{a}',id from public.roles where codigo='administrador_principal'")
    # El actor A espera mientras B revoca su rol: debe revalidarse después del lock.
    race(b, a, revoke(a), "select public.guardar_rol(null,'race_no_debe_existir','Race',true,array[]::text[])", 'No autorizado')
    assert sql("select count(*) from public.roles where codigo='race_no_debe_existir'") == '0'
    print('PASS: actor revocado mientras espera no ejecuta una operación administrativa')
finally:
    sql(f"""begin;
    delete from private.bootstrap where admin_id in ({ids});
    delete from public.asignaciones_rol where perfil_id in ({ids});
    delete from public.perfiles where id in ({ids});
    delete from auth.identities where user_id in ({ids});
    delete from auth.users where id in ({ids});
    delete from public.roles where codigo='race_no_debe_existir';
    delete from private.auditoria where actor_id in ({ids})
      or anterior->>'id' in ('{a}','{b}') or posterior->>'id' in ('{a}','{b}')
      or anterior->>'perfil_id' in ('{a}','{b}') or posterior->>'perfil_id' in ('{a}','{b}');
    commit;""")
assert sql('select count(*) from public.perfiles') == '0'
print('PASS: fixtures de concurrencia eliminados')
