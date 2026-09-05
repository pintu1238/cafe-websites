import type { Request, Response } from 'express';
import type { OrderService } from '../services/order-service.js';

export function createShopkeeperOrderController(service: OrderService) {
  return {
    list: async (request: Request, response: Response) => {
      const orders = await service.listShopkeeperOrders(request.auth!.userId);
      response.json({ success: true, data: orders });
    },
    updateStatus: async (request: Request, response: Response) => {
      const order = await service.updateShopkeeperOrder(request.auth!.userId, request.params.id as string, request.body.status);
      response.json({ success: true, data: order });
    },
  };
}
