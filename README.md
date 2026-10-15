# Raspaditas Timapuro — panel web y demo visual

Proyecto React + Vite en español. Conserva el diseño existente de la raspadita y añade los paneles de gestión. No necesita rehacer el diseño desde cero.

## Qué quedó preparado

- Acceso por correo y contraseña con Supabase Auth.
- Paneles diferenciados por rol `superadmin` y `admin`.
- Resumen de operaciones.
- Gestión de premios: alta, activar/desactivar y probabilidad con hasta cinco decimales.
- Gestión de vendedores: alta, activar/desactivar.
- Lectura de ventas y tickets.
- Consulta de reclamos (`prize_claims`) y actividad (`audit_log`).
- Búsqueda local y exportación CSV de las secciones.
- Botón que abre el diseño original de la raspadita.
- Consulta SQL para revisar el esquema real.
- Carga SQL inicial e idempotente de los 13 resultados/probabilidades.
- Prueba automática básica para comprobar el JavaScript de la raspadita y las probabilidades.

## Resultados y probabilidades incluidos

| Resultado | Importe | Probabilidad por ticket |
|---|---:|---:|
| Lata Kaiser | G. 5.000 | 5,00000 % |
| Lata Brahma | G. 10.000 | 1,00000 % |
| Lata Skol | G. 25.000 | 0,80000 % |
| Botellita Skol abre fácil | G. 50.000 | 0,10000 % |
| Botellita Budweiser | G. 100.000 | 0,05000 % |
| Heineken botellita | G. 250.000 | 0,01600 % |
| Stella Artois | G. 500.000 | 0,00600 % |
| Heineken Silver | G. 1.000.000 | 0,00100 % |
| Johnnie Walker Gold Label | G. 3.000.000 | 0,00020 % |
| SORPRESA PLATA | Según premio sorpresa | 0,00030 % |
| Johnnie Walker Blue Label | G. 5.000.000 | 0,00008 % |
| SORPRESA GOLD | Según premio sorpresa | 0,00010 % |
| SIN PREMIO — Cerveza Polar | G. 0 | 93,02632 % |
| **Total** | | **100,00000 %** |

El tablero de demostración sortea un único resultado ponderado por jugada. En un ticket perdedor, ningún símbolo puede formar tres iguales. Polar es un símbolo de relleno frecuente y está rotulado SIN PREMIO. Gold, Blue y las sorpresas no se usan como relleno común; solo aparecen si el resultado elegido corresponde a ellos.

**Pendiente visual importante:** el archivo que tenemos muestra una imagen de Heineken en el resultado de G. 100.000 aunque el premio aprobado es Budweiser; el arte usado para G. 250.000 también está duplicado del de G. 100.000, y las dos sorpresas comparten imagen. Dejé los resultados y probabilidades separados correctamente, pero hacen falta los artes originales correctos para que todas las imágenes coincidan antes de publicar.

## Supabase: orden recomendado

1. Abrí el proyecto correcto de Supabase y el **SQL Editor**.
2. Ejecutá `SCHEMA_CHECK.sql` para cotejar los nombres de columnas.
3. Ejecutá `PROFILES_SETUP.sql` para preparar la tabla de perfiles y la política de lectura del perfil propio. Si ya existe una tabla `profiles`, revisá el resultado antes de ejecutar.
4. Creá el usuario del superadministrador en **Authentication** y luego seguí las instrucciones comentadas al final de `PROFILES_SETUP.sql` para asignar `Fernando Barua` como `superadmin`. No uses el nombre como contraseña.
5. Ejecutá `SUPABASE_SEED_PREMIOS.sql` para insertar o actualizar los 13 resultados en `public.prizes`. El script no borra filas.
6. Configurá las variables públicas `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el entorno de despliegue. Nunca pongas una contraseña ni `service_role` en el frontend.

### Esquema usado por el panel

- `profiles`: `id`, `full_name`, `role`, `created_at`.
- `prizes`: `id`, `name`, `amount_gs`, `probability_percent`, `active`, `created_at`.
- `sellers`: `id`, `full_name`, `phone`, `active`, `created_at`.
- `sales`: `id`, `seller_id`, `quantity`, `ticket_price`, `commission_per_ticket`, `status`, `created_at`.
- `tickets`: `id`, `code`, `seller_id`, `sale_id`, `status`, `created_at`.
- `prize_claims`: `id`, `ticket_id`, `seller_id`, `status`, `created_at`.
- `audit_log`: `id`, `action`, `details`, `created_at`.

Los nombres de `tickets`, `prize_claims` y `audit_log` fueron ajustados al esquema que ya se había observado en Supabase. Las columnas de `profiles` aún deben verificarse en tu proyecto.

## Ejecutar y probar

```bash
npm install
npm run dev
npm run verify:demo
npm run build
```

`npm run verify:demo` comprueba la sintaxis del JavaScript, que existan 13 resultados, que la suma de probabilidades sea 100 %, que Gold/Blue/sorpresas no estén en los símbolos de relleno y que Polar esté marcado como SIN PREMIO.

## Lo que todavía falta para producción

Esta carpeta es una base de trabajo mejorada, no una plataforma lista para vender o pagar premios reales. No se ha conectado a tu cuenta real ni publicado desde aquí porque eso exige autorización dentro de tus cuentas. En este entorno tampoco se pudo completar la instalación de dependencias, así que todavía no puedo afirmar que `npm run build` haya pasado.

**No usar la demo del navegador para validar premios reales.** El resultado final debe generarse, guardarse y validarse en el servidor con una operación segura y transaccional; además hacen falta políticas RLS para cada rol, creación de usuarios/perfiles, flujo real de ventas y asignación de tickets, reclamos auditables, pruebas de integración y revisión de requisitos legales aplicables. Los permisos visuales del frontend por sí solos no protegen la base de datos.
