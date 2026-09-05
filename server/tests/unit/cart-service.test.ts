import { describe, expect, test } from 'vitest';
import { CartService } from '../../src/services/cart-service.js';
import { AppError } from '../../src/utils/app-error.js';

const cart = {
  id: 'cart-1',
  customerId: 'customer-1',
  shopId: 'shop-a' as string | null,
  shopName: 'The Courtyard Cafe' as string | null,
  items: [],
  subtotalPaise: 0,
};

const selection = {
  shopId: 'shop-a',
  shopName: 'The Courtyard Cafe',
  menuItemId: 'item-1',
  itemName: 'Masala Paneer Wrap',
  basePricePaise: 8900,
  variant: null,
  addons: [],
  unitPricePaise: 8900,
};

test('cart service never accepts a client-supplied price', async () => {
  let receivedSelection: unknown;
  const repository = {
    getByCustomer: async () => ({ ...cart, shopId: null }),
    getSelection: async () => selection,
    addItem: async (_customerId: string, serverSelection: unknown, _quantity: number) => {
      receivedSelection = serverSelection;
      return { ...cart, shopId: 'shop-a', items: [], subtotalPaise: 8900 };
    },
    updateQuantity: async () => cart,
    removeItem: async () => cart,
    clear: async () => undefined,
  };
  const service = new CartService(repository);

  await service.addItem('customer-1', {
    menuItemId: 'item-1',
    quantity: 1,
    pricePaise: 1,
  });

  expect(receivedSelection).toEqual(selection);
  expect(receivedSelection).not.toHaveProperty('pricePaise');
});

test('cart service blocks a different shop until the caller explicitly replaces the cart', async () => {
  let cleared = false;
  const repository = {
    getByCustomer: async () => ({ ...cart, shopId: cleared ? null : 'shop-a' }),
    getSelection: async () => ({ ...selection, shopId: 'shop-b', shopName: 'North Block Bites' }),
    addItem: async () => cart,
    updateQuantity: async () => cart,
    removeItem: async () => cart,
    clear: async () => { cleared = true; },
  };
  const service = new CartService(repository);

  await expect(service.addItem('customer-1', { menuItemId: 'item-1', quantity: 1 }))
    .rejects.toMatchObject({ code: 'CART_SHOP_MISMATCH', statusCode: 409 });
  await service.addItem('customer-1', { menuItemId: 'item-1', quantity: 1, replaceCart: true });

  expect(cleared).toBe(true);
});

test('cart service rejects unavailable catalog selections with a human-readable error', async () => {
  const repository = {
    getByCustomer: async () => cart,
    getSelection: async () => null,
    addItem: async () => cart,
    updateQuantity: async () => cart,
    removeItem: async () => cart,
    clear: async () => undefined,
  };
  const service = new CartService(repository);

  await expect(service.addItem('customer-1', { menuItemId: 'missing', quantity: 1 }))
    .rejects.toEqual(new AppError('ITEM_UNAVAILABLE', 'That menu item is currently unavailable.', 409));
});
