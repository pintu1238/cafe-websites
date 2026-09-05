import { Router } from 'express';
import { getContentPage } from '../content/content-catalog.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../utils/app-error.js';
import { contentSlugParamsSchema } from '../validators/content.js';

export function createContentRouter() {
  const router = Router();

  router.get('/:slug', validate(contentSlugParamsSchema, 'params'), (request, response) => {
    const page = getContentPage(request.params.slug as string);
    if (!page) {
      throw new AppError('CONTENT_NOT_FOUND', 'The requested content page was not found.', 404);
    }
    response.json({ success: true, data: page });
  });

  return router;
}
