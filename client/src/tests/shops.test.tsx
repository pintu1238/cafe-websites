import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShopCard } from '../components/shop-card';
import { EmptyState } from '../components/ui/empty-state';

vi.mock('../features/auth/auth-provider', () => ({ useAuth: () => ({ user: null }), useOptionalAuth: () => null }));

describe('shop discovery components', () => {
  test('renders real shop data and accessible open status', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><ShopCard shop={{
      id: 'shop-1',
      name: 'The Courtyard Cafe',
      slug: 'the-courtyard-cafe',
      description: 'Fresh campus comfort food.',
      location: 'Student Center',
      rating: 4.7,
      totalReviews: 128,
      estimatedPreparationTime: 12,
      isOpen: true,
      bannerUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900',
    }} /></MemoryRouter></QueryClientProvider>);

    expect(screen.getByText('The Courtyard Cafe')).toBeInTheDocument();
    expect(screen.getByText('Open now')).toBeInTheDocument();
    expect(screen.getByText('4.7')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view menu/i })).toHaveAttribute('href', '/shops/the-courtyard-cafe');
  });

  test('renders a useful empty state', () => {
    render(<EmptyState title="No shops found" description="Try a different search or clear your filters." />);

    expect(screen.getByText('No shops found')).toBeInTheDocument();
    expect(screen.getByText('Try a different search or clear your filters.')).toBeInTheDocument();
  });
});
