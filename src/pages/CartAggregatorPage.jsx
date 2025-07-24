import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { ArrowRight, Tag, Percent, ExternalLink } from 'lucide-react';

const storeLogos = {
  Amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  Flipkart: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Flipkart_logo_vector.svg',
  Myntra: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.svg',
  Default: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Shopping_Cart_Icon.svg/1024px-Shopping_Cart_Icon.svg.png',
};

const CartAggregatorPage = () => {
  const { toast } = useToast();
  const { cartItems, getTotalValue } = useCart();

  const handleCheckout = (store) => {
    toast({
      title: `Redirecting to ${store}`,
      description: "This would take you to the checkout page on the original website.",
    });
  };

  const handleProceedToPayment = () => {
    toast({
      title: "Let's get you paid up!",
      description: "Please provide your Stripe keys to continue.",
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
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length > 0 ? cartItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-4 rounded-2xl bg-white dark:bg-gray-800/50 shadow-md border border-gray-200 dark:border-gray-800 flex items-center gap-4"
              >
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                  <img src={item.image || storeLogos[item.platform] || storeLogos.Default} alt={item.title} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-violet-500 dark:text-violet-400 font-bold text-lg">${item.price.toFixed(2)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleCheckout(item.platform)}>
                  Checkout on {item.platform} <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl">
                <p className="text-gray-500 dark:text-gray-400">Your cart is empty.</p>
              </div>
            )}
          </div>

          {/* Summary & Insights */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-950/30 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold mb-4">Cart Summary</h2>
              <div className="space-y-2 text-lg">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getTotalValue().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between font-bold text-xl pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span>${getTotalValue().toFixed(2)}</span>
                </div>
              </div>
              <Button size="lg" className="w-full mt-6" onClick={handleProceedToPayment} disabled={cartItems.length === 0}>
                Proceed to Payment <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-3">Price Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
                    <Percent className="h-5 w-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Potential Savings!</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">We found one of your items for a lower price elsewhere.</p>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => toast({ title: "Feature Not Implemented" })}>View Offer</Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
                    <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Coupon Available</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Use code <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">SAVE10</span> on Flipkart for 10% off.</p>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => toast({ title: "Feature Not Implemented" })}>Apply Coupon</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default CartAggregatorPage;