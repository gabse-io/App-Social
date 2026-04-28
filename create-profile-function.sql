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

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION insert_or_update_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_or_update_profile(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION insert_or_update_profile(UUID, TEXT, TEXT, TEXT) TO service_role;
