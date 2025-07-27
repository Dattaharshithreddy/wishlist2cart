import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import WishlistIntegrationPage from '@/pages/WishlistIntegrationPage';
import CartAggregatorPage from '@/pages/CartAggregatorPage';
import CheckoutPage from '@/pages/CheckoutPage';
import UserOrdersPage from '@/pages/UserOrdersPage';
import OrderSuccess from './pages/Order-Success';
import SettingsPage from '@/pages/SettingsPage';
import SyncedSitesPage from '@/pages/SyncedSitesPage';
import CustomProductsPage from '@/pages/CustomProductsPage';
import MarketplacePicksPage from '@/pages/MarketplacePicksPage';
import AdminPanelPage from '@/pages/AdminPanelPage';
import RequireAuth from './components/RequireAuth';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function App() {
  const location = useLocation();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/add-wishlist" element={
            <ProtectedRoute>
              <WishlistIntegrationPage />
            </ProtectedRoute>
          } />

          <Route path="/cart" element={
            <ProtectedRoute>
              <CartAggregatorPage />
            </ProtectedRoute>
          } />

          <Route path="/checkout" element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute>
              <UserOrdersPage />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />

          <Route path="/synced-sites" element={
            <ProtectedRoute>
              <SyncedSitesPage />
            </ProtectedRoute>
          } />

          <Route path="/brands" element={
            <ProtectedRoute>
              <CustomProductsPage />
            </ProtectedRoute>
          } />

          <Route path="/marketplace" element={
            <ProtectedRoute>
              <MarketplacePicksPage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <RequireAuth>
                <AdminPanelPage />
              </RequireAuth>
            </ProtectedRoute>
          } />

          <Route path="/order-success" element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
