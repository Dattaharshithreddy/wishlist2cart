import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import { Link } from 'react-router-dom';
import { HeartOff } from 'lucide-react';

import WishlistFilters from '@/components/Dashboard/WishlistFilters';
import WishlistGrid from '@/components/Dashboard/WishlistGrid';
import { useWishlist } from '@/contexts/WishlistContext';
import { Heart } from 'lucide-react';

const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' }},
};

const DashboardPage = () => {
  const { w2cItems, wishlistItems, toggleCartStatus, remove, loading } = useWishlist();
  const { toast } = useToast();

  const [showExternalOnly, setShowExternalOnly] = useState(false);
  const [sortMethod, setSortMethod] = useState('recent');

  const activeItems = useMemo(
    () => (showExternalOnly ? (wishlistItems ?? []) : (w2cItems ?? [])),
    [showExternalOnly, wishlistItems, w2cItems]
  );

  const filteredItems = useMemo(() => {
    const safeItems = activeItems ?? [];
    if (showExternalOnly) {
      return safeItems.filter(item => {
        const src = (item.sourceType || item.source || '').toLowerCase();
        return ['external', 'marketplace', 'universal'].includes(src);
      });
    } else {
      return safeItems.filter(item => {
        const src = (item.sourceType || item.source || '').toLowerCase();
        return ['w2c', 'custom'].includes(src);
      });
    }
  }, [activeItems, showExternalOnly]);

  const sortedItems = useMemo(() => {
    const copy = [...filteredItems];
    switch (sortMethod) {
      case 'price-asc':
        return copy.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-desc':
        return copy.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'store':
        return copy.sort((a, b) => (a.store || '').localeCompare(b.store || ''));
      case 'a-z':
        return copy.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'recent':
      default:
        return copy.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    }
  }, [filteredItems, sortMethod]);

  const handleToggleCart = (id) => {
    const source = showExternalOnly ? 'universal' : 'w2c';
    const list = showExternalOnly ? wishlistItems : w2cItems;
    const item = list.find(i => i.id === id);
    if (!item) return;

    toggleCartStatus(id, source);
    toast({
      title: 'Item status updated!',
      description: `${item.title} has been ${item.inCart ? 'returned to wishlist' : 'moved to cart'}.`,
    });
  };

  const handleDelete = (id) => {
    const source = showExternalOnly ? 'universal' : 'w2c';
    remove(id, source);
    toast({
      title: 'Item removed',
      description: 'Successfully removed from wishlist.',
      variant: 'destructive',
    });
  };

  // Show loading UI if data is being fetched
  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-20">
        <p className="text-lg text-gray-500 dark:text-gray-400">Loading your wishlist...</p>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Wishlist - Wishlist Dashboard</title>
      </Helmet>

      <main>
        {/* Header */}
        <motion.div
          className="w-full mx-auto mb-10"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-3">
              <span className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full">
                <Heart className="w-8 h-8 text-white drop-shadow-md animate-pulse" />
              </span>
              <span className="ml-4 text-4xl font-semibold tracking-wide text-violet-700 dark:text-violet-300 font-poppins select-none">
                My Wishlist
              </span>
            </div>
            <p className="max-w-md text-lg text-gray-700 dark:text-gray-300 font-medium">
              Curate and manage your favorite products — discover, dream, and convert into your cart.
            </p>
            <span className="block mt-5 h-1 w-32 bg-gradient-to-r from-violet-400 via-blue-400 to-violet-400 rounded-full opacity-90 shadow-sm" />
          </div>
        </motion.div>

        {/* Filters and toggles */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8 px-4 sm:px-0"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <div>
            <label className="flex items-center cursor-pointer select-none text-gray-700 dark:text-gray-300 font-medium">
              <input
                type="checkbox"
                checked={showExternalOnly}
                onChange={e => setShowExternalOnly(e.target.checked)}
                className="form-checkbox h-5 w-5 text-violet-600 hover:text-violet-700"
              />
              <span className="ml-2 text-lg">Show External Products Only</span>
            </label>
          </div>
          <WishlistFilters sortMethod={sortMethod} setSortMethod={setSortMethod} />
        </motion.div>

        {/* Wishlist grid or empty state */}
        <AnimatePresence>
          {sortedItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-20 max-w-xl mx-auto p-10 rounded-3xl bg-white dark:bg-gray-800/70 border border-gray-300 dark:border-gray-700 text-center shadow-lg"
            >
              <HeartOff className="mx-auto mb-6 w-24 h-24 text-violet-600 dark:text-violet-400" aria-hidden="true" />
              <p className="text-xl font-semibold">
                {showExternalOnly
                  ? 'No external products found. Discover new favorites on the marketplace!'
                  : 'Your wishlist is empty. Start adding your favorite products!'}
              </p>
              {!showExternalOnly && (
                <Button asChild variant="violet" className="mt-6">
                  <Link to="/add-wishlist">Create your Universal Wishlist!</Link>
                </Button>
              )}
            </motion.div>
          ) : (
            <WishlistGrid
              items={sortedItems}
              onToggle={handleToggleCart}
              onDelete={handleDelete}
              wishlistType={showExternalOnly ? 'universal' : 'w2c'}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
};

export default DashboardPage;
