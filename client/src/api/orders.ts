import { http, apiData } from './http';
import type { Order } from '../types/api';

export async function createOrder(input: { paymentMethod: 'CASH_ON_PICKUP'; pickupTime?: string; specialInstructions?: string }) { return apiData<Order>(await http.post('/orders', input)); }
export async function getOrders() { return apiData<Order[]>(await http.get('/orders')); }
export async function getOrder(id: string) { return apiData<Order>(await http.get(`/orders/${id}`)); }
export async function cancelOrder(id: string) { return apiData<Order>(await http.post(`/orders/${id}/cancel`)); }
export async function getShopkeeperOrders() { return apiData<Order[]>(await http.get('/shopkeeper/orders')); }
export async function updateShopkeeperOrder(id: string, status: Order['status']) { return apiData<Order>(await http.patch(`/shopkeeper/orders/${id}/status`, { status })); }
