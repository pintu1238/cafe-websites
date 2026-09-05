import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShopOffers } from '../features/shops/hooks';
import { LoadingSkeleton } from '../components/ui/loading-skeleton';

export function OffersPage() {
  const offers = useShopOffers();
  return <div className="section-shell py-10 sm:py-14"><p className="eyebrow">Save on campus</p><h1 className="mt-3 font-display text-5xl text-espresso">Today’s offers.</h1><p className="mt-4 max-w-xl text-base leading-7 text-muted">Fresh deals from approved UniEats cafeterias.</p>{offers.isLoading ? <div className="mt-8 grid gap-4 md:grid-cols-2">{[1, 2].map((item) => <LoadingSkeleton key={item} className="h-36" />)}</div> : offers.data?.length ? <div className="mt-8 grid gap-4 md:grid-cols-2">{offers.data.map((offer) => <article key={offer.id} className="rounded-2xl border border-ember/20 bg-ember/5 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-ember">{offer.shopName}</p><h2 className="mt-2 font-display text-2xl text-espresso">{offer.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{offer.description}</p></div><Tag className="shrink-0 text-ember" /></div><div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-ember">{offer.code ? <span>Code: {offer.code}</span> : <span>Limited time</span>}<Link to={`/shops/${offer.shopSlug}`} className="underline">View menu</Link></div></article>)}</div> : <p className="mt-8 text-sm text-muted">No active offers right now. Check back soon.</p>}</div>;
}
