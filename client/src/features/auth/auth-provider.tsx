import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import { me } from '../../api/auth';
import type { User } from '../../types/api';

type AuthContextValue = { user: User | null; isLoading: boolean; refresh: () => Promise<unknown> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const query = useQuery({ queryKey: ['auth', 'me'], queryFn: me, retry: false });
  return <AuthContext.Provider value={{ user: query.data ?? null, isLoading: query.isLoading, refresh: () => query.refetch() }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
