-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  amount_ae INTEGER NOT NULL,
  price_original DECIMAL(10,2) NOT NULL,
  price_now DECIMAL(10,2) NOT NULL,
  image TEXT,
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Coupon codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  product_id INTEGER NOT NULL,
  is_used BOOLEAN DEFAULT 0,
  used_by_email TEXT,
  order_id INTEGER,
  reserved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  gateway TEXT NOT NULL, -- 'toyyibpay' or 'billplz'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  gateway_ref TEXT,
  gateway_bill_code TEXT,
  payment_url TEXT,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Order events table for audit trail
CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'created', 'payment_initiated', 'payment_completed', 'payment_failed', 'codes_sent'
  payload TEXT, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupon_codes_product_id ON coupon_codes(product_id);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_is_used ON coupon_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_order_id ON coupon_codes(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_gateway_ref ON orders(gateway_ref);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);