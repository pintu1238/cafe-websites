import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '../components/navbar';

vi.mock('../features/auth/auth-provider', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../features/cart/hooks', () => ({ useCart: () => ({ data: { items: [] } }) }));

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

describe('UniEats navigation', () => {
  test('keeps desktop and mobile search controls separately addressable for responsive layout', () => {
    render(<MemoryRouter initialEntries={['/']}><Navbar /></MemoryRouter>);

    expect(screen.getByRole('textbox', { name: 'Search for food or outlets' }).closest('form')).toHaveClass('header-search-desktop');
    expect(screen.getByRole('textbox', { name: 'Mobile search for food or outlets' }).closest('form')).toHaveClass('header-search-mobile');
  });

  test('sends header searches to the real shop discovery route', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/']}><Navbar /><Routes><Route path="*" element={<LocationDisplay />} /></Routes></MemoryRouter>);

    await user.type(screen.getByRole('textbox', { name: 'Search for food or outlets' }), 'paneer');
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/shops?search=paneer');
  });
});
