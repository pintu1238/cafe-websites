import { Component, type ErrorInfo, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './features/auth/auth-provider';
import { ProtectedRoute, RoleRoute } from './features/auth/protected-route';
import { PublicLayout } from './layouts/public-layout';
import { CustomerLayout } from './layouts/customer-layout';
import { ShopkeeperLayout } from './layouts/shopkeeper-layout';
import { DashboardHomePage } from './pages/dashboard-home-page';
import { DashboardLayout } from './layouts/dashboard-layout';
import { ShopsPage } from './pages/shops-page';
import { ShopPage } from './pages/shop-page';
import { LoginPage } from './pages/login-page';
import { RegisterPage } from './pages/register-page';
import { CartPage } from './pages/cart-page';
import { CheckoutPage } from './pages/checkout-page';
import { OrdersPage } from './pages/orders-page';
import { OrderDetailPage } from './pages/order-detail-page';
import { ShopkeeperPage } from './pages/shopkeeper-page';
import { ComingSoonPage } from './pages/coming-soon-page';
import { NotFoundPage } from './pages/not-found-page';
import { ForgotPasswordPage } from './pages/forgot-password-page';
import { ResetPasswordPage } from './pages/reset-password-page';
import { VerifyEmailPage } from './pages/verify-email-page';
import { ContentPage } from './pages/content-page';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('UI error boundary', error, info); }
  render() { return this.state.hasError ? <div className="section-shell py-24 text-center"><p className="eyebrow">Something unexpected happened</p><h1 className="mt-3 font-display text-4xl text-espresso">Let’s get you back to the menu.</h1><button className="button-primary mt-8" onClick={() => window.location.reload()}>Reload</button></div> : this.props.children; }
}

export function App() {
  return <QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><ErrorBoundary><Routes>
    <Route element={<DashboardLayout />}><Route path="/" element={<DashboardHomePage />} /></Route>
    <Route element={<PublicLayout />}><Route path="/shops" element={<ShopsPage />} /><Route path="/shops/:slug" element={<ShopPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/verify-email" element={<VerifyEmailPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="/notifications" element={<ComingSoonPage />} /><Route path="/about" element={<ContentPage />} /><Route path="/contact" element={<ContentPage />} /><Route path="/how-it-works" element={<ContentPage />} /><Route path="/faqs" element={<ContentPage />} /><Route path="/offers" element={<ContentPage />} /><Route path="/support" element={<ContentPage />} /><Route path="/partner" element={<ContentPage />} /><Route path="/resources" element={<ContentPage />} /></Route>
    <Route path="/shops/:slug" element={<ShopPage />} />
    <Route path="*" element={<NotFoundPage />} />
    <Route element={<CustomerLayout />}><Route element={<ProtectedRoute />}><Route element={<RoleRoute role="CUSTOMER" />}><Route path="/cart" element={<CartPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/orders" element={<OrdersPage />} /><Route path="/orders/:id" element={<OrderDetailPage />} /><Route path="/favorites" element={<ComingSoonPage />} /></Route></Route></Route>
    <Route element={<ShopkeeperLayout />}><Route element={<ProtectedRoute />}><Route element={<RoleRoute role="SHOPKEEPER" />}><Route path="/shopkeeper" element={<ShopkeeperPage />} /><Route path="/shopkeeper/menu" element={<ComingSoonPage />} /><Route path="/shopkeeper/settings" element={<ComingSoonPage />} /><Route path="/shopkeeper/notifications" element={<ComingSoonPage />} /></Route></Route></Route>
  </Routes></ErrorBoundary></AuthProvider></BrowserRouter></QueryClientProvider>;
}
