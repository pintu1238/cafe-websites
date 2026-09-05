import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addFavorite, getFavorites, removeFavorite } from '../../api/favorites';

export const favoritesKey = ['favorites'];

export function useFavorites(enabled = true) {
  return useQuery({ queryKey: favoritesKey, queryFn: getFavorites, enabled, staleTime: 60 * 1000 });
}

export function useToggleFavorite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { shopId: string; isFavorite: boolean }) => input.isFavorite ? removeFavorite(input.shopId) : addFavorite(input.shopId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: favoritesKey });
      void client.invalidateQueries({ queryKey: ['shops'] });
      void client.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}
