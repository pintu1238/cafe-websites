import { Sparkles } from 'lucide-react';

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return <div className="surface flex items-start gap-4 border-dashed bg-white/70 p-5"><div className="rounded-2xl bg-oat p-3 text-ember"><Sparkles size={18} /></div><div><p className="font-semibold text-espresso">{title} · Coming Soon</p><p className="mt-1 text-sm leading-6 text-muted">{description}</p></div></div>;
}
