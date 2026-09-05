ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(6,2) NOT NULL DEFAULT 0.50,
  ADD COLUMN IF NOT EXISTS price_range TEXT NOT NULL DEFAULT 'MID';

DO $$ BEGIN
  ALTER TABLE shops ADD CONSTRAINT shops_price_range_check CHECK (price_range IN ('BUDGET', 'MID', 'PREMIUM'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS shop_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(trim(comment)) BETWEEN 3 AND 800),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, user_id)
);

CREATE TABLE IF NOT EXISTS favorite_shops (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, shop_id)
);

CREATE TABLE IF NOT EXISTS shop_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 120),
  description TEXT NOT NULL DEFAULT '',
  discount_percent INTEGER CHECK (discount_percent IS NULL OR discount_percent BETWEEN 1 AND 100),
  code TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_shop_reviews_shop_created ON shop_reviews(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorite_shops_user ON favorite_shops(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_offers_active_window ON shop_offers(shop_id, is_active, starts_at, ends_at);
