CREATE TABLE IF NOT EXISTS Usuarios (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Compras (
  id TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES Usuarios(id),
  email TEXT NOT NULL,
  fecha_visita TEXT NOT NULL,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('cash', 'card')),
  estado TEXT NOT NULL CHECK (estado IN ('pending', 'confirmed', 'cancelled')),
  monto_total INTEGER NOT NULL,
  referencia_pago TEXT,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Tickets (
  id TEXT PRIMARY KEY,
  compra_id TEXT NOT NULL REFERENCES Compras(id),
  edad_visitante INTEGER NOT NULL CHECK (edad_visitante >= 0),
  tipo_pase TEXT NOT NULL CHECK (tipo_pase IN ('common', 'vip')),
  precio INTEGER NOT NULL CHECK (precio >= 0)
);

CREATE INDEX IF NOT EXISTS idx_compras_usuario_fecha
  ON Compras(usuario_id, fecha_visita);
CREATE INDEX IF NOT EXISTS idx_tickets_compra
  ON Tickets(compra_id);
