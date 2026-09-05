import { z } from 'zod';

export const shopkeeperOrderParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const shopkeeperOrderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED', 'REJECTED']),
}).strict();
