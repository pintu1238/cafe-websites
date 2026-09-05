import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Input({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return <label className="block text-sm font-medium text-espresso">{label && <span className="mb-2 block">{label}</span>}<input className={cn('w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-ember focus:ring-4 focus:ring-ember/10', className)} {...props} /></label>;
}
