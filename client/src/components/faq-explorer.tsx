import { useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ContentSection } from '../types/api';

export function FaqExplorer({ sections }: { sections: ContentSection[] }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const results = sections.filter((section) => [section.heading, ...section.paragraphs].join(' ').toLowerCase().includes(normalized));
  return <section className="portal-faq"><label className="portal-search"><Search size={20} /><span className="sr-only">Search FAQs</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search payments, pickup, accounts…" type="search" /></label><p className="portal-result-count" role="status">{results.length} {results.length === 1 ? 'answer' : 'answers'} found</p>{results.map((section) => <details key={section.heading} open={normalized ? true : undefined}><summary>{section.heading}</summary><div>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></details>)}{!results.length && <div className="portal-empty"><h2>No matching answers</h2><p>Try “pickup” or “payment”, or send us your question.</p><button className="portal-button secondary" onClick={() => setQuery('')}>Clear search</button></div>}<p className="portal-help-note">Still need a hand? <Link to="/support">Contact student support →</Link></p></section>;
}

