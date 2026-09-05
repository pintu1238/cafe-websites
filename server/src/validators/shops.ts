import { z } from 'zod';

export const shopListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(100).optional(),
  openOnly: z.coerce.boolean().default(false),
  category: z.string().trim().max(80).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxDistanceKm: z.coerce.number().positive().max(100).optional(),
  priceRange: z.enum(['BUDGET', 'MID', 'PREMIUM']).optional(),
  offersOnly: z.coerce.boolean().default(false),
  sort: z.enum(['popular', 'rating', 'distance', 'preparation', 'newest']).default('popular'),
}).strict();

export const shopSlugParamsSchema = z.object({
  slug: z.string().trim().min(2).max(160),
}).strict();

export const menuQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  vegetarian: z.coerce.boolean().default(false),
  spicy: z.coerce.boolean().default(false),
}).strict();

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
}).strict();

export const reviewBodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(800),
}).strict();

export const favoriteParamsSchema = z.object({
  shopId: z.string().uuid(),
}).strict();
