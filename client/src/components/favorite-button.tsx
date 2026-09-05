import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOptionalAuth } from '../features/auth/auth-provider';
import { useFavorites, useToggleFavorite } from '../features/favorites/hooks';
import { cn } from '../lib/utils';

export function FavoriteButton({ shopId, initial = false, compact = false }: { shopId: string; initial?: boolean; compact?: boolean }) {
  const auth = useOptionalAuth();
  if (!auth) return <StaticFavoriteButton compact={compact} />;
  return <AuthenticatedFavoriteButton shopId={shopId} initial={initial} compact={compact} user={auth.user} />;
}

function StaticFavoriteButton({ compact }: { compact: boolean }) {
  return <button type="button" aria-label="Sign in to save cafeteria" title="Sign in to save favorites" className={cn('inline-flex items-center justify-center rounded-full border border-espresso/10 bg-white text-espresso', compact ? 'h-9 w-9 shadow-card' : 'h-11 gap-2 px-4 text-sm font-semibold')}><Heart size={compact ? 17 : 16} />{!compact && 'Favorite'}</button>;
}

function AuthenticatedFavoriteButton({ shopId, initial, compact, user }: { shopId: string; initial: boolean; compact: boolean; user: NonNullable<ReturnType<typeof useOptionalAuth>>['user'] }) {
  const navigate = useNavigate();
  const favorites = useFavorites(Boolean(user));
  const toggle = useToggleFavorite();
  const isFavorite = favorites.data?.some((item) => item.shopId === shopId) ?? initial;
  return <button
    type="button"
    aria-label={isFavorite ? 'Remove cafeteria from favorites' : 'Save cafeteria to favorites'}
    title={user ? (isFavorite ? 'Remove from favorites' : 'Save to favorites') : 'Sign in to save favorites'}
    className={cn('inline-flex items-center justify-center rounded-full border transition', compact ? 'h-9 w-9 bg-white/90 shadow-card backdrop-blur' : 'h-11 gap-2 px-4 text-sm font-semibold', isFavorite ? 'border-ember/30 bg-ember/10 text-ember' : 'border-espresso/10 bg-white text-espresso hover:border-ember/30 hover:text-ember')}
    disabled={toggle.isPending}
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!user) { navigate('/login'); return; }
      toggle.mutate({ shopId, isFavorite });
    }}
  ><Heart size={compact ? 17 : 16} className={isFavorite ? 'fill-current' : ''} />{!compact && (isFavorite ? 'Saved' : 'Favorite')}</button>;
}
