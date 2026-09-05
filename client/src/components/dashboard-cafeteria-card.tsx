import { Clock3, Heart, MapPin, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export type DashboardCafeteria = { name: string; slug: string; imageUrl: string; isOpen: boolean; rating: string; reviews: string; cuisine: string; hours: string; distance: string; live?: boolean };

export function DashboardCafeteriaCard({ cafe }: { cafe: DashboardCafeteria }) {
  const [favorite, setFavorite] = useState(false);
  return <article className="dashboard-cafe-card"><div className="dashboard-cafe-image"><img src={cafe.imageUrl} alt={`${cafe.name} cafeteria`} /><button type="button" className={favorite ? 'is-favorite' : ''} onClick={() => setFavorite((value) => !value)} aria-label={`${favorite ? 'Remove' : 'Add'} ${cafe.name} to favorites`} aria-pressed={favorite}><Heart size={20} fill={favorite ? 'currentColor' : 'none'} /></button><span className={cafe.isOpen ? 'is-open' : 'is-closed'}>{cafe.isOpen ? '● Open Now' : '○ Closed'}</span></div><Link className="dashboard-cafe-copy" to={cafe.live ? `/shops/${cafe.slug}` : '/shops'}><div className="dashboard-cafe-title"><h3>{cafe.name}</h3><span><Star size={14} fill="currentColor" />{cafe.rating} <small>({cafe.reviews})</small></span></div><p>{cafe.cuisine}</p><p><Clock3 size={14} />{cafe.hours}</p><p><MapPin size={14} />{cafe.distance}</p></Link></article>;
}
