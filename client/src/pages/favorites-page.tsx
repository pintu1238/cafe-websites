import { Heart, MapPin, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavorites, useToggleFavorite } from '../features/favorites/hooks';
import { LoadingSkeleton } from '../components/ui/loading-skeleton';

export function FavoritesPage() {
  const favorites = useFavorites(true);
  const toggle = useToggleFavorite();
  return <div className="section-shell py-10 sm:py-14"><p className="eyebrow">Your saved places</p><h1 className="mt-3 font-display text-5xl text-espresso">Favorite cafeterias.</h1><p className="mt-4 max-w-xl text-base leading-7 text-muted">Keep the campus kitchens you love close at hand.</p>{favorites.isLoading ? <div className="mt-8 grid gap-4 md:grid-cols-2">{[1, 2].map((item) => <LoadingSkeleton key={item} className="h-32" />)}</div> : favorites.data?.length ? <div className="mt-8 grid gap-4 md:grid-cols-2">{favorites.data.map((item) => <article key={item.shopId} className="flex items-center justify-between gap-4 rounded-2xl border border-espresso/10 bg-white p-5 shadow-card"><Link to={`/shops/${item.shopSlug}`} className="min-w-0"><h2 className="truncate font-display text-2xl text-espresso">{item.shopName}</h2><p className="mt-2 flex items-center gap-1 text-sm text-muted"><MapPin size={14} />Open cafeteria details</p></Link><button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-espresso/10 text-muted hover:border-ember/30 hover:text-ember" aria-label={`Remove ${item.shopName} from favorites`} onClick={() => toggle.mutate({ shopId: item.shopId, isFavorite: true })}><Trash2 size={16} /></button></article>)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-espresso/20 bg-white p-8 text-center"><Heart className="mx-auto text-ember" /><p className="mt-3 font-semibold text-espresso">No favorites yet.</p><Link to="/shops" className="button-primary mt-5">Explore cafeterias</Link></div>}</div>;
}
