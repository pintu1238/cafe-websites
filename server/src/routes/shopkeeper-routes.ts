import { Router } from 'express';
import type { AppConfig } from '../config/env.js';
import { createShopkeeperOrderController } from '../controllers/shopkeeper-order-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import { OrderService } from '../services/order-service.js';
import type { OrderRepository, UserRepository } from '../types/domain.js';
import { shopkeeperOrderParamsSchema, shopkeeperOrderStatusSchema } from '../validators/shopkeeper.js';

export function createShopkeeperRouter(input: { orders: OrderRepository; users: UserRepository; config: AppConfig }) {
  const router = Router();
  const controller = createShopkeeperOrderController(new OrderService(input.orders, input.config));
  router.use(authenticate(input.users, input.config), requireRole('SHOPKEEPER'));
  router.get('/orders', controller.list);
  router.patch('/orders/:id/status', validate(shopkeeperOrderParamsSchema, 'params'), validate(shopkeeperOrderStatusSchema), controller.updateStatus);
  return router;
}
