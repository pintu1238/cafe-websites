import { apiData, http } from './http';

export type EnquiryKind = 'contact' | 'support' | 'partner';
export type EnquiryInput = {
  requestKey: string; kind: EnquiryKind; fullName: string; email: string;
  phone?: string; campus: string; topic: string; orderNumber?: string;
  businessName?: string; message: string; consent: boolean;
};
export type EnquiryReceipt = { reference: string; status: string; createdAt: string };
export async function submitEnquiry(input: EnquiryInput) {
  return apiData<EnquiryReceipt>(await http.post('/enquiries', input));
}

