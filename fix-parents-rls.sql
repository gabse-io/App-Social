-- Fix RLS específico para INSERT en parents
-- El problema puede ser que la política ALL no aplica correctamente al INSERT

-- Primero eliminar la política ALL existente
DROP POLICY IF EXISTS "Admins can manage parents" ON parents;

-- Crear políticas separadas para cada operación

-- SELECT: Admins pueden ver todos, padres solo los suyos
CREATE POLICY "Admins can view all parents"
ON parents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- INSERT: Solo admins pueden crear
CREATE POLICY "Admins can insert parents"
ON parents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- UPDATE: Solo admins pueden actualizar
CREATE POLICY "Admins can update parents"
ON parents FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- DELETE: Solo admins pueden eliminar
CREATE POLICY "Admins can delete parents"
ON parents FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Mantener la política para que padres vean su propia data
DROP POLICY IF EXISTS "Parents can view own data" ON parents;
CREATE POLICY "Parents can view own data"
ON parents FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- Verificar políticas finales
SELECT policyname, roles, cmd, qual IS NOT NULL as has_using, with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'parents';
