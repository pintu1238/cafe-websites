import { Router } from 'express';
import type { AppConfig } from '../config/env.js';
import { createOrderController } from '../controllers/order-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import type { OrderRepository, UserRepository } from '../types/domain.js';
import { orderParamsSchema, placeOrderSchema } from '../validators/orders.js';
import { OrderService } from '../services/order-service.js';

export function createOrderRouter(input: { orders: OrderRepository; users: UserRepository; config: AppConfig }) {
  const router = Router();
  const controller = createOrderController(new OrderService(input.orders, input.config));
  router.use(authenticate(input.users, input.config), requireRole('CUSTOMER'));
  router.post('/', validate(placeOrderSchema), controller.create);
  router.get('/', controller.list);
  router.get('/:id', validate(orderParamsSchema, 'params'), controller.detail);
  router.post('/:id/cancel', validate(orderParamsSchema, 'params'), controller.cancel);
  return router;
}
