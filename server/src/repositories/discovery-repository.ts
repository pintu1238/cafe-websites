import type { Queryable } from '../config/database.js';
import type { DiscoveryRepository, FavoriteRecord, OfferRecord, ReviewRecord } from '../types/domain.js';

type ReviewRow = {
  id: string;
  shop_id: string;
  shop_slug?: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: Date;
};

type OfferRow = {
  id: string;
  shop_id: string;
  shop_slug: string;
  shop_name: string;
  title: string;
  description: string;
  discount_percent: number | null;
  code: string | null;
  starts_at: Date;
  ends_at: Date | null;
};

function mapReview(row: ReviewRow): ReviewRecord {
  return {
    id: row.id,
    shopId: row.shop_id,
    shopSlug: row.shop_slug,
    userId: row.user_id,
    userName: row.user_name,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: row.created_at,
  };
}

function mapOffer(row: OfferRow): OfferRecord {
  return {
    id: row.id,
    shopId: row.shop_id,
    shopSlug: row.shop_slug,
    shopName: row.shop_name,
    title: row.title,
    description: row.description,
    discountPercent: row.discount_percent,
    code: row.code,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

const offerColumns = `o.id, o.shop_id, s.slug AS shop_slug, s.name AS shop_name,
  o.title, o.description, o.discount_percent, o.code, o.starts_at, o.ends_at`;

export class PgDiscoveryRepository implements DiscoveryRepository {
  constructor(private readonly db: Queryable) {}

  async listCategories() {
    const result = await this.db.query<{ slug: string; name: string; image_url: string | null }>(
      `SELECT c.slug, MIN(c.name) AS name, MIN(c.image_url) AS image_url
         FROM categories c JOIN shops s ON s.id = c.shop_id
        WHERE s.status = 'APPROVED'
        GROUP BY c.slug ORDER BY name ASC`,
    );
    return result.rows.map((row) => ({ slug: row.slug, name: row.name, imageUrl: row.image_url }));
  }

  async listReviews(slug: string, input: { page: number; limit: number }) {
    const count = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM shop_reviews r
         JOIN shops s ON s.id = r.shop_id
        WHERE s.slug = $1 AND s.status = 'APPROVED'`,
      [slug],
    );
    const total = Number(count.rows[0]?.count ?? 0);
    const result = await this.db.query<ReviewRow>(
      `SELECT r.id, r.shop_id, s.slug AS shop_slug, r.user_id,
              u.full_name AS user_name, r.rating, r.comment, r.created_at
         FROM shop_reviews r
         JOIN shops s ON s.id = r.shop_id
         JOIN users u ON u.id = r.user_id
        WHERE s.slug = $1 AND s.status = 'APPROVED'
        ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
      [slug, input.limit, (input.page - 1) * input.limit],
    );
    return {
      items: result.rows.map(mapReview),
      pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) },
    };
  }

  async upsertReview(input: { slug: string; userId: string; rating: number; comment: string }) {
    const result = await this.db.query<ReviewRow>(
      `INSERT INTO shop_reviews (shop_id, user_id, rating, comment)
       SELECT s.id, $2, $3, $4 FROM shops s WHERE s.slug = $1 AND s.status = 'APPROVED'
       ON CONFLICT (shop_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
       RETURNING id, shop_id, user_id, rating, comment, created_at`,
      [input.slug, input.userId, input.rating, input.comment],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Review insert did not return a row.');
    const user = await this.db.query<{ full_name: string }>('SELECT full_name FROM users WHERE id = $1', [input.userId]);
    return mapReview({ ...row, shop_slug: input.slug, user_name: user.rows[0]?.full_name ?? 'Campus student' });
  }

  async listOffers(slug?: string) {
    const values: unknown[] = [];
    const conditions = ["s.status = 'APPROVED'", 'o.is_active = TRUE', 'o.starts_at <= NOW()', '(o.ends_at IS NULL OR o.ends_at > NOW())'];
    if (slug) {
      values.push(slug);
      conditions.push(`s.slug = $${values.length}`);
    }
    const result = await this.db.query<OfferRow>(
      `SELECT ${offerColumns} FROM shop_offers o JOIN shops s ON s.id = o.shop_id
        WHERE ${conditions.join(' AND ')} ORDER BY o.ends_at NULLS LAST, o.created_at DESC`,
      values,
    );
    return result.rows.map(mapOffer);
  }

  async listFavorites(userId: string): Promise<FavoriteRecord[]> {
    const result = await this.db.query<FavoriteRecord>(
      `SELECT f.shop_id AS "shopId", s.slug AS "shopSlug", s.name AS "shopName", f.created_at AS "createdAt"
         FROM favorite_shops f JOIN shops s ON s.id = f.shop_id
        WHERE f.user_id = $1 AND s.status = 'APPROVED' ORDER BY f.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async addFavorite(userId: string, shopId: string) {
    await this.db.query(
      `INSERT INTO favorite_shops (user_id, shop_id)
       SELECT $1, s.id FROM shops s WHERE s.id = $2 AND s.status = 'APPROVED'
       ON CONFLICT (user_id, shop_id) DO NOTHING`,
      [userId, shopId],
    );
  }

  async removeFavorite(userId: string, shopId: string) {
    await this.db.query('DELETE FROM favorite_shops WHERE user_id = $1 AND shop_id = $2', [userId, shopId]);
  }
}
