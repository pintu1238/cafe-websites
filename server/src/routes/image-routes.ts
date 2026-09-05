import { Router } from 'express';
import { AppError } from '../utils/app-error.js';

const APPROVED_IMAGE_HOST = 'images.unsplash.com';

function parseApprovedImageUrl(value: unknown) {
  if (typeof value !== 'string' || !value) {
    throw new AppError('INVALID_IMAGE_SOURCE', 'The image source is invalid.', 400);
  }

  let source: URL;
  try {
    source = new URL(value);
  } catch {
    throw new AppError('INVALID_IMAGE_SOURCE', 'The image source is invalid.', 400);
  }

  if (
    source.protocol !== 'https:'
    || source.hostname !== APPROVED_IMAGE_HOST
    || source.username
    || source.password
    || source.port
  ) {
    throw new AppError('INVALID_IMAGE_SOURCE', 'The image source is not approved.', 400);
  }

  return source;
}

export function createImageRouter() {
  const router = Router();

  router.get('/', async (request, response, next) => {
    try {
      const source = parseApprovedImageUrl(request.query.url);
      const upstream = await fetch(source);

      if (!upstream.ok) {
        throw new AppError('IMAGE_UNAVAILABLE', 'The image could not be loaded.', 502);
      }

      const contentType = upstream.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) {
        throw new AppError('IMAGE_UNAVAILABLE', 'The image response was invalid.', 502);
      }

      response.set({
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': contentType,
        'Cross-Origin-Resource-Policy': 'same-origin',
      });
      response.send(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
