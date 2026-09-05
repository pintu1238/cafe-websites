import type { Request, Response } from 'express';
import type { OrderService } from '../services/order-service.js';

export function createOrderController(service: OrderService) {
  return {
    create: async (request: Request, response: Response) => {
      const order = await service.placeOrder(request.auth!.userId, request.body);
      response.status(201).json({ success: true, data: order });
    },
    list: async (request: Request, response: Response) => {
      const orders = await service.listOrders(request.auth!.userId);
      response.json({ success: true, data: orders });
    },
    detail: async (request: Request, response: Response) => {
      const order = await service.getOrder(request.auth!.userId, request.params.id as string);
      response.json({ success: true, data: order });
    },
    cancel: async (request: Request, response: Response) => {
      const order = await service.cancelOrder(request.auth!.userId, request.params.id as string);
      response.json({ success: true, data: order });
    },
  };
}
