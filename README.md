# MiniBasquet Pro

Aplicación web para gestionar recaudaciones de fondos de un club de minibásquet, donde los padres pueden tomar pedidos de productos y el administrador central gestiona campañas, pedidos y entregas.

## 🚀 Características

- **Roles de usuario**: Administrador y Padres/Apoderados
- **Gestión de campañas**: Crear campañas con productos
- **Wizard de pedidos**: 3 pasos para crear pedidos intuitivamente
- **Panel de entregas**: Búsqueda y gestión de estados de pago/entrega
- **Dashboard**: Estadísticas globales para el administrador
- **Integración MercadoPago**: Generación de links de pago (simulado)
- **Diseño responsive**: Mobile-first con paleta azul/blanco

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React, TypeScript
- **Estilos**: TailwindCSS
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth

## 📋 Requisitos previos

1. Cuenta en [Supabase](https://supabase.com)
2. Node.js 18+ instalado

## 🔧 Configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. Copia la URL y la anon key del proyecto

### 2. Ejecutar el esquema de base de datos

1. En tu proyecto de Supabase, ve a la sección SQL Editor
2. Copia y ejecuta el contenido del archivo `supabase/schema.sql`
3. Esto creará todas las tablas necesarias con sus políticas RLS

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

O, para desarrollo temporal, edita `src/lib/supabase/config.ts` y agrega tus credenciales en `devConfig`.

### 4. Instalar dependencias

```bash
npm install
```

### 5. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 👥 Uso de la aplicación

### Primeros pasos

1. **Registrar el primer usuario (Administrador)**:
   - Ve a `/login`
   - Haz clic en "¿No tienes cuenta? Regístrate"
   - Selecciona rol "Administrador"
   - Completa el registro

2. **Configurar el sistema**:
   - Como administrador, ve a "Padres" y agrega los padres/apoderados
   - Ve a "Campañas" y crea una nueva campaña
   - Agrega productos a la campaña
   - Edita la campaña y asigna los padres habilitados

3. **Padres toman pedidos**:
   - Los padres se registran con rol "Padre/Apoderado"
   - Van a "Nuevo Pedido" y siguen el wizard de 3 pasos
   - Pueden ver sus pedidos en "Mis Pedidos"

4. **Gestión de entregas**:
   - El administrador usa "Entregas" para buscar por cliente
   - Puede marcar pedidos como pagados/entregados
   - Acciones masivas disponibles

## 📁 Estructura del proyecto

```
minibasquet-pro/
├── src/
│   ├── app/                    # Páginas Next.js
│   │   ├── dashboard/          # Dashboard protegido
│   │   │   ├── deliveries/     # Gestión de entregas
│   │   │   ├── parents/        # CRUD de padres
│   │   │   ├── campaigns/      # CRUD de campañas
│   │   │   ├── new-order/      # Wizard de pedidos
│   │   │   └── my-orders/      # Historial de pedidos
│   │   ├── login/              # Página de login/registro
│   │   └── layout.tsx          # Layout principal
│   ├── components/
│   │   ├── ui/                 # Componentes UI reutilizables
│   │   ├── providers.tsx       # Contexto de autenticación
│   │   └── dashboard-layout.tsx # Layout del dashboard
│   ├── lib/
│   │   ├── auth.ts             # Funciones de autenticación
│   │   └── supabase/
│   │       ├── client.ts       # Cliente Supabase
│   │       ├── config.ts       # Configuración
│   │       └── services.ts     # Servicios de base de datos
│   └── types/
│       └── index.ts            # Tipos TypeScript
├── supabase/
│   └── schema.sql              # Esquema de base de datos
└── README.md
```

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Los padres solo ven sus campañas habilitadas y sus propios pedidos
- Los administradores tienen acceso completo
- Confirmación antes de eliminar datos

## 🎨 Personalización

### Colores

Los colores principales se definen en `src/app/globals.css`:
- Primario: `#1a73e8` (azul)
- Fondo: `#f5f9ff` (blanco azulado)
- Superficie: `#ffffff` (blanco)

## 🚀 Despliegue

### Vercel

1. Conecta tu repositorio a Vercel
2. Agrega las variables de entorno en Vercel
3. Despliega automáticamente

### Otros proveedores

Asegúrate de agregar las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 📝 Notas

- La integración con MercadoPago está simulada. Para producción, reemplaza la función `generateMercadoPagoLink` con la API real de MercadoPago.
- Para usar el email del padre en la autenticación, asegúrate de que el email registrado en Supabase coincida con el email del padre en la tabla `parents`.

## 🤝 Contribuciones

Este es un proyecto de ejemplo. Siéntete libre de adaptarlo a tus necesidades.

## 📄 Licencia

MIT
