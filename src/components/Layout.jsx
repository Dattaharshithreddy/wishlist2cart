import React, { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ModernSidebar from '@/components/Dashboard/ModernSidebar';

const Layout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Pages to hide header/sidebar/footer
  const noLayoutRoutes = ['/login'];
  const shouldHideLayout = noLayoutRoutes.includes(location.pathname);

  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans flex flex-col overflow-x-hidden">
      {/* Header */}
      {!shouldHideLayout && (
        <Header onHamburgerClick={() => setIsMobileMenuOpen(true)} />
      )}
      <div className="flex flex-1">
        {/* Sidebar */}
        {!shouldHideLayout && (
          <ModernSidebar
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        )}
        {/* Main Content */}
        <main className="flex-grow">
          <Outlet />
        </main>
      </div>
      {/* Footer */}
      {!shouldHideLayout && <Footer />}
    </div>
  );
};

export default Layout;
