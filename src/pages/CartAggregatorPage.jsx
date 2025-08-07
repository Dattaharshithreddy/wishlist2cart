import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';

const storeLogos = {
  Amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  Flipkart: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Flipkart_logo_vector.svg',
  Myntra: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.svg',
  Default:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Shopping_Cart_Icon.svg/1024px-Shopping_Cart_Icon.svg.png',
};

export default function CartAggregatorPage() {
  const { cartItems, removeFromCart, setQuantity } = useCart();

  const decreaseQuantity = (item) => {
    const newQty = (item.quantity || 1) - 1;
    if (newQty >= 1) setQuantity(item.id, newQty);
  };

  const increaseQuantity = (item) => {
    const newQty = (item.quantity || 1) + 1;
    setQuantity(item.id, newQty);
  };

  const handleRemove = (item) => {
    removeFromCart(item.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">My Cart</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
          Review your selected items before proceeding to checkout.
        </p>
      </div>

      <div className="space-y-6 max-w-3xl mx-auto">
        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 text-center text-gray-500 dark:text-gray-400 rounded-lg shadow">
            Your cart is empty.
          </div>
        ) : (
          cartItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded flex-shrink-0">
                <img
                  loading="lazy"
                  src={item.image || storeLogos[item.platform] || storeLogos.Default}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-grow flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-2 dark:text-white">{item.title}</h3>
                <p className="mt-1 font-bold text-violet-700 dark:text-violet-400">
                  ₹{(item.price * item.quantity).toFixed(2)}
                  {item.quantity > 1 && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      (₹{item.price.toFixed(2)} × {item.quantity})
                    </span>
                  )}
                </p>
                <div className="mt-auto flex items-center space-x-2">
                  <Button size="sm" onClick={() => decreaseQuantity(item)} aria-label="Decrease quantity">
                    <Minus size={16} />
                  </Button>
                  <span className="text-lg">{item.quantity}</span>
                  <Button size="sm" onClick={() => increaseQuantity(item)} aria-label="Increase quantity">
                    <Plus size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemove(item)}
                    aria-label="Remove item from cart"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              {item.affiliateUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="self-center mt-2 sm:mt-0"
                  onClick={() => window.open(item.affiliateUrl, '_blank')}
                  aria-label={`Checkout on ${item.platform}`}
                >
                  Checkout on {item.platform} <ExternalLink size={16} />
                </Button>
              )}
            </motion.div>
          ))
        )}

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => {
              if (cartItems.length === 0) return;
              window.location.href = '/checkout';
            }}
            aria-label="Proceed to checkout"
            disabled={cartItems.length === 0}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
