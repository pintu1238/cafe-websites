export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-oat/80 ${className}`} aria-hidden="true" />;
}
