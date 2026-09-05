import type { Pool } from 'pg';
import { withTransaction, type Queryable } from '../config/database.js';
import type {
  AddonRecord,
  CartRecord,
  CartRepository,
  CartSelection,
  MenuVariant,
} from '../types/domain.js';
import { AppError } from '../utils/app-error.js';

type CartRow = {
  cart_id: string;
  customer_id: string;
  shop_id: string | null;
  shop_name: string | null;
  item_id: string | null;
  menu_item_id: string | null;
  item_name: string | null;
  base_price_paise: number | null;
  variant_id: string | null;
  variant_name: string | null;
  variant_modifier_paise: number | null;
  selected_addons: AddonRecord[];
  unit_price_paise: number | null;
  quantity: number | null;
};

type SelectionRow = {
  shop_id: string;
  shop_name: string;
  menu_item_id: string;
  item_name: string;
  base_price_paise: number;
  variant_id: string | null;
  variant_name: string | null;
  variant_modifier_paise: number | null;
};

function asAddonArray(value: unknown): AddonRecord[] {
  return Array.isArray(value) ? value as AddonRecord[] : [];
}

function mapSelection(row: SelectionRow, addons: AddonRecord[]): CartSelection {
  const variant: MenuVariant | null = row.variant_id ? {
    id: row.variant_id,
    name: row.variant_name ?? '',
    priceModifierPaise: row.variant_modifier_paise ?? 0,
    isAvailable: true,
  } : null;
  return {
    shopId: row.shop_id,
    shopName: row.shop_name,
    menuItemId: row.menu_item_id,
    itemName: row.item_name,
    basePricePaise: row.base_price_paise,
    variant,
    addons,
    unitPricePaise: row.base_price_paise + (variant?.priceModifierPaise ?? 0) + addons.reduce((sum, addon) => sum + addon.pricePaise, 0),
  };
}

async function ensureCart(db: Queryable, customerId: string) {
  await db.query('INSERT INTO carts (customer_id) VALUES ($1) ON CONFLICT (customer_id) DO NOTHING', [customerId]);
  const result = await db.query<{ id: string; shop_id: string | null }>(
    'SELECT id, shop_id FROM carts WHERE customer_id = $1',
    [customerId],
  );
  if (!result.rows[0]) throw new AppError('CART_NOT_FOUND', 'Your cart is unavailable right now.', 404);
  return result.rows[0];
}

async function loadCart(db: Queryable, customerId: string): Promise<CartRecord> {
  const result = await db.query<CartRow>(
    `SELECT c.id AS cart_id, c.customer_id, c.shop_id, s.name AS shop_name,
            ci.id AS item_id, mi.id AS menu_item_id, mi.name AS item_name,
            mi.price_paise AS base_price_paise, iv.id AS variant_id, iv.name AS variant_name,
            iv.price_modifier_paise AS variant_modifier_paise, ci.selected_addons,
            (mi.price_paise + COALESCE(iv.price_modifier_paise, 0) +
              COALESCE((SELECT SUM((addon.value->>'pricePaise')::integer)
                          FROM jsonb_array_elements(ci.selected_addons) AS addon(value)), 0))::integer AS unit_price_paise,
            ci.quantity
       FROM carts c
       LEFT JOIN shops s ON s.id = c.shop_id
       LEFT JOIN cart_items ci ON ci.cart_id = c.id
       LEFT JOIN menu_items mi ON mi.id = ci.menu_item_id
       LEFT JOIN item_variants iv ON iv.id = ci.variant_id
      WHERE c.customer_id = $1
      ORDER BY ci.created_at ASC`,
    [customerId],
  );
  const first = result.rows[0];
  if (!first) {
    const empty = await ensureCart(db, customerId);
    return { id: empty.id, customerId, shopId: empty.shop_id, shopName: null, items: [], subtotalPaise: 0 };
  }
  const items = result.rows
    .filter((row) => row.item_id && row.menu_item_id && row.item_name && row.quantity && row.unit_price_paise !== null)
    .map((row) => {
      const variant = row.variant_id ? {
        id: row.variant_id,
        name: row.variant_name ?? '',
        priceModifierPaise: row.variant_modifier_paise ?? 0,
        isAvailable: true,
      } : null;
      const addons = asAddonArray(row.selected_addons);
      const unitPricePaise = row.unit_price_paise ?? 0;
      return {
        id: row.item_id!,
        menuItemId: row.menu_item_id!,
        itemName: row.item_name!,
        shopId: row.shop_id!,
        shopName: row.shop_name!,
        basePricePaise: row.base_price_paise ?? 0,
        variant,
        addons,
        unitPricePaise,
        quantity: row.quantity!,
        totalPricePaise: unitPricePaise * row.quantity!,
      };
    });
  return {
    id: first.cart_id,
    customerId: first.customer_id,
    shopId: first.shop_id,
    shopName: first.shop_name,
    items,
    subtotalPaise: items.reduce((sum, item) => sum + item.totalPricePaise, 0),
  };
}

export class PgCartRepository implements CartRepository {
  constructor(private readonly pool: Pool) {}

  async getByCustomer(customerId: string): Promise<CartRecord> {
    await ensureCart(this.pool, customerId);
    return loadCart(this.pool, customerId);
  }

  async getSelection(input: { menuItemId: string; variantId?: string; addonIds?: string[] }): Promise<CartSelection | null> {
    const result = await this.pool.query<SelectionRow>(
      `SELECT s.id AS shop_id, s.name AS shop_name, mi.id AS menu_item_id, mi.name AS item_name,
              mi.price_paise AS base_price_paise, iv.id AS variant_id, iv.name AS variant_name,
              iv.price_modifier_paise AS variant_modifier_paise
         FROM menu_items mi
         JOIN shops s ON s.id = mi.shop_id
         LEFT JOIN item_variants iv ON iv.menu_item_id = mi.id AND iv.id IS NOT DISTINCT FROM $2::uuid AND iv.is_available = TRUE
        WHERE mi.id = $1 AND mi.is_available = TRUE AND s.status = 'APPROVED' AND s.is_open = TRUE
          AND ($2::uuid IS NULL OR iv.id IS NOT NULL)
        LIMIT 1`,
      [input.menuItemId, input.variantId ?? null],
    );
    const row = result.rows[0];
    if (!row) return null;

    const addonIds = [...new Set(input.addonIds ?? [])].sort();
    let addons: AddonRecord[] = [];
    if (addonIds.length > 0) {
      const addonResult = await this.pool.query<AddonRecord>(
        `SELECT a.id, a.name, a.price_paise AS "pricePaise", a.is_available AS "isAvailable"
           FROM addons a JOIN menu_item_addons mia ON mia.addon_id = a.id
          WHERE mia.menu_item_id = $1 AND a.id = ANY($2::uuid[]) AND a.is_available = TRUE
          ORDER BY a.id`,
        [input.menuItemId, addonIds],
      );
      if (addonResult.rows.length !== addonIds.length) return null;
      addons = addonResult.rows;
    }
    return mapSelection(row, addons);
  }

  async addItem(customerId: string, selection: CartSelection, quantity: number): Promise<CartRecord> {
    await withTransaction(this.pool, async (client) => {
      const cart = await client.query<{ id: string; shop_id: string | null }>(
        'SELECT id, shop_id FROM carts WHERE customer_id = $1 FOR UPDATE',
        [customerId],
      );
      const current = cart.rows[0] ?? (await ensureCart(client, customerId));
      if (current.shop_id && current.shop_id !== selection.shopId) {
        throw new AppError('CART_SHOP_MISMATCH', 'Your cart contains items from another shop. Clear the current cart to continue.', 409);
      }
      await client.query('UPDATE carts SET shop_id = $2 WHERE id = $1', [current.id, selection.shopId]);
      const addonsKey = selection.addons.map((addon) => addon.id).sort().join(',');
      const existing = await client.query<{ id: string; quantity: number }>(
        `SELECT id, quantity FROM cart_items
          WHERE cart_id = $1 AND menu_item_id = $2 AND variant_id IS NOT DISTINCT FROM $3::uuid AND addons_key = $4
          FOR UPDATE`,
        [current.id, selection.menuItemId, selection.variant?.id ?? null, addonsKey],
      );
      const nextQuantity = (existing.rows[0]?.quantity ?? 0) + quantity;
      if (nextQuantity > 20) throw new AppError('INVALID_QUANTITY', 'Choose a quantity between 1 and 20.', 422);
      if (existing.rows[0]) {
        await client.query('UPDATE cart_items SET quantity = $2 WHERE id = $1', [existing.rows[0].id, nextQuantity]);
      } else {
        await client.query(
          `INSERT INTO cart_items (cart_id, menu_item_id, variant_id, selected_addons, addons_key, quantity)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
          [current.id, selection.menuItemId, selection.variant?.id ?? null, JSON.stringify(selection.addons), addonsKey, quantity],
        );
      }
    });
    return this.getByCustomer(customerId);
  }

  async updateQuantity(customerId: string, itemId: string, quantity: number): Promise<CartRecord> {
    const result = await this.pool.query(
      `UPDATE cart_items ci SET quantity = $3
        FROM carts c WHERE ci.id = $1 AND ci.cart_id = c.id AND c.customer_id = $2`,
      [itemId, customerId, quantity],
    );
    if (!result.rowCount) throw new AppError('CART_ITEM_NOT_FOUND', 'That cart item is no longer available.', 404);
    return this.getByCustomer(customerId);
  }

  async removeItem(customerId: string, itemId: string): Promise<CartRecord> {
    const result = await this.pool.query(
      `DELETE FROM cart_items ci USING carts c WHERE ci.id = $1 AND ci.cart_id = c.id AND c.customer_id = $2`,
      [itemId, customerId],
    );
    if (!result.rowCount) throw new AppError('CART_ITEM_NOT_FOUND', 'That cart item is no longer available.', 404);
    await this.pool.query(
      `UPDATE carts SET shop_id = NULL WHERE customer_id = $1 AND NOT EXISTS (
        SELECT 1 FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.customer_id = $1
      )`,
      [customerId],
    );
    return this.getByCustomer(customerId);
  }

  async clear(customerId: string): Promise<void> {
    await withTransaction(this.pool, async (client) => {
      const cart = await client.query<{ id: string }>('SELECT id FROM carts WHERE customer_id = $1 FOR UPDATE', [customerId]);
      if (!cart.rows[0]) return;
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id]);
      await client.query('UPDATE carts SET shop_id = NULL WHERE id = $1', [cart.rows[0].id]);
    });
  }
}
