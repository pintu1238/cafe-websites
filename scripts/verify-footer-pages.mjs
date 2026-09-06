// Build with VITE_API_BASE_URL=/api/v1 before running this same-origin audit.
// Tests real reads and enquiry persistence in a rolled-back transaction.
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import dotenv from 'dotenv';
import { chromium } from 'playwright';

dotenv.config({ path: '.env', quiet: true });
dotenv.config({ path: 'server/.env', quiet: true });
process.env.LOG_LEVEL = 'silent';
const [{ createApp }, { createApiRouter }, { createEnquiryRouter }, { PgEnquiryRepository }, { createPool }, { getEnv }, { Router }] = await Promise.all([
  import('../server/dist/app.js'), import('../server/dist/routes/index.js'),
  import('../server/dist/routes/enquiry-routes.js'), import('../server/dist/repositories/enquiry-repository.js'),
  import('../server/dist/config/database.js'), import('../server/dist/config/env.js'), import('express'),
]);
const config = getEnv();
const pool = createPool(config);
const client = await pool.connect();
const api = Router();
// All writes exercised by this audit use this transaction, never the general pool.
api.use('/enquiries', createEnquiryRouter(new PgEnquiryRepository(client)));
api.use(createApiRouter({ pool, config }));
const app = createApp({ config, apiRouter: api, staticDir: path.resolve('client/dist') });
const server = await new Promise((resolve) => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
const origin = `http://127.0.0.1:${server.address().port}`;
const artifacts = await mkdtemp(path.join(os.tmpdir(), 'unieats-footer-qa-'));
let browser;
const failures = [];
const savedKeys = [];
try {
  await client.query('BEGIN');
  browser = await chromium.launch({ channel: process.env.QA_BROWSER_CHANNEL || 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') console.log('Browser diagnostic:', message.text().slice(0, 700)); });
  const portalRoutes = ['/menu', '/about', '/contact', '/how-it-works', '/faqs', '/offers', '/support', '/partner', '/vendor/login', '/resources'];
  await page.goto(origin + '/contact');
  await page.locator('.portal h1').waitFor();
  const footerLinks = await page.locator('.site-footer nav a').evaluateAll((links) => links.map((link) => ({ label: link.textContent, path: link.getAttribute('href') })));
  assert.equal(footerLinks.length, 12);
  for (const link of footerLinks) {
    await page.locator('.site-footer').getByRole('link', { name: link.label, exact: true }).click();
    await page.waitForURL(origin + link.path);
    await page.locator('h1').first().waitFor();
    assert(!(await page.getByText('Something unexpected happened', { exact: true }).count()), link.path);
    console.log(`Footer navigation: ${link.path}`);
  }
  for (const route of portalRoutes) {
    await page.goto(origin + route);
    await page.locator('.portal h1').waitFor();
    assert(!await page.getByText('We could not load this page. Please try again.', { exact: true }).count(), route);
  }
  await page.goto(origin + '/faqs');
  const search = page.getByRole('searchbox', { name: 'Search FAQs' });
  await search.fill('cash');
  assert(await page.locator('details[open]').count() > 0);
  await search.fill('impossible-no-results-qa');
  await page.getByRole('heading', { name: 'No matching answers' }).waitFor();
  await page.getByRole('button', { name: 'Clear search' }).click();
  assert(await page.locator('details').count() > 1);
  await page.goto(origin + '/resources/order-workflow');
  await page.getByRole('heading', { name: 'From incoming order to pickup' }).waitFor();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download guide' }).click();
  assert.equal((await downloadEvent).suggestedFilename(), 'unieats-order-workflow.md');
  await page.goto(origin + '/resources/missing-guide');
  await page.getByRole('heading', { name: 'Guide not found.' }).waitFor();
  for (const route of [...portalRoutes, '/resources/order-workflow']) {
    await page.goto(origin + route);
    await page.locator('.portal h1').waitFor();
    if (route === '/menu') await page.locator('.portal-menu-heading').waitFor();
    for (const width of [1920, 1680, 1600, 1400, 1300, 1200, 992, 768, 576, 390, 360, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const layout = await page.evaluate(() => {
        const phone = document.querySelector('.footer-phone');
        const icon = phone.querySelector('svg').getBoundingClientRect();
        const number = phone.querySelector('span').getBoundingClientRect();
        const clipped = [...document.querySelectorAll('.portal h1,.portal h2,.portal h3,.portal button,.portal label,.footer-contact a')].filter((element) => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2).map((element) => element.textContent);
        return { overflow: document.documentElement.scrollWidth - window.innerWidth, phoneRow: Math.abs(icon.y + icon.height / 2 - number.y - number.height / 2) < 2 && number.x > icon.x, clipped };
      });
      assert(layout.overflow <= 1, `${route} ${width}px overflow ${layout.overflow}`);
      assert(layout.phoneRow, `${route} ${width}px phone alignment`);
      assert.deepEqual(layout.clipped, [], `${route} ${width}px clipped content`);
      if (route === '/contact' && (width === 1400 || width === 390)) await page.screenshot({ path: path.join(artifacts, `contact-${width}.png`), fullPage: true });
    }
    console.log(`12 responsive widths: ${route}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const kind of ['contact', 'support', 'partner']) {
    await page.goto(origin + '/' + kind);
    await page.getByLabel('Full name', { exact: true }).fill('QA Campus');
    await page.getByLabel('Email address', { exact: true }).fill('qa-enquiry@example.test');
    await page.getByLabel(/Phone number/).fill('+91 98765 43210');
    if (kind === 'partner') await page.getByLabel('Cafeteria / business name').fill('QA Cafe');
    await page.getByLabel(kind === 'partner' ? 'Tell us about your cafeteria' : 'Message', { exact: true }).fill('Transactional QA request: verify form persistence and rollback.');
    await page.getByRole('checkbox').check();
    const request = page.waitForRequest((request) => request.url().endsWith('/enquiries') && request.method() === 'POST');
    await page.getByRole('button', { name: kind === 'partner' ? 'Submit application' : 'Send request' }).click();
    const submitted = (await request).postDataJSON(); savedKeys.push(submitted.requestKey);
    await page.locator('.portal-success').waitFor();
    const reference = await page.locator('.portal-reference').innerText();
    assert.match(reference, /^UE-[0-9a-f-]{36}$/);
    const stored = await client.query('SELECT id, kind FROM public_enquiries WHERE request_key = $1', [submitted.requestKey]);
    assert.equal(stored.rows[0].kind, kind);
    const replay = await fetch(origin + '/api/v1/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submitted) });
    assert.equal(replay.status, 201); assert.equal((await replay.json()).data.reference, reference);
    const conflict = await fetch(origin + '/api/v1/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...submitted, message: 'A different request with the same key must not overwrite.' }) });
    assert.equal(conflict.status, 409);
    console.log(`Saved + idempotent retry + conflict protected: ${kind}`);
  }
  assert.deepEqual(failures, [], 'Browser runtime errors');
  console.log(`PASS: routes, FAQ, download, 132 layouts, three real forms; screenshots: ${artifacts}`);
} finally {
  await client.query('ROLLBACK');
  if (savedKeys.length) {
    const persisted = await client.query('SELECT count(*)::int AS count FROM public_enquiries WHERE request_key = ANY($1::uuid[])', [savedKeys]);
    assert.equal(persisted.rows[0].count, 0, 'QA entries must not remain');
    console.log('Verified: all QA submissions rolled back; no test entries remain.');
  }
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  client.release(); await pool.end();
}
