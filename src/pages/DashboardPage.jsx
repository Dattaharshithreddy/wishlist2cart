import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '@/contexts/WishlistContext';
import { Heart, Settings, ShoppingCart, Star, Tag, Trash2, PlusCircle, Bell } from 'lucide-react';

const storeLogos = {
  Amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  Flipkart: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Flipkart_logo_vector.svg',
  Myntra: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.svg',
  Default: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Shopping_Cart_Icon.svg/1024px-Shopping_Cart_Icon.svg.png',
};

const DashboardPage = () => {
  const { wishlistItems, toggleCartStatus, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleToggleCart = (id) => {
    const item = wishlistItems.find(i => i.id === id);
    toggleCartStatus(id);
    toast({
      title: `Item status updated!`,
      description: `${item.title} has been ${!item.inCart ? 'moved to cart' : 'returned to wishlist'}.`,
    });
  };

  const handleDelete = (id) => {
    removeFromWishlist(id);
    toast({
      title: "Item Removed",
      description: "The item has been successfully removed from your wishlist.",
      variant: "destructive",
    });
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Wishlist2Cart</title>
        <meta name="description" content="Manage your wishlists, synced sites, and cart all in one place." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-gray-950/30 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Menu</h2>
              <nav className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30">
                  <Heart className="mr-3 h-5 w-5" /> My Wishlist
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/synced-sites')}>
                  <Star className="mr-3 h-5 w-5" /> Synced Sites
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/cart')}>
                  <ShoppingCart className="mr-3 h-5 w-5" /> My Cart
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/settings')}>
                  <Settings className="mr-3 h-5 w-5" /> Settings
                </Button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">My Wishlist</h1>
              <Button asChild>
                <Link to="/add-wishlist">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Item
                </Link>
              </Button>
            </div>

            {/* Wishlist Items */}
            <div className="space-y-4">
              {wishlistItems.length > 0 ? wishlistItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-4 rounded-2xl transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${item.inCart ? 'bg-green-100/50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800/50'} shadow-md border border-gray-200 dark:border-gray-800`}
                >
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                    <img src={item.image || storeLogos[item.store] || storeLogos.Default} alt={item.title} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-violet-500 dark:text-violet-400 font-bold text-xl">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full flex items-center">
                          <Tag className="mr-1 h-3 w-3" /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 self-end sm:self-center">
                    <Button size="sm" onClick={() => handleToggleCart(item.id)} variant={item.inCart ? 'outline' : 'default'}>
                      {item.inCart ? 'In Cart' : 'Move to Cart'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl">
                  <p className="text-gray-500 dark:text-gray-400">Your wishlist is empty.</p>
                  <Button asChild className="mt-4">
                    <Link to="/add-wishlist">Add your first item!</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Smart Suggestions */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Smart Suggestions</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold">Alternative for Sony Headphones</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bose QuietComfort Ultra - $429.00</p>
                    <Button size="sm" className="mt-2" onClick={() => toast({ title: "Feature Not Implemented" })}>View Deal</Button>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold">Price Drop Alert!</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Apple Watch Series 9 is now $399.00</p>
                    <Button size="sm" className="mt-2" onClick={() => toast({ title: "Feature Not Implemented" })}>
                      <Bell className="mr-2 h-4 w-4" /> Notify Me
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </motion.div>
    </>
  );
};

export default DashboardPage;