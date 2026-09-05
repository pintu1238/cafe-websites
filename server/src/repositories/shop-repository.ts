import type { Queryable } from '../config/database.js';
import type { ShopListFilters, ShopRecord, ShopRepository, ShopStatus } from '../types/domain.js';

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  location: string;
  status: ShopStatus;
  is_open: boolean;
  rating: string | number;
  total_reviews: number;
  estimated_preparation_time: number;
  opening_time: string;
  closing_time: string;
  distance_km: string | number;
  price_range: 'BUDGET' | 'MID' | 'PREMIUM';
  cuisine_categories: string[];
  active_offers_count: number;
};

const sortSql: Record<NonNullable<ShopListFilters['sort']>, string> = {
  popular: 's.total_reviews DESC, s.rating DESC',
  rating: 's.rating DESC, s.total_reviews DESC',
  distance: 's.distance_km ASC, s.rating DESC',
  preparation: 's.estimated_preparation_time ASC, s.rating DESC',
  newest: 's.created_at DESC',
};

function mapShop(row: ShopRow): ShopRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    location: row.location,
    status: row.status,
    isOpen: row.is_open,
    rating: Number(row.rating),
    totalReviews: row.total_reviews,
    estimatedPreparationTime: row.estimated_preparation_time,
    openingTime: row.opening_time,
    closingTime: row.closing_time,
    distanceKm: Number(row.distance_km),
    priceRange: row.price_range,
    cuisineCategories: row.cuisine_categories ?? [],
    activeOffersCount: Number(row.active_offers_count ?? 0),
  };
}

const shopColumns = `s.id, s.name, s.slug, s.description, s.logo_url, s.banner_url,
  s.location, s.status, s.is_open, s.rating, s.total_reviews, s.estimated_preparation_time,
  s.opening_time::text AS opening_time, s.closing_time::text AS closing_time,
  s.distance_km, s.price_range,
  COALESCE((SELECT ARRAY_AGG(DISTINCT c.name ORDER BY c.name)
    FROM categories c WHERE c.shop_id = s.id), ARRAY[]::text[]) AS cuisine_categories,
  (SELECT COUNT(*)::int FROM shop_offers so
    WHERE so.shop_id = s.id AND so.is_active = TRUE
      AND so.starts_at <= NOW() AND (so.ends_at IS NULL OR so.ends_at > NOW())) AS active_offers_count`;

export class PgShopRepository implements ShopRepository {
  constructor(private readonly db: Queryable) {}

  async list(filters: ShopListFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;
    const values: unknown[] = ['APPROVED'];
    const where = ['s.status = $1'];
    let parameter = 2;

    if (filters.search) {
      values.push(`%${filters.search.trim()}%`);
      where.push(`(s.name ILIKE $${parameter} OR s.description ILIKE $${parameter} OR s.location ILIKE $${parameter}
        OR EXISTS (SELECT 1 FROM menu_items searchable_item WHERE searchable_item.shop_id = s.id
                  AND searchable_item.name ILIKE $${parameter}))`);
      parameter += 1;
    }
    if (filters.openOnly) where.push('s.is_open = TRUE');
    if (filters.category) {
      values.push(filters.category);
      where.push(`EXISTS (SELECT 1 FROM categories category_filter WHERE category_filter.shop_id = s.id AND category_filter.slug = $${parameter})`);
      parameter += 1;
    }
    if (filters.minRating !== undefined) {
      values.push(filters.minRating);
      where.push(`s.rating >= $${parameter}`);
      parameter += 1;
    }
    if (filters.maxDistanceKm !== undefined) {
      values.push(filters.maxDistanceKm);
      where.push(`s.distance_km <= $${parameter}`);
      parameter += 1;
    }
    if (filters.priceRange) {
      values.push(filters.priceRange);
      where.push(`s.price_range = $${parameter}`);
      parameter += 1;
    }
    if (filters.offersOnly) {
      where.push(`EXISTS (SELECT 1 FROM shop_offers offer_filter WHERE offer_filter.shop_id = s.id
        AND offer_filter.is_active = TRUE AND offer_filter.starts_at <= NOW()
        AND (offer_filter.ends_at IS NULL OR offer_filter.ends_at > NOW()))`);
    }

    const whereSql = where.join(' AND ');
    const countResult = await this.db.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM shops s WHERE ${whereSql}`, values);
    const total = Number(countResult.rows[0]?.count ?? 0);
    values.push(limit, (page - 1) * limit);
    const rows = await this.db.query<ShopRow>(
      `SELECT ${shopColumns} FROM shops s WHERE ${whereSql}
       ORDER BY ${sortSql[filters.sort ?? 'popular']}
       LIMIT $${parameter} OFFSET $${parameter + 1}`,
      values,
    );
    return {
      items: rows.rows.map(mapShop),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPublicBySlug(slug: string): Promise<ShopRecord | null> {
    const result = await this.db.query<ShopRow>(
      `SELECT ${shopColumns} FROM shops s WHERE s.slug = $1 AND s.status = 'APPROVED' LIMIT 1`,
      [slug],
    );
    return result.rows[0] ? mapShop(result.rows[0]) : null;
  }
}
