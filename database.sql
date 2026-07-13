-- ============================================================
-- E-Commerce Schema — run this in your Supabase SQL editor
-- ============================================================

-- Categories
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  image_url  TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  price          NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url      TEXT,
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (no payment — status starts as 'pending')
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status           VARCHAR(50) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  total_amount     NUMERIC(10,2) NOT NULL,
  delivery_name    VARCHAR(255) NOT NULL,
  delivery_phone   VARCHAR(50) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city    VARCHAR(100) NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Order line items (snapshot price at time of order)
CREATE TABLE order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read on categories and active products
CREATE POLICY "public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "public read products"   ON products   FOR SELECT USING (is_active = true);

-- Orders: users can only see and create their own
CREATE POLICY "users read own orders"   ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order items: visible if the parent order belongs to the user
CREATE POLICY "users read own order_items" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "users create order_items" ON order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- ============================================================
-- Sample seed data
-- ============================================================

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Energy Snacks',  'energy-snacks',  1),
  ('Protein Bars',   'protein-bars',   2),
  ('Beverages',      'beverages',      3),
  ('Healthy Sweets', 'healthy-sweets', 4);

INSERT INTO products (name, description, price, image_url, category_id, stock_quantity) VALUES
  ('Almond Energy Bar',   'Packed with almonds and oats for a sustained energy boost.',  12.90, 'https://placehold.co/400x300/e8f5e9/2e7d32?text=Energy+Bar',  (SELECT id FROM categories WHERE slug='energy-snacks'), 50),
  ('Cashew Crunch Bar',   'Crunchy roasted cashews in a dark chocolate coating.',         14.50, 'https://placehold.co/400x300/e8f5e9/2e7d32?text=Cashew+Bar',  (SELECT id FROM categories WHERE slug='energy-snacks'), 40),
  ('Whey Protein Bar',    'High-protein bar with 20g protein per serving.',              18.90, 'https://placehold.co/400x300/e3f2fd/1565c0?text=Protein+Bar', (SELECT id FROM categories WHERE slug='protein-bars'),  35),
  ('Peanut Butter Bar',   'Natural peanut butter and honey — clean fuel.',               16.00, 'https://placehold.co/400x300/e3f2fd/1565c0?text=PB+Bar',      (SELECT id FROM categories WHERE slug='protein-bars'),  30),
  ('Green Detox Drink',   'Spirulina, chlorella and cucumber cold-pressed.',              22.00, 'https://placehold.co/400x300/f3e5f5/6a1b9a?text=Detox+Drink', (SELECT id FROM categories WHERE slug='beverages'),     25),
  ('Kombucha Original',   'Raw live-culture kombucha, lightly carbonated.',              15.90, 'https://placehold.co/400x300/f3e5f5/6a1b9a?text=Kombucha',    (SELECT id FROM categories WHERE slug='beverages'),     20),
  ('Date Brownie',        'Fudgy brownies sweetened only with Medjool dates.',           11.50, 'https://placehold.co/400x300/fff8e1/e65100?text=Brownie',      (SELECT id FROM categories WHERE slug='healthy-sweets'), 45),
  ('Raw Cacao Truffle',   'Dark cacao truffles with zero refined sugar.',                 9.90, 'https://placehold.co/400x300/fff8e1/e65100?text=Truffle',      (SELECT id FROM categories WHERE slug='healthy-sweets'), 60),
  ('Mixed Nut Granola',   'Slow-baked granola with walnuts, pecans and maple.',          19.90, 'https://placehold.co/400x300/e8f5e9/2e7d32?text=Granola',     (SELECT id FROM categories WHERE slug='energy-snacks'), 55),
  ('Coconut Protein Bar', '15g plant protein, coconut and dark chocolate.',              17.50, 'https://placehold.co/400x300/e3f2fd/1565c0?text=Coconut+Bar', (SELECT id FROM categories WHERE slug='protein-bars'),  28);
