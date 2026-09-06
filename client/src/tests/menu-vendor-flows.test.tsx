import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MenuPage } from '../pages/menu-page';
import { VendorLoginPage } from '../pages/vendor-login-page';
import { AuthProvider } from '../features/auth/auth-provider';
import { queryClient } from '../lib/query-client';
import { getShop, getShops } from '../api/shops';
import { addCartItem } from '../api/cart';
import { login, me } from '../api/auth';
import type { MenuItem, Shop, User } from '../types/api';

vi.mock('../api/shops', () => ({ getShops: vi.fn(), getShop: vi.fn() }));
vi.mock('../api/cart', () => ({ addCartItem: vi.fn() }));
vi.mock('../api/auth', () => ({ login: vi.fn(), me: vi.fn(), logout: vi.fn() }));
const student: User = { id: 'student', fullName: 'Campus Student', email: 'student@example.test', role: 'CUSTOMER', phone: null, profileImageUrl: null, universityId: null, studentId: null, isActive: true, isVerified: true, createdAt: '', updatedAt: '', lastLoginAt: null };
const shop: Shop = { id: 'cafe', slug: 'campus-cafe', name: 'Campus Cafe', description: 'Lunch and coffee', bannerUrl: null, location: 'Campus', isOpen: true, rating: 4.7, totalReviews: 20, estimatedPreparationTime: 10 };
const meal: MenuItem = { id: 'meal', shopId: 'cafe', categoryId: 'lunch', categoryName: 'Lunch', categorySlug: 'lunch', name: 'Veg bowl', description: 'Rice and vegetables', pricePaise: 8000, imageUrl: null, preparationTime: 10, isAvailable: true, isVegetarian: true, isSpicy: false, calories: null, variants: [], addons: [] };
const chicken: MenuItem = { ...meal, id: 'chicken', name: 'Chicken bowl', isVegetarian: false };
beforeEach(() => {
  vi.resetAllMocks(); queryClient.clear();
  vi.mocked(me).mockResolvedValue(student);
  vi.mocked(getShops).mockResolvedValue({ items: [shop], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } });
  vi.mocked(getShop).mockResolvedValue({ shop, menu: [meal, chicken] });
});
function LoginDestination() { const location = useLocation(); return <h1>Sign in to return to {location.state?.from}</h1>; }
function setup(path: string) {
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[path]}><AuthProvider><Routes><Route path="/menu" element={<MenuPage />} /><Route path="/vendor/login" element={<VendorLoginPage />} /><Route path="/login" element={<LoginDestination />} /><Route path="/shopkeeper" element={<h1>Vendor order board</h1>} /></Routes></AuthProvider></MemoryRouter></QueryClientProvider>);
}
describe('campus menu flows', () => {
  test('uses an animated cafeteria picker and keeps search focus on the outer surface', async () => {
    setup('/menu');
    const picker = await screen.findByRole('combobox', { name: 'Cafeteria' });

    expect(picker).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.portal-menu-toolbar select')).not.toBeInTheDocument();

    await userEvent.click(picker);
    expect(picker).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toHaveClass('is-open');
    expect(screen.getByRole('option', { name: 'Campus Cafe' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(screen.getByRole('option', { name: 'Campus Cafe' }));
    expect(picker).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('searchbox', { name: 'Search menu' })).toHaveClass('portal-search-input');
  });

  test('combines vegetarian and search filters, then clears an empty result', async () => {
    setup('/menu'); await screen.findByRole('heading', { name: 'Veg bowl' });
    await userEvent.click(screen.getByLabelText('Vegetarian only'));
    expect(screen.queryByRole('heading', { name: 'Chicken bowl' })).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search menu' }), 'not a dish');
    expect(screen.getByRole('heading', { name: 'No dishes match these filters.' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByRole('heading', { name: 'Chicken bowl' })).toBeInTheDocument();
  });
  test('sends the chosen dish to cart and only then confirms success', async () => {
    vi.mocked(addCartItem).mockResolvedValue({ id: 'cart', customerId: 'student', shopId: 'cafe', shopName: 'Campus Cafe', items: [], subtotalPaise: 8000 });
    setup('/menu');
    await userEvent.click(await screen.findByRole('button', { name: 'Add Veg bowl to cart' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Veg bowl added');
    expect(vi.mocked(addCartItem).mock.calls[0][0]).toEqual({ menuItemId: 'meal', quantity: 1 });
    expect(screen.getByRole('link', { name: /View cart/ })).toHaveAttribute('href', '/cart');
  });
  test('preserves menu filters when a guest goes to sign in', async () => {
    vi.mocked(me).mockResolvedValue(null); setup('/menu?veg=1');
    await userEvent.click(await screen.findByRole('button', { name: 'Add Veg bowl to cart' }));
    expect(await screen.findByRole('heading', { name: 'Sign in to return to /menu?veg=1' })).toBeInTheDocument();
    expect(addCartItem).not.toHaveBeenCalled();
  });
  test('does not allow adding unavailable food or ordering from a closed cafeteria', async () => {
    vi.mocked(getShop).mockResolvedValue({ shop: { ...shop, isOpen: false }, menu: [meal, { ...chicken, isAvailable: false }] });
    setup('/menu');
    expect(await screen.findByRole('button', { name: 'Add Veg bowl to cart' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add Chicken bowl to cart' })).toBeDisabled();
    expect(addCartItem).not.toHaveBeenCalled();
  });
});
describe('vendor access flows', () => {
  test('sends an authenticated shopkeeper to the order board', async () => {
    vi.mocked(me).mockResolvedValue({ ...student, role: 'SHOPKEEPER' }); setup('/vendor/login');
    expect(await screen.findByRole('heading', { name: 'Vendor order board' })).toBeInTheDocument();
  });
  test('does not grant a signed-in customer access to the vendor workspace', async () => {
    setup('/vendor/login');
    expect(await screen.findByRole('button', { name: 'Sign out and switch account' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vendor order board' })).not.toBeInTheDocument();
  });
  test('keeps the form available after rejected credentials', async () => {
    vi.mocked(me).mockResolvedValue(null); vi.mocked(login).mockRejectedValue(new Error('rejected'));
    setup('/vendor/login');
    await userEvent.type(await screen.findByLabelText('Partner email'), 'partner@example.test');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in to workspace' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please try again');
    expect(screen.getByLabelText('Partner email')).toHaveValue('partner@example.test');
    expect(screen.getByRole('button', { name: 'Sign in to workspace' })).toBeEnabled();
  });
  test('refreshes the authenticated session after successful partner sign-in', async () => {
    const partner: User = { ...student, role: 'SHOPKEEPER' };
    vi.mocked(me).mockResolvedValueOnce(null).mockResolvedValue(partner);
    vi.mocked(login).mockResolvedValue(partner); setup('/vendor/login');
    await userEvent.type(await screen.findByLabelText('Partner email'), 'partner@example.test');
    await userEvent.type(screen.getByLabelText('Password'), 'valid-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in to workspace' }));
    expect(await screen.findByRole('heading', { name: 'Vendor order board' })).toBeInTheDocument();
  });
});
