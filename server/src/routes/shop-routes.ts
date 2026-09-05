import { Router } from 'express';
import { createShopController } from '../controllers/shop-controller.js';
import { validate } from '../middleware/validate.js';
import type { ShopService } from '../services/shop-service.js';
import type { AppConfig } from '../config/env.js';
import type { UserRepository } from '../types/domain.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/require-role.js';
import { menuQuerySchema, reviewBodySchema, reviewQuerySchema, shopListQuerySchema, shopSlugParamsSchema } from '../validators/shops.js';

export function createShopRouter(input: ShopService | { service: ShopService; users: UserRepository; config: AppConfig }) {
  const router = Router();
  const service = input instanceof Object && 'service' in input ? input.service : input;
  const controller = createShopController(service);
  router.get('/', validate(shopListQuerySchema, 'query'), controller.list);
  router.get('/categories', controller.categories);
  router.get('/:slug/reviews', validate(shopSlugParamsSchema, 'params'), validate(reviewQuerySchema, 'query'), controller.reviews);
  if (input instanceof Object && 'service' in input) {
    router.post('/:slug/reviews', validate(shopSlugParamsSchema, 'params'), authenticate(input.users, input.config), requireRole('CUSTOMER'), validate(reviewBodySchema), controller.createReview);
  }
  router.get('/:slug/menu', validate(shopSlugParamsSchema, 'params'), validate(menuQuerySchema, 'query'), controller.menu);
  router.get('/:slug', validate(shopSlugParamsSchema, 'params'), controller.detail);
  return router;
}
