import { cn } from '../lib/utils';

export function BrandMark({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return <span className={cn('inline-flex items-center gap-2.5', light ? 'text-white' : 'text-espresso')}>
    <span className={cn('brand-logo-frame', compact ? 'h-9 w-9' : 'h-10 w-10')}>
      <img className="brand-logo-image" src="/assets/unieats-cup-logo.png" alt="UniEats coffee cup logo" />
    </span>
    <span className="brand-mark-copy leading-none"><span className="block text-lg font-extrabold tracking-tight">UniEats</span><span className={cn('brand-mark-tagline mt-1 block text-xs font-medium tracking-[0.08em]', light ? 'text-white/60' : 'text-muted')}>Good Food. Greater Together.</span></span>
  </span>;
}
