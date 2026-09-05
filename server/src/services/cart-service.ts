import type { AddCartItemInput, CartRecord, CartRepository } from '../types/domain.js';
import { AppError } from '../utils/app-error.js';

const validateQuantity = (quantity: number) => {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new AppError('INVALID_QUANTITY', 'Choose a quantity between 1 and 20.', 422);
  }
};

export class CartService {
  constructor(private readonly carts: CartRepository) {}

  getCart(customerId: string): Promise<CartRecord> {
    return this.carts.getByCustomer(customerId);
  }

  async addItem(customerId: string, input: AddCartItemInput): Promise<CartRecord> {
    validateQuantity(input.quantity);
    const selection = await this.carts.getSelection({
      menuItemId: input.menuItemId,
      variantId: input.variantId,
      addonIds: input.addonIds,
    });
    if (!selection) {
      throw new AppError('ITEM_UNAVAILABLE', 'That menu item is currently unavailable.', 409);
    }

    const cart = await this.carts.getByCustomer(customerId);
    if (cart.shopId && cart.shopId !== selection.shopId) {
      if (!input.replaceCart) {
        throw new AppError(
          'CART_SHOP_MISMATCH',
          'Your cart contains items from another shop. Clear the current cart to continue.',
          409,
        );
      }
      await this.carts.clear(customerId);
    }

    return this.carts.addItem(customerId, selection, input.quantity);
  }

  updateQuantity(customerId: string, itemId: string, quantity: number): Promise<CartRecord> {
    validateQuantity(quantity);
    return this.carts.updateQuantity(customerId, itemId, quantity);
  }

  removeItem(customerId: string, itemId: string): Promise<CartRecord> {
    return this.carts.removeItem(customerId, itemId);
  }

  async clear(customerId: string): Promise<CartRecord> {
    await this.carts.clear(customerId);
    return this.carts.getByCustomer(customerId);
  }
}
