import type { Request, Response } from 'express';
import type { DiscoveryService } from '../services/discovery-service.js';

export function createDiscoveryController(service: DiscoveryService) {
  return {
    categories: async (_request: Request, response: Response) => {
      response.json({ success: true, data: await service.listCategories() });
    },
    offers: async (request: Request, response: Response) => {
      response.json({ success: true, data: await service.listOffers(typeof request.query.slug === 'string' ? request.query.slug : undefined) });
    },
    favorites: async (request: Request, response: Response) => {
      response.json({ success: true, data: await service.listFavorites(request.auth!.userId) });
    },
    addFavorite: async (request: Request, response: Response) => {
      response.status(201).json({ success: true, data: await service.addFavorite(request.auth!.userId, request.params.shopId as string) });
    },
    removeFavorite: async (request: Request, response: Response) => {
      response.json({ success: true, data: await service.removeFavorite(request.auth!.userId, request.params.shopId as string) });
    },
  };
}
