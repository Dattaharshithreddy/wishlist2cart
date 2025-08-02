import React from 'react';
import { motion } from 'framer-motion';

const tabs = [
  { id: 'universal', label: 'Universal Wishlist' },
  { id: 'w2c', label: 'W2C Wishlist' },
];

const WishlistTabs = ({ active, setActive }) => {
  return (
    <div className="flex gap-6 border-b border-gray-300 dark:border-gray-700 mb-8">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          className={`relative px-5 py-3 text-lg font-semibold transition-colors ${
            active === id ? 'text-violet-600 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400 hover:text-violet-500'
          }`}
          aria-selected={active === id}
          onClick={() => setActive(id)}
          role="tab"
          tabIndex={active === id ? 0 : -1}
        >
          {label}
          {active === id && (
            <motion.div
              layoutId="underline"
              className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-violet-600 dark:bg-violet-400"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default WishlistTabs;
