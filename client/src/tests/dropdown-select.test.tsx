import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { DropdownSelect } from '../components/ui/dropdown-select';

function TestDropdown({ name = 'value', ariaLabel = 'Dropdown' }: { name?: string; ariaLabel?: string }) {
  const [value, setValue] = useState('');
  return <DropdownSelect aria-label={ariaLabel} name={name} value={value} onChange={setValue} options={[{ value: '', label: 'Any rating' }, { value: '4', label: '4.0+ stars' }]} />;
}

describe('DropdownSelect', () => {
  test('opens as an accessible listbox and submits the selected value', async () => {
    const user = userEvent.setup();
    render(<TestDropdown ariaLabel="Minimum rating" name="minRating" />);

    const trigger = screen.getByRole('combobox', { name: 'Minimum rating' });
    expect(trigger).toHaveTextContent('Any rating');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeVisible();
    expect(screen.getByRole('listbox')).toHaveClass('is-open');
    expect(screen.getByRole('option', { name: 'Any rating' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('option', { name: '4.0+ stars' }));
    expect(trigger).toHaveTextContent('4.0+ stars');
    expect(document.querySelector<HTMLInputElement>('input[name="minRating"]')).toHaveValue('4');
  });

  test('supports keyboard selection and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<TestDropdown ariaLabel="Sort cafeterias" name="sort" />);

    const trigger = screen.getByRole('combobox', { name: 'Sort cafeterias' });
    await user.click(trigger);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(trigger).toHaveTextContent('4.0+ stars');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
