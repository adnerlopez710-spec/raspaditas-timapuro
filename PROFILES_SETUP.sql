-- Raspaditas Timapuro — perfil/rol de acceso al panel.
-- Ejecutar en Supabase SQL Editor antes de iniciar sesión en el panel.
-- Este script NO crea usuarios ni cambia el rol de usuarios automáticamente.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Timapuro: leer mi propio perfil" ON public.profiles;
CREATE POLICY "Timapuro: leer mi propio perfil"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

-- PASO MANUAL PARA ASIGNAR EL SUPERADMIN:
-- 1) Crear primero el usuario en Supabase Authentication.
-- 2) Reemplazar TU_CORREO_AQUI por el correo exacto y ejecutar estas líneas:
-- INSERT INTO public.profiles (id, full_name, role)
-- SELECT id, 'Fernando Barua', 'superadmin'
-- FROM auth.users WHERE lower(email) = lower('TU_CORREO_AQUI')
-- ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
-- Para los demás usuarios, usar role='admin'. Nunca permitir que un usuario cambie su propio rol.
