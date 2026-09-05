import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const migrationPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../database/migrations/001_initial_schema.sql',
);

test('initial migration defines the vertical slice relational contract', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  for (const role of ['CUSTOMER', 'SHOPKEEPER', 'SUPER_ADMIN']) {
    expect(sql).toContain(`'${role}'`);
  }

  for (const table of [
    'users',
    'shops',
    'categories',
    'menu_items',
    'item_variants',
    'addons',
    'menu_item_addons',
    'carts',
    'cart_items',
    'orders',
    'order_items',
    'payments',
  ]) {
    expect(sql).toMatch(new RegExp(`create table if not exists ${table}`, 'i'));
  }

  expect(sql).toContain('password_hash TEXT NOT NULL');
  expect(sql).toContain('UNIQUE (email)');
  expect(sql).toContain('UNIQUE (slug)');
  expect(sql).toContain('subtotal_paise INTEGER NOT NULL');
  expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_orders_customer_status');
  expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_menu_items_shop_available');
  expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_shops_status_slug');
});
