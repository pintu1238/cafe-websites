import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '../components/footer';

describe('Footer contact details', () => {
  test('shows the owner contact details and social profile links', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);

    expect(screen.getByText(/GNA UNIVERSITY,/)).toBeInTheDocument();
    expect(screen.getByText(/Phagwara, Punjab, India/)).toBeInTheDocument();
    expect(screen.getByText('+91 62849 29772')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/pintu-gupta-834254251/');
    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute('href', 'https://x.com/PintuKu10887227');
  });

  test('routes informational footer links to their content pages', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'How It Works' })).toHaveAttribute('href', '/how-it-works');
    expect(screen.getByRole('link', { name: 'FAQs' })).toHaveAttribute('href', '/faqs');
    expect(screen.getByRole('link', { name: 'Offers' })).toHaveAttribute('href', '/offers');
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute('href', '/support');
    expect(screen.getByRole('link', { name: 'Partner With Us' })).toHaveAttribute('href', '/partner');
    expect(screen.getByRole('link', { name: 'Resources' })).toHaveAttribute('href', '/resources');
  });
});
