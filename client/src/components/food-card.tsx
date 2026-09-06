import { Clock3, Leaf, Plus, Flame } from 'lucide-react';
import type { MenuItem } from '../types/api';
import { formatRupees } from '../lib/utils';
import { getImageUrl } from '../lib/image-url';
import { Button } from './ui/button';

const foodFallback = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80';
export function FoodCard({ item, onAdd, disabled = false }: { item: MenuItem; onAdd?: () => void; disabled?: boolean }) {
  return <article className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-espresso/10 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft">
    <div className="relative h-44 overflow-hidden bg-oat"><img src={getImageUrl(item.imageUrl ?? foodFallback)} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />{item.isVegetarian && <span className="absolute left-3 top-3 rounded-full bg-white/95 p-2 text-basil" title="Vegetarian"><Leaf size={15} /></span>}</div>
    <div className="flex flex-1 flex-col p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-ember">{item.categoryName}</p><h3 className="mt-1 font-display text-xl text-espresso">{item.name}</h3></div>{item.isSpicy && <span aria-label="Spicy"><Flame className="mt-1 text-ember" size={16} /></span>}</div><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{item.description}</p><div className="mt-auto flex items-center justify-between gap-3 pt-4"><div><p className="font-semibold text-espresso">{formatRupees(item.pricePaise)}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted"><Clock3 size={13} />{item.preparationTime} min</p></div><Button onClick={onAdd} disabled={disabled || !item.isAvailable} aria-label={`Add ${item.name} to cart`}><Plus size={16} />Add</Button></div></div>
  </article>;
}
