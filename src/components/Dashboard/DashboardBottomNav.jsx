import React from 'react';
import { NavLink } from 'react-router-dom';
import { Star, Compass, ShoppingCart, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard/brands', icon: <Star />, label: 'Originals' },
  { to: '/dashboard/marketplace', icon: <Compass />, label: 'Discover' },
  { to: '/dashboard/cart', icon: <ShoppingCart />, label: 'Cart' },
  { to: '/dashboard/settings', icon: <User />, label: 'Account' },
];

const DashboardBottomNav = () => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-950/95 shadow-t flex md:hidden justify-around border-t border-gray-300 dark:border-gray-700"
    aria-label="Dashboard bottom navigation"
  >
    {navItems.map(({ to, icon, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `flex flex-col items-center py-2 pt-3 px-4 text-xs font-semibold select-none transition-colors ${
            isActive
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400'
          }`
        }
        aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
      >
        <span className="h-6 w-6 mb-0.5">{icon}</span>
        {label}
      </NavLink>
    ))}
  </nav>
);

export default DashboardBottomNav;
