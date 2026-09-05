import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardHeader } from '../components/dashboard-header';

vi.mock('../features/auth/auth-provider', () => ({ useAuth: () => ({ user: null }) }));

describe('customer dashboard header', () => {
  test('keeps the UniEats cup logo visible in the compact mobile header', () => {
    render(<MemoryRouter><DashboardHeader user={null} cartCount={0} onMenuToggle={vi.fn()} /></MemoryRouter>);

    expect(screen.getByRole('img', { name: /unieats coffee cup logo/i })).toBeInTheDocument();
  });
});
