import { useState } from 'react';
import { Copy, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShopOffers } from '../features/shops/hooks';
import { LoadingSkeleton } from '../components/ui/loading-skeleton';
import { ErrorState } from '../components/ui/error-state';
import { PortalShell } from '../components/portal-shell';

export function OffersPage() {
  const offers = useShopOffers();
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const filtered = offers.data?.filter((offer) => (offer.shopName + ' ' + offer.title + ' ' + offer.description).toLowerCase().includes(query.toLowerCase())) ?? [];
  const copy = async (code: string) => { try { await navigator.clipboard.writeText(code); setMessage(`Copied ${code}. Check the offer details with the cafeteria before ordering.`); } catch { setMessage(`Copy this code manually: ${code}`); } };
  return <PortalShell eyebrow="Campus offers" title="A little more for your lunch break." intro="Explore published cafeteria specials. Check each offer’s details and your final total before ordering." action={{ label: 'Explore cafeterias', to: '/shops' }}>
    <label className="portal-search"><span className="sr-only">Search offers</span><input type="search" placeholder="Search offers or cafeterias…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    {message && <p className="portal-notice" role="status">{message}</p>}
    {offers.isLoading ? <div className="portal-resource-grid mt-6">{[1, 2].map((n) => <LoadingSkeleton key={n} className="h-44" />)}</div> : offers.isError ? <div className="mt-6"><ErrorState message="Offers could not be loaded." /><button className="portal-button secondary" onClick={() => void offers.refetch()}>Try again</button></div> : filtered.length ? <div className="portal-resource-grid mt-6">{filtered.map((offer) => <article key={offer.id} className="portal-card"><Tag size={26} className="portal-card-icon" /><p className="portal-eyebrow">{offer.shopName}</p><h2>{offer.title}</h2><p>{offer.description}</p>{offer.endsAt && <p>Valid until {new Date(offer.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}<div className="portal-actions mt-5">{offer.code && <button className="portal-button secondary" onClick={() => void copy(offer.code!)} aria-label={`Copy code ${offer.code}`}><Copy size={15} />{offer.code}</button>}<Link className="portal-button" to={`/shops/${offer.shopSlug}`}>View cafeteria menu</Link></div></article>)}</div> : <div className="portal-empty mt-6"><h2>{query ? 'No matching offers.' : 'No active offers right now.'}</h2><p>{query ? 'Try another cafeteria or clear your search.' : 'You can still explore today’s menus and find your next campus favourite.'}</p>{query ? <button className="portal-button secondary" onClick={() => setQuery('')}>Clear search</button> : <Link className="portal-button" to="/menu">Browse menus</Link>}</div>}
  </PortalShell>;
}
