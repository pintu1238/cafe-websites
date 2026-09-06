import { createHash } from 'node:crypto';
import type { Queryable } from '../config/database.js';
import type { EnquiryInput } from '../validators/enquiries.js';
import { AppError } from '../utils/app-error.js';

export type EnquiryReceipt = { reference: string; status: 'NEW'; createdAt: string };
export interface EnquiryRepository { create(input: EnquiryInput): Promise<EnquiryReceipt> }

export class PgEnquiryRepository implements EnquiryRepository {
  constructor(private readonly database: Queryable) {}
  async create(input: EnquiryInput): Promise<EnquiryReceipt> {
    const { requestKey, ...payload } = input;
    const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const result = await this.database.query<{ id: string; payload_hash: string; created_at: Date }>(
      `INSERT INTO public_enquiries (request_key, payload_hash, kind, full_name, email, phone, campus, topic, order_number, business_name, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (request_key) DO UPDATE SET request_key = EXCLUDED.request_key
       RETURNING id, payload_hash, created_at`,
      [requestKey, hash, input.kind, input.fullName, input.email, input.phone || null, input.campus, input.topic, input.orderNumber || null, input.businessName || null, input.message],
    );
    const row = result.rows[0];
    if (!row) throw new AppError('ENQUIRY_SAVE_FAILED', 'We could not save your request. Please try again.', 503);
    if (row.payload_hash !== hash) throw new AppError('REQUEST_CONFLICT', 'This request reference has already been used. Start a new request.', 409);
    return { reference: `UE-${row.id}`, status: 'NEW', createdAt: row.created_at.toISOString() };
  }
}

