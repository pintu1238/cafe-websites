import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShopPage } from '../pages/shop-page';

vi.mock('../features/auth/auth-provider', () => ({
  useAuth: () => ({ user: { fullName: 'Vicky Sharma', role: 'CUSTOMER' } }),
}));

vi.mock('../features/shops/hooks', () => ({
  useShop: () => ({
    isLoading: false,
    isError: false,
    data: {
      shop: {
        id: 'shop-1',
        name: 'The Courtyard Cafe',
        slug: 'the-courtyard-cafe',
        description: 'Fresh campus comfort food.',
        location: 'Student Center',
        rating: 4.7,
        totalReviews: 128,
        estimatedPreparationTime: 12,
        isOpen: true,
        bannerUrl: null,
      },
      menu: [],
    },
  }),
}));

const mutateAsync = vi.fn().mockResolvedValue({});
vi.mock('../features/cart/hooks', () => ({
  useAddCartItem: () => ({ isPending: false, mutateAsync }),
  useCart: () => ({ data: { items: [] } }),
}));

describe('cafeteria detail experience', () => {
  test('renders the Bite Box discovery layout and adds a menu item', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/shops/the-courtyard-cafe']}><ShopPage /></MemoryRouter></QueryClientProvider>);

    expect(screen.getByRole('heading', { name: 'Bite Box' })).toBeInTheDocument();
    expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'North Indian' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chinese' })).toBeInTheDocument();
    expect(screen.getByText('Ratings & reviews')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /add paneer butter masala/i })[0]);
    expect(await screen.findByRole('status')).toHaveTextContent(/added to your order/i);
  });
});
