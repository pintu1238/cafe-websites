import { useQuery } from '@tanstack/react-query';
import { getContentPage } from '../../api/content';

export function useContentPage(slug: string) {
  return useQuery({ queryKey: ['content', slug], queryFn: () => getContentPage(slug), enabled: Boolean(slug) });
}
