import { Router } from 'express';
import type { Pool } from 'pg';
import type { AppConfig } from '../config/env.js';
import { PgCartRepository } from '../repositories/cart-repository.js';
import { PgMenuRepository } from '../repositories/menu-repository.js';
import { PgOrderRepository } from '../repositories/order-repository.js';
import { PgShopRepository } from '../repositories/shop-repository.js';
import { PgUserRepository } from '../repositories/user-repository.js';
import { PgDiscoveryRepository } from '../repositories/discovery-repository.js';
import { createAuthRouter } from './auth-routes.js';
import { createCartRouter } from './cart-routes.js';
import { createOrderRouter } from './order-routes.js';
import { createShopRouter } from './shop-routes.js';
import { createShopkeeperRouter } from './shopkeeper-routes.js';
import { createDiscoveryRouter } from './discovery-routes.js';
import { createContentRouter } from './content-routes.js';
import { createEnquiryRouter } from './enquiry-routes.js';
import { PgEnquiryRepository } from '../repositories/enquiry-repository.js';
import { createImageRouter } from './image-routes.js';
import { AuthService } from '../services/auth-service.js';
import { SmtpMailer } from '../services/mailer.js';
import { ShopService } from '../services/shop-service.js';
import { DiscoveryService } from '../services/discovery-service.js';

export function createApiRouter(input: { pool: Pool; config: AppConfig }) {
  const router = Router();
  const users = new PgUserRepository(input.pool);
  const shops = new PgShopRepository(input.pool);
  const menus = new PgMenuRepository(input.pool);
  const carts = new PgCartRepository(input.pool);
  const orders = new PgOrderRepository(input.pool);
  const discovery = new PgDiscoveryRepository(input.pool);
  const shopService = new ShopService(shops, menus, discovery);

  router.use('/auth', createAuthRouter({ service: new AuthService(users, input.config, new SmtpMailer(input.config)), users, config: input.config }));
  router.use('/shops', createShopRouter({ service: shopService, users, config: input.config }));
  router.use('/', createDiscoveryRouter({ service: new DiscoveryService(discovery), users, config: input.config }));
  router.use('/content', createContentRouter());
  router.use('/enquiries', createEnquiryRouter(new PgEnquiryRepository(input.pool)));
  router.use('/images', createImageRouter());
  router.use('/cart', createCartRouter({ carts, users, config: input.config }));
  router.use('/orders', createOrderRouter({ orders, users, config: input.config }));
  router.use('/shopkeeper', createShopkeeperRouter({ orders, users, config: input.config }));
  return router;
}
