import type { ReactNode } from 'react';

export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-4 text-ember">{icon}</div>}
      <h2 className="font-display text-2xl text-espresso">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
