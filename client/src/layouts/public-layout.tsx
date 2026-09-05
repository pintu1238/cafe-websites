import { Outlet } from 'react-router-dom';
import { Footer } from '../components/footer';
import { Navbar } from '../components/navbar';
export function PublicLayout() { return <div className="min-h-screen bg-cream text-ink"><Navbar /><main><Outlet /></main><Footer /></div>; }
