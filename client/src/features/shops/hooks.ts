import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createShopReview, getShop, getShopCategories, getShopOffers, getShopReviews, getShops, type ShopFilters } from '../../api/shops';

export function useShops(filters: ShopFilters = {}) {
  return useQuery({ queryKey: ['shops', filters], queryFn: () => getShops(filters) });
}

export function useShop(slug: string, filters: { search?: string; category?: string; vegetarian?: boolean; spicy?: boolean } = {}) {
  return useQuery({ queryKey: ['shop', slug, filters], queryFn: () => getShop(slug, filters), enabled: Boolean(slug) });
}

export function useShopCategories() {
  return useQuery({ queryKey: ['shop-categories'], queryFn: getShopCategories, staleTime: 5 * 60 * 1000 });
}

export function useShopReviews(slug: string) {
  return useQuery({ queryKey: ['shop-reviews', slug], queryFn: () => getShopReviews(slug), enabled: Boolean(slug) });
}

export function useShopOffers(slug?: string) {
  return useQuery({ queryKey: ['shop-offers', slug ?? 'all'], queryFn: () => getShopOffers(slug), staleTime: 60 * 1000 });
}

export function useCreateShopReview(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { rating: number; comment: string }) => createShopReview(slug, input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['shop-reviews', slug] });
      void client.invalidateQueries({ queryKey: ['shop', slug] });
      void client.invalidateQueries({ queryKey: ['shops'] });
    },
  });
}
