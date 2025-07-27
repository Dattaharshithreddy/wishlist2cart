import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from '@/components/ui/use-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: 'Logged out successfully',
      description: 'See you soon! 👋',
    });
  };

  const isActive = (path) => location.pathname === path;

  // Calculate total quantity in cart (sum of quantities)
  const totalCartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div whileHover={{ scale: 1.05 }} className="text-2xl font-bold gradient-text">
              Wishlist2Cart
            </motion.div>
          </Link>

          {/* Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-purple-300 ${
                  isActive('/dashboard') ? 'text-white' : 'text-white/70'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/wishlist-integration"
                className={`text-sm font-medium transition-colors hover:text-purple-300 ${
                  isActive('/wishlist-integration') ? 'text-white' : 'text-white/70'
                }`}
              >
                Add Items
              </Link>
              <Link
                to="/cart"
                className={`text-sm font-medium transition-colors hover:text-purple-300 ${
                  isActive('/cart') ? 'text-white' : 'text-white/70'
                }`}
              >
                Cart
              </Link>
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Wishlist Icon */}
                <Link to="/dashboard" aria-label="Go to Wishlist">
                  <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
                    <Heart className="h-5 w-5" />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Cart Icon */}
                <Link to="/cart" aria-label="Go to Cart">
                  <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
                    <ShoppingCart className="h-5 w-5" />
                    {totalCartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {totalCartCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* User Menu */}
                <div className="flex items-center space-x-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User avatar'}
                      className="h-8 w-8 rounded-full border-2 border-white/20"
                    />
                  ) : (
                    <UserIconPlaceholder /> {/* Optional: your user icon fallback */}
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-white hover:bg-white/10"
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Link to="/login">
                <Button className="bg-white text-purple-600 hover:bg-white/90">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
