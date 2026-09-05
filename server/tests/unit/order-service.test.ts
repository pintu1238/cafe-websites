import { describe, expect, test } from 'vitest';
import { OrderService } from '../../src/services/order-service.js';
import { calculateOrderTotals } from '../../src/utils/money.js';

test('calculates subtotal and tax with integer paise', () => {
  expect(calculateOrderTotals([
    { unitPricePaise: 8900, quantity: 2 },
    { unitPricePaise: 6900, quantity: 1 },
  ], 500)).toEqual({ subtotalPaise: 24700, taxPaise: 1235, discountPaise: 0, deliveryFeePaise: 0, totalAmountPaise: 25935 });
});

test('place order forwards no client-controlled totals to the transaction boundary', async () => {
  let received: unknown;
  const expectedOrder = { id: 'order-1', orderNumber: 'CAF-20260905-1000', status: 'PENDING' };
  const orders = {
    createFromCart: async (input: unknown) => { received = input; return expectedOrder; },
    listForCustomer: async () => [],
    findForCustomer: async () => expectedOrder,
    cancelForCustomer: async () => expectedOrder,
    listForShopkeeper: async () => [],
    updateStatusForShopkeeper: async () => expectedOrder,
  };
  const service = new OrderService(orders, { taxRateBps: 500 });

  const result = await service.placeOrder('customer-1', {
    paymentMethod: 'CASH_ON_PICKUP',
    pickupTime: '2026-09-05T12:00:00.000Z',
    specialInstructions: 'No onions',
    subtotalPaise: 1,
    totalAmountPaise: 1,
  });

  expect(result).toBe(expectedOrder);
  expect(received).toEqual({
    customerId: 'customer-1',
    paymentMethod: 'CASH_ON_PICKUP',
    pickupTime: '2026-09-05T12:00:00.000Z',
    specialInstructions: 'No onions',
    taxRateBps: 500,
  });
});

test('order state machine rejects terminal-state reversions', () => {
  const orders = {
    createFromCart: async () => ({ id: 'order-1' }),
    listForCustomer: async () => [],
    findForCustomer: async () => ({ id: 'order-1', status: 'COMPLETED' }),
    cancelForCustomer: async () => ({ id: 'order-1' }),
    listForShopkeeper: async () => [],
    updateStatusForShopkeeper: async () => ({ id: 'order-1' }),
  };
  const service = new OrderService(orders, { taxRateBps: 500 });

  expect(() => service.assertTransition('COMPLETED', 'PREPARING')).toThrowError(
    expect.objectContaining({ code: 'ORDER_INVALID_TRANSITION' }),
  );
  expect(() => service.assertTransition('PENDING', 'ACCEPTED')).not.toThrow();
});
