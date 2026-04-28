-- ============================================
-- Limpiar políticas RLS duplicadas en tabla parents
-- ============================================

-- Eliminar políticas individuales (duplicadas)
DROP POLICY IF EXISTS "Admins can delete parents" ON parents;
DROP POLICY IF EXISTS "Admins can insert parents" ON parents;
DROP POLICY IF EXISTS "Admins can update parents" ON parents;
DROP POLICY IF EXISTS "Admins can view all parents" ON parents;
DROP POLICY IF EXISTS "Parents can view own profile" ON parents;

-- Mantener solo estas dos políticas:
-- 1. Admins can manage parents (cubre ALL para admins)
-- 2. Parents can view own data (SELECT para padres)

-- Verificar políticas finales
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'parents';
