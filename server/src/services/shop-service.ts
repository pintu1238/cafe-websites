import type {
  MenuFilters,
  MenuRepository,
  DiscoveryRepository,
  ShopListFilters,
  ShopRepository,
} from '../types/domain.js';
import { AppError } from '../utils/app-error.js';

export class ShopService {
  constructor(
    private readonly shops: ShopRepository,
    private readonly menus: MenuRepository,
    private readonly discovery?: DiscoveryRepository,
  ) {}

  listShops(filters: ShopListFilters) {
    return this.shops.list({ ...filters, status: 'APPROVED' });
  }

  async getShop(slug: string, filters: MenuFilters) {
    const shop = await this.shops.findPublicBySlug(slug);
    if (!shop) {
      throw new AppError('SHOP_NOT_FOUND', 'We could not find that cafeteria.', 404);
    }
    const menu = await this.menus.listByShopSlug(slug, filters);
    const extras = this.discovery
      ? { reviews: await this.discovery.listReviews(slug, { page: 1, limit: 5 }), offers: await this.discovery.listOffers(slug) }
      : undefined;
    return extras ? { shop, menu, ...extras } : { shop, menu };
  }

  listCategories() {
    return this.discovery?.listCategories() ?? Promise.resolve([]);
  }

  listReviews(slug: string, page: number, limit: number) {
    return this.discovery?.listReviews(slug, { page, limit }) ?? Promise.resolve({ items: [], pagination: { page, limit, total: 0, totalPages: 0 } });
  }

  createReview(input: { slug: string; userId: string; rating: number; comment: string }) {
    if (!this.discovery) throw new Error('Discovery repository is not configured.');
    return this.discovery.upsertReview(input);
  }
}
