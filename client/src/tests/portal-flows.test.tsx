import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Footer } from '../components/footer';
import { ContentPage } from '../pages/content-page';
import { EnquiryForm } from '../components/enquiry-form';
import { ResourceArticlePage } from '../pages/resource-article-page';
import { getContentPage } from '../api/content';
import { submitEnquiry } from '../api/enquiries';
vi.mock('../api/content', () => ({ getContentPage: vi.fn() }));
vi.mock('../api/enquiries', () => ({ submitEnquiry: vi.fn() }));

beforeEach(() => { vi.clearAllMocks(); });
const renderPage = (path: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes>{['about', 'contact', 'how-it-works', 'faqs', 'support', 'partner', 'resources'].map((slug) => <Route path={`/${slug}`} element={<ContentPage />} key={slug} />)}</Routes><Footer /></MemoryRouter></QueryClientProvider>);
};
describe('footer page journeys', () => {
  test.each(['about', 'contact', 'how-it-works', 'faqs', 'support', 'partner', 'resources'])('loads the exact static /%s route', async (slug) => {
    vi.mocked(getContentPage).mockResolvedValue({ slug, eyebrow: slug, title: `Page for ${slug}`, intro: 'Useful campus information.', sections: [{ heading: 'Pickup', paragraphs: ['Your cafeteria updates your order.'] }] });
    renderPage('/' + slug);
    expect(await screen.findByRole('heading', { name: `Page for ${slug}` })).toBeInTheDocument();
    expect(getContentPage).toHaveBeenCalledWith(slug);
  });
  test('follows a footer link to the next page', async () => {
    vi.mocked(getContentPage).mockImplementation(async (slug) => ({ slug, eyebrow: slug, title: `Page for ${slug}`, intro: 'Campus information.', sections: [] }));
    renderPage('/about');
    await screen.findByRole('heading', { name: 'Page for about' });
    await userEvent.click(screen.getByRole('link', { name: 'Contact' }));
    expect(await screen.findByRole('heading', { name: 'Page for contact' })).toBeInTheDocument();
  });
  test('searches FAQ answers and recovers from an empty search', async () => {
    vi.mocked(getContentPage).mockResolvedValue({ slug: 'faqs', eyebrow: 'Help', title: 'FAQ', intro: 'Answers.', sections: [{ heading: 'How do I pay?', paragraphs: ['Cash on pickup.'] }, { heading: 'Reset password', paragraphs: ['Use account recovery.'] }] });
    renderPage('/faqs');
    const search = await screen.findByRole('searchbox', { name: 'Search FAQs' });
    await userEvent.type(search, 'cash'); expect(screen.getByText('Cash on pickup.')).toBeVisible();
    expect(screen.queryByText('Reset password')).not.toBeInTheDocument();
    await userEvent.clear(search); await userEvent.type(search, 'zzzz');
    expect(screen.getByRole('heading', { name: 'No matching answers' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('Reset password')).toBeInTheDocument();
  });
  test('has distinct menu and vendor links and clickable contact rows', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/menu');
    expect(screen.getByRole('link', { name: 'Vendor Login' })).toHaveAttribute('href', '/vendor/login');
    expect(screen.getByRole('link', { name: '+91 62849 29772' })).toHaveAttribute('href', 'tel:+916284929772');
    expect(screen.getByRole('link', { name: 'support@unieats.in' })).toHaveAttribute('href', 'mailto:support@unieats.in');
    expect(document.querySelector('a[href="#footer"]')).toBeNull();
  });
  test('opens resource deep links and handles unknown articles', () => {
    render(<MemoryRouter initialEntries={['/resources/order-workflow']}><Routes><Route path="/resources/:article" element={<ResourceArticlePage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'From incoming order to pickup' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download guide' })).toBeInTheDocument();
  });
});
describe('enquiry form', () => {
  async function fill() {
    await userEvent.type(screen.getByLabelText('Full name'), 'Campus Student');
    await userEvent.type(screen.getByLabelText('Email address'), 'student@example.test');
    await userEvent.type(screen.getByLabelText('Message'), 'My pickup needs help with the missing item.');
    await userEvent.click(screen.getByRole('checkbox'));
  }
  test('shows a saved reference only after the server confirms persistence', async () => {
    vi.mocked(submitEnquiry).mockResolvedValue({ reference: 'UE-123', status: 'NEW', createdAt: '2026-09-06' });
    render(<EnquiryForm kind="support" />); await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(await screen.findByRole('status')).toHaveTextContent('UE-123');
    expect(submitEnquiry).toHaveBeenCalledWith(expect.objectContaining({ kind: 'support', consent: true, campus: 'GNA University' }));
  });
  test('keeps data and reuses the request key when retrying a failed submission', async () => {
    vi.mocked(submitEnquiry).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ reference: 'UE-retry', status: 'NEW', createdAt: '2026-09-06' });
    render(<EnquiryForm kind="support" />); await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be saved');
    expect(screen.getByLabelText('Full name')).toHaveValue('Campus Student');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    await screen.findByRole('status');
    expect(vi.mocked(submitEnquiry).mock.calls[0][0].requestKey).toBe(vi.mocked(submitEnquiry).mock.calls[1][0].requestKey);
  });
});
