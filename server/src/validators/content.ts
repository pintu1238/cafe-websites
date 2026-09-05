import { z } from 'zod';

export const contentSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(80),
}).strict();
