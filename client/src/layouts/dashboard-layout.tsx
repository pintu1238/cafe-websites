import { House, ListOrdered, Search, UserRound } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { logout } from '../api/auth';
import { DashboardHeader } from '../components/dashboard-header';
import { DashboardSidebar } from '../components/dashboard-sidebar';
import { Footer } from '../components/footer';
import { useAuth } from '../features/auth/auth-provider';
import { useCart } from '../features/cart/hooks';
import { queryClient } from '../lib/query-client';
import { cn } from '../lib/utils';

export function DashboardLayout() {
  const { user } = useAuth();
  const cart = useCart(Boolean(user));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const cartCount = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const handleLogout = async () => { try { await logout(); } finally { await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }); setSidebarOpen(false); } };
  return <div className="dashboard-app"><DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={() => void handleLogout()} />{sidebarOpen && <button className="dashboard-sidebar-overlay" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}<div className="dashboard-main"><DashboardHeader user={user} cartCount={cartCount} onMenuToggle={() => setSidebarOpen(true)} /><main className="dashboard-content"><Outlet /></main><Footer /></div><nav className="dashboard-mobile-nav" aria-label="Mobile navigation"><NavLink to="/" end className={({ isActive }) => cn(isActive && 'is-active')}><House size={18} />Home</NavLink><NavLink to="/shops" className={({ isActive }) => cn(isActive && 'is-active')}><Search size={18} />Explore</NavLink><NavLink to="/orders" className={({ isActive }) => cn(isActive && 'is-active')}><ListOrdered size={18} />Orders</NavLink><NavLink to={user ? '/notifications' : '/login'} className={({ isActive }) => cn(isActive && 'is-active')}><UserRound size={18} />Profile</NavLink></nav></div>;
}
