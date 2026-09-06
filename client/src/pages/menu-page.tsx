import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useShop, useShops } from '../features/shops/hooks';
import { useAuth } from '../features/auth/auth-provider';
import { useAddCartItem } from '../features/cart/hooks';
import { FoodCard } from '../components/food-card';
import { PortalShell } from '../components/portal-shell';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSkeleton } from '../components/ui/loading-skeleton';
import { getApiError } from '../lib/errors';
import type { MenuItem, Shop } from '../types/api';

type CafeteriaPickerProps = {
  shops: Shop[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function CafeteriaPicker({ shops, value, onChange, disabled = false }: CafeteriaPickerProps) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const listboxId = 'cafeteria-picker-options';
  const selected = shops.find((shop) => shop.slug === value);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  return <div className="portal-field portal-cafeteria-picker" ref={pickerRef}>
    <span className="portal-field-label" id="cafeteria-picker-label">Cafeteria</span>
    <button
      type="button"
      className="portal-cafeteria-trigger"
      role="combobox"
      aria-label="Cafeteria"
      aria-labelledby="cafeteria-picker-label"
      aria-controls={listboxId}
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={handleTriggerKeyDown}
    >
      <span>{selected?.name ?? 'Select a cafeteria'}</span>
      <ChevronDown className={open ? 'is-open' : undefined} size={18} aria-hidden="true" />
    </button>
    <div id={listboxId} className={`portal-cafeteria-options${open ? ' is-open' : ''}`} role="listbox" aria-label="Cafeteria options" aria-hidden={!open}>
      {shops.map((shop) => <div
        key={shop.id}
        className={`portal-cafeteria-option${shop.slug === value ? ' is-selected' : ''}`}
        role="option"
        aria-selected={shop.slug === value}
        tabIndex={open ? 0 : -1}
        onClick={() => { onChange(shop.slug); setOpen(false); }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onChange(shop.slug); setOpen(false); }
        }}
      >
        <span><strong>{shop.name}</strong>{!shop.isOpen && <small>Closed now</small>}</span>
        {shop.slug === value && <Check size={16} aria-hidden="true" />}
      </div>)}
    </div>
  </div>;
}

export function MenuPage() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const shops = useShops({ limit: 50, sort: 'popular' });
  const slug = params.get('cafeteria') ?? shops.data?.items[0]?.slug ?? '';
  const details = useShop(slug);
  const { user } = useAuth();
  const add = useAddCartItem();
  const navigate = useNavigate();
  const query = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const vegetarian = params.get('veg') === '1';
  const menu = details.data?.menu ?? [];
  const categories = [...new Map(menu.map((item) => [item.categorySlug, item.categoryName])).entries()];
  const filtered = menu.filter((item) => (!query || (item.name + ' ' + item.description).toLowerCase().includes(query.toLowerCase())) && (!category || item.categorySlug === category) && (!vegetarian || item.isVegetarian));
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key === 'cafeteria') { next.delete('category'); setNotice(''); setError(''); } setParams(next, { replace: true }); };
  const addItem = async (item: MenuItem) => {
    if (!user) { navigate('/login', { state: { from: '/menu?' + params.toString() } }); return; }
    setError(''); setNotice('');
    try { await add.mutateAsync({ menuItemId: item.id, quantity: 1 }); setNotice(`${item.name} added to your cart.`); }
    catch (err) { setError(getApiError(err)); }
  };
  return <PortalShell eyebrow="The campus menu" title="What sounds good today?" intro="Choose a cafeteria, find your favourites, and build your next campus meal." action={{ label: 'Browse all cafeterias', to: '/shops' }}>
    <div className="portal-menu-toolbar"><CafeteriaPicker shops={shops.data?.items ?? []} value={slug} onChange={(value) => update('cafeteria', value)} disabled={shops.isLoading} /><label className="portal-search"><Search size={19} /><span className="sr-only">Search menu</span><input className="portal-search-input" type="search" maxLength={100} placeholder="Search dishes or ingredients…" value={query} onChange={(event) => update('q', event.target.value)} /></label><label className="portal-checkbox"><input type="checkbox" checked={vegetarian} onChange={(event) => update('veg', event.target.checked ? '1' : '')} />Vegetarian only</label></div>
    <nav className="portal-chips" aria-label="Menu categories"><button aria-pressed={!category} onClick={() => update('category', '')}>All dishes</button>{categories.map(([key, name]) => <button key={key} aria-pressed={category === key} onClick={() => update('category', key)}>{name}</button>)}</nav>
    {shops.isError || details.isError ? <div><ErrorState message="We could not load the menu." /><button className="portal-button secondary" onClick={() => { void shops.refetch(); if (slug) void details.refetch(); }}>Try again</button></div> : shops.isLoading || (slug && details.isLoading) ? <div className="portal-menu-grid">{[1, 2, 3].map((n) => <LoadingSkeleton key={n} className="h-72" />)}</div> : <>
      <div className="portal-menu-heading"><div><h2>{details.data?.shop.name ?? 'Campus menus'}</h2><p>{filtered.length} dishes · {details.data?.shop.isOpen ? 'Open for orders' : 'Select an open cafeteria to order'}</p></div>{slug && <Link to={`/shops/${slug}`}>Cafeteria details →</Link>}</div>
      {notice && <p className="portal-notice" role="status">{notice} <Link to="/cart">View cart →</Link></p>}{error && <p className="portal-error" role="alert">{error}</p>}
      {filtered.length ? <div className="portal-menu-grid">{filtered.map((item) => <FoodCard key={item.id} item={item} onAdd={() => void addItem(item)} disabled={add.isPending || !details.data?.shop.isOpen} />)}</div> : <div className="portal-empty"><h2>{slug ? 'No dishes match these filters.' : 'No cafeteria menus available yet.'}</h2><p>Browse cafeterias or adjust your search to discover another meal.</p><button className="portal-button secondary" onClick={() => { const next = new URLSearchParams(params); next.delete('q'); next.delete('category'); next.delete('veg'); setParams(next); }}>Clear filters</button></div>}
    </>}
  </PortalShell>;
}
