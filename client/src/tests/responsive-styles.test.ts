import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const stylesheet = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8');

describe('responsive layout tiers', () => {
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

    for (const tier of tiers) {
      const start = stylesheet.lastIndexOf(tier);
      const end = stylesheet.indexOf('\n@media', start + tier.length);
      const block = stylesheet.slice(start, end === -1 ? undefined : end);

      expect(block).toContain('--shell-gutter');
      expect(block).toContain('.hero-grid');
    }
  });
});
