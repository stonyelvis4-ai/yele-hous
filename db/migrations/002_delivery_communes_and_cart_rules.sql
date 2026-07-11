CREATE TABLE IF NOT EXISTS delivery_communes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  delivery_price NUMERIC(12, 2) NOT NULL CHECK (delivery_price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO delivery_communes (id, name, delivery_price, is_active)
SELECT
  'COM-' || ROW_NUMBER() OVER (ORDER BY commune),
  commune,
  amount,
  TRUE
FROM shipping_rates
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_delivery_communes_is_active ON delivery_communes(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_communes_name ON delivery_communes(name);
