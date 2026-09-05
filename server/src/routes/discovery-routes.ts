import { Router } from 'express';
import type { AppConfig } from '../config/env.js';
import type { UserRepository } from '../types/domain.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import { createDiscoveryController } from '../controllers/discovery-controller.js';
import type { DiscoveryService } from '../services/discovery-service.js';
import { favoriteParamsSchema } from '../validators/shops.js';

export function createDiscoveryRouter(input: { service: DiscoveryService; users: UserRepository; config: AppConfig }) {
  const router = Router();
  const controller = createDiscoveryController(input.service);
  const customer = [authenticate(input.users, input.config), requireRole('CUSTOMER')];
  router.get('/offers', controller.offers);
  router.get('/favorites', ...customer, controller.favorites);
  router.post('/favorites/:shopId', ...customer, validate(favoriteParamsSchema, 'params'), controller.addFavorite);
  router.delete('/favorites/:shopId', ...customer, validate(favoriteParamsSchema, 'params'), controller.removeFavorite);
  return router;
}
