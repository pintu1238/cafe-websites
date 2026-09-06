import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import config from '../../tailwind.config';

let style: HTMLStyleElement;

beforeAll(async () => {
  const source = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8');
  const compiled = await postcss([tailwindcss(config)]).process(source, { from: undefined });
  style = document.createElement('style');
  style.textContent = compiled.css;
  document.head.append(style);
});

afterAll(() => style.remove());

beforeEach(() => {
  document.body.innerHTML = `
    <nav><a class="dashboard-sidebar-link"><span>My Orders</span></a></nav>
    <div class="dashboard-search"><input placeholder="Search food" /></div>
    <div class="dashboard-cafe-copy"><div class="dashboard-cafe-title"><h3>Courtyard Cafe</h3></div><p>Student Center</p></div>
    <div class="dashboard-food-copy"><h3>Campus Club Sandwich</h3></div>
    <div class="dashboard-profile"><small>Student</small></div>
    <div class="dashboard-category-item"><strong>North Indian</strong></div>
    <a class="dashboard-view-all">View All</a>
    <div class="cafe-food-copy"><h3>Paneer Wrap</h3><p>Freshly prepared</p></div>
    <div class="cafe-menu-search"><input placeholder="Search menu" /></div>
    <button class="button-primary">Sign in</button>
    <p class="text-muted">Sign in to order ahead.</p>
    <h1 class="font-display">Your campus table awaits.</h1>
  `;
});

function computed(selector: string) {
  return getComputedStyle(document.querySelector(selector)!);
}

function fontSize(selector: string) {
  // JSDOM exposes custom properties without resolving them into used values.
  let value = computed(selector).fontSize;
  value = value.replace(/var\((--[^)]+)\)/g, (_, name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  return parseFloat(value) * (value.endsWith('rem') ? 16 : 1);
}

describe('readable shared typography', () => {
  test.each(['body', '.dashboard-sidebar-link', '.dashboard-search input', '.cafe-menu-search input', '.button-primary'])('%s renders primary text at 16px or larger', (selector) => {
    expect(fontSize(selector)).toBeGreaterThanOrEqual(16);
  });

  test.each(['.dashboard-profile small', '.dashboard-cafe-copy p', '.cafe-food-copy p', '.dashboard-category-item strong', '.dashboard-view-all'])('%s never shrinks supporting text below 14px', (selector) => {
    expect(fontSize(selector)).toBeGreaterThanOrEqual(14);
  });

  test.each(['.dashboard-cafe-title h3', '.dashboard-food-copy h3', '.cafe-food-copy h3'])('%s keeps food and café names at a readable 18px', (selector) => {
    expect(fontSize(selector)).toBe(18);
  });

  test('uses the same sans-serif family for public headings and body text', () => {
    expect(computed('.font-display').fontFamily).not.toContain('Georgia');
    expect(computed('.font-display').fontFamily).toContain('sans-serif');
  });

  test('uses the same readable secondary colour for dashboard and public text', () => {
    const description = computed('.dashboard-cafe-copy p').color;
    expect(description).toBe(computed('.text-muted').color);
    const rgb = description.match(/[\d.]+/g)!.map(Number);
    const luminance = rgb.slice(0, 3).map((v) => v / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const contrastOnPage = (0.94 + 0.05) / (0.2126 * luminance[0] + 0.7152 * luminance[1] + 0.0722 * luminance[2] + 0.05);
    expect(contrastOnPage).toBeGreaterThanOrEqual(4.5);
  });
});
