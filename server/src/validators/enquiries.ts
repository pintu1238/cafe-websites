import { z } from 'zod';

export const enquirySchema = z.object({
  requestKey: z.string().uuid(),
  kind: z.enum(['contact', 'support', 'partner']),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, 'Enter a valid phone number.').optional(),
  campus: z.string().trim().min(2).max(150),
  topic: z.enum(['General question', 'Order help', 'Account access', 'Feedback', 'Partnership']),
  orderNumber: z.string().trim().max(80).optional(),
  businessName: z.string().trim().max(160).optional(),
  message: z.string().trim().min(20).max(4000),
  consent: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.kind === 'partner') {
    if (!value.businessName || value.businessName.length < 2) context.addIssue({ code: z.ZodIssueCode.custom, path: ['businessName'], message: 'Enter your cafeteria or business name.' });
    if (!value.phone || value.phone.replace(/\D/g, '').length < 7) context.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Enter a contact phone number.' });
    if (value.topic !== 'Partnership') context.addIssue({ code: z.ZodIssueCode.custom, path: ['topic'], message: 'Select Partnership for an application.' });
  }
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

