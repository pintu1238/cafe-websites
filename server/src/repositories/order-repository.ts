import type { Pool } from 'pg';
import { withTransaction, type Queryable } from '../config/database.js';
import type {
  AddonRecord,
  CreateOrderFromCartInput,
  MenuVariant,
  OrderRecord,
  OrderRepository,
  OrderStatus,
} from '../types/domain.js';
import { AppError } from '../utils/app-error.js';
import { calculateOrderTotals } from '../utils/money.js';

type OrderRow = {
  id: string;
  customer_id: string;
  shop_id: string;
  shop_name: string;
  order_number: string;
  status: OrderStatus;
  subtotal_paise: number;
  tax_paise: number;
  discount_paise: number;
  delivery_fee_paise: number;
  total_amount_paise: number;
  payment_status: OrderRecord['paymentStatus'];
  payment_method: OrderRecord['paymentMethod'];
  special_instructions: string | null;
  pickup_time: Date | null;
  created_at: Date;
  updated_at: Date;
};

type OrderItemRow = {
  id: string;
  menu_item_id: string | null;
  item_name_snapshot: string;
  quantity: number;
  unit_price_paise: number;
  total_price_paise: number;
  selected_variant: MenuVariant | null;
  selected_addons: AddonRecord[];
  special_instruction: string | null;
};

type CartOrderRow = {
  id: string;
  menu_item_id: string;
  item_name: string;
  base_price_paise: number;
  is_available: boolean;
  variant_id: string | null;
  variant_name: string | null;
  variant_modifier_paise: number | null;
  selected_addons: Array<{ id: string }>;
  quantity: number;
};

function mapOrder(row: OrderRow, items: OrderItemRow[] = []): OrderRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    shopId: row.shop_id,
    shopName: row.shop_name,
    orderNumber: row.order_number,
    status: row.status,
    subtotalPaise: row.subtotal_paise,
    taxPaise: row.tax_paise,
    discountPaise: row.discount_paise,
    deliveryFeePaise: row.delivery_fee_paise,
    totalAmountPaise: row.total_amount_paise,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    specialInstructions: row.special_instructions,
    pickupTime: row.pickup_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((item) => ({
      id: item.id,
      menuItemId: item.menu_item_id,
      itemNameSnapshot: item.item_name_snapshot,
      quantity: item.quantity,
      unitPricePaise: item.unit_price_paise,
      totalPricePaise: item.total_price_paise,
      selectedVariant: item.selected_variant,
      selectedAddons: item.selected_addons ?? [],
      specialInstruction: item.special_instruction,
    })),
  };
}

async function loadOrder(db: Queryable, orderId: string, customerId?: string, shopkeeperId?: string): Promise<OrderRecord | null> {
  const values: unknown[] = [orderId];
  const where = ['o.id = $1'];
  if (customerId) {
    values.push(customerId);
    where.push(`o.customer_id = $${values.length}`);
  }
  if (shopkeeperId) {
    values.push(shopkeeperId);
    where.push(`s.owner_id = $${values.length}`);
  }
  const result = await db.query<OrderRow>(
    `SELECT o.id, o.customer_id, o.shop_id, s.name AS shop_name, o.order_number, o.status,
            o.subtotal_paise, o.tax_paise, o.discount_paise, o.delivery_fee_paise, o.total_amount_paise,
            o.payment_status, o.payment_method, o.special_instructions, o.pickup_time, o.created_at, o.updated_at
       FROM orders o JOIN shops s ON s.id = o.shop_id
      WHERE ${where.join(' AND ')} LIMIT 1`,
    values,
  );
  const row = result.rows[0];
  if (!row) return null;
  const items = await db.query<OrderItemRow>(
    `SELECT id, menu_item_id, item_name_snapshot, quantity, unit_price_paise, total_price_paise,
            selected_variant, selected_addons, special_instruction
       FROM order_items WHERE order_id = $1 ORDER BY id`,
    [orderId],
  );
  return mapOrder(row, items.rows);
}

export class PgOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async createFromCart(input: CreateOrderFromCartInput): Promise<OrderRecord> {
    return withTransaction(this.pool, async (client) => {
      const cartResult = await client.query<{ id: string; shop_id: string | null }>(
        `SELECT id, shop_id FROM carts WHERE customer_id = $1 FOR UPDATE`,
        [input.customerId],
      );
      const cart = cartResult.rows[0];
      if (!cart?.shop_id) throw new AppError('CART_EMPTY', 'Your cart is empty.', 409);

      const shopResult = await client.query<{ id: string; name: string; status: string; is_open: boolean }>(
        `SELECT id, name, status, is_open FROM shops WHERE id = $1 FOR SHARE`,
        [cart.shop_id],
      );
      const shop = shopResult.rows[0];
      if (!shop || shop.status !== 'APPROVED' || !shop.is_open) {
        throw new AppError('SHOP_UNAVAILABLE', 'This cafeteria is not accepting orders right now.', 409);
      }

      const cartItems = await client.query<CartOrderRow>(
        `SELECT ci.id, mi.id AS menu_item_id, mi.name AS item_name, mi.price_paise AS base_price_paise,
                mi.is_available, ci.variant_id, iv.name AS variant_name, iv.price_modifier_paise AS variant_modifier_paise,
                ci.selected_addons, ci.quantity
           FROM cart_items ci
           JOIN menu_items mi ON mi.id = ci.menu_item_id
           LEFT JOIN item_variants iv ON iv.id = ci.variant_id AND iv.is_available = TRUE
          WHERE ci.cart_id = $1
          ORDER BY ci.created_at
          FOR UPDATE OF ci, mi`,
        [cart.id],
      );
      if (cartItems.rows.length === 0) throw new AppError('CART_EMPTY', 'Your cart is empty.', 409);
      if (cartItems.rows.some((item) => !item.is_available || (item.variant_id && !item.variant_name))) {
        throw new AppError('ITEM_UNAVAILABLE', 'One or more items in your cart are no longer available.', 409);
      }

      const addonIds = [...new Set(cartItems.rows.flatMap((item) => (Array.isArray(item.selected_addons) ? item.selected_addons : []).map((addon) => addon.id)))];
      const addonsByItem = new Map<string, AddonRecord[]>();
      if (addonIds.length) {
        const addonResult = await client.query<AddonRecord & { menu_item_id: string }>(
          `SELECT mia.menu_item_id, a.id, a.name, a.price_paise AS "pricePaise", a.is_available AS "isAvailable"
             FROM menu_item_addons mia JOIN addons a ON a.id = mia.addon_id
            WHERE mia.menu_item_id = ANY($1::uuid[]) AND a.id = ANY($2::uuid[]) AND a.is_available = TRUE`,
          [cartItems.rows.map((item) => item.menu_item_id), addonIds],
        );
        for (const addon of addonResult.rows) {
          const current = addonsByItem.get(addon.menu_item_id) ?? [];
          current.push(addon);
          addonsByItem.set(addon.menu_item_id, current);
        }
      }

      const pricedItems = cartItems.rows.map((item) => {
        const requestedAddons = Array.isArray(item.selected_addons) ? item.selected_addons : [];
        const currentAddons = addonsByItem.get(item.menu_item_id) ?? [];
        if (requestedAddons.length !== currentAddons.length || requestedAddons.some((requested) => !currentAddons.some((addon) => addon.id === requested.id))) {
          throw new AppError('ITEM_UNAVAILABLE', 'One or more add-ons in your cart are no longer available.', 409);
        }
        const variant = item.variant_id ? {
          id: item.variant_id,
          name: item.variant_name!,
          priceModifierPaise: item.variant_modifier_paise ?? 0,
          isAvailable: true,
        } : null;
        const unitPricePaise = item.base_price_paise + (variant?.priceModifierPaise ?? 0) + currentAddons.reduce((sum, addon) => sum + addon.pricePaise, 0);
        return { item, addons: currentAddons, variant, unitPricePaise };
      });
      const totals = calculateOrderTotals(pricedItems.map((item) => ({ unitPricePaise: item.unitPricePaise, quantity: item.item.quantity })), input.taxRateBps);
      const sequence = await client.query<{ order_number: string }>(
        `SELECT 'CAF-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::text, 4, '0') AS order_number`,
      );
      const orderNumber = sequence.rows[0]!.order_number;
      const orderResult = await client.query<{ id: string }>(
        `INSERT INTO orders (customer_id, shop_id, order_number, status, subtotal_paise, tax_paise,
          discount_paise, delivery_fee_paise, total_amount_paise, payment_status, payment_method,
          special_instructions, pickup_time)
         VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, $7, $8, 'PENDING', $9, $10, $11)
         RETURNING id`,
        [input.customerId, shop.id, orderNumber, totals.subtotalPaise, totals.taxPaise, totals.discountPaise, totals.deliveryFeePaise, totals.totalAmountPaise, input.paymentMethod, input.specialInstructions ?? null, input.pickupTime ?? null],
      );
      const orderId = orderResult.rows[0]!.id;
      for (const priced of pricedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, item_name_snapshot, quantity, unit_price_paise,
            total_price_paise, selected_variant, selected_addons)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
          [orderId, priced.item.menu_item_id, priced.item.item_name, priced.item.quantity, priced.unitPricePaise, priced.unitPricePaise * priced.item.quantity, JSON.stringify(priced.variant), JSON.stringify(priced.addons)],
        );
      }
      await client.query(
        `INSERT INTO payments (order_id, method, status, amount_paise) VALUES ($1, $2, 'PENDING', $3)`,
        [orderId, input.paymentMethod, totals.totalAmountPaise],
      );
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
      await client.query('UPDATE carts SET shop_id = NULL WHERE id = $1', [cart.id]);
      const order = await loadOrder(client, orderId, input.customerId);
      if (!order) throw new AppError('ORDER_NOT_FOUND', 'We could not load the new order.', 500);
      return order;
    });
  }

  async listForCustomer(customerId: string): Promise<OrderRecord[]> {
    const result = await this.pool.query<OrderRow>(
      `SELECT o.id, o.customer_id, o.shop_id, s.name AS shop_name, o.order_number, o.status,
              o.subtotal_paise, o.tax_paise, o.discount_paise, o.delivery_fee_paise, o.total_amount_paise,
              o.payment_status, o.payment_method, o.special_instructions, o.pickup_time, o.created_at, o.updated_at
         FROM orders o JOIN shops s ON s.id = o.shop_id WHERE o.customer_id = $1 ORDER BY o.created_at DESC`,
      [customerId],
    );
    return result.rows.map((row) => mapOrder(row));
  }

  findForCustomer(customerId: string, orderId: string) {
    return loadOrder(this.pool, orderId, customerId);
  }

  async cancelForCustomer(customerId: string, orderId: string): Promise<OrderRecord> {
    const result = await this.pool.query<{ id: string }>(
      `UPDATE orders SET status = 'CANCELLED' WHERE id = $1 AND customer_id = $2 AND status IN ('PENDING', 'ACCEPTED') RETURNING id`,
      [orderId, customerId],
    );
    if (!result.rows[0]) {
      const exists = await this.pool.query('SELECT 1 FROM orders WHERE id = $1 AND customer_id = $2', [orderId, customerId]);
      if (!exists.rowCount) throw new AppError('ORDER_NOT_FOUND', 'We could not find that order.', 404);
      throw new AppError('ORDER_CANNOT_CANCEL', 'This order can no longer be cancelled.', 409);
    }
    const order = await loadOrder(this.pool, orderId, customerId);
    if (!order) throw new AppError('ORDER_NOT_FOUND', 'We could not find that order.', 404);
    return order;
  }

  async listForShopkeeper(shopkeeperId: string): Promise<OrderRecord[]> {
    const result = await this.pool.query<OrderRow>(
      `SELECT o.id, o.customer_id, o.shop_id, s.name AS shop_name, o.order_number, o.status,
              o.subtotal_paise, o.tax_paise, o.discount_paise, o.delivery_fee_paise, o.total_amount_paise,
              o.payment_status, o.payment_method, o.special_instructions, o.pickup_time, o.created_at, o.updated_at
         FROM orders o JOIN shops s ON s.id = o.shop_id WHERE s.owner_id = $1 ORDER BY o.created_at ASC`,
      [shopkeeperId],
    );
    return result.rows.map((row) => mapOrder(row));
  }

  findForShopkeeper(shopkeeperId: string, orderId: string) {
    return loadOrder(this.pool, orderId, undefined, shopkeeperId);
  }

  async updateStatusForShopkeeper(shopkeeperId: string, orderId: string, status: OrderStatus): Promise<OrderRecord> {
    const result = await this.pool.query<{ id: string }>(
      `UPDATE orders o SET status = $3::order_status
         FROM shops s
        WHERE o.id = $1 AND o.shop_id = s.id AND s.owner_id = $2
          AND ((o.status = 'PENDING' AND $3::order_status IN ('ACCEPTED', 'REJECTED', 'CANCELLED'))
            OR (o.status = 'ACCEPTED' AND $3::order_status IN ('PREPARING', 'CANCELLED'))
            OR (o.status = 'PREPARING' AND $3::order_status = 'READY')
            OR (o.status = 'READY' AND $3::order_status = 'COMPLETED'))
        RETURNING o.id`,
      [orderId, shopkeeperId, status],
    );
    if (!result.rows[0]) {
      const exists = await loadOrder(this.pool, orderId, undefined, shopkeeperId);
      if (!exists) throw new AppError('ORDER_NOT_FOUND', 'We could not find that shop order.', 404);
      throw new AppError('ORDER_INVALID_TRANSITION', `The order cannot move to ${status}.`, 409);
    }
    const order = await loadOrder(this.pool, orderId, undefined, shopkeeperId);
    if (!order) throw new AppError('ORDER_NOT_FOUND', 'We could not find that shop order.', 404);
    return order;
  }
}
