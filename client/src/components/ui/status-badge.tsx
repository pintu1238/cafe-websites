import { Badge } from './badge';
import type { Order } from '../../types/api';

export function StatusBadge({ status }: { status: Order['status'] }) {
  const tone = status === 'READY' || status === 'COMPLETED' ? 'success' : status === 'REJECTED' || status === 'CANCELLED' ? 'danger' : status === 'PENDING' ? 'warning' : 'neutral';
  return <Badge tone={tone}>{status.replace('_', ' ')}</Badge>;
}
