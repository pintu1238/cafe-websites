import type { DiscoveryRepository } from '../types/domain.js';
import { AppError } from '../utils/app-error.js';

export class DiscoveryService {
  constructor(private readonly discovery: DiscoveryRepository) {}

  listCategories() { return this.discovery.listCategories(); }
  listReviews(slug: string, page = 1, limit = 10) { return this.discovery.listReviews(slug, { page, limit }); }
  listOffers(slug?: string) { return this.discovery.listOffers(slug); }

  createReview(input: { slug: string; userId: string; rating: number; comment: string }) {
    return this.discovery.upsertReview(input);
  }

  listFavorites(userId: string) { return this.discovery.listFavorites(userId); }

  async addFavorite(userId: string, shopId: string) {
    await this.discovery.addFavorite(userId, shopId);
    return { shopId };
  }

  async removeFavorite(userId: string, shopId: string) {
    await this.discovery.removeFavorite(userId, shopId);
    return { shopId };
  }

  ensureCustomer(userId: string | undefined) {
    if (!userId) throw new AppError('UNAUTHORIZED', 'Please sign in to continue.', 401);
    return userId;
  }
}
