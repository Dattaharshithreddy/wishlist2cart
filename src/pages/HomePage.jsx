import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle,
  Zap,
  ShoppingCart,
  LogIn,
} from 'lucide-react';

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-transparent hover:border-violet-500"
  >
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </motion.div>
);

const TestimonialCard = ({ quote, author, role, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg text-center"
  >
    <p className="text-gray-700 dark:text-gray-300 italic mb-4">"{quote}"</p>
    <p className="font-semibold text-gray-900 dark:text-white">{author}</p>
    <p className="text-sm text-violet-500 dark:text-violet-400">{role}</p>
  </motion.div>
);

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Wishlist2Cart - Transform Your Desires Into Deliveries</title>
        <meta
          name="description"
          content="Wishlist2Cart helps you consolidate wishlists from all your favorite stores and turn them into purchases."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-x-hidden"
      >
        {/* ✅ Navigation Bar */}
        <header className="w-full fixed top-0 left-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
                Wishlist2Cart
              </span>
            </Link>

            <Link to="/login">
              <Button
  variant="ghost"
  size="sm"
  className="text-sm text-gray-800 hover:bg-gray-100
             dark:text-white dark:hover:bg-gray-800"
>
  <LogIn className="h-4 w-4 mr-1" />
  Login
</Button>

            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-28 pb-20 md:py-32 bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-black">
          <div className="container mx-auto px-4 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-4"
            >
              Transform Your Desires
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-violet-600 to-blue-500"
            >
              Into Deliveries
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
              className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10"
            >
              Consolidate wishlists from all your favorite stores. One place to track, manage, and purchase everything you love.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
              className="flex justify-center gap-4 flex-wrap"
            >
              <Button size="lg" asChild>
                <Link to="/add-wishlist">
                  Add Wishlist <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
  size="lg"
  asChild
  className="
    bg-blue-600
    dark:bg-blue-700
    text-white
    border-none
    hover:bg-blue-700
    dark:hover:bg-blue-800
    transition
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    dark:focus:ring-blue-300
    rounded-lg
    px-5
    py-2.5
    font-semibold
    shadow
  "
>
  <Link to="/cart">
    View Cart <ShoppingCart className="ml-2 h-5 w-5" />
  </Link>
</Button>



            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-28 bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">How It Works</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Simple steps to shopping bliss.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Zap size={24} />}
                title="1. Add Wishlist URLs"
                description="Paste URLs from any store. We'll fetch the product details for you."
                delay={0.1}
              />
              <FeatureCard
                icon={<CheckCircle size={24} />}
                title="2. Organize Everything"
                description="Your items stay in one unified dashboard. Tag, sort, prioritize."
                delay={0.2}
              />
              <FeatureCard
                icon={<ShoppingCart size={24} />}
                title="3. Move to Cart & Buy"
                description="Ready to shop? Move to cart and we'll take you to buy from the original site."
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 md:py-28 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Loved by Shoppers Worldwide</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Don’t just take our word for it.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <TestimonialCard
                quote="Wishlist2Cart has revolutionized my online shopping. I can finally keep track of everything in one place!"
                author="Sarah J."
                role="Avid Online Shopper"
                delay={0.1}
              />
              <TestimonialCard
                quote="This app has saved me so much time and money. Highly recommended!"
                author="Mike R."
                role="Bargain Hunter"
                delay={0.2}
              />
              <TestimonialCard
                quote="My friends and I use this for birthdays and holidays. It’s amazing!"
                author="Emily C."
                role="Gift Planner"
                delay={0.3}
              />
            </div>
          </div>
        </section>
      </motion.div>
    </>
  );
};

export default HomePage;
