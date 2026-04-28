-- PASO 1: Limpiar cualquier registro previo conflictivo
DELETE FROM auth.users WHERE email = 'montenegrogabriel90@gmail.com';
DELETE FROM auth.identities WHERE identity_data->>'email' = 'montenegrogabriel90@gmail.com';

-- PASO 2: Insertar usuario con contraseña 'Admin123!' usando crypt de bcrypt
-- El formato debe ser compatible con GoTrue de Supabase
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'bad75c19-9bb3-43e1-bd11-487afba7e8bd',
  'authenticated',
  'authenticated',
  'montenegrogabriel90@gmail.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- PASO 3: Crear identidad para el usuario
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'bad75c19-9bb3-43e1-bd11-487afba7e8bd',
  'bad75c19-9bb3-43e1-bd11-487afba7e8bd',
  '{"sub":"bad75c19-9bb3-43e1-bd11-487afba7e8bd","email":"montenegrogabriel90@gmail.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- PASO 4: Asegurar que el perfil exista con rol admin
INSERT INTO profiles (id, email, name, role, created_at, updated_at)
VALUES (
  'bad75c19-9bb3-43e1-bd11-487afba7e8bd',
  'montenegrogabriel90@gmail.com',
  'Administrador',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', 
    name = 'Administrador',
    email = 'montenegrogabriel90@gmail.com';

-- Verificar que todo quedó bien
SELECT id, email, email_confirmed_at, role, created_at 
FROM auth.users 
WHERE email = 'montenegrogabriel90@gmail.com';
