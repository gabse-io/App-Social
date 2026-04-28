-- ============================================
-- MiniBasquet Pro - Database Setup
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. POLÍTICA RLS PARA ADMINS (CRÍTICO)
-- Permite a admins gestionar la tabla parents
-- ============================================

-- Habilitar RLS si no está habilitado
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Admins can manage parents" ON parents;

-- Crear política para admins
CREATE POLICY "Admins can manage parents"
ON parents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Política para que padres vean su propia información
DROP POLICY IF EXISTS "Parents can view own data" ON parents;
CREATE POLICY "Parents can view own data"
ON parents FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM profiles WHERE id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 2. TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE
-- Crea automáticamente perfil cuando se registra usuario
-- ============================================

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. ASEGURAR QUE LAS COLUMNAS EXISTAN
-- ============================================

-- Agregar columna phone a parents
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Agregar columna is_active a parents
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ============================================
-- 4. FUNCIONES RPC NECESARIAS
-- ============================================

-- Función para insertar o actualizar perfil
CREATE OR REPLACE FUNCTION insert_or_update_profile(
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role, created_at, updated_at)
  VALUES (p_id, p_email, p_name, p_role, NOW(), NOW())
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
END;
$$;

-- Permisos para la función
GRANT EXECUTE ON FUNCTION insert_or_update_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_or_update_profile(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION insert_or_update_profile(UUID, TEXT, TEXT, TEXT) TO service_role;

-- ============================================
-- 5. FIX PARA USUARIO ADMIN EXISTENTE
-- (Descomenta y modifica con tu user_id si es necesario)
-- ============================================

-- Si tu usuario admin no tiene perfil, ejecuta:
-- INSERT INTO profiles (id, email, name, role, created_at, updated_at)
-- VALUES (
--   'TU-USER-ID-AQUI',
--   'tu-email@ejemplo.com',
--   'Administrador',
--   'admin',
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar políticas creadas
SELECT * FROM pg_policies WHERE tablename = 'parents';

-- Verificar columnas de parents
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'parents';
