import { ArrowRight, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Order } from '../types/api';
import { formatRupees } from '../lib/utils';
import { StatusBadge } from './ui/status-badge';

export function OrderCard({ order }: { order: Order }) {
  return <article className="surface p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{order.orderNumber}</p><h3 className="mt-2 font-display text-2xl text-espresso">{order.shopName}</h3></div><StatusBadge status={order.status} /></div><div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted"><span className="flex items-center gap-1"><Clock3 size={15} />{order.pickupTime ? new Date(order.pickupTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Pickup time to be confirmed'}</span><strong className="text-espresso">{formatRupees(order.totalAmountPaise)}</strong></div><Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ember hover:text-mocha" to={`/orders/${order.id}`}>View order <ArrowRight size={16} /></Link></article>;
}
