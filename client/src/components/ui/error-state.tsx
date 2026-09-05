import { AlertCircle } from 'lucide-react';

export function ErrorState({ message = "We couldn't load this right now. Please try again." }: { message?: string }) {
  return <div role="alert" className="surface flex items-center gap-3 border-ember/20 bg-ember/5 p-5 text-sm text-espresso"><AlertCircle className="text-ember" size={20} />{message}</div>;
}
