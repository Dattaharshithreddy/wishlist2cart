import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import WishlistIntegrationPage from '@/pages/WishlistIntegrationPage';
import CartAggregatorPage from '@/pages/CartAggregatorPage';
import SettingsPage from '@/pages/SettingsPage';
import SyncedSitesPage from '@/pages/SyncedSitesPage';

// Import your new pages
import CustomProductsPage from '@/pages/CustomProductsPage';
import MarketplacePicksPage from '@/pages/MarketplacePicksPage';


import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

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

          <Route path="/brands" 
          element={<ProtectedRoute>
            <CustomProductsPage />
          </ProtectedRoute>} />
          
<Route path="/marketplace" 
element={<ProtectedRoute><
  MarketplacePicksPage />
</ProtectedRoute>} />

        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
