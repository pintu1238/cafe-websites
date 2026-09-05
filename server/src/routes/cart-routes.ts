import { Router } from 'express';
import type { AppConfig } from '../config/env.js';
import { createCartController } from '../controllers/cart-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import type { CartRepository, UserRepository } from '../types/domain.js';
import { addCartItemSchema, cartItemParamsSchema, updateCartItemSchema } from '../validators/cart.js';
import { CartService } from '../services/cart-service.js';

export function createCartRouter(input: { carts: CartRepository; users: UserRepository; config: AppConfig }) {
  const router = Router();
  const controller = createCartController(new CartService(input.carts));
  router.use(authenticate(input.users, input.config), requireRole('CUSTOMER'));
  router.get('/', controller.get);
  router.post('/items', validate(addCartItemSchema), controller.add);
  router.patch('/items/:id', validate(cartItemParamsSchema, 'params'), validate(updateCartItemSchema), controller.update);
  router.delete('/items/:id', validate(cartItemParamsSchema, 'params'), controller.remove);
  router.delete('/', controller.clear);
  return router;
}
