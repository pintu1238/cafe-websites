import type { OrderRepository, OrderStatus, PlaceOrderInput } from '../types/domain.js';
import { AppError } from '../utils/app-error.js';

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

export class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly config: { taxRateBps: number },
  ) {}

  async placeOrder(customerId: string, input: PlaceOrderInput) {
    if (input.paymentMethod !== 'CASH_ON_PICKUP') {
      throw new AppError('PAYMENT_METHOD_UNAVAILABLE', 'Online payments are coming soon. Choose cash on pickup.', 422);
    }
    return this.orders.createFromCart({
      customerId,
      paymentMethod: 'CASH_ON_PICKUP',
      pickupTime: input.pickupTime,
      specialInstructions: input.specialInstructions,
      taxRateBps: this.config.taxRateBps,
    });
  }

  listOrders(customerId: string) {
    return this.orders.listForCustomer(customerId);
  }

  async getOrder(customerId: string, orderId: string) {
    const order = await this.orders.findForCustomer(customerId, orderId);
    if (!order) throw new AppError('ORDER_NOT_FOUND', 'We could not find that order.', 404);
    return order;
  }

  cancelOrder(customerId: string, orderId: string) {
    return this.orders.cancelForCustomer(customerId, orderId);
  }

  listShopkeeperOrders(shopkeeperId: string) {
    return this.orders.listForShopkeeper(shopkeeperId);
  }

  async updateShopkeeperOrder(shopkeeperId: string, orderId: string, nextStatus: OrderStatus) {
    const order = await this.orders.findForShopkeeper(shopkeeperId, orderId);
    if (!order) throw new AppError('ORDER_NOT_FOUND', 'We could not find that shop order.', 404);
    this.assertTransition(order.status, nextStatus);
    return this.orders.updateStatusForShopkeeper(shopkeeperId, orderId, nextStatus);
  }

  assertTransition(current: OrderStatus, next: OrderStatus): void {
    if (!transitions[current].includes(next)) {
      throw new AppError('ORDER_INVALID_TRANSITION', `An order cannot move from ${current} to ${next}.`, 409);
    }
  }
}

export { transitions };
