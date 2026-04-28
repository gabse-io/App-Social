-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de perfiles (relacionada con auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'parent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla de padres/apoderados
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla de proyectos/campañas
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla de productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla de relación padres habilitados por proyecto
CREATE TABLE project_parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(project_id, parent_id)
);

-- Tabla de cabeceras de pedidos (información de la orden)
CREATE TABLE order_headers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla de items de pedidos (productos individuales de cada orden)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_header_id UUID NOT NULL REFERENCES order_headers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Tabla de pedidos (mantener por compatibilidad, marcada como deprecated)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  customer_name TEXT NOT NULL,
  payment_link TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Índices para mejor rendimiento
CREATE INDEX idx_orders_parent_id ON orders(parent_id);
CREATE INDEX idx_orders_project_id ON orders(project_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX idx_orders_customer_name ON orders(customer_name);
CREATE INDEX idx_products_project_id ON products(project_id);
CREATE INDEX idx_project_parents_project_id ON project_parents(project_id);
CREATE INDEX idx_project_parents_parent_id ON project_parents(parent_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR auth.jwt()->>'role' = 'admin'
  );

-- Políticas RLS para parents (solo admin puede gestionar)
CREATE POLICY "Admins can view all parents" ON parents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can view own profile" ON parents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles prof
      WHERE prof.id = auth.uid() AND prof.email = parents.email
    )
  );

CREATE POLICY "Admins can insert parents" ON parents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update parents" ON parents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete parents" ON parents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas RLS para projects
CREATE POLICY "Admins can view all projects" ON projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can view allowed projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_parents pp
      JOIN parents p ON pp.parent_id = p.id
      JOIN profiles prof ON prof.email = p.email
      WHERE pp.project_id = projects.id AND prof.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update projects" ON projects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete projects" ON projects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas RLS para products
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can view products from allowed projects" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_parents pp
      JOIN parents p ON pp.parent_id = p.id
      JOIN profiles prof ON prof.email = p.email
      WHERE pp.project_id = products.project_id AND prof.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can view products from allowed projects" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_parents pp
      JOIN parents p ON pp.parent_id = p.id
      JOIN profiles prof ON prof.email = p.email
      WHERE pp.project_id = products.project_id AND prof.id = auth.uid()
    )
  );

-- Políticas RLS para project_parents
CREATE POLICY "Admins can view all project_parents" ON project_parents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert project_parents" ON project_parents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete project_parents" ON project_parents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas RLS para order_headers
CREATE POLICY "Admins can view all order_headers" ON order_headers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can view own order_headers" ON order_headers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parents p
      JOIN profiles prof ON prof.email = p.email
      WHERE p.id = order_headers.parent_id AND prof.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert order_headers" ON order_headers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update order_headers" ON order_headers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete order_headers" ON order_headers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas RLS para order_items
CREATE POLICY "Admins can view all order_items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can view own order_items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_headers oh
      JOIN parents p ON oh.parent_id = p.id
      JOIN profiles prof ON prof.email = p.email
      WHERE oh.id = order_items.order_header_id AND prof.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert order_items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update order_items" ON order_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete order_items" ON order_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas RLS para orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can view own orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parents p
      JOIN profiles prof ON prof.email = p.email
      WHERE p.id = orders.parent_id AND prof.id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert orders" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM parents p
      JOIN profiles prof ON prof.email = p.email
      WHERE p.id = parent_id AND prof.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Vista para obtener pedidos con nombre del padre (legacy)
CREATE OR REPLACE VIEW orders_view AS
SELECT
  o.*,
  p.name as parent_name,
  proj.name as project_name
FROM orders o
JOIN parents p ON o.parent_id = p.id
JOIN projects proj ON o.project_id = proj.id;

-- Vista para obtener cabeceras de pedidos con nombre del padre
CREATE OR REPLACE VIEW order_headers_view AS
SELECT
  oh.*,
  p.name as parent_name,
  proj.name as project_name
FROM order_headers oh
JOIN parents p ON oh.parent_id = p.id
JOIN projects proj ON oh.project_id = proj.id;

-- Función para insertar o actualizar profiles sin RLS (para admins)
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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
EXCEPTION
  WHEN unique_violation THEN
    -- Si el email ya existe, actualizar por email
    UPDATE profiles SET
      name = p_name,
      role = p_role,
      updated_at = NOW()
    WHERE email = p_email;
END;
$$;

-- Función para generar número de orden único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_num TEXT;
  seq_val BIGINT;
BEGIN
  -- Obtener el siguiente valor de una secuencia
  SELECT nextval('order_number_seq') INTO seq_val;

  -- Formatear como ORD-XXXXXX (ej: ORD-000001)
  order_num := 'ORD-' || LPAD(seq_val::TEXT, 6, '0');

  RETURN order_num;
END;
$$;

-- Crear secuencia para números de orden
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger para generar número de orden automáticamente
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number_trigger
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- Trigger para generar número de orden en order_headers
CREATE TRIGGER set_order_number_trigger_headers
BEFORE INSERT ON order_headers
FOR EACH ROW
EXECUTE FUNCTION set_order_number();
