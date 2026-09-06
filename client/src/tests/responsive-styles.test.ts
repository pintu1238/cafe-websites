import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const stylesheet = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8');

describe('responsive layout tiers', () => {
  const rule = (selector: string) => {
    const start = stylesheet.indexOf(`${selector} {`);
    const end = stylesheet.indexOf('\n', start);
    return stylesheet.slice(start, end === -1 ? undefined : end);
  };

  test('keeps every supported viewport tier explicit in the stylesheet', () => {
    const tiers = [
      '@media (min-width: 1680px) and (max-width: 1919px)',
      '@media (min-width: 1600px) and (max-width: 1679px)',
      '@media (min-width: 1400px) and (max-width: 1599px)',
      '@media (min-width: 1300px) and (max-width: 1399px)',
      '@media (min-width: 1200px) and (max-width: 1299px)',
      '@media (min-width: 992px) and (max-width: 1199px)',
      '@media (min-width: 768px) and (max-width: 991px)',
      '@media (min-width: 576px) and (max-width: 767px)',
      '@media (min-width: 361px) and (max-width: 575px)',
      '@media (max-width: 360px)',
      '@media (max-width: 320px)',
    ];

    const contract = stylesheet.slice(stylesheet.indexOf('/* Final responsive contract:'), stylesheet.indexOf('/* Shared type scale.'));
    for (const tier of tiers) {
      const start = contract.lastIndexOf(tier);
      const end = contract.indexOf('\n@media', start + tier.length);
      const block = contract.slice(start, end === -1 ? undefined : end);

      expect(block).toContain('--shell-gutter');
      expect(block).toContain('.hero-grid');
    }
  });

  test('keeps cafeteria navigation fixed while the content panel owns scrolling', () => {
    expect(rule('.cafe-app')).toContain('height: 100dvh');
    expect(rule('.cafe-app')).toContain('overflow: hidden');
    expect(rule('.cafe-sidebar')).toContain('overflow-y: auto');
    expect(rule('.cafe-main')).toContain('height: 100dvh');
    expect(rule('.cafe-main')).toContain('overflow-y: auto');
  });

  test('pins the customer dashboard sidebar while the document content scrolls', () => {
    expect(rule('.dashboard-app')).toContain('--dashboard-sidebar-width: 246px');
    expect(rule('.dashboard-sidebar')).toContain('position: fixed');
    expect(rule('.dashboard-sidebar')).toContain('inset: 0 auto 0 0');
    expect(rule('.dashboard-main')).toContain('margin-left: var(--dashboard-sidebar-width)');
  });

  test('removes the desktop sidebar offset on mobile', () => {
    expect(stylesheet).toContain('@media (max-width: 767px) { .dashboard-main { margin-left: 0; } }');
  });

  test('keeps sidebar navigation readable while inheriting active colours', () => {
    const sidebarLinkCopy = rule('.dashboard-sidebar-link > span:not(.dashboard-sidebar-badge)');
    const sidebarBrandCopy = rule('.dashboard-sidebar-brand .brand-mark-copy > span:first-child');

    expect(sidebarLinkCopy).toContain('font-size: 0.8125rem');
    expect(sidebarLinkCopy).toContain('font-weight: 600');
    expect(sidebarLinkCopy).toContain('color: inherit');
    expect(sidebarBrandCopy).toContain('font-size: 1.375rem');
    expect(sidebarBrandCopy).toContain('font-weight: 700');
    expect(sidebarBrandCopy).toContain('color: inherit');
  });
});
