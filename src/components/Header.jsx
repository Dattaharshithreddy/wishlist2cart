import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShoppingCart, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const navLinkClasses = 'text-sm font-semibold tracking-wide transition-colors';
const activeLinkClasses = 'text-violet-600 dark:text-violet-400 font-bold';

const Header = ({ onHamburgerClick }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 select-none">
            <div
              className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg"
              aria-label="Dashboard Home"
            >
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold font-poppins tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-blue-700 dark:from-violet-400 dark:to-blue-400 select-none">
              Wishlist2Cart
            </span>
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-8" aria-label="Primary Navigation">
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeLinkClasses : 'text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400'}`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeLinkClasses : "text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400"}`
                }
              >
                About
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeLinkClasses : "text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400"}`
                }
              >
                Contact
              </NavLink>
              {isAdmin && (
                <>
                  <NavLink to="/admin" className={({ isActive }) =>
                    `${navLinkClasses} ${isActive ? activeLinkClasses : "text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400"}`}>Admin Panel</NavLink>
                  <NavLink to="/custom-admin" className={({ isActive }) =>
                    `${navLinkClasses} ${isActive ? activeLinkClasses : "text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400"}`}>Custom Product Admin</NavLink>
                </>
              )}
            </nav>
          )}
          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="ghost" size="icon" asChild aria-label="User Settings">
                <Link to="/settings">
                  <User className="h-6 w-6 text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/login">Login</Link>
              </Button>
            )}
            {/* Hamburger for mobile */}
            <button
              type="button"
              className="md:hidden ml-1 p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-600"
              aria-label="Open menu"
              onClick={onHamburgerClick}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
