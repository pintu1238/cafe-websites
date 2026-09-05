import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useContentPage } from '../features/content/hooks';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSkeleton } from '../components/ui/loading-skeleton';

export function ContentPage() {
  const { slug = '' } = useParams();
  const page = useContentPage(slug);

  if (page.isLoading) {
    return <div className="section-shell py-12 sm:py-16"><LoadingSkeleton className="h-48" /><LoadingSkeleton className="mt-6 h-64" /></div>;
  }

  if (page.isError || !page.data) {
    return <div className="section-shell py-16"><ErrorState message="We could not load this page. Please try again." /></div>;
  }

  return <div className="section-shell py-12 sm:py-16">
    <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-espresso"><ArrowLeft size={16} /> Back home</Link>
    <div className="mt-8 max-w-3xl">
      <p className="eyebrow">{page.data.eyebrow}</p>
      <h1 className="mt-3 font-display text-5xl text-espresso sm:text-6xl">{page.data.title}</h1>
      <p className="mt-5 text-base leading-7 text-muted">{page.data.intro}</p>
    </div>
    <div className="mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
      {page.data.sections.map((section) => <section className="surface p-6 sm:p-7" key={section.heading}>
        <h2 className="font-display text-2xl text-espresso">{section.heading}</h2>
        <div className="mt-4 grid gap-3 text-sm leading-6 text-muted">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        {section.items && <ul className="mt-4 grid gap-2 text-sm text-muted">{section.items.map((item) => <li className="flex items-start gap-2" key={item}><CheckCircle2 size={16} className="mt-1 shrink-0 text-basil" />{item}</li>)}</ul>}
      </section>)}
    </div>
  </div>;
}
