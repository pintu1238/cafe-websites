import { Clock3, MapPin, Star, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Shop } from '../types/api';
import { Badge } from './ui/badge';
import { FavoriteButton } from './favorite-button';
import { getImageUrl } from '../lib/image-url';

const fallbackImage = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80';

export function ShopCard({ shop }: { shop: Shop }) {
  const hours = shop.openingTime && shop.closingTime ? `${shop.openingTime.slice(0, 5)} – ${shop.closingTime.slice(0, 5)}` : 'Campus hours';
  const price = shop.priceRange === 'BUDGET' ? '₹' : shop.priceRange === 'PREMIUM' ? '₹₹₹' : '₹₹';
  return <article className="group overflow-hidden rounded-[2rem] border border-espresso/10 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft">
    <div className="relative h-52 overflow-hidden bg-oat"><img src={getImageUrl(shop.bannerUrl ?? fallbackImage)} alt={`${shop.name} cafeteria`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      <div className="absolute left-4 top-4"><Badge tone={shop.isOpen ? 'success' : 'neutral'}>{shop.isOpen ? 'Open now' : 'Closed'}</Badge></div>
      <div className="absolute right-4 top-4"><FavoriteButton shopId={shop.id} initial={Boolean(shop.isFavorite)} compact /></div>
    </div>
    <div className="p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-2xl text-espresso">{shop.name}</h3><p className="mt-2 flex items-center gap-1 text-sm text-muted"><MapPin size={14} />{shop.location}</p></div><div className="flex items-center gap-1 text-sm font-semibold text-espresso"><Star size={15} className="fill-ember text-ember" />{shop.rating.toFixed(1)}</div></div>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted">{shop.cuisineCategories?.slice(0, 2).map((category) => <span key={category} className="rounded-full bg-oat px-2.5 py-1">{category}</span>)}<span className="rounded-full bg-oat px-2.5 py-1">{price}</span></div>
      <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-muted"><span>{shop.totalReviews} reviews</span><span className="flex items-center gap-1"><Clock3 size={14} />{hours}</span><span className="flex items-center gap-1"><MapPin size={14} />{shop.distanceKm ? `${shop.distanceKm.toFixed(1)} km away` : 'On campus'}</span><span className="flex items-center gap-1"><Clock3 size={14} />{shop.estimatedPreparationTime} min prep</span></div>
      {Boolean(shop.activeOffersCount) && <p className="mt-4 flex items-center gap-1.5 text-xs font-bold text-ember"><Tag size={14} />{shop.activeOffersCount} active offer{shop.activeOffersCount === 1 ? '' : 's'}</p>}
      <Link className="button-primary mt-5 w-full" to={`/shops/${shop.slug}`} aria-label={`View menu at ${shop.name}`}>View menu</Link>
    </div>
  </article>;
}
