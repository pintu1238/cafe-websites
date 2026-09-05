import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from '../../api/cart';

export const cartKey = ['cart'];
export function useCart(enabled = true) { return useQuery({ queryKey: cartKey, queryFn: getCart, retry: false, enabled }); }
export function useAddCartItem() {
  const client = useQueryClient();
  return useMutation({ mutationFn: addCartItem, onSuccess: (cart) => client.setQueryData(cartKey, cart) });
}
export function useUpdateCartItem() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, quantity }: { id: string; quantity: number }) => updateCartItem(id, quantity), onSuccess: (cart) => client.setQueryData(cartKey, cart) });
}
export function useRemoveCartItem() {
  const client = useQueryClient();
  return useMutation({ mutationFn: removeCartItem, onSuccess: (cart) => client.setQueryData(cartKey, cart) });
}
export function useClearCart() {
  const client = useQueryClient();
  return useMutation({ mutationFn: clearCart, onSuccess: (cart) => client.setQueryData(cartKey, cart) });
}
