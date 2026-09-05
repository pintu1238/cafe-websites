import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

export function SearchBar({ ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <label className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><input aria-label={props['aria-label'] ?? 'Search'} className="w-full rounded-full border border-espresso/10 bg-white py-4 pl-12 pr-5 text-sm text-espresso shadow-card outline-none transition placeholder:text-muted/70 focus:border-ember focus:ring-4 focus:ring-ember/10" placeholder="What are you craving today?" {...props} /></label>;
}
