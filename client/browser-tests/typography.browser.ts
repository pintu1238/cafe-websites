import { expect, test, type Page } from '@playwright/test';
import type { Cart, User } from '../src/types/api';
import type { ShopDetails } from '../src/api/shops';

async function useTestApi(page: Page, role: 'CUSTOMER' | 'SHOPKEEPER' = 'CUSTOMER') {
  // Isolated browser contexts never use a real account or write to the database.
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path.endsWith('/auth/me')) data = { user: {
      id: 'test-user', fullName: 'Test Student', email: 'student@example.test', role,
      phone: null, profileImageUrl: null, universityId: null, studentId: null,
      isActive: true, isVerified: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', lastLoginAt: null,
    } satisfies User };
    if (path.endsWith('/cart')) data = {
      id: 'test-cart', customerId: 'test-user', shopId: 'test-shop', shopName: 'Courtyard Cafe', subtotalPaise: 21800,
      items: [{ id: 'test-line', menuItemId: 'test-meal', itemName: 'Campus Club Sandwich with Extra Cheese', shopId: 'test-shop', shopName: 'Courtyard Cafe', basePricePaise: 10900, quantity: 2, unitPricePaise: 10900, totalPricePaise: 21800, variant: null, addons: [] }],
    } satisfies Cart;
    if (path.startsWith('/api/v1/images')) { await route.abort(); return; }
    if (path === '/api/v1/shops/the-courtyard-cafe') data = {
      shop: { id: 'test-shop', name: 'The Courtyard Cafe', slug: 'the-courtyard-cafe', description: 'Fresh campus comfort food.', location: 'Student Center', rating: 4.7, totalReviews: 128, estimatedPreparationTime: 12, isOpen: true, bannerUrl: null },
      menu: [], offers: [],
    } satisfies ShopDetails;
    await route.fulfill({ json: { success: true, data, pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } } });
  });
}

async function expectReadablePage(page: Page) {
  const violations = await page.locator('body').evaluate((body) => {
    const visible = (element: Element) => element.getBoundingClientRect().width > 0 && getComputedStyle(element).visibility !== 'hidden';
    return {
      smallText: [...body.querySelectorAll('*')].filter((element) =>
        !element.closest('svg') && visible(element) &&
        [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) &&
        parseFloat(getComputedStyle(element).fontSize) < 14,
      ).map((element) => `${element.tagName}.${element.className}: ${getComputedStyle(element).fontSize}`),
      clippedTitles: [...body.querySelectorAll('h1,h2,h3,button')].filter((element) => visible(element) && element.scrollWidth > element.clientWidth + 2).map((element) => element.textContent),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    };
  });
  expect(violations.smallText).toEqual([]);
  expect(violations.clippedTitles).toEqual([]);
  expect(violations.horizontalOverflow).toBe(false);
  for (const input of await page.locator('input:not([type="checkbox"]):not([type="radio"]),select,textarea').all()) {
    if (await input.isVisible()) await expect(input).toHaveCSS('font-size', '16px');
  }
}

test('home keeps the same readable scale at every breakpoint', async ({ page }) => {
  await useTestApi(page);
  await page.goto('/');
  await expect(page.locator('.dashboard-food-copy h3').first()).toBeVisible();
  await expect(page.locator('.dashboard-food-copy h3').first()).toHaveCSS('font-size', '18px');
  await expect(page.locator('.dashboard-sidebar-link').first()).toHaveCSS('font-size', '16px');
  await expectReadablePage(page);
});

for (const path of ['/login', '/register', '/forgot-password', '/shops', '/shops/the-courtyard-cafe', '/cart', '/checkout', '/orders', '/favorites', '/offers']) {
  test(`${path} uses readable text without clipping`, async ({ page }) => {
    await useTestApi(page);
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
    if (path === '/shops/the-courtyard-cafe') {
      await expect(page.getByRole('heading', { name: 'Bite Box', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Recommended for You', exact: true })).toBeVisible();
      await expect(page.locator('.cafe-food-copy h3').first()).toHaveCSS('font-size', '18px');
    }
    if (path === '/cart' || path === '/checkout') await expect(page.getByText(/Campus Club Sandwich with Extra Cheese/)).toBeVisible();
    await expectReadablePage(page);
  });
}

test('operator navigation and order board stay readable', async ({ page }, testInfo) => {
  await useTestApi(page, 'SHOPKEEPER');
  await page.goto('/shopkeeper');
  await expect(page.getByRole('heading', { name: 'Order board.', exact: true })).toBeVisible();
  if (testInfo.project.name === 'desktop') await expect(page.locator('aside a').first()).toHaveCSS('font-size', '16px');
  await expectReadablePage(page);
});
