import { AppError } from './app-error.js';

export type PricedQuantity = { unitPricePaise: number; quantity: number };

export function calculateOrderTotals(items: PricedQuantity[], taxRateBps: number) {
  if (items.some((item) => !Number.isInteger(item.unitPricePaise) || item.unitPricePaise < 0 || !Number.isInteger(item.quantity) || item.quantity < 1)) {
    throw new AppError('INVALID_PRICE', 'We could not calculate this order. Please try again.', 422);
  }
  const subtotalPaise = items.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
  const taxPaise = Math.round(subtotalPaise * taxRateBps / 10_000);
  const discountPaise = 0;
  const deliveryFeePaise = 0;
  return {
    subtotalPaise,
    taxPaise,
    discountPaise,
    deliveryFeePaise,
    totalAmountPaise: subtotalPaise + taxPaise + deliveryFeePaise - discountPaise,
  };
}

export function formatRupees(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100);
}
