import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { EnquiryRepository } from '../repositories/enquiry-repository.js';
import { enquirySchema } from '../validators/enquiries.js';
import { validate } from '../middleware/validate.js';

export function createEnquiryRouter(repository: EnquiryRepository) {
  const router = Router();
  router.post('/', rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests. Please wait 15 minutes or use the contact details on this page.', errors: [] },
  }), validate(enquirySchema), async (request, response) => {
    const receipt = await repository.create(request.body);
    response.status(201).json({ success: true, data: receipt });
  });
  return router;
}

