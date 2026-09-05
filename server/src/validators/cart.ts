import { z } from 'zod';

const uuid = z.string().uuid();

export const addCartItemSchema = z.object({
  menuItemId: uuid,
  quantity: z.coerce.number().int().min(1).max(20),
  variantId: uuid.optional(),
  addonIds: z.array(uuid).max(20).optional(),
  replaceCart: z.boolean().default(false),
}).strict();

export const cartItemParamsSchema = z.object({ id: uuid }).strict();

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(20),
}).strict();
