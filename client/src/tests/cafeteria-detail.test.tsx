import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShopPage } from '../pages/shop-page';

vi.mock('../features/auth/auth-provider', () => ({
  useAuth: () => ({ user: { fullName: 'Vicky Sharma', role: 'CUSTOMER' } }),
  useOptionalAuth: () => null,
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
      menu: [
        { id: 'item-1', shopId: 'shop-1', categoryId: 'category-1', categoryName: 'North Indian', categorySlug: 'north-indian', name: 'Paneer Butter Masala', description: 'Creamy tomato gravy with soft paneer.', pricePaise: 8000, imageUrl: null, preparationTime: 12, isAvailable: true, isVegetarian: true, isSpicy: false, calories: 480, variants: [], addons: [] },
        { id: 'item-2', shopId: 'shop-1', categoryId: 'category-2', categoryName: 'Chinese', categorySlug: 'chinese', name: 'Veg Hakka Noodles', description: 'Wok-tossed noodles with vegetables.', pricePaise: 7000, imageUrl: null, preparationTime: 10, isAvailable: true, isVegetarian: true, isSpicy: false, calories: 420, variants: [], addons: [] },
      ],
    },
  }),
  useShopReviews: () => ({ data: { items: [] } }),
  useCreateShopReview: () => ({ isPending: false, mutateAsync: vi.fn() }),
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

    expect(screen.getByRole('heading', { name: 'The Courtyard Cafe' })).toBeInTheDocument();
    expect(screen.getByText('What sounds good?')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'North Indian' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chinese' })).toBeInTheDocument();
    expect(screen.getByText('Ratings & reviews')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add paneer butter masala/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/added to your cart/i);
  });
});
