-- Development-only seed data. Do not run this against production.
INSERT INTO users (full_name, email, password_hash, role, is_active, is_verified, university_id, student_id)
VALUES
  ('Aarav Mehta', 'student@university.test', '$2b$12$96b1HCrrGwYWoBlM.5raxe3HhTkmWB5pSYI57Ya2O0TsUhXRWIGry', 'CUSTOMER', TRUE, TRUE, 'UNI-001', 'STU-2026-001'),
  ('Neha Sharma', 'shopkeeper@university.test', '$2b$12$AMEr5ibF/tNs9NeTx0YcReh9nIBkO7xZIoxUK0WeehGFpExYPgnbm', 'SHOPKEEPER', TRUE, TRUE, 'UNI-001', NULL),
  ('Campus Admin', 'admin@university.test', '$2b$12$cd.GzgiCiKRIOGzdFmhqgO2DML768EFP3K3hVV1swT4ZsqmuUO1Ry', 'SUPER_ADMIN', TRUE, TRUE, 'UNI-001', NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO shops (owner_id, name, slug, description, location, contact_phone, status, opening_time, closing_time, is_open, rating, total_reviews, estimated_preparation_time)
SELECT id, 'The Courtyard Cafe', 'the-courtyard-cafe', 'Fresh campus comfort food, espresso, and quick pickup.', 'Student Center · Ground Floor', '+91 90000 10001', 'APPROVED', '08:00', '20:00', TRUE, 4.7, 128, 12
FROM users WHERE email = 'shopkeeper@university.test'
ON CONFLICT (slug) DO NOTHING;

UPDATE shops
SET distance_km = 0.40, price_range = 'MID'
WHERE slug = 'the-courtyard-cafe';

INSERT INTO shop_offers (shop_id, title, description, discount_percent, code, starts_at, ends_at)
SELECT s.id, 'Student combo deal', 'Save on a wrap, fries, and a cold drink before 4 PM.', 15, 'CAMPUS15', NOW(), NOW() + INTERVAL '30 days'
FROM shops s
WHERE s.slug = 'the-courtyard-cafe'
  AND NOT EXISTS (SELECT 1 FROM shop_offers o WHERE o.shop_id = s.id AND o.code = 'CAMPUS15');

INSERT INTO shop_reviews (shop_id, user_id, rating, comment)
SELECT s.id, u.id, 5, 'Fast pickup and fresh food between classes.'
FROM shops s CROSS JOIN users u
WHERE s.slug = 'the-courtyard-cafe' AND u.email = 'student@university.test'
  AND NOT EXISTS (SELECT 1 FROM shop_reviews r WHERE r.shop_id = s.id AND r.user_id = u.id);

INSERT INTO shops (owner_id, name, slug, description, location, status, is_open)
SELECT id, 'North Block Bites', 'north-block-bites', 'A new cafeteria awaiting university approval.', 'North Block', 'PENDING', FALSE
FROM users WHERE email = 'shopkeeper@university.test'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (shop_id, name, slug, image_url)
SELECT s.id, c.name, c.slug, c.image_url
FROM shops s
CROSS JOIN (VALUES
  ('Breakfast', 'breakfast', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80'),
  ('Campus Favourites', 'campus-favourites', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80'),
  ('Coffee & Drinks', 'coffee-drinks', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80')
) AS c(name, slug, image_url)
WHERE s.slug = 'the-courtyard-cafe'
ON CONFLICT (shop_id, slug) DO NOTHING;

INSERT INTO menu_items (shop_id, category_id, name, description, price_paise, image_url, preparation_time, is_available, is_vegetarian, is_spicy, calories)
SELECT s.id, c.id, item.name, item.description, item.price_paise, item.image_url, item.preparation_time, TRUE, item.is_vegetarian, item.is_spicy, item.calories
FROM shops s
JOIN categories c ON c.shop_id = s.id
CROSS JOIN (VALUES
  ('Masala Paneer Wrap', 'Smoky paneer, crisp greens, and mint chutney in a warm wrap.', 8900, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80', 10, TRUE, TRUE, 540),
  ('Campus Club Sandwich', 'Toasted sourdough layered with vegetables, cheese, and house spread.', 10900, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', 12, TRUE, FALSE, 620),
  ('Cold Brew Latte', 'Slow-steeped coffee, chilled milk, and a clean caramel finish.', 6900, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80', 5, TRUE, TRUE, 180),
  ('Crispy Peri Peri Fries', 'Golden fries tossed in a bright peri peri seasoning.', 5900, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80', 8, TRUE, TRUE, 410)
) AS item(name, description, price_paise, image_url, preparation_time, is_vegetarian, is_spicy, calories)
WHERE s.slug = 'the-courtyard-cafe'
  AND c.slug = CASE WHEN item.name = 'Masala Paneer Wrap' THEN 'campus-favourites' WHEN item.name = 'Campus Club Sandwich' THEN 'campus-favourites' WHEN item.name = 'Cold Brew Latte' THEN 'coffee-drinks' ELSE 'campus-favourites' END
  AND NOT EXISTS (SELECT 1 FROM menu_items existing WHERE existing.shop_id = s.id AND existing.name = item.name);

INSERT INTO item_variants (menu_item_id, name, price_modifier_paise, is_available)
SELECT id, 'Regular', 0, TRUE FROM menu_items WHERE name IN ('Masala Paneer Wrap', 'Campus Club Sandwich')
ON CONFLICT (menu_item_id, name) DO NOTHING;

INSERT INTO item_variants (menu_item_id, name, price_modifier_paise, is_available)
SELECT id, 'Large', 2500, TRUE FROM menu_items WHERE name IN ('Masala Paneer Wrap', 'Campus Club Sandwich')
ON CONFLICT (menu_item_id, name) DO NOTHING;

INSERT INTO addons (shop_id, name, price_paise, is_available)
SELECT id, addon.name, addon.price_paise, TRUE
FROM shops
CROSS JOIN (VALUES ('Extra cheese', 1500), ('Mint chutney', 500), ('Avocado spread', 2500)) AS addon(name, price_paise)
WHERE slug = 'the-courtyard-cafe'
ON CONFLICT (shop_id, name) DO NOTHING;

INSERT INTO menu_item_addons (menu_item_id, addon_id)
SELECT item.id, addon.id
FROM menu_items item
JOIN shops s ON s.id = item.shop_id
JOIN addons addon ON addon.shop_id = item.shop_id
WHERE s.slug = 'the-courtyard-cafe'
  AND item.name IN ('Masala Paneer Wrap', 'Campus Club Sandwich')
ON CONFLICT DO NOTHING;
