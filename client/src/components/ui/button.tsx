import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Button({ variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  return <button className={cn(variant === 'primary' ? 'button-primary' : 'button-secondary', 'disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />;
}
