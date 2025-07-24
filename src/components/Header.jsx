import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Menu, X, LogOut, User, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const navLinkClasses = "text-sm font-medium transition-colors hover:text-violet-500";
  const activeLinkClasses = "text-violet-600 dark:text-violet-400";

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">
              Wishlist2Cart
            </span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/add-wishlist"
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                Add Wishlist
              </NavLink>
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                My Cart
              </NavLink>

              {/* New Links Added Here */}
              <NavLink
                to="/brands"
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                Wishlist2Cart Brands
              </NavLink>
              <NavLink
                to="/marketplace"
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                Marketplace Picks
              </NavLink>
            </nav>
          )}

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/dashboard"><Heart className="h-5 w-5" /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/cart"><ShoppingCart className="h-5 w-5" /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/settings"><User className="h-5 w-5" /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link to="/login">Login</Link>
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-white dark:bg-gray-900 pb-4"
        >
          <nav className="flex flex-col items-center gap-4 pt-4">
            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/add-wishlist"
                  className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Add Wishlist
                </NavLink>
                <NavLink
                  to="/cart"
                  className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Cart
                </NavLink>

                {/* New Links Added Here - Mobile Menu */}
                <NavLink
                  to="/brands"
                  className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wishlist2Cart Brands
                </NavLink>
                <NavLink
                  to="/marketplace"
                  className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Marketplace Picks
                </NavLink>

                <NavLink
                  to="/settings"
                  className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </NavLink>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button asChild onClick={() => setIsMenuOpen(false)}>
                <Link to="/login">Login</Link>
              </Button>
            )}
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
