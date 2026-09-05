import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Filter, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/search-bar';
import { ShopCard } from '../components/shop-card';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSkeleton } from '../components/ui/loading-skeleton';
import { useShopCategories, useShops } from '../features/shops/hooks';
import type { ShopFilters } from '../api/shops';

const priceOptions = [{ value: 'BUDGET', label: 'Budget · ₹' }, { value: 'MID', label: 'Mid-range · ₹₹' }, { value: 'PREMIUM', label: 'Premium · ₹₹₹' }] as const;

export function ShopsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [debounced, setDebounced] = useState(params.get('search') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [openOnly, setOpenOnly] = useState(params.get('openOnly') === 'true');
  const [minRating, setMinRating] = useState(params.get('minRating') ?? '');
  const [maxDistanceKm, setMaxDistanceKm] = useState(params.get('maxDistanceKm') ?? '');
  const [priceRange, setPriceRange] = useState<ShopFilters['priceRange']>(params.get('priceRange') as ShopFilters['priceRange'] ?? undefined);
  const [offersOnly, setOffersOnly] = useState(params.get('offersOnly') === 'true');
  const [sort, setSort] = useState<ShopFilters['sort']>((params.get('sort') as ShopFilters['sort']) ?? 'popular');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categories = useShopCategories();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filters = useMemo<ShopFilters>(() => ({
    search: debounced || undefined,
    category: category || undefined,
    openOnly,
    minRating: minRating ? Number(minRating) : undefined,
    maxDistanceKm: maxDistanceKm ? Number(maxDistanceKm) : undefined,
    priceRange,
    offersOnly,
    sort,
    limit: 12,
  }), [category, debounced, maxDistanceKm, minRating, offersOnly, openOnly, priceRange, sort]);
  const shops = useShops(filters);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debounced) next.set('search', debounced);
    if (category) next.set('category', category);
    if (openOnly) next.set('openOnly', 'true');
    if (minRating) next.set('minRating', minRating);
    if (maxDistanceKm) next.set('maxDistanceKm', maxDistanceKm);
    if (priceRange) next.set('priceRange', priceRange);
    if (offersOnly) next.set('offersOnly', 'true');
    if (sort !== 'popular') next.set('sort', sort ?? 'popular');
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [category, debounced, maxDistanceKm, minRating, offersOnly, openOnly, params, priceRange, setParams, sort]);

  const clearFilters = () => {
    setSearch(''); setDebounced(''); setCategory(''); setOpenOnly(false); setMinRating(''); setMaxDistanceKm(''); setPriceRange(undefined); setOffersOnly(false); setSort('popular');
  };
  const activeFilterCount = [category, openOnly, minRating, maxDistanceKm, priceRange, offersOnly].filter(Boolean).length;

  return <div className="discovery-page section-shell py-10 sm:py-14">
    <div className="max-w-3xl"><p className="eyebrow">Explore campus</p><h1 className="mt-3 font-display text-5xl text-espresso sm:text-6xl">Find your next meal.</h1><p className="mt-4 text-base leading-7 text-muted">Search cafeterias, compare what is open, and find the right meal for your campus day.</p></div>
    <section className="mt-8 rounded-[1.75rem] border border-espresso/10 bg-white p-4 shadow-card sm:p-5" aria-label="Cafeteria filters">
      <div className="discovery-toolbar">
        <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search cafeterias, food, or locations" />
        <label className="flex min-h-11 items-center gap-2 rounded-full border border-espresso/10 px-4 text-sm font-semibold text-espresso"><input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} className="h-4 w-4 accent-ember" />Open now</label>
        <label className="flex min-h-11 items-center gap-2 rounded-full border border-espresso/10 px-4 text-sm font-semibold text-espresso"><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => setSort(event.target.value as ShopFilters['sort'])} className="min-w-0 bg-transparent py-2 outline-none"><option value="popular">Popular</option><option value="rating">Top rated</option><option value="distance">Nearest</option><option value="preparation">Fastest prep</option><option value="newest">Newest</option></select></label>
        <button type="button" className="discovery-filter-button button-secondary" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}><Filter size={16} />Filters {activeFilterCount > 0 && <span className="rounded-full bg-ember px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>}<ChevronDown size={15} className={filtersOpen ? 'rotate-180' : ''} /></button>
      </div>
      <div className="mt-4"><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">Cuisine categories</p><div className="discovery-cuisine-rail"><button type="button" className={`rounded-full border px-4 py-2 text-sm font-semibold ${!category ? 'border-basil bg-basil text-white' : 'border-espresso/10 bg-white text-espresso'}`} onClick={() => setCategory('')}>All cuisines</button>{categories.data?.map((item) => <button type="button" key={item.slug} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${category === item.slug ? 'border-basil bg-basil text-white' : 'border-espresso/10 bg-white text-espresso'}`} onClick={() => setCategory(item.slug)}>{item.name}</button>)}</div></div>
      {filtersOpen && <div className="discovery-filter-drawer mt-4 border-t border-espresso/10 pt-4"><label className="grid gap-1 text-sm font-semibold text-espresso">Minimum rating<select value={minRating} onChange={(event) => setMinRating(event.target.value)} className="rounded-xl border border-espresso/10 bg-white px-3 py-2 font-normal"><option value="">Any rating</option><option value="4">4.0+ stars</option><option value="4.5">4.5+ stars</option></select></label><label className="grid gap-1 text-sm font-semibold text-espresso">Distance<select value={maxDistanceKm} onChange={(event) => setMaxDistanceKm(event.target.value)} className="rounded-xl border border-espresso/10 bg-white px-3 py-2 font-normal"><option value="">Any distance</option><option value="0.5">Within 0.5 km</option><option value="1">Within 1 km</option><option value="2">Within 2 km</option></select></label><label className="grid gap-1 text-sm font-semibold text-espresso">Price range<select value={priceRange ?? ''} onChange={(event) => setPriceRange((event.target.value || undefined) as ShopFilters['priceRange'])} className="rounded-xl border border-espresso/10 bg-white px-3 py-2 font-normal"><option value="">Any price</option>{priceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="flex items-center gap-2 self-end rounded-xl border border-espresso/10 px-3 py-2 text-sm font-semibold text-espresso"><input type="checkbox" checked={offersOnly} onChange={(event) => setOffersOnly(event.target.checked)} className="h-4 w-4 accent-ember" />Offers only</label><button type="button" className="button-secondary self-end" onClick={clearFilters}><X size={15} />Clear filters</button></div>}
    </section>
    <div className="discovery-result-summary mt-8"><div className="flex items-center gap-2 text-sm text-muted"><Check size={16} className="text-basil" />{shops.data?.pagination.total ?? 0} cafeterias available</div>{activeFilterCount > 0 && <button type="button" className="inline-flex items-center gap-1 text-sm font-bold text-basil" onClick={clearFilters}>Clear active filters <X size={14} /></button>}</div>
    {shops.isLoading ? <div className="discovery-results-grid mt-5">{Array.from({ length: 6 }, (_, item) => <LoadingSkeleton key={item} className="h-[430px]" />)}</div> : shops.isError ? <div className="mt-8"><ErrorState /></div> : shops.data?.items.length ? <div className="discovery-results-grid mt-5">{shops.data.items.map((shop) => <ShopCard key={shop.id} shop={shop} />)}</div> : <div className="mt-8"><EmptyState title="No cafeterias found" description="Try another cuisine, widen your distance, or clear a filter." /></div>}
  </div>;
}
