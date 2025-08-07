import React, { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar'; // Use Navbar, not Header
import Footer from '@/components/Footer';
import ModernSidebar from '@/components/Dashboard/ModernSidebar';

const Layout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Pages to hide navbar/sidebar/footer
  const noLayoutRoutes = ['/login', '/'];
  const shouldHideLayout = noLayoutRoutes.includes(location.pathname);

  // Close mobile sidebar/menu on route changes
  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans flex flex-col overflow-x-hidden">
      {/* Navbar */}
      {!shouldHideLayout && (
        <Navbar />
        // Note: The Navbar component includes its own mobile menu toggle internally.
        // If you want the sidebar’s mobile toggle linked to Navbar’s hamburger,
        // consider lifting state or use a global context.
      )}

      <div className="flex flex-1 pt-16"> 
      {/* Added pt-16 to offset fixed Navbar height */}
        {/* Sidebar */}
        {!shouldHideLayout && (
          <ModernSidebar
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        )}

        {/* Main Content */}
        <main className="flex-grow px-4 md:px-8">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      {!shouldHideLayout && <Footer />}
    </div>
  );
};

export default Layout;
