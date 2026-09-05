import type { Queryable } from '../config/database.js';
import type { AddonRecord, MenuFilters, MenuItemRecord, MenuRepository, MenuVariant } from '../types/domain.js';

type MenuRow = Omit<MenuItemRecord, 'variants' | 'addons'> & {
  variants: MenuVariant[] | null;
  addons: AddonRecord[] | null;
  is_vegetarian: boolean;
};

export class PgMenuRepository implements MenuRepository {
  constructor(private readonly db: Queryable) {}

  async listByShopSlug(slug: string, filters: MenuFilters): Promise<MenuItemRecord[]> {
    const values: unknown[] = [slug];
    const where = ["s.slug = $1", "s.status = 'APPROVED'"];
    let parameter = 2;
    if (filters.search) {
      values.push(`%${filters.search.trim()}%`);
      where.push(`(mi.name ILIKE $${parameter} OR mi.description ILIKE $${parameter} OR c.name ILIKE $${parameter})`);
      parameter += 1;
    }
    if (filters.category) {
      values.push(filters.category);
      where.push(`c.slug = $${parameter}`);
      parameter += 1;
    }
    if (filters.vegetarian) where.push('mi.is_vegetarian = TRUE');
    if (filters.spicy) where.push('mi.is_spicy = TRUE');

    const result = await this.db.query<MenuRow>(
      `SELECT mi.id, mi.shop_id AS "shopId", mi.category_id AS "categoryId", c.name AS "categoryName",
              c.slug AS "categorySlug", mi.name, mi.description, mi.price_paise AS "pricePaise",
              mi.image_url AS "imageUrl", mi.preparation_time AS "preparationTime", mi.is_available AS "isAvailable",
              mi.is_vegetarian, mi.is_spicy AS "isSpicy", mi.calories,
              COALESCE((SELECT jsonb_agg(jsonb_build_object('id', iv.id, 'name', iv.name,
                'priceModifierPaise', iv.price_modifier_paise, 'isAvailable', iv.is_available) ORDER BY iv.name)
                FROM item_variants iv WHERE iv.menu_item_id = mi.id), '[]'::jsonb) AS variants,
              COALESCE((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name,
                'pricePaise', a.price_paise, 'isAvailable', a.is_available) ORDER BY a.name)
                FROM addons a JOIN menu_item_addons mia ON mia.addon_id = a.id
                WHERE mia.menu_item_id = mi.id), '[]'::jsonb) AS addons
         FROM menu_items mi
         JOIN shops s ON s.id = mi.shop_id
         JOIN categories c ON c.id = mi.category_id
        WHERE ${where.join(' AND ')}
        ORDER BY c.name, mi.name`,
      values,
    );

    return result.rows.map((row) => ({
      id: row.id,
      shopId: row.shopId,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categorySlug: row.categorySlug,
      name: row.name,
      description: row.description,
      pricePaise: row.pricePaise,
      imageUrl: row.imageUrl,
      preparationTime: row.preparationTime,
      isAvailable: row.isAvailable,
      isVegetarian: row.is_vegetarian,
      isSpicy: row.isSpicy,
      calories: row.calories,
      variants: row.variants ?? [],
      addons: row.addons ?? [],
    }));
  }
}
