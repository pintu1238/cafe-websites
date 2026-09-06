import { BookOpen, Download, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PortalShell } from '../components/portal-shell';
import { partnerGuides, guideMarkdown } from '../data/partner-guides';

export function ResourceCards() {
  return <div className="portal-resource-grid">{partnerGuides.map((guide) => <Link className="portal-resource-card" key={guide.slug} to={`/resources/${guide.slug}`}><BookOpen size={26} /><p className="portal-eyebrow">{guide.category} · {guide.minutes} MIN READ</p><h2>{guide.title}</h2><p>{guide.summary}</p><span>Read guide <ArrowRight size={16} /></span></Link>)}</div>;
}
export function ResourceArticlePage() {
  const { article } = useParams();
  const guide = partnerGuides.find((item) => item.slug === article);
  if (!guide) return <PortalShell eyebrow="Partner resources" title="Guide not found." intro="Browse the resource library to find the guide you need."><Link className="portal-button" to="/resources">Back to resources</Link></PortalShell>;
  const download = () => {
    const url = URL.createObjectURL(new Blob([guideMarkdown(guide)], { type: 'text/markdown;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `unieats-${guide.slug}.md`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <PortalShell eyebrow={guide.category} title={guide.title} intro={guide.summary} breadcrumb="Partner guide">
    <div className="portal-article-layout"><article className="portal-article">{guide.steps.map(([heading, body], index) => <section id={`step-${index + 1}`} key={heading}><span className="portal-step-number">{String(index + 1).padStart(2, '0')}</span><h2>{heading}</h2><p>{body}</p></section>)}</article><aside className="portal-card portal-article-nav"><p className="portal-eyebrow">In this guide</p><nav aria-label="Guide contents">{guide.steps.map(([heading], index) => <a key={heading} href={`#step-${index + 1}`}>{index + 1}. {heading}</a>)}</nav><button className="portal-button secondary" onClick={download}><Download size={17} />Download guide</button><Link to="/resources">← All resources</Link></aside></div>
  </PortalShell>;
}

