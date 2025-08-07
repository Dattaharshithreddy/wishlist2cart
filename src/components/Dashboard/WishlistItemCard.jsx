import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trash, ShoppingCart, ExternalLink, Tag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';  // IMPORT THE CONTEXT

const storeLogos = {
  Amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  Flipkart: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Flipkart_vector_logo.png',
  Myntra: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.svg',
  Other: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Shopping_cart_font_awesome.svg',
};

export default function WishlistItemCard({ item }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart();
  const { removeFromWishlist } = useWishlist();  // GET REMOVE FUNCTION
  const [isAdding, setIsAdding] = useState(false);

  const isMarketplace =
    ['amazon', 'flipkart', 'myntra'].includes((item.store || '').toLowerCase()) ||
    (item.url && item.sourceType === 'universal');

  const isInCart = cartItems.some((cartItem) => cartItem.id === item.id);

  const handleBuyClick = (e) => {
    e.stopPropagation();
    if (item.url) {
      window.open(item.url, '_blank', 'noopener noreferrer');
    } else {
      toast({
        title: 'No marketplace link',
        description: 'Product link is not available',
        variant: 'destructive',
      });
    }
  };

  const handleCartClick = async () => {
    if (isInCart) {
      navigate('/cart');
    } else {
      try {
        setIsAdding(true);
        await addToCart(item);
        toast({
          title: 'Added to Cart',
          description: `${item.title} has been added to your cart.`,
          duration: 2500,
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Could not add item to cart.',
          variant: 'destructive',
        });
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleRemoveClick = async () => {
    try {
      await removeFromWishlist(item.id, item.sourceType || 'universal'); // pass sourceType accordingly
      toast({
        title: 'Removed',
        description: `${item.title} has been removed from your wishlist.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not remove item from wishlist.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      whileFocus={{ scale: 1.03 }}
      transition={{ duration: 0.35 }}
      className="
        relative flex flex-col justify-between rounded-2xl shadow-xl border
        border-gray-300 dark:border-gray-700
        bg-white dark:bg-gray-900 p-6 min-h-[520px] max-w-[440px] w-full
        focus:outline-none focus:ring-4 focus:ring-violet-400 dark:focus:ring-violet-600
        cursor-pointer transition-colors
      "
      tabIndex={0}
      role="listitem"
      aria-label={`Wishlist item: ${item.title}`}
    >
      {/* Your existing product image, title, price, tags and action buttons */}

      <div>
        {/* Product Image */}
        <div className="w-full flex justify-center mb-6">
          <div className="w-full h-[220px] rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner overflow-hidden mb-6">
            <img
              src={item.image || storeLogos[item.store] || storeLogos.Other}
              alt={item.title}
              className="object-contain max-h-full max-w-full"
              loading="lazy"
              draggable={false}
            />
          </div>
        </div>

        {/* Product Title */}
        <h3
          className="w-full text-center text-2xl font-extrabold font-poppins text-gray-900 dark:text-white mb-2 break-words truncate"
          title={item.title}
        >
          {item.title}
        </h3>

        {/* Price */}
        <div className="w-full flex justify-center mb-3">
          <span className="text-xl font-semibold text-green-700 dark:text-green-400">
            ₹{item.price?.toLocaleString() || 'N/A'}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {(item.tags || []).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 select-none"
              aria-label={`Tag: ${tag}`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between w-full gap-4 flex-nowrap">
        <div className="flex-grow min-w-0">
          {isMarketplace ? (
            <Button
              onClick={handleBuyClick}
              variant="outline"
              size="lg"
              className="w-full whitespace-nowrap font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors"
              aria-label={`Buy ${item.title} on Marketplace`}
            >
              Buy on Marketplace <ExternalLink className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCartClick}
              disabled={isAdding}
              variant={isInCart ? 'outline' : 'default'}
              size="lg"
              className={`
                w-full whitespace-nowrap font-semibold transition-colors
                ${isInCart ? 'bg-transparent dark:bg-transparent text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-violet-700 dark:border-violet-300' : ''}
              `}
              aria-label={isInCart ? `View ${item.title} in cart` : `Move ${item.title} to cart`}
            >
              <ShoppingCart className="mr-2 w-5 h-5" />
              {isInCart ? 'View Cart' : isAdding ? 'Adding...' : 'Move to Cart'}
            </Button>
          )}
        </div>

        <Button
          onClick={handleRemoveClick}
          variant="ghost"
          size="icon"
          aria-label={`Remove ${item.title} from wishlist`}
          className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <Trash className="w-6 h-6" />
        </Button>
      </div>
    </motion.div>
  );
}
