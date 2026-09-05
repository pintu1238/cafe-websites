import type { Order } from '../types/api';
import { cn } from '../lib/utils';
import { StatusBadge } from './ui/status-badge';

const steps: Order['status'][] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];
export function OrderTimeline({ status }: { status: Order['status'] }) {
  const current = steps.indexOf(status);
  return <div className="grid gap-3 sm:grid-cols-5">{steps.map((step, index) => <div key={step} className={cn('rounded-2xl border p-3 text-center text-xs transition', index <= current && !['CANCELLED', 'REJECTED'].includes(status) ? 'border-basil/25 bg-basil/5 text-basil' : 'border-espresso/10 bg-white text-muted')}><div className="font-bold">{String(index + 1).padStart(2, '0')}</div><div className="mt-1 font-semibold">{step}</div></div>)}{['CANCELLED', 'REJECTED'].includes(status) && <div className="sm:col-span-5"><StatusBadge status={status} /></div>}</div>;
}
