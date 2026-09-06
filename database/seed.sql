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

-- Eight approved campus cafeterias power the discovery route in development.
-- The records are intentionally varied so search, filters, sorting, and detail pages
-- can be demonstrated with realistic campus data instead of hard-coded UI cards.
INSERT INTO shops (owner_id, name, slug, description, location, contact_phone, status, opening_time, closing_time, is_open, rating, total_reviews, estimated_preparation_time, banner_url, distance_km, price_range)
SELECT u.id, demo.name, demo.slug, demo.description, demo.location, demo.contact_phone, 'APPROVED', demo.opening_time::time, demo.closing_time::time, demo.is_open, demo.rating, demo.total_reviews, demo.preparation_time, demo.banner_url, demo.distance_km, demo.price_range
FROM users u
CROSS JOIN (VALUES
  ('The Courtyard Cafe', 'the-courtyard-cafe', 'Fresh campus comfort food, espresso, and quick pickup.', 'Student Center · Ground Floor', '+91 90000 10001', '08:00', '20:00', TRUE, 4.7, 128, 12, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=86', 0.40, 'MID'),
  ('Bite Box', 'bite-box', 'North Indian favourites, wok-tossed noodles, and generous student combos.', 'North Block · Level 1', '+91 90000 10002', '08:00', '21:00', TRUE, 4.6, 320, 10, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=86', 0.55, 'MID'),
  ('The Food Hub', 'the-food-hub', 'A bright all-day counter for South Indian plates and quick campus snacks.', 'Library Walk · East Wing', '+91 90000 10003', '08:00', '20:00', TRUE, 4.5, 280, 14, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=86', 0.80, 'BUDGET'),
  ('Campus Cravings', 'campus-cravings', 'Comfort bowls, Chinese classics, and chilled drinks for long study days.', 'Innovation Hall · Ground Floor', '+91 90000 10004', '09:00', '21:00', TRUE, 4.4, 190, 11, 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=86', 1.10, 'MID'),
  ('Green Bowl', 'green-bowl', 'Fresh salads, grain bowls, and protein-forward plates made for active campus life.', 'Sports Complex · Cafe Terrace', '+91 90000 10005', '08:00', '18:00', TRUE, 4.8, 154, 9, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=86', 1.35, 'PREMIUM'),
  ('North Indian Express', 'north-indian-express', 'Fast, filling thalis and homestyle North Indian plates between classes.', 'North Block · Food Court', '+91 90000 10006', '10:00', '20:00', TRUE, 4.5, 98, 13, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=86', 0.65, 'BUDGET'),
  ('Java Junction', 'java-junction', 'Specialty coffee, chai, breakfast bites, and a calm corner to reset.', 'Admin Block · Atrium', '+91 90000 10007', '07:30', '19:30', TRUE, 4.6, 226, 6, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=86', 0.95, 'MID'),
  ('Snack Lab', 'snack-lab', 'Crispy evening snacks, loaded fries, and quick bites for campus hangouts.', 'Student Center · Arcade Level', '+91 90000 10008', '11:00', '22:00', TRUE, 4.3, 176, 8, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=86', 0.30, 'BUDGET')
) AS demo(name, slug, description, location, contact_phone, opening_time, closing_time, is_open, rating, total_reviews, preparation_time, banner_url, distance_km, price_range)
WHERE u.email = 'shopkeeper@university.test'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  contact_phone = EXCLUDED.contact_phone,
  status = EXCLUDED.status,
  opening_time = EXCLUDED.opening_time,
  closing_time = EXCLUDED.closing_time,
  is_open = EXCLUDED.is_open,
  rating = EXCLUDED.rating,
  total_reviews = EXCLUDED.total_reviews,
  estimated_preparation_time = EXCLUDED.estimated_preparation_time,
  banner_url = EXCLUDED.banner_url,
  distance_km = EXCLUDED.distance_km,
  price_range = EXCLUDED.price_range;

INSERT INTO categories (shop_id, name, slug, image_url)
SELECT s.id, category.name, category.slug, category.image_url
FROM shops s
JOIN (VALUES
  ('the-courtyard-cafe', 'Breakfast', 'breakfast', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80'),
  ('the-courtyard-cafe', 'Campus Favourites', 'campus-favourites', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80'),
  ('the-courtyard-cafe', 'Coffee & Drinks', 'coffee-drinks', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80'),
  ('bite-box', 'North Indian', 'north-indian', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'),
  ('bite-box', 'Chinese', 'chinese', 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&q=80'),
  ('bite-box', 'Snacks', 'snacks', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80'),
  ('the-food-hub', 'South Indian', 'south-indian', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80'),
  ('the-food-hub', 'Snacks', 'snacks', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'),
  ('the-food-hub', 'Healthy', 'healthy', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'),
  ('campus-cravings', 'Chinese', 'chinese', 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=600&q=80'),
  ('campus-cravings', 'Beverages', 'beverages', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80'),
  ('campus-cravings', 'Healthy', 'healthy', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80'),
  ('green-bowl', 'Healthy', 'healthy', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'),
  ('green-bowl', 'Salads', 'salads', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80'),
  ('green-bowl', 'Beverages', 'beverages', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80'),
  ('north-indian-express', 'North Indian', 'north-indian', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80'),
  ('north-indian-express', 'Breakfast', 'breakfast', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80'),
  ('north-indian-express', 'Thalis', 'thalis', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'),
  ('java-junction', 'Coffee & Drinks', 'coffee-drinks', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80'),
  ('java-junction', 'Breakfast', 'breakfast', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80'),
  ('java-junction', 'Desserts', 'desserts', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'),
  ('snack-lab', 'Snacks', 'snacks', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80'),
  ('snack-lab', 'Street Food', 'street-food', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'),
  ('snack-lab', 'Beverages', 'beverages', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80')
) AS category(shop_slug, name, slug, image_url) ON category.shop_slug = s.slug
ON CONFLICT (shop_id, slug) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO shop_offers (shop_id, title, description, discount_percent, code, starts_at, ends_at)
SELECT s.id, offer.title, offer.description, offer.discount_percent, offer.code, NOW(), NOW() + INTERVAL '30 days'
FROM shops s
JOIN (VALUES
  ('bite-box', 'Student lunch combo', 'Save on a filling main, side, and chilled drink before 4 PM.', 10, 'BITE10'),
  ('green-bowl', 'Fresh start special', 'Take 15% off a healthy bowl with your campus ID.', 15, 'GREEN15'),
  ('java-junction', 'Coffee break perk', 'A little off your second coffee during afternoon study hours.', 10, 'JAVA10')
) AS offer(shop_slug, title, description, discount_percent, code) ON offer.shop_slug = s.slug
WHERE NOT EXISTS (SELECT 1 FROM shop_offers existing WHERE existing.shop_id = s.id AND existing.code = offer.code);

INSERT INTO menu_items (shop_id, category_id, name, description, price_paise, image_url, preparation_time, is_available, is_vegetarian, is_spicy, calories)
SELECT s.id, c.id, item.name, item.description, item.price_paise, item.image_url, item.preparation_time, TRUE, item.is_vegetarian, item.is_spicy, item.calories
FROM shops s
JOIN categories c ON c.shop_id = s.id
JOIN (VALUES
  ('bite-box', 'north-indian', 'Paneer Butter Masala', 'Silky tomato gravy, paneer, and warm naan-style comfort.', 8000, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 12, TRUE, TRUE, 520),
  ('bite-box', 'chinese', 'Veg Hakka Noodles', 'Wok-tossed noodles with crisp vegetables and a smoky finish.', 6500, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80', 10, TRUE, TRUE, 460),
  ('the-food-hub', 'south-indian', 'Masala Dosa', 'Crisp dosa with spiced potato, sambar, and coconut chutney.', 7000, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80', 12, TRUE, TRUE, 480),
  ('the-food-hub', 'healthy', 'Idli Sambar', 'Soft steamed idlis served with a fragrant lentil stew.', 4500, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80', 8, TRUE, FALSE, 340),
  ('campus-cravings', 'chinese', 'Chilli Paneer', 'Crisp paneer, peppers, and a bright sweet-spicy sauce.', 8000, 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80', 11, TRUE, TRUE, 510),
  ('campus-cravings', 'chinese', 'Veg Fried Rice', 'Fragrant rice with vegetables, spring onion, and wok seasoning.', 7500, 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80', 10, TRUE, TRUE, 440),
  ('green-bowl', 'healthy', 'Mediterranean Grain Bowl', 'Herbed grains, roasted vegetables, greens, and lemon dressing.', 12000, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 9, TRUE, TRUE, 520),
  ('green-bowl', 'salads', 'Avocado Crunch Salad', 'Avocado, greens, chickpeas, seeds, and a citrus vinaigrette.', 11000, 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80', 8, TRUE, TRUE, 390),
  ('north-indian-express', 'north-indian', 'Chole Bhature', 'Spiced chickpeas with fluffy bhature and fresh onion salad.', 7000, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', 13, TRUE, TRUE, 610),
  ('north-indian-express', 'breakfast', 'Aloo Paratha', 'Stuffed potato paratha with curd and pickle.', 5500, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 10, TRUE, TRUE, 460),
  ('java-junction', 'coffee-drinks', 'Cold Coffee', 'Chilled coffee blended with milk and a creamy finish.', 5000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80', 5, TRUE, TRUE, 210),
  ('java-junction', 'breakfast', 'Masala Chai', 'Freshly brewed tea with cardamom and warming spices.', 3000, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80', 4, TRUE, TRUE, 120),
  ('snack-lab', 'snacks', 'Peri Peri Fries', 'Golden fries tossed in a bright peri peri seasoning.', 5500, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80', 8, TRUE, TRUE, 410),
  ('snack-lab', 'street-food', 'Veg Momos', 'Steamed dumplings with crunchy vegetables and chilli dip.', 6500, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 10, TRUE, TRUE, 360)
) AS item(shop_slug, category_slug, name, description, price_paise, image_url, preparation_time, is_vegetarian, is_spicy, calories)
  ON item.shop_slug = s.slug AND item.category_slug = c.slug
WHERE NOT EXISTS (SELECT 1 FROM menu_items existing WHERE existing.shop_id = s.id AND existing.name = item.name);

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
