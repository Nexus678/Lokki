-- 1. Tabla de Usuarios (Perfiles extendidos del Auth de Supabase)
CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  correo text UNIQUE NOT NULL,
  telefono text,
  lada text,
  created_at timestamptz DEFAULT now()
);

-- 2. Tabla de Tiendas
CREATE TABLE public.tiendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_user uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  slug text UNIQUE NOT NULL, 
  titulo text NOT NULL,
  descripcion text,
  logo text,
  banner text,
  url_instagram text,
  url_facebook text,
  whatsapp text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabla de Productos
CREATE TABLE public.productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_tienda uuid NOT NULL REFERENCES public.tiendas(id) ON DELETE CASCADE,
  nombre_producto text NOT NULL,
  categoria text,
  imagen text,
  precio numeric(10, 2) NOT NULL,
  moneda text DEFAULT 'MXN',
  descripcion text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Tabla de Pedidos
CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_tienda uuid NOT NULL REFERENCES public.tiendas(id) ON DELETE CASCADE,
  detalle_pedido jsonb NOT NULL, 
  nombre_cliente text NOT NULL,
  direccion text,
  correo text,
  numero_telefonico text,
  estatus text DEFAULT 'pendiente', 
  created_at timestamptz DEFAULT now()
);

