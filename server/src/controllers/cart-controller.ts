import type { Request, Response } from 'express';
import type { CartService } from '../services/cart-service.js';

export function createCartController(service: CartService) {
  return {
    get: async (request: Request, response: Response) => {
      const cart = await service.getCart(request.auth!.userId);
      response.json({ success: true, data: cart });
    },
    add: async (request: Request, response: Response) => {
      const cart = await service.addItem(request.auth!.userId, request.body);
      response.status(200).json({ success: true, data: cart });
    },
    update: async (request: Request, response: Response) => {
      const cart = await service.updateQuantity(request.auth!.userId, request.params.id as string, request.body.quantity);
      response.json({ success: true, data: cart });
    },
    remove: async (request: Request, response: Response) => {
      const cart = await service.removeItem(request.auth!.userId, request.params.id as string);
      response.json({ success: true, data: cart });
    },
    clear: async (request: Request, response: Response) => {
      const cart = await service.clear(request.auth!.userId);
      response.json({ success: true, data: cart });
    },
  };
}
