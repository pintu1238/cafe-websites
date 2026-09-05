import { z } from 'zod';

const uuid = z.string().uuid();

export const placeOrderSchema = z.object({
  paymentMethod: z.literal('CASH_ON_PICKUP'),
  pickupTime: z.string().datetime({ offset: true }).optional(),
  specialInstructions: z.string().trim().max(500).optional(),
}).strict();

export const orderParamsSchema = z.object({ id: uuid }).strict();
