import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { ContentPage } from '../pages/content-page';
import { getContentPage } from '../api/content';

vi.mock('../api/content', () => ({ getContentPage: vi.fn() }));

const mockedGetContentPage = vi.mocked(getContentPage);

describe('content pages', () => {
  test('renders content returned by the backend for the current slug', async () => {
    mockedGetContentPage.mockResolvedValue({
      slug: 'faqs',
      eyebrow: 'Student help',
      title: 'Frequently asked questions',
      intro: 'Answers for campus ordering.',
      sections: [{ heading: 'Where can I order?', paragraphs: ['From approved cafeterias.'] }],
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/faqs']}><Routes><Route path="/:slug" element={<ContentPage />} /></Routes></MemoryRouter></QueryClientProvider>);

    expect(await screen.findByRole('heading', { name: 'Frequently asked questions' })).toBeInTheDocument();
    expect(screen.getByText('From approved cafeterias.')).toBeInTheDocument();
    expect(mockedGetContentPage).toHaveBeenCalledWith('faqs');
  });
});
