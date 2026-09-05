import { http, apiData } from './http';
import type { MenuItem, Offer, Pagination, Review, Shop } from '../types/api';

export type ShopDetails = { shop: Shop; menu: MenuItem[]; reviews?: { items: Review[]; pagination: Pagination }; offers?: Offer[] };

export type ShopFilters = { search?: string; openOnly?: boolean; category?: string; minRating?: number; maxDistanceKm?: number; priceRange?: 'BUDGET' | 'MID' | 'PREMIUM'; offersOnly?: boolean; sort?: 'popular' | 'rating' | 'distance' | 'preparation' | 'newest'; page?: number; limit?: number };
export async function getShops(filters: ShopFilters = {}) {
  const response = await http.get<{ success: true; data: Shop[]; pagination: Pagination }>('/shops', { params: filters });
  return { items: response.data.data, pagination: response.data.pagination };
}
export async function getShop(slug: string, filters: { search?: string; category?: string; vegetarian?: boolean; spicy?: boolean } = {}) {
  return apiData<ShopDetails>(await http.get(`/shops/${slug}`, { params: filters }));
}
export async function getMenu(slug: string, filters: { search?: string; category?: string; vegetarian?: boolean; spicy?: boolean } = {}) {
  return apiData<MenuItem[]>(await http.get(`/shops/${slug}/menu`, { params: filters }));
}
export async function getShopCategories() {
  return apiData<Array<{ slug: string; name: string; imageUrl: string | null }>>(await http.get('/shops/categories'));
}
export async function getShopReviews(slug: string, page = 1, limit = 10) {
  const response = await http.get<{ success: true; data: Review[]; pagination: Pagination }>(`/shops/${slug}/reviews`, { params: { page, limit } });
  return { items: response.data.data, pagination: response.data.pagination };
}
export async function createShopReview(slug: string, input: { rating: number; comment: string }) {
  return apiData<Review>(await http.post(`/shops/${slug}/reviews`, input));
}
export async function getShopOffers(slug?: string) {
  return apiData<Offer[]>(await http.get('/offers', { params: slug ? { slug } : undefined }));
}
