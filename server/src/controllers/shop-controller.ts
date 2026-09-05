import type { Request, Response } from 'express';
import type { ShopService } from '../services/shop-service.js';

export function createShopController(service: ShopService) {
  return {
    list: async (request: Request, response: Response) => {
      const result = await service.listShops(request.query);
      response.json({ success: true, data: result.items, pagination: result.pagination });
    },
    categories: async (_request: Request, response: Response) => {
      response.json({ success: true, data: await service.listCategories() });
    },
    detail: async (request: Request, response: Response) => {
      const result = await service.getShop(request.params.slug as string, {});
      response.json({ success: true, data: result });
    },
    menu: async (request: Request, response: Response) => {
      const result = await service.getShop(request.params.slug as string, request.query);
      response.json({ success: true, data: result.menu });
    },
    reviews: async (request: Request, response: Response) => {
      const result = await service.listReviews(request.params.slug as string, Number(request.query.page), Number(request.query.limit));
      response.json({ success: true, data: result.items, pagination: result.pagination });
    },
    createReview: async (request: Request, response: Response) => {
      const result = await service.createReview({ slug: request.params.slug as string, userId: request.auth!.userId, ...request.body });
      response.status(201).json({ success: true, data: result });
    },
  };
}
