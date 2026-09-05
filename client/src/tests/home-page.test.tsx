import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardHomePage } from '../pages/dashboard-home-page';

vi.mock('../features/shops/hooks', () => ({
  useShops: () => ({
    isLoading: false,
    isError: false,
    data: {
      items: [{
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
      }],
      pagination: { page: 1, limit: 3, total: 1, totalPages: 1 },
    },
  }),
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
        bannerUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900',
      },
      menu: [{
        id: 'item-1',
        shopId: 'shop-1',
        categoryId: 'category-1',
        categoryName: 'North Indian',
        categorySlug: 'north-indian',
        name: 'Paneer Butter Masala',
        description: 'Creamy tomato gravy with soft paneer.',
        pricePaise: 8000,
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900',
        preparationTime: 12,
        isAvailable: true,
        isVegetarian: true,
        isSpicy: false,
        calories: 480,
        variants: [],
        addons: [],
      }],
    },
  }),
}));

vi.mock('../features/auth/auth-provider', () => ({ useAuth: () => ({ user: null }), useOptionalAuth: () => null }));
vi.mock('../features/cart/hooks', () => ({ useAddCartItem: () => ({ isPending: false, mutateAsync: vi.fn() }) }));

describe('UniEats homepage', () => {
  test('renders the UniEats customer dashboard sections and discovery entry points', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><DashboardHomePage /></MemoryRouter></QueryClientProvider>);

    expect(screen.getByRole('heading', { name: /fuel your campus life/i })).toBeInTheDocument();
    expect(screen.getByText('What are you craving?')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /popular cafeterias near you/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /popular dishes/i })).toBeInTheDocument();
    expect(screen.getByText('Paneer Butter Masala')).toBeInTheDocument();
    expect(screen.getByText('Student Special')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /healthy choices\s+happier you/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /your recent orders/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /offers for you/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /your campus impact/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add paneer butter masala/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /order now/i })).toHaveAttribute('href', '/shops');
  });
});
