import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]', tone === 'success' && 'bg-basil/10 text-basil', tone === 'warning' && 'bg-ember/10 text-ember', tone === 'danger' && 'bg-red-100 text-red-700', tone === 'neutral' && 'bg-oat text-mocha')}>{children}</span>;
}
