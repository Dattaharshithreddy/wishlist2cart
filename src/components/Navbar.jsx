// Navbar.jsx

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ThemeToggle';

function Popover({ trigger, children }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();

  React.useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-md"
        tabIndex={0}
        type="button"
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-64 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const isActive = (path) => location.pathname === path;
  const cartPreview = cartItems.slice(-3).reverse();
  const wishlistPreview = wishlistItems.slice(-3).reverse();
  const totalCartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({ title: 'Logged out successfully', description: 'See you soon! 👋' });
  };

  const NAV_LINKS = [
    { to: '/dashboard', label: 'Home' },
    { to: '/dashboard/brands', label: 'Brands' },
    { to: '/dashboard/marketplace', label: 'Marketplace' },
    { to: '/dashboard/cart', label: 'Cart' },
    { to: '/dashboard/orders', label: 'Orders' },
    { to: '/dashboard/settings', label: 'Settings' },
    { to: '/dashboard/rewards', label: 'Rewards' },
    ...(user?.role === 'admin'
      ? [
          { to: '/admin', label: 'Admin Panel', special: true },
          { to: '/custom-admin', label: 'Custom Admin', special: true },
        ]
      : []),
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/90 border-b border-white/10 dark:border-gray-800 shadow-lg backdrop-blur-md supports-backdrop-blur:backdrop-blur-md"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-3 select-none">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 via-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span
                className="hidden md:inline text-2xl font-extrabold font-poppins tracking-wide bg-clip-text text-transparent select-none"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #7c3aed, #2563eb 80%, #2563eb 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                Wishlist2Cart
              </span>
            </Link>

            {/* Desktop nav */}
            {user && (
              <nav
                className="hidden md:flex items-center gap-8 text-base font-semibold select-none"
                aria-label="Primary"
              >
                {NAV_LINKS.map((link, idx) => (
                  <Link
                    key={idx}
                    to={link.to}
                    className={`transition-colors duration-200 capitalize ${
                      isActive(link.to)
                        ? link.special
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-violet-600 dark:text-violet-400 font-bold'
                        : 'text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Right controls */}
            <div className="flex items-center space-x-3">
              {/* Wishlist popover */}
              {user && (
                <Popover
                  trigger={
                    <span
                      className="relative cursor-pointer"
                      aria-label="Wishlist"
                      role="button"
                      tabIndex={0}
                    >
                      <Heart className="h-6 w-6 text-pink-600 hover:text-pink-500 dark:text-pink-400 dark:hover:text-pink-300 transition" />
                      {wishlistItems.length > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white shadow-md">
                          {wishlistItems.length}
                        </span>
                      )}
                    </span>
                  }
                >
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      Wishlist ({wishlistItems.length})
                    </div>
                    {wishlistItems.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
                        No wishlist items yet.
                      </div>
                    ) : (
                      <ul className="max-h-48 overflow-auto space-y-2">
                        {wishlistPreview.map(item => (
                          <li
                            key={item.id}
                            onClick={() => {
                              navigate(`/products/${item.id}`);
                            }}
                            role="button"
                            tabIndex={0}
                            className="flex cursor-pointer items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-10 w-10 rounded object-cover"
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.category}
                              </p>
                            </div>
                            <p className="text-xs font-bold text-pink-600 dark:text-pink-400 select-none">
                              ₹{item.price?.toLocaleString()}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link to="/dashboard">
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        aria-label="View full wishlist"
                        variant="outline"
                      >
                        View Wishlist
                      </Button>
                    </Link>
                  </div>
                </Popover>
              )}

              {/* Cart popover */}
              {user && (
                <Popover
                  trigger={
                    <span
                      className="relative cursor-pointer"
                      aria-label="Cart"
                      role="button"
                      tabIndex={0}
                    >
                      <ShoppingCart className="h-6 w-6 text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 transition" />
                      {totalCartCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white shadow-md">
                          {totalCartCount}
                        </span>
                      )}
                    </span>
                  }
                >
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      Cart ({totalCartCount})
                    </div>
                    {totalCartCount === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
                        Your cart is empty.
                      </div>
                    ) : (
                      <ul className="max-h-48 overflow-auto space-y-2">
                        {cartPreview.map(item => (
                          <li
                            key={item.id}
                            onClick={() => {
                              navigate(`/products/${item.id}`);
                            }}
                            role="button"
                            tabIndex={0}
                            className="flex cursor-pointer items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-10 w-10 rounded object-cover"
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.category}
                              </p>
                            </div>
                            <p className="text-xs font-bold text-violet-600 dark:text-violet-400 select-none">
                              ₹{item.price?.toLocaleString()} × {item.quantity ?? 1}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link to="/cart">
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        aria-label="View full cart"
                        variant="outline"
                      >
                        View Cart
                      </Button>
                    </Link>
                  </div>
                </Popover>
              )}

              {/* Desktop User menu */}
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/settings"
                    aria-label="User Settings"
                    title="User Settings"
                    className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-600"
                    tabIndex={0}
                  >
                    <User className="h-6 w-6 text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400" />
                  </Link>
                  <ThemeToggle />
                </div>
              ) : (
                <Button as={Link} to="/login" size="sm" className="font-semibold">
                  Sign In
                </Button>
              )}

              {/* Mobile user menu */}
              {user && (
                <div className="flex md:hidden items-center gap-2">
                  <ThemeToggle />
                  <button
                    type="button"
                    className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-600"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open Sidebar"
                    aria-expanded={sidebarOpen}
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* MODERN SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed top-0 left-0 bottom-0 w-[80vw] max-w-xs bg-white dark:bg-gray-900 shadow-lg z-[100] flex flex-col"
            aria-label="Sidebar menu"
          >
            {/* Brand/logo */}
            <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 px-4">
              <Link to="/" onClick={() => setSidebarOpen(false)}>
                <span
                  className="text-xl font-extrabold font-poppins tracking-wide select-none bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #7c3aed, #2563eb 80%, #2563eb 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }}
                >
                  Wishlist2Cart
                </span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-2 top-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                aria-label="Close Sidebar"
              >
                ×
              </button>
            </div>
            <nav className="flex flex-col p-4 space-y-2" role="navigation" aria-label="Sidebar navigation">
              {NAV_LINKS.map((link, idx) => (
                <Link
                  key={idx}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`block rounded px-3 py-2 font-semibold ${
                    isActive(link.to)
                      ? link.special
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 font-bold'
                        : 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Log Out button */}
              {user && (
                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-semibold"
                    onClick={() => {
                      handleLogout();
                      setSidebarOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-2 inline" /> Log Out
                  </Button>
                </div>
              )}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Optional mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.32 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[99] md:hidden"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
