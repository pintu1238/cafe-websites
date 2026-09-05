import { Bell, ClipboardList, Heart, Home, LogOut, UserRound, WalletCards, X, type LucideIcon } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { BrandMark } from './brand-mark';
import { cn } from '../lib/utils';

type DashboardSidebarProps = { open: boolean; onClose: () => void; onLogout: () => void };

type SidebarItem = { label: string; to: string; icon: LucideIcon; end?: boolean; badge?: number };
const links: SidebarItem[] = [
  { label: 'Home', to: '/', icon: Home, end: true },
  { label: 'Cafeterias', to: '/shops', icon: WalletCards },
  { label: 'My Orders', to: '/orders', icon: ClipboardList },
  { label: 'Favorites', to: '/favorites', icon: Heart },
  { label: 'Wallet & Offers', to: '/notifications', icon: WalletCards },
  { label: 'Notifications', to: '/notifications', icon: Bell, badge: 3 },
  { label: 'Profile', to: '/notifications', icon: UserRound },
];

export function DashboardSidebar({ open, onClose, onLogout }: DashboardSidebarProps) {
  return <aside className={cn('dashboard-sidebar', open && 'is-open')} aria-label="Customer navigation">
    <div className="dashboard-sidebar-brand"><Link to="/" aria-label="UniEats home" onClick={onClose}><BrandMark /></Link><button className="dashboard-sidebar-close" type="button" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div>
    <nav className="dashboard-sidebar-nav">{links.map((item) => { const Icon = item.icon; const end = 'end' in item ? item.end : undefined; const badge = 'badge' in item ? item.badge : undefined; return <NavLink key={item.label} to={item.to} end={end} onClick={onClose} className={({ isActive }) => cn('dashboard-sidebar-link', isActive && 'is-active')}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{badge && <span className="dashboard-sidebar-badge">{badge}</span>}</NavLink>; })}</nav>
    <div className="dashboard-sidebar-rule" />
    <button className="dashboard-sidebar-link dashboard-sidebar-logout" type="button" onClick={onLogout}><LogOut size={18} strokeWidth={1.8} /><span>Logout</span></button>
  </aside>;
}
