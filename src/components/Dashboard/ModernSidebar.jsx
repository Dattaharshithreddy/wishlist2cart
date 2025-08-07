import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Star,
  Compass,
  ShoppingCart,
  Package,
  Settings,
  Shield,
  X,
   Gift,
  ChevronsLeft,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { CustomButton } from './CustomButton';
import { useAuth } from '@/contexts/AuthContext';
import RewardsPage from '@/pages/RewardsPage';


const ModernSidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const [isDesktopCollapsed, setDesktopCollapsed] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { pathname } = useLocation();
  const mobileRef = useRef(null);
  const firstNavLinkRef = useRef(null);
  const lastNavLinkRef = useRef(null);

  const baseNavItems = [
    { label: 'My Wishlist', to: '/dashboard', Icon: Heart },
    { label: 'Originals', to: '/dashboard/brands', Icon: Star },
    { label: 'Discover', to: '/dashboard/marketplace', Icon: Compass },
    { label: 'My Cart', to: '/dashboard/cart', Icon: ShoppingCart },
    { label: 'My Orders', to: '/dashboard/orders', Icon: Package },
    { label: 'Settings', to: '/dashboard/settings', Icon: Settings },
    { label: 'Rewards', to: '/dashboard/rewards', Icon: Gift },

  ];

  const adminNavItems = isAdmin
    ? [
        { label: 'Admin Panel', to: '/admin', Icon: Shield },
        { label: 'Custom Product Admin', to: '/custom-admin', Icon: Shield },
      ]
    : [];

  const navItems = [...baseNavItems, ...adminNavItems];

  // Close sidebar on route change (Mobile)
  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ESC key closes sidebar (Mobile)
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);

      // Trap tab within sidebar when open
      if (e.key === 'Tab') {
        if (!firstNavLinkRef.current || !lastNavLinkRef.current) return;

        if (e.shiftKey) {
          // shift + tab (backwards)
          if (document.activeElement === firstNavLinkRef.current) {
            e.preventDefault();
            lastNavLinkRef.current.focus();
          }
        } else {
          // tab (forwards)
          if (document.activeElement === lastNavLinkRef.current) {
            e.preventDefault();
            firstNavLinkRef.current.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  // Focus first link in mobile sidebar when opened
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    firstNavLinkRef.current?.focus();
  }, [isMobileMenuOpen]);

  function NavLink({ to, Icon, label, isActive, isCollapsed, refForFocus }) {
    return (
      <Link
        to={to}
        ref={refForFocus}
        title={isCollapsed ? label : undefined}
        className={`flex w-full items-center gap-4 rounded-lg py-3 transition-colors duration-200 ${
          isCollapsed ? 'justify-center px-2' : 'justify-start px-4'
        } ${
          isActive
  ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-300 font-semibold'
  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'

        }`}
        aria-current={isActive ? 'page' : undefined}
        tabIndex={0}
      >
        <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        {!isCollapsed && <span className="truncate font-medium">{label}</span>}
      </Link>
    );
  }

  const renderNavLinks = (isCollapsed) => (
    <nav className="flex flex-col gap-2" role="navigation" aria-label="Dashboard Sidebar">
      {navItems.map((item, i) => {
        let refForFocus = null;
        if (i === 0) refForFocus = firstNavLinkRef;
        if (i === navItems.length - 1) refForFocus = lastNavLinkRef;

        return (
          <NavLink
            key={item.to}
            {...item}
            isActive={item.to === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.to)}
            isCollapsed={isCollapsed}
            refForFocus={refForFocus}
          />
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Sidebar (Drawer) */}
      <aside
        id="dashboard-sidebar"
        ref={mobileRef}
        tabIndex={isMobileMenuOpen ? 0 : -1}
        aria-modal="true"
        aria-label="Dashboard Sidebar"
        role="dialog"
        className={`md:hidden fixed inset-y-0 left-0 z-50 flex h-full w-64 transform flex-col border-r bg-white/95 backdrop-blur-sm transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-950/90 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
          <h2 className="text-lg font-bold">Menu</h2>
          <CustomButton onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </CustomButton>
        </div>
        <div className="flex-1 p-4">{renderNavLinks(false)}</div>
      </aside>

      {/* Backdrop under mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        aria-label="Dashboard Sidebar"
        className={`hidden md:sticky md:top-6 md:flex h-[calc(100vh-3rem)] flex-col rounded-2xl border bg-white/80 backdrop-blur-md transition-all duration-300 dark:border-gray-800 dark:bg-gray-950/70 ${
          isDesktopCollapsed ? 'w-24' : 'w-64'
        }`}
      >
        <div className="flex h-full flex-col p-2">
          <CustomButton
            onClick={() => setDesktopCollapsed(!isDesktopCollapsed)}
            aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="mb-4 self-end"
          >
            <ChevronsLeft
              className={`h-5 w-5 transition-transform duration-300 ${
                isDesktopCollapsed ? 'rotate-180' : ''
              }`}
            />
          </CustomButton>
          <div className="flex-1 overflow-y-auto">{renderNavLinks(isDesktopCollapsed)}</div>
        </div>
      </aside>
    </>
  );
};

export default ModernSidebar;
