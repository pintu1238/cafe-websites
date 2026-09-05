import { apiData, http } from './http';
import type { ContentPage } from '../types/api';

export async function getContentPage(slug: string) {
  return apiData<ContentPage>(await http.get(`/content/${encodeURIComponent(slug)}`));
}
