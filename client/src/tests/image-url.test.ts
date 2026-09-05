import { describe, expect, test } from 'vitest';
import { getImageUrl } from '../lib/image-url';

describe('getImageUrl', () => {
  test('routes Unsplash images through the versioned same-origin API', () => {
    const source = 'https://images.unsplash.com/photo-123?auto=format&w=900';
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

    expect(getImageUrl(source)).toBe(`${apiBase}/images?url=${encodeURIComponent(source)}`);
  });

  test('keeps local and non-Unsplash image URLs unchanged', () => {
    expect(getImageUrl('/assets/unieats-cup-logo.png')).toBe('/assets/unieats-cup-logo.png');
    expect(getImageUrl('https://cdn.example.com/image.jpg')).toBe('https://cdn.example.com/image.jpg');
    expect(getImageUrl(null)).toBeUndefined();
  });
});
