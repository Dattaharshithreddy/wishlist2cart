import React from 'react';
import WishlistItemCard from './WishlistItemCard';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const WishlistGrid = ({ items, onToggleCart, onDelete }) => {
  return (
    <motion.div
      className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 px-2 sm:px-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {items.map((item) => (
          <WishlistItemCard
            key={item.id}
            item={item}
            onToggleCart={onToggleCart}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default WishlistGrid;
