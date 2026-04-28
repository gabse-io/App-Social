# MiniBasquet Pro - Estado del Proyecto

**Última actualización:** 27 de Abril, 2026

---

## 📋 Resumen General

Sistema de gestión de pedidos para minibasquet con:
- **Panel de Administración** (campañas, pedidos, padres, usuarios, dashboard)
- **Panel de Padres** (tomar pedidos para sus hijos)
- **Autenticación** con Supabase Auth
- **Base de Datos** PostgreSQL en Supabase

---

## ✅ Funcionalidades Implementadas

### 1. Gestión de Pedidos (Completa)
- Creación de pedidos múltiples por padre
- Order headers + order_items estructura
- Estados de pago y entrega separados
- Dashboard con estadísticas
- Lista de pedidos con filtros

### 2. Panel de Administración - Estilos Modernos

#### **Campañas** (`/admin/campaigns`)
- ✅ Header con glassmorphism (blur + gradiente)
- ✅ Cards con header degradado azul
- ✅ Productos como badges redondeados
- ✅ Modales modernos (create, edit parents, manage products)
- ✅ Botones con hover effects

#### **Padres** (`/admin/parents`)
- ✅ Tabla moderna con columnas: Padre, Contacto, Pedidos, Estado, Acciones
- ✅ Avatar circular con gradiente (azul activo, gris inactivo)
- ✅ **Editar padre** - Modal para modificar nombre, email, teléfono
- ✅ **Activar/Desactivar** - Toggle de estado sin eliminar registro
- ✅ Badge de pedidos
- ✅ Estados visuales (Activo/Inactivo con colores)

#### **Usuarios/Administradores** (`/admin/users`)
- ✅ Tabla moderna con estilo consistente
- ✅ Avatar con gradiente verde
- ✅ Placeholder para edición (desactivado temporalmente)

#### **Dashboard** (`/admin`)
- ✅ Estadísticas de pedidos
- ✅ Pedidos recientes
- ✅ Sidebar con navegación activa corregida

### 3. Esquema de Base de Datos (Actualizado)

#### Tablas Principales:

```sql
-- Tabla parents (actualizada)
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,                    -- NUEVO
  is_active BOOLEAN DEFAULT TRUE, -- NUEVO
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla order_headers
CREATE TABLE order_headers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES parents(id),
  payment_status TEXT DEFAULT 'pending',
  delivery_status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla order_items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_header_id UUID REFERENCES order_headers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- Tabla profiles (existe)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'parent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
```

---

## 🔧 Configuraciones de Supabase Ejecutadas

### 1. Función RPC para crear/actualizar perfiles

```sql
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

-- Permisos
GRANT EXECUTE ON FUNCTION insert_or_update_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_or_update_profile(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION insert_or_update_profile(UUID, TEXT, TEXT, TEXT) TO service_role;
```

### 2. Políticas RLS (Row Level Security)

**IMPORTANTE:** Se detectó que falta la política para admins en tabla `parents`. 

```sql
-- PENDIENTE: Ejecutar este SQL para fixear creación de padres
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
```

### 3. Trigger para crear perfil automáticamente (PENDIENTE)

```sql
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

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. Columnas Agregadas (Ya ejecutado)

```sql
-- Agregar columna phone a parents
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Agregar columna is_active a parents
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
```

---

## 🐛 Issues Conocidos / Pendientes

### CRÍTICO - Bloqueando:
1. **RLS Policy faltante:** Error "new row violates row-level security policy for table 'parents'"
   - **Solución:** Ejecutar SQL de política RLS arriba
   
2. **Redirección incorrecta:** Después del error RLS, redirecciona al panel del padre
   - **Causa probable:** El `signIn` en el catch queda en sesión
   - **Archivo:** `src/app/admin/parents/page.tsx`

### Mejoras Pendientes:
3. **Rate limit de emails:** Al crear múltiples padres, se alcanza límite de Supabase
   - **Solución temporal:** Esperar 30-60 minutos entre creaciones
   - **Solución permanente:** Desactivar "Confirm email" en Supabase Dashboard → Auth → Email

4. **Perfiles faltantes:** Usuarios en auth sin perfil en tabla `profiles` causan errores 406
   - **Solución:** Ejecutar trigger de creación automática arriba

---

## 📁 Archivos Modificados Recientemente

### Frontend:
- `src/app/admin/campaigns/page.tsx` - Estilos modernos completos
- `src/app/admin/parents/page.tsx` - Tabla + edición + toggle estado
- `src/app/admin/users/page.tsx` - Tabla moderna
- `src/components/providers.tsx` - Fix `maybeSingle()` para perfiles
- `src/lib/supabase/services.ts` - Funciones `createParent`, `updateParent`, `toggleParentStatus`

### SQL:
- `supabase/schema.sql` - Schema actualizado con `phone` e `is_active`
- `create-profile-function.sql` - Función RPC `insert_or_update_profile`
- `fix-admin.sql` - (archivo existente, posiblemente contiene fixes)

---

## 🚀 Cómo Retomar Mañana

### Paso 1: Ejecutar SQL Pendiente
1. Ir a Supabase Dashboard → SQL Editor
2. Ejecutar la política RLS para admins en tabla `parents` (sección "Políticas RLS" arriba)
3. Ejecutar el trigger de creación automática de perfiles
4. Verificar que las columnas `phone` e `is_active` existan en tabla `parents`

### Paso 2: Verificar Funcionamiento
1. Iniciar sesión como admin
2. Probar crear un padre NUEVO (email que no exista antes)
3. Verificar que:
   - Se crea en auth.users
   - Se crea en profiles
   - Se crea en parents
   - Aparece en la tabla de padres

### Paso 3: Fixear Redirección
Si sigue redireccionando después de error:
- Revisar función `handleAddParent` en `src/app/admin/parents/page.tsx`
- El `signIn` en el catch puede estar dejando sesión activa
- Considerar usar `supabase.auth.signOut()` después del intento fallido

---

## 📞 Contexto Importante

### Flujo de Creación de Padre (Actual):
1. `signUp` en auth.users
2. Si ya existe → `signIn` para obtener userId
3. Crear/actualizar perfil vía RPC `insert_or_update_profile`
4. Crear registro en tabla `parents`

### Problema del Rate Limit:
- Supabase limita emails de verificación por hora
- Solución: Desactivar "Enable email confirmations" en Auth → Email
- Esto permite crear usuarios sin enviar emails

### Arquitectura de Pedidos:
- `order_headers` - Encabezado del pedido (padre, totales, estados)
- `order_items` - Líneas de productos (producto, cantidad, precio)
- Los totales se calculan desde order_items

---

## 🎯 Prioridades para Mañana

1. **ALTA:** Fix RLS policy para tabla parents
2. **ALTA:** Fix redirección incorrecta después de error
3. **MEDIA:** Implementar edición de administradores (users page)
4. **BAJA:** Testing completo de flujo de pedidos

---

## 📚 Comandos Útiles

```bash
# Iniciar desarrollo
npm run dev

# Compilar
npm run build

# Ver logs de Supabase (si tuviera CLI)
supabase logs
```

---

## 🔐 Credenciales de Prueba

- **Admin:** (tu email) / (tu contraseña)
- **Padre temporal:** (varios creados durante testing)
- **Contraseña temporal padres:** `temporal123`

---

## 📝 Notas Finales

- El sistema está **funcional** para tomar pedidos
- Los **estilos modernos** están aplicados en campañas, padres y usuarios
- La **tabla moderna de padres** incluye edición y activar/desactivar
- **Falta:** Resolver RLS y redirección para completar flujo de creación

**Para continuar mañana:** Leer este archivo, ejecutar SQL pendiente, probar creación de padre.
