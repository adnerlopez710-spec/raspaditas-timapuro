# Empezar con Raspaditas Timapuro

Este paquete reúne el demo visual de raspaditas y el panel web de administración.

## Qué comprobar primero
- `public/raspadita-demo.html`: demo visual; acepta códigos de demostración y **no** valida tickets reales en Supabase.
- `src/main.jsx`: panel con roles `admin` y `superadmin`.
- `SCHEMA_CHECK.sql`: consulta de solo lectura para comparar el esquema real.
- `PROFILES_SETUP.sql`: tabla de perfiles y política de lectura del propio perfil; revisar antes de ejecutar si ya existe `profiles`.
- `SUPABASE_SEED_PREMIOS.sql`: carga inicial de premios y probabilidades, sin borrar filas. Revisar importes y probabilidades antes de ejecutar.

## Ejecutar localmente
Requiere Node.js compatible con Vite 7.

```bash
npm install
npm run verify:demo
npm run build
```

## Importante
El panel y la demo están preparados como base, pero no se han conectado a tu cuenta real de Supabase ni publicado. No uses la demo para ventas ni premios reales hasta que el resultado se genere y valide en servidor, los tickets sean únicos y las políticas RLS estén comprobadas.
