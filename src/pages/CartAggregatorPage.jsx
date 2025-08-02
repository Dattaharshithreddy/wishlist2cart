// CartAggregatorPage.jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import {
  ArrowRight, Tag, Percent, ExternalLink, Trash2, Plus, Minus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const storeLogos = {
  Amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  Flipkart: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Flipkart_logo_vector.svg',
  Myntra: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.svg',
  Default: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Shopping_Cart_Icon.svg/1024px-Shopping_Cart_Icon.svg.png',
};

export default function CartAggregatorPage() {
  const { toast } = useToast();
  const {
    cartItems,
    getTotalValue,
    removeFromCart,
    setQuantity,
    couponApplied,
    applyCoupon,
    couponDiscountPercent,
  } = useCart();
  const navigate = useNavigate();

  const discountedTotal = getTotalValue;
  // Note: now getTotalValue is discounted total (due to context logic), no extra state needed here

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
    toast({
      title: 'Removed from cart',
      description: `${item.title} was removed.`,
      variant: 'destructive',
    });
  };

  const handleCheckout = (store) => {
    toast({
      title: `Redirecting to ${store}`,
      description: 'This will take you to the checkout page on their site.',
    });
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Cart Empty',
        description: 'Add items before proceeding to payment.',
        variant: 'destructive',
      });
      return;
    }
    navigate('/checkout');
  };

  const handleApplyCoupon = () => {
    if (couponApplied) {
      toast({
        title: 'Coupon Already Applied',
        description: `You already have a ${couponDiscountPercent}% discount applied.`,
      });
      return;
    }
    // For demo, only allow 10% discount coupon
    applyCoupon(10);
    toast({
      title: 'Coupon Applied!',
      description: 'You saved 10% on your order total.',
      variant: 'success',
    });
  };

  return (
    <>
      <Helmet>
        <title>My Cart - Wishlist2Cart</title>
        <meta name="description" content="View your aggregated cart from multiple platforms and get ready to checkout." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight">My Aggregated Cart</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">All your items, ready for checkout.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 rounded-2xl bg-white dark:bg-gray-800/50 shadow-md border border-gray-200 dark:border-gray-800 flex items-center gap-4"
                >
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                    <img
                      src={item.image || storeLogos[item.platform] || storeLogos.Default}
                      alt={item.title}
                      className="max-h-full max-w-full object-contain rounded"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
                    <p className="text-violet-500 dark:text-violet-400 font-bold text-lg mt-1">
                      ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                      {item.quantity > 1 && (
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                          (₹{item.price.toFixed(2)} × {item.quantity})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white dark:bg-gray-900">
                      <button
                        onClick={() => decreaseQuantity(item)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                        aria-label={`Decrease quantity of ${item.title}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 font-semibold select-none">{item.quantity || 1}</span>
                      <button
                        onClick={() => increaseQuantity(item)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                        aria-label={`Increase quantity of ${item.title}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item)}
                      className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {item.affiliateUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckout(item.platform)}
                      className="ml-4 whitespace-nowrap"
                    >
                      Checkout on {item.platform} <ExternalLink className="ml-1 w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl text-gray-500 dark:text-gray-400">
                Your cart is empty.
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-950/30 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold mb-4">Cart Summary</h2>
              <div className="space-y-2 text-lg">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{(couponApplied ? (discountedTotal / 0.9) : discountedTotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                    <span>Discount ({couponDiscountPercent}%)</span>
                    <span>-₹{(discountedTotal * (couponDiscountPercent / (100 - couponDiscountPercent))).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span>₹{discountedTotal.toFixed(2)}</span>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full mt-6"
                onClick={handleProceedToPayment}
                disabled={cartItems.length === 0}
                aria-disabled={cartItems.length === 0}
              >
                Proceed to Payment <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {!couponApplied && cartItems.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold mb-3">Price Insights</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
                      <Percent className="h-5 w-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Potential Savings!</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Apply Coupon to save more!
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto mt-1"
                          onClick={() => applyCoupon(10)}
                        >
                          Apply Coupon
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
                      <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Coupon Available</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Use code <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">SAVE10</span> for 10% off on Flipkart.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
