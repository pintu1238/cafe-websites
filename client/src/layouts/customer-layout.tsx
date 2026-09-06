import { House, ListOrdered, Search, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Footer } from '../components/footer';
import { Navbar } from '../components/navbar';
import { useAuth } from '../features/auth/auth-provider';
import { cn } from '../lib/utils';

export function CustomerLayout() {
  const { user } = useAuth();
  return <div className="min-h-screen bg-cream text-ink"><Navbar /><main className="pb-20 md:pb-0"><Outlet /></main><Footer /><nav className="fixed inset-x-0 bottom-0 z-30 border-t border-espresso/10 bg-cream/95 px-5 py-3 backdrop-blur-xl md:hidden" aria-label="Mobile navigation"><div className="mx-auto flex max-w-md items-center justify-between"><NavLink to="/" className={({ isActive }) => cn('flex flex-col items-center gap-1 text-xs font-semibold', isActive ? 'text-ember' : 'text-muted')}><House size={18} />Home</NavLink><NavLink to="/shops" className={({ isActive }) => cn('flex flex-col items-center gap-1 text-xs font-semibold', isActive ? 'text-ember' : 'text-muted')}><Search size={18} />Explore</NavLink><NavLink to="/orders" className={({ isActive }) => cn('flex flex-col items-center gap-1 text-xs font-semibold', isActive ? 'text-ember' : 'text-muted')}><ListOrdered size={18} />Orders</NavLink><NavLink to={user ? '/orders' : '/login'} className="flex flex-col items-center gap-1 text-xs font-semibold text-muted"><UserRound size={18} />Profile</NavLink></div></nav></div>;
}
