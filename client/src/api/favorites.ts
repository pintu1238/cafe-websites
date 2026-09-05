import { apiData, http } from './http';
import type { Favorite } from '../types/api';

export async function getFavorites() {
  return apiData<Favorite[]>(await http.get('/favorites'));
}

export async function addFavorite(shopId: string) {
  return apiData<{ shopId: string }>(await http.post(`/favorites/${shopId}`));
}

export async function removeFavorite(shopId: string) {
  return apiData<{ shopId: string }>(await http.delete(`/favorites/${shopId}`));
}
