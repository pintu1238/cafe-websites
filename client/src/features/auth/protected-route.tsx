import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-provider';
import { LoadingSkeleton } from '../../components/ui/loading-skeleton';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="section-shell py-20"><LoadingSkeleton className="mx-auto h-32 max-w-xl" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RoleRoute({ role }: { role: 'CUSTOMER' | 'SHOPKEEPER' | 'SUPER_ADMIN' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'SHOPKEEPER' ? '/shopkeeper' : '/'} replace />;
  return <Outlet />;
}
