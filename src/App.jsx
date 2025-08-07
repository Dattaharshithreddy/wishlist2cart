// src/App.jsx

import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Layout from '@/components/Layout';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { RewardProvider } from '@/contexts/RewardContext'; // adjust path accordingly

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Careers from '@/pages/Careers';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';

import DashboardPage from '@/pages/DashboardPage';
import CustomProductsPage from '@/pages/CustomProductsPage';
import MarketplacePicksPage from '@/pages/MarketplacePicksPage';
import CartAggregatorPage from '@/pages/CartAggregatorPage';
import UserOrdersPage from '@/pages/UserOrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import WishlistIntegrationPage from '@/pages/WishlistIntegrationPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderSuccess from '@/pages/Order-Success';
import SettingsPage from '@/pages/SettingsPage';
import ProductDetailsPage from '@/pages/ProductDetailsPage';
import RewardsPage from './pages/RewardsPage';

import AdminPanelPage from '@/pages/AdminPanelPage'; // confirm filenames
import AdminAddCustomProduct from '@/pages/AdminAddCustomProduct';

import ProtectedRoute from '@/components/ProtectedRoute';
import RequireAuth from '@/components/RequireAuth';

function App() {
  const location = useLocation();

  return (
    // RewardsProvider used at top-level to provide rewards context globally
    <RewardProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* Public & Auth Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Layout Wrapper */}
          <Route element={<Layout />}>

            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

            {/* Protected Non-Dashboard Routes */}
            <Route path="/add-wishlist" element={
              <ProtectedRoute><WishlistIntegrationPage /></ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute><CheckoutPage /></ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute><UserOrdersPage /></ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute><CartAggregatorPage /></ProtectedRoute>
            } />
            <Route path="/order-success" element={
              <ProtectedRoute><OrderSuccess /></ProtectedRoute>
            } />
            <Route path="/products/:productId" element={
              <ProtectedRoute><ProductDetailsPage /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><SettingsPage /></ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <RequireAuth requiredRole="admin"><AdminPanelPage /></RequireAuth>
            } />
            <Route path="/custom-admin" element={
              <RequireAuth requiredRole="admin"><AdminAddCustomProduct /></RequireAuth>
            } />

            {/* Dashboard with Nested Routes */}
            <Route path="/dashboard/*" element={
              <ProtectedRoute><DashboardLayout /></ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="brands" element={<CustomProductsPage />} />
              <Route path="marketplace" element={<MarketplacePicksPage />} />
              <Route path="cart" element={<CartAggregatorPage />} />
              <Route path="orders" element={<UserOrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              <Route path="rewards" element={<RewardsPage />} />
              <Route path="products/:productId" element={<ProductDetailsPage />} />
              <Route path="settings" element={<SettingsPage />} />

            </Route>

          </Route>
        </Routes>
      </AnimatePresence>
    </RewardProvider>
  );
}

export default App;
