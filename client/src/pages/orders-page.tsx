import { Link } from 'react-router-dom';
import { OrderCard } from '../components/order-card';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSkeleton } from '../components/ui/loading-skeleton';
import { useOrders } from '../features/orders/hooks';

export function OrdersPage() { const orders = useOrders(); if (orders.isLoading) return <div className="section-shell py-16"><div className="grid gap-4">{[1, 2, 3].map((item) => <LoadingSkeleton key={item} className="h-44" />)}</div></div>; if (orders.isError) return <div className="section-shell py-16"><ErrorState message="We couldn't load your orders. Please try again." /></div>; return <div className="section-shell py-12 sm:py-16"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Your campus table</p><h1 className="mt-3 font-display text-5xl text-espresso">Your orders.</h1><p className="mt-4 text-sm leading-6 text-muted">Track pickup, revisit receipts, and keep your lunch moving.</p></div><Link to="/shops" className="button-secondary">Explore cafeterias</Link></div><div className="mt-8 grid gap-4">{orders.data?.length ? orders.data.map((order) => <OrderCard key={order.id} order={order} />) : <EmptyState title="No orders yet" description="Your next good meal is a few taps away." />}</div></div>; }
