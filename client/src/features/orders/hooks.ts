import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelOrder, createOrder, getOrder, getOrders, getShopkeeperOrders, updateShopkeeperOrder } from '../../api/orders';
import type { Order } from '../../types/api';

export function useOrders() { return useQuery({ queryKey: ['orders'], queryFn: getOrders }); }
export function useOrder(id: string) { return useQuery({ queryKey: ['orders', id], queryFn: () => getOrder(id), enabled: Boolean(id) }); }
export function useCreateOrder() {
  const client = useQueryClient();
  return useMutation({ mutationFn: createOrder, onSuccess: () => { void client.invalidateQueries({ queryKey: ['orders'] }); client.setQueryData(['cart'], { id: '', customerId: '', shopId: null, shopName: null, items: [], subtotalPaise: 0 }); } });
}
export function useCancelOrder() {
  const client = useQueryClient();
  return useMutation({ mutationFn: cancelOrder, onSuccess: (order) => { void client.invalidateQueries({ queryKey: ['orders'] }); client.setQueryData(['orders', order.id], order); } });
}
export function useShopkeeperOrders() { return useQuery({ queryKey: ['shopkeeper', 'orders'], queryFn: getShopkeeperOrders, refetchInterval: 20_000 }); }
export function useUpdateShopkeeperOrder() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: Order['status'] }) => updateShopkeeperOrder(id, status), onSuccess: () => { void client.invalidateQueries({ queryKey: ['shopkeeper', 'orders'] }); } });
}
