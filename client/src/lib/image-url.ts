const UNSPLASH_HOST = 'images.unsplash.com';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export function getImageUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  try {
    const source = new URL(value);
    if (source.protocol === 'https:' && source.hostname === UNSPLASH_HOST) {
      return `${API_BASE_URL}/images?url=${encodeURIComponent(source.toString())}`;
    }
  } catch {
    // Relative and otherwise non-URL values are already usable by the browser.
  }

  return value;
}

export function unsplashImage(id: string, width = 1000): string {
  return getImageUrl(`https://${UNSPLASH_HOST}/${id}?auto=format&fit=crop&w=${width}&q=86`) ?? '';
}
