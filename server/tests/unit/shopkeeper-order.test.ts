import { describe, expect, test } from 'vitest';
import { OrderService } from '../../src/services/order-service.js';

const order = {
  id: 'order-1',
  customerId: 'customer-1',
  shopId: 'shop-a',
  shopName: 'The Courtyard Cafe',
  orderNumber: 'CAF-20260905-1000',
  status: 'PENDING' as const,
  subtotalPaise: 8900,
  taxPaise: 445,
  discountPaise: 0,
  deliveryFeePaise: 0,
  totalAmountPaise: 9345,
  paymentStatus: 'PENDING' as const,
  paymentMethod: 'CASH_ON_PICKUP' as const,
  specialInstructions: null,
  pickupTime: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('shopkeeper status update resolves the order through own-shop repository scope', async () => {
  let updatedWith: unknown;
  const orders = {
    createFromCart: async () => order,
    listForCustomer: async () => [],
    findForCustomer: async () => null,
    cancelForCustomer: async () => order,
    listForShopkeeper: async (shopkeeperId: string) => shopkeeperId === 'owner-a' ? [order] : [],
    findForShopkeeper: async (shopkeeperId: string) => shopkeeperId === 'owner-a' ? order : null,
    updateStatusForShopkeeper: async (shopkeeperId: string, orderId: string, status: string) => {
      updatedWith = { shopkeeperId, orderId, status };
      return { ...order, status };
    },
  };
  const service = new OrderService(orders, { taxRateBps: 500 });

  const updated = await service.updateShopkeeperOrder('owner-a', 'order-1', 'ACCEPTED');

  expect(updated.status).toBe('ACCEPTED');
  expect(updatedWith).toEqual({ shopkeeperId: 'owner-a', orderId: 'order-1', status: 'ACCEPTED' });
  await expect(service.updateShopkeeperOrder('owner-b', 'order-1', 'ACCEPTED'))
    .rejects.toMatchObject({ code: 'ORDER_NOT_FOUND', statusCode: 404 });
});

test('shopkeeper cannot skip order lifecycle states', async () => {
  const orders = {
    createFromCart: async () => order,
    listForCustomer: async () => [],
    findForCustomer: async () => null,
    cancelForCustomer: async () => order,
    listForShopkeeper: async () => [order],
    findForShopkeeper: async () => order,
    updateStatusForShopkeeper: async () => order,
  };
  const service = new OrderService(orders, { taxRateBps: 500 });

  await expect(service.updateShopkeeperOrder('owner-a', 'order-1', 'READY'))
    .rejects.toMatchObject({ code: 'ORDER_INVALID_TRANSITION', statusCode: 409 });
});
