# Hito 2: núcleo operativo

Estado: **en curso**. Este incremento incorpora una aplicación React/Vite y el ingreso con Google configurado en Supabase. El cliente usa OAuth con PKCE: el retorno de Google contiene un código temporal, no tokens en la URL.

## Primer ingreso seguro

1. Configurar en Supabase Authentication > URL Configuration la URL local (`http://localhost:5173`) como Redirect URL durante desarrollo y, más adelante, la URL HTTPS de staging.
2. Crear `.env.local` desde `.env.example`, con `VITE_SUPABASE_URL` y la **anon key** de Supabase (Settings > API). La anon key puede estar en el cliente; nunca usar `service_role`.
3. Ejecutar `npm ci` y `npm run dev`.
4. Iniciar sesión como `j.salas@goethe.edu.ar`. La pantalla mostrará que la identidad está pendiente: eso confirma que Google Auth funciona pero aún no otorga acceso a datos.
5. Desde SQL Editor, con privilegios de operador, ejecutar una única vez la función `public.inicializar_administrador('<UUID de auth.users>')`. La función valida tanto el proveedor Google como el email designado y deja auditoría.

El UUID se obtiene en Authentication > Users al seleccionar la identidad de `j.salas@goethe.edu.ar`; no se debe crear una cuenta por email/contraseña para evitar saltear la validación de Google.

Después de este paso, el administrador puede iniciar sesión y accederá al panel a medida que se incorporen los módulos H2.
