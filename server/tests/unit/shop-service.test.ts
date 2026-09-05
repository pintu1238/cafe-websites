import { describe, expect, test } from 'vitest';
import { ShopService } from '../../src/services/shop-service.js';

const approvedShop = {
  id: 'shop-approved',
  name: 'The Courtyard Cafe',
  slug: 'the-courtyard-cafe',
  description: 'Fresh campus comfort food.',
  logoUrl: null,
  bannerUrl: null,
  location: 'Student Center',
  status: 'APPROVED' as const,
  isOpen: true,
  rating: 4.7,
  totalReviews: 128,
  estimatedPreparationTime: 12,
};

test('public shop listing forces approved visibility and forwards server filters', async () => {
  let received: Record<string, unknown> | undefined;
  const shops = {
    list: async (filters: Record<string, unknown>) => {
      received = filters;
      return { items: [approvedShop], pagination: { page: 1, limit: 12, total: 1, totalPages: 1 } };
    },
    findPublicBySlug: async () => approvedShop,
  };
  const menus = { listByShopSlug: async () => [] };
  const service = new ShopService(shops, menus);

  const result = await service.listShops({ page: 2, limit: 6, search: 'coffee', openOnly: true, sort: 'rating' });

  expect(received).toMatchObject({ status: 'APPROVED', page: 2, limit: 6, search: 'coffee', openOnly: true, sort: 'rating' });
  expect(result.items[0].slug).toBe('the-courtyard-cafe');
});

test('public shop detail and menu are sourced through approved-shop repository methods', async () => {
  const calls: string[] = [];
  const shops = {
    list: async () => ({ items: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } }),
    findPublicBySlug: async (slug: string) => { calls.push(`shop:${slug}`); return approvedShop; },
  };
  const menus = {
    listByShopSlug: async (slug: string, filters: Record<string, unknown>) => { calls.push(`menu:${slug}:${String(filters.search)}`); return []; },
  };
  const service = new ShopService(shops, menus);

  const result = await service.getShop('the-courtyard-cafe', { search: 'wrap', vegetarian: true });

  expect(result.shop.slug).toBe('the-courtyard-cafe');
  expect(calls).toEqual(['shop:the-courtyard-cafe', 'menu:the-courtyard-cafe:wrap']);
});
