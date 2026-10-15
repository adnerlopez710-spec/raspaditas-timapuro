# Timapuro — estado real para la entrega

## Revisado en este paquete
- [x] Se conservó el HTML de la raspadita de demostración y sus recursos embebidos.
- [x] La prueba `npm run verify:demo` pasó: JavaScript válido, 13 resultados, probabilidades suman 100% y los símbolos de relleno no incluyen los premios altos.
- [x] Panel web React con acceso por Supabase Auth y vistas según rol `admin` / `superadmin`.
- [x] Scripts SQL de revisión del esquema, perfiles y carga inicial de premios.

## Bloqueos que requieren acceso a tus cuentas (no están marcados como hechos)
- [ ] Ejecutar SQL en el proyecto correcto de Supabase y revisar sus resultados.
- [ ] Crear usuario de acceso y asignar rol `superadmin` a la cuenta correcta.
- [ ] Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el despliegue.
- [ ] Confirmar compilación `npm run build` (la instalación de dependencias no terminó en este entorno).
- [ ] Publicar e iniciar sesión en el sitio real.
- [ ] Implementar y probar en servidor la validación de códigos, el sorteo real transaccional y el registro de resultados. La demo HTML no valida códigos con el servidor.
- [ ] Revisar las políticas RLS y permisos de cada rol con pruebas de seguridad.
- [ ] Corregir los artes de premios que el README original identifica como pendientes.

## Publicación rápida
1. Extraer esta carpeta y subir el contenido de `timapuro-web` a un repositorio GitHub propio.
2. En Vercel, importar ese repositorio y establecer como raíz `timapuro-web` si el repositorio contiene la carpeta superior.
3. Añadir las dos variables públicas de Supabase indicadas en `.env.example`. Nunca publicar `service_role`, contraseñas ni claves privadas en el frontend.
4. Antes de usar dinero o pagar premios, completar las tareas de servidor, RLS y pruebas.
