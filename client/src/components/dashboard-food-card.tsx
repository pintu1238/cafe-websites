import { Plus, Star } from 'lucide-react';
import type { MenuItem } from '../types/api';
import { formatRupees } from '../lib/utils';
import { getImageUrl } from '../lib/image-url';

export function DashboardFoodCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return <article className="dashboard-food-card"><div className="dashboard-food-image"><img src={getImageUrl(item.imageUrl)} alt={item.name} /><button className="dashboard-add-button" type="button" onClick={onAdd} aria-label={`Add ${item.name} to cart`}><Plus size={17} /></button></div><div className="dashboard-food-copy"><h3>{item.name}</h3><div className="dashboard-food-meta"><strong>{formatRupees(item.pricePaise)}</strong><span><Star size={13} fill="currentColor" />{item.isVegetarian ? '4.8' : '4.6'}</span></div></div></article>;
}
