import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { BrandMark } from '../components/brand-mark';

describe('UniEats brand mark', () => {
  test('renders the supplied cup logo with an accessible brand name', () => {
    render(<BrandMark />);

    expect(screen.getByRole('img', { name: /unieats coffee cup logo/i })).toHaveAttribute(
      'src',
      '/assets/unieats-cup-logo.png',
    );
    expect(screen.getByText('UniEats')).toBeInTheDocument();
  });
});
