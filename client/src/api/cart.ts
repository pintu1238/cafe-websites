import { http, apiData } from './http';
import type { Cart } from '../types/api';

export async function getCart() { return apiData<Cart>(await http.get('/cart')); }
export async function addCartItem(input: { menuItemId: string; quantity: number; variantId?: string; addonIds?: string[]; replaceCart?: boolean }) { return apiData<Cart>(await http.post('/cart/items', input)); }
export async function updateCartItem(id: string, quantity: number) { return apiData<Cart>(await http.patch(`/cart/items/${id}`, { quantity })); }
export async function removeCartItem(id: string) { return apiData<Cart>(await http.delete(`/cart/items/${id}`)); }
export async function clearCart() { return apiData<Cart>(await http.delete('/cart')); }
